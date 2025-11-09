import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { TrafficCone, Contact, LogIn, LogOut, LayoutDashboard } from "lucide-react";

export function Navigation() {
  const location = useLocation();
  const { user, signOut } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary">
            <TrafficCone className="h-6 w-6" />
            <span>SmartTraffic Control</span>
          </Link>
          
          <div className="flex items-center gap-2">
            <Button
              variant={isActive("/") ? "default" : "ghost"}
              asChild
            >
              <Link to="/">Inicio</Link>
            </Button>
            
            <Button
              variant={isActive("/contacts") ? "default" : "ghost"}
              asChild
            >
              <Link to="/contacts">
                <Contact className="mr-2 h-4 w-4" />
                Contactos
              </Link>
            </Button>
            
            {user ? (
              <>
                <Button
                  variant={isActive("/dashboard") ? "default" : "ghost"}
                  asChild
                >
                  <Link to="/dashboard">
                    <LayoutDashboard className="mr-2 h-4 w-4" />
                    Dashboard
                  </Link>
                </Button>
                <Button variant="outline" onClick={signOut}>
                  <LogOut className="mr-2 h-4 w-4" />
                  Salir
                </Button>
              </>
            ) : (
              <Button
                variant={isActive("/auth") ? "default" : "ghost"}
                asChild
              >
                <Link to="/auth">
                  <LogIn className="mr-2 h-4 w-4" />
                  Iniciar Sesión
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
