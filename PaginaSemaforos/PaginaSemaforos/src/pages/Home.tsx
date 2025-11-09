// ...existing code...
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { Shield, Network, Activity, Lock, Info, LogIn } from "lucide-react";

export default function Home() {
  return (
    <div className="text-center mb-16">
      <div className="container mx-auto px-4 py-16">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 mb-12">
          <div className="flex-1">
            <h1 className="text-5xl font-bold mb-2 bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent">
              Sistema de Control de Semáforos Inteligentes
            </h1>

            <p className="text-xl text-muted-foreground mt-6 mb-6">
              Plataforma IoT de alto nivel de ciberseguridad para la gestión y monitoreo de semáforos
            </p>

            <aside className="w-full lg:w-56 flex justify">
            <div className="flex flex-col gap-3">
              <Button size="sm" asChild>
                <Link to="/auth" className="flex items-center">
                  <LogIn className="mr-2 h-4 w-4" /> Iniciar sesión
                </Link>
              </Button>
            </div>
            <div className="flex flex-col gap-3 ms-2">
            <Button size="sm" variant="outline" asChild>
                <Link to="/contacts" className="flex items-center">
                  <Info className="mr-2 h-4 w-4" /> Más información
                </Link>
              </Button>
              </div>
          </aside>
          </div>

        
          
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          <Card className="border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Shield className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Seguridad Avanzada</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sistema protegido con autenticación robusta y cifrado de datos
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Network className="h-10 w-10 text-accent mb-2" />
              <CardTitle>IoT Conectado</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Control en tiempo real de dispositivos ESP32 vía HTTPS
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-primary/20 hover:border-primary/50 transition-colors">
            <CardHeader>
              <Activity className="h-10 w-10 text-primary mb-2" />
              <CardTitle>Monitoreo RTC</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Sincronización temporal con módulo DS3231 I2C
              </CardDescription>
            </CardContent>
          </Card>

          <Card className="border-accent/20 hover:border-accent/50 transition-colors">
            <CardHeader>
              <Lock className="h-10 w-10 text-accent mb-2" />
              <CardTitle>Encriptacion de contraseñas</CardTitle>
            </CardHeader>
            <CardContent>
              <CardDescription>
                Contraseñas seguras con hashing bcrypt
              </CardDescription>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card/50 backdrop-blur">
          <CardHeader>
            <CardTitle className="text-2xl">Características Técnicas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h3 className="font-semibold text-primary mb-2">Hardware</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Microcontrolador ESP32</li>
                  <li>• Reloj RTC DS3231 (I2C)</li>
                  <li>• Pantalla LCD I2C 0x27</li>
                  <li>• Conexión HTTPS segura</li>
                </ul>
              </div>
              <div>
                <h3 className="font-semibold text-accent mb-2">Software</h3>
                <ul className="space-y-1 text-sm text-muted-foreground">
                  <li>• Autenticación de usuarios</li>
                  <li>• Control de estados en tiempo real</li>
                  <li>• API RESTful JSON</li>
                  <li>• Interfaz web responsive</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
// ...existing code...