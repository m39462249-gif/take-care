import React, { createContext, useContext, useState, useEffect } from "react";
import { User, Role, RegisterPayload, AuthResponse } from "../types/auth.js";
import { apiUrl, smartFetch } from "../utils/api.js";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  loginDemo: (role: Role) => void;
  register: (payload: RegisterPayload) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  getRoleRedirectPath: (role: Role) => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function getRoleRedirectPath(role: Role): string {
  switch (role) {
    case "CAREGIVER":
      return "/cuidador";
    case "PROFESSIONAL":
      return "/clinica";
    default:
      return "/login";
  }
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem("eje_token"));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Validate session on mount
  useEffect(() => {
    const fetchMe = async () => {
      const storedToken = localStorage.getItem("eje_token");
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await smartFetch(apiUrl("/api/auth/me"), {
          headers: {
            Authorization: `Bearer ${storedToken}`,
          },
        });

        if (response.ok) {
          const result = await response.json();
          if (result.success && result.data?.user) {
            setUser(result.data.user);
          } else {
            logout();
          }
        } else {
          logout();
        }
      } catch (err) {
        console.error("Error validando sesión:", err);
        // If server is not responding, don't immediately wipe if we have stored user info
        const storedUser = localStorage.getItem("eje_user");
        if (storedUser) {
          try {
            setUser(JSON.parse(storedUser));
          } catch {
            logout();
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchMe();
  }, []);

  const login = async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await smartFetch(apiUrl("/api/auth/login"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success || !data.data) {
        return {
          success: false,
          error: data.message || "Credenciales incorrectas",
        };
      }

      const { user: authedUser, token: authToken } = data.data;
      setUser(authedUser);
      setToken(authToken);
      localStorage.setItem("eje_token", authToken);
      localStorage.setItem("eje_user", JSON.stringify(authedUser));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: "No se pudo conectar con el servidor. Verifica que el backend esté ejecutándose.",
      };
    }
  };

  const register = async (payload: RegisterPayload): Promise<{ success: boolean; error?: string }> => {
    try {
      const response = await fetch(apiUrl("/api/auth/register"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data: AuthResponse = await response.json();

      if (!response.ok || !data.success || !data.data) {
        const errorDetail = data.errors?.map((e) => e.message).join(", ");
        return {
          success: false,
          error: errorDetail || data.message || "Error al completar el registro",
        };
      }

      const { user: newUser, token: newToken } = data.data;
      setUser(newUser);
      setToken(newToken);
      localStorage.setItem("eje_token", newToken);
      localStorage.setItem("eje_user", JSON.stringify(newUser));

      return { success: true };
    } catch (err: any) {
      return {
        success: false,
        error: "Error de red al intentar registrar la cuenta.",
      };
    }
  };

  const loginDemo = (role: Role) => {
    let demoUser: User;
    if (role === "CAREGIVER") {
      demoUser = {
        id: "cg-demo-001",
        email: "cuidador@eje.salud",
        role: "CAREGIVER",
        fullName: "Elena Silva",
        profileId: "prof-cg-001",
      };
    } else if (role === "PROFESSIONAL") {
      demoUser = {
        id: "doc-demo-001",
        email: "clinica@eje.salud",
        role: "PROFESSIONAL",
        fullName: "Dra. Sofía Martínez",
        profileId: "prof-doc-001",
      };
    } else {
      demoUser = {
        id: "pat-demo-001",
        email: "paciente@eje.salud",
        role: "PATIENT",
        fullName: "Mateo Silva",
        profileId: "prof-pat-001",
      };
    }

    const demoToken = "autonomous-demo-token-2026";
    setUser(demoUser);
    setToken(demoToken);
    localStorage.setItem("eje_token", demoToken);
    localStorage.setItem("eje_user", JSON.stringify(demoUser));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("eje_token");
    localStorage.removeItem("eje_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        login,
        loginDemo,
        register,
        logout,
        getRoleRedirectPath,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth debe usarse dentro de un AuthProvider");
  }
  return context;
};
