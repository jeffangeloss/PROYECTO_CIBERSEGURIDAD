// ...existing code...
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Play,
  Square,
  Clock,
  Wifi,
  Database,
  Activity,
  AlertCircle,
  LogOut
} from "lucide-react";

type TrafficState = "RED" | "YELLOW" | "GREEN" | "OFF";

export default function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [trafficState, setTrafficState] = useState<TrafficState>("OFF");
  const [isRunning, setIsRunning] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date().toISOString());
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected">("disconnected");
  const cycleRef = useRef<number | null>(null);
  const isCheckingStatus = useRef(false);

  const safeClearCycle = () => {
    if (cycleRef.current !== null) {
      clearInterval(cycleRef.current);
      cycleRef.current = null;
    }
  };

  const checkStatus = useCallback(async () => {
    if (isCheckingStatus.current) return;
    isCheckingStatus.current = true;
    try {
      const response = await fetch("/api/status", {
        headers: { "Accept": "application/json" },
      });
      if (!response.ok) {
        throw new Error(`Status ${response.status}`);
      }
      await response.json().catch(() => null);
      setConnectionStatus("connected");
    } catch (error) {
      console.error("Error comprobando estado del ESP32", error);
      setConnectionStatus("disconnected");
    } finally {
      isCheckingStatus.current = false;
    }
  }, []);

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
    }
  }, [user, loading, navigate]);

  // Limpiar intervalo del semáforo al desmontar
  useEffect(() => {
    return () => {
      safeClearCycle();
    };
  }, []);

  // Actualizar reloj cada segundo
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date().toISOString());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleStart = async () => {
    if (isRunning) return; // ya está en marcha

    safeClearCycle();

    try {
      const response = await fetch("/api/start", {
        method: "POST",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? `Error ${response.status}`);
      }

      setIsRunning(true);
      setConnectionStatus("connected");
      toast({
        title: "Sistema iniciado",
        description: "Semáforo en operación",
      });

      // Estado inicial
      let state: TrafficState = "GREEN";
      setTrafficState(state);

      // Guardar id del intervalo para poder detenerlo después
      cycleRef.current = window.setInterval(() => {
        state = state === "GREEN" ? "YELLOW" : state === "YELLOW" ? "RED" : "GREEN";
        setTrafficState(state);
      }, 3000);
    } catch (error) {
      console.error("No se pudo iniciar el semáforo", error);
      setConnectionStatus("disconnected");
      toast({
        title: "Fallo al iniciar",
        description: "No se pudo contactar con el ESP32.",
        variant: "destructive",
      });
    }
  };

  const handleStop = async () => {
    if (!isRunning) return;

    try {
      const response = await fetch("/api/stop", {
        method: "POST",
        headers: { "Accept": "application/json" },
      });

      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody?.error ?? `Error ${response.status}`);
      }

      safeClearCycle();
      setIsRunning(false);
      setTrafficState("OFF");
      setConnectionStatus("disconnected");
      toast({
        title: "Sistema detenido",
        description: "Semáforo fuera de servicio",
        variant: "destructive",
      });
    } catch (error) {
      console.error("No se pudo detener el semáforo", error);
      toast({
        title: "Fallo al detener",
        description: "No se pudo contactar con el ESP32.",
        variant: "destructive",
      });
    }
  };

  const handleSignOut = async () => {
    if (!confirm("¿Cerrar sesión?")) return;
    try {
      await signOut();
      toast({
        title: "Sesión cerrada",
        description: "Has salido del sistema",
      });
      navigate("/auth");
    } catch {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo cerrar la sesión",
      });
    }
  };

  const getStateColor = (state: TrafficState) => {
    switch (state) {
      case "RED": return "bg-red-500";
      case "YELLOW": return "bg-yellow-500";
      case "GREEN": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  useEffect(() => {
    checkStatus();
    const interval = window.setInterval(checkStatus, 10000);
    return () => window.clearInterval(interval);
  }, [checkStatus]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Activity className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Cargando sistema...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
       
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2">Sala de Control de Semáforos</h1>
            <p className="text-muted-foreground">Panel de administración</p>
          </div>
          {user && (
            <div className="self-start">
              <Button variant="outline" onClick={handleSignOut}>
                <LogOut className="mr-2 h-4 w-4" />
                Cerrar sesión
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wifi className="h-5 w-5" />
                Conexión
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Badge variant={connectionStatus === "connected" ? "default" : "secondary"}>
                {connectionStatus === "connected" ? "Conectado" : "Desconectado"}
              </Badge>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                RTC (DS3231)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-mono">{currentTime}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5" />
                LCD I2C
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm">Dirección: 0x27 (SDA=21, SCL=22)</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-primary/30">
            <CardHeader>
              <CardTitle>Estado del Semáforo</CardTitle>
              <CardDescription>
                Estado actual: <span className="font-bold text-foreground">{trafficState}</span>
                {" | "}
                {isRunning ? "EN EJECUCIÓN" : "DETENIDO"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center gap-6">
                <div className="relative">
                  <div className="w-32 h-80 bg-card border-4 border-border rounded-2xl p-4 flex flex-col justify-around items-center shadow-2xl">
                    <div className={`w-20 h-20 rounded-full ${trafficState === "RED" ? getStateColor("RED") : "bg-gray-700"} shadow-lg transition-all duration-300 ${trafficState === "RED" ? "shadow-red-500/50" : ""}`} />
                    <div className={`w-20 h-20 rounded-full ${trafficState === "YELLOW" ? getStateColor("YELLOW") : "bg-gray-700"} shadow-lg transition-all duration-300 ${trafficState === "YELLOW" ? "shadow-yellow-500/50" : ""}`} />
                    <div className={`w-20 h-20 rounded-full ${trafficState === "GREEN" ? getStateColor("GREEN") : "bg-gray-700"} shadow-lg transition-all duration-300 ${trafficState === "GREEN" ? "shadow-green-500/50" : ""}`} />
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <Button
                    onClick={handleStart}
                    disabled={isRunning}
                    className="flex-1"
                  >
                    <Play className="mr-2 h-4 w-4" />
                    Iniciar
                  </Button>
                  <Button
                    onClick={handleStop}
                    disabled={!isRunning}
                    variant="destructive"
                    className="flex-1"
                  >
                    <Square className="mr-2 h-4 w-4" />
                    Detener
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-primary" />
                  Endpoints API
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    GET /time - Obtener tiempo actual (JSON)
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    GET /settime?iso=YYYY-MM-DDTHH:MM:SS
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    GET /start - Iniciar semáforo
                  </p>
                </div>
                <div className="p-3 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-muted-foreground">
                    GET /stop - Detener semáforo
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-accent/30">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-accent" />
                  Información de Seguridad
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm text-muted-foreground">
                  <p>✓ Conexión HTTPS segura</p>
                  <p>✓ Autenticación de usuario activa</p>
                  <p>✓ Comunicación cifrada ESP32</p>
                  <p>✓ Proyecto académico de ciberseguridad</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Botón simple que redirige a la página Defacement */}
        <div className="mt-6 flex justify-center">
          <Button variant="destructive" onClick={() => navigate("/defacement")}>
            Defacement
          </Button>
        </div>
      </div>
    </div>
  );
}
// ...existing code...