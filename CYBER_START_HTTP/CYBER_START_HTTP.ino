// ESP32 — Semáforo + 2 Servos + LCD + RTC + API HTTP start/stop
#include <Arduino.h>
#include <WiFi.h>
#include <WebServer.h>
#include <Wire.h>
#include <LiquidCrystal_I2C.h>
#include <RTClib.h>
#include <ESP32Servo.h>

// ====== Selecciona RTC ======
#define USE_DS3231 1  // 1=DS3231, 0=DS1307

// ====== Semáforo (ajusta tiempos) ======
const int LED_ROJO=16, LED_AMARILLO=17, LED_VERDE=18;
uint32_t T_ROJO=8000, T_VERDE=9000, T_AMARILLO=2000;
enum TL{ROJO,VERDE,AMARILLO}; TL st=ROJO; uint32_t t0=0;

// ====== LCD ======
LiquidCrystal_I2C lcd(0x27,16,2);
String prev0="", prev1="";
static inline void lcdLine(uint8_t r, String s){
  if(s.length()>16)s=s.substring(0,16);
  while(s.length()<16)s+=' ';
  String& p=(r==0?prev0:prev1);
  if(s==p) return;
  lcd.setCursor(0,r); lcd.print(s); p=s;
}

// ====== RTC ======
#if USE_DS3231
  RTC_DS3231 rtc;
#else
  RTC_DS1307 rtc;
#endif
bool rtc_ok=false;

// ====== Servos (19 derecha, 23 izquierda) ======
const int SERVO1_PIN=19, SERVO2_PIN=23;
const bool SERVO1_REVERSED = false; // GPIO19 normal (derecha)
const bool SERVO2_REVERSED = true;  // GPIO23 invertido (izquierda)
const int  SERVO1_TRIM = 0;
const int  SERVO2_TRIM = 0;
const int SERVO_NEUTRO=90;
const int SERVO_OPEN = 90;
const int SERVO_CLOSE= 0;

Servo s1, s2;
int pos1=SERVO_NEUTRO, pos2=SERVO_NEUTRO;  // posición actual
int tgt1=SERVO_CLOSE,  tgt2=SERVO_CLOSE;   // objetivo
uint32_t lastServoTick=0;
const uint16_t SERVO_PERIOD_MS=20;
const uint8_t  SERVO_STEP_DEG=2;

// ====== Control de ciclo ======
volatile bool running=false;     // << arranca detenido
volatile bool force_reset=true;  // para reiniciar al iniciar

// ====== WiFi SoftAP + HTTP ======
const char* AP_SSID = "ESP32Bridge";
const char* AP_PASS = "12345678";
WebServer server(80);            // El proxy usará 8080; el ESP32 queda en 80

// ====== Utiles ======
static inline String two(int v){ char b[3]; snprintf(b,sizeof(b),"%02d",v); return String(b); }
String hhmmss(){
  if(!rtc_ok) return "--:--:--";
  DateTime n=rtc.now();
  char b[9]; snprintf(b,9,"%02d:%02d:%02d",n.hour(),n.minute(),n.second());
  return b;
}
static inline String stText(){ return st==ROJO?"ROJO":(st==VERDE?"VERDE":"AMARILLO"); }
static inline uint32_t dur(){ return st==ROJO?T_ROJO:(st==VERDE?T_VERDE:T_AMARILLO); }

// ====== Servo helpers ======
static inline int clamp180(int a){ if(a<0) return 0; if(a>180) return 180; return a; }
static inline int physAngle(int logical, bool reversed, int trim){
  int a = reversed ? (180 - logical) : logical;
  return clamp180(a + trim);
}

// Mapea estado -> objetivos (abierto en VERDE/AMARILLO; cerrado en ROJO)
void updateServoTargetsByState(){
  if(st==ROJO){       tgt1=SERVO_CLOSE; tgt2=SERVO_CLOSE; }
  else /*VERDE/AMARILLO*/ { tgt1=SERVO_OPEN;  tgt2=SERVO_OPEN;  }
}

// Rampa no bloqueante
void servoTick(){
  if(millis()-lastServoTick < SERVO_PERIOD_MS) return;
  lastServoTick = millis();
  auto stepTo=[&](int& cur, int tgt){
    if(cur < tgt){ cur += SERVO_STEP_DEG; if(cur>tgt) cur=tgt; }
    else if(cur > tgt){ cur -= SERVO_STEP_DEG; if(cur<tgt) cur=tgt; }
    if(cur<0) cur=0; if(cur>180) cur=180;
  };
  stepTo(pos1, tgt1);
  stepTo(pos2, tgt2);
  s1.write( physAngle(pos1, SERVO1_REVERSED, SERVO1_TRIM) );
  s2.write( physAngle(pos2, SERVO2_REVERSED, SERVO2_TRIM) );
}

// ====== Serial: S=YYYY-MM-DDTHH:MM:SS ======
bool parseISO(const String& iso, DateTime& out){
  if(iso.length()<19) return false;
  int Y=iso.substring(0,4).toInt();
  int M=iso.substring(5,7).toInt();
  int D=iso.substring(8,10).toInt();
  int h=iso.substring(11,13).toInt();
  int m=iso.substring(14,16).toInt();
  int s=iso.substring(17,19).toInt();
  if(Y<2000||M<1||M>12||D<1||D>31||h<0||h>23||m<0||m>59||s<0||s>59) return false;
  out = DateTime(Y,M,D,h,m,s); return true;
}
void serialTick(){
  static String buf="";
  while(Serial.available()){
    char c=Serial.read();
    if(c=='\r'||c=='\n'){
      if(buf.startsWith("S=") && rtc_ok){
        DateTime dt;
        if(parseISO(buf.substring(2), dt)){
          rtc.adjust(dt);
          Serial.println(F("[RTC] Ajustado OK"));
        }else{
          Serial.println(F("[RTC] Formato invalido. Ej: S=2025-11-06T21:30:00"));
        }
      }
      buf="";
    }else{
      if(buf.length()<40) buf+=c;
    }
  }
}

// ====== Semáforo ======
void apply(){
  digitalWrite(LED_ROJO,     st==ROJO && running);
  digitalWrite(LED_AMARILLO, st==AMARILLO && running);
  digitalWrite(LED_VERDE,    st==VERDE && running);
  updateServoTargetsByState();
}

// Forzar pausa: TODO apagado y barreras cerradas
void applyPause(){
  digitalWrite(LED_ROJO,LOW);
  digitalWrite(LED_AMARILLO,LOW);
  digitalWrite(LED_VERDE,LOW);
  tgt1 = SERVO_CLOSE; tgt2 = SERVO_CLOSE;
}

// ====== HTTP Handlers ======
void handleRoot(){
  String html =
    "<!doctype html><meta charset='utf-8'><title>ESP32 Semáforo</title>"
    "<style>body{font-family:system-ui;margin:24px}button{padding:10px 16px;margin:6px;font-size:16px}</style>"
    "<h1>Semáforo ESP32</h1>"
    "<p><button onclick='fetch(\"/api/start\").then(()=>location.reload())'>Iniciar</button>"
    "<button onclick='fetch(\"/api/stop\").then(()=>location.reload())'>Detener</button>"
    "<button onclick='location.href=\"/api/status\"'>Estado</button></p>";
  server.send(200,"text/html",html);
}
void handleStart(){
  running = true;           // activa ciclo
  force_reset = true;       // reinicia desde ROJO
  server.send(200,"application/json", "{\"ok\":true,\"running\":true}");
}
void handleStop(){
  running = false;          // pausa ciclo
  applyPause();
  server.send(200,"application/json", "{\"ok\":true,\"running\":false}");
}
void handleStatus(){
  String j = String("{\"running\":") + (running?"true":"false") +
             ",\"state\":\""+ stText() +"\","+
             "\"time\":\""+ hhmmss() +"\"}";
  server.send(200,"application/json", j);
}

void setup(){
  Serial.begin(115200);

  pinMode(LED_ROJO,OUTPUT); pinMode(LED_AMARILLO,OUTPUT); pinMode(LED_VERDE,OUTPUT);

  Wire.begin(21,22);
  lcd.init(); lcd.backlight();
  lcdLine(0,"ESP32 Semaforos");
  lcdLine(1,"RTC iniciando...");

  // RTC
  rtc_ok = rtc.begin();
#if USE_DS3231
  if(rtc_ok && rtc.lostPower()) rtc.adjust(DateTime(F(__DATE__),F(__TIME__)));
#else
  if(rtc_ok && !rtc.isrunning()) rtc.adjust(DateTime(F(__DATE__),F(__TIME__)));
#endif
  lcdLine(1, rtc_ok? "RTC OK":"RTC FAIL");

  // Servos
  delay(200);
  s1.setPeriodHertz(50); s2.setPeriodHertz(50);
  s1.attach(SERVO1_PIN, 500, 2400);
  s2.attach(SERVO2_PIN, 500, 2400);
  pos1 = pos2 = SERVO_NEUTRO;
  s1.write( physAngle(pos1, SERVO1_REVERSED, SERVO1_TRIM) );
  s2.write( physAngle(pos2, SERVO2_REVERSED, SERVO2_TRIM) );

  // Estado inicial: detenido
  running=false; force_reset=true; st=ROJO; applyPause();

  // WiFi AP + HTTP
  WiFi.softAP(AP_SSID, AP_PASS);
  IPAddress ip = WiFi.softAPIP();
  Serial.print("AP iniciado. IP: "); Serial.println(ip);

  server.on("/", HTTP_GET, handleRoot);
  server.on("/api/start", HTTP_ANY, handleStart);
  server.on("/api/stop",  HTTP_ANY, handleStop);
  server.on("/api/status",HTTP_GET, handleStatus);
  server.begin();

  Serial.println(F("Ajustar hora por Serial: S=YYYY-MM-DDTHH:MM:SS"));
}

void loop(){
  server.handleClient();
  serialTick();

  if(running){
    if(force_reset){
      st = ROJO;
      t0 = millis();
      force_reset=false;
    }
    // Avance de semáforo
    if(millis()-t0 >= dur()){
      st = (st==ROJO)?VERDE:(st==VERDE?AMARILLO:ROJO);
      t0 = millis();
    }
    apply();
  }

  // Refrescos LCD
  static uint32_t last=0;
  if(millis()-last>=250){
    last=millis();
    if(running){
      lcdLine(0,"Semaf: "+stText());
      lcdLine(1,"Hora:  "+hhmmss());
    }else{
      lcdLine(0,"PAUSADO");
      lcdLine(1,"IP "+WiFi.softAPIP().toString());
    }
  }

  servoTick();
}
