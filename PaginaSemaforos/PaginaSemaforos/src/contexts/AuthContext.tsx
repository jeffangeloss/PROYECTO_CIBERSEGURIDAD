import { createContext, useContext, useEffect, useState } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { useNavigate } from "react-router-dom";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  signIn: (email: string, password: string) => Promise<{ error: any }>;
  signOut: () => Promise<void>;
  loading: boolean;
}

const DEFAULT_EMAIL = "admin@local";
const DEFAULT_PASSWORD = "Admin123";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        setLoading(false);
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email: string, password: string) => {
    // Autenticación local para cuenta por defecto
    if (email === DEFAULT_EMAIL && password === DEFAULT_PASSWORD) {
      const localUser = {
        id: "local-admin",
        email,
      } as unknown as User;
      setUser(localUser);
      setSession(null);
      setLoading(false);
      navigate("/dashboard");
      return { error: null };
    }

    // Si no coincide, usar Supabase
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (!error) {
      navigate("/dashboard");
    }
    return { error };
  };

  const signOut = async () => {
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar errores de supabase al cerrar sesión
    } finally {
      // limpiar estado local (incluye cuenta hardcodeada)
      setUser(null);
      setSession(null);
      navigate("/");
    }
  };

  return (
    <AuthContext.Provider value={{ user, session, signIn, signOut, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}