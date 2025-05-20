import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";

interface AuthContextType {
  token: string | null;
  user: any | null; 
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (token: string, userData: any) => void;
  logout: () => void;
  checkAuth: () => Promise<void>; 
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<any | null>(null); 
  const [isLoading, setIsLoading] = useState(true);

  // API_URL was removed as it was unused

  const navigateTo = (path: string) => {
    window.location.href = path;
  };

  const checkAuth = useCallback(async () => {
    setIsLoading(true);
    const storedToken = localStorage.getItem("jwtToken");
    if (storedToken) {
      try {
        setToken(storedToken);
        const storedUser = localStorage.getItem("userData");
        if (storedUser) {
            setUser(JSON.parse(storedUser));
        }
      } catch (error) {
        console.error("Auth check failed:", error);
        localStorage.removeItem("jwtToken");
        localStorage.removeItem("userData");
        setToken(null);
        setUser(null);
      }
    } else {
        setToken(null);
        setUser(null);
    }
    setIsLoading(false);
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = (newToken: string, userData: any) => {
    localStorage.setItem("jwtToken", newToken);
    localStorage.setItem("userData", JSON.stringify(userData)); 
    setToken(newToken);
    setUser(userData);
  };

  const logout = () => {
    localStorage.removeItem("jwtToken");
    localStorage.removeItem("userData");
    setToken(null);
    setUser(null);
    navigateTo("/login");
  };

  return (
    <AuthContext.Provider value={{ token, user, isAuthenticated: !!token, isLoading, login, logout, checkAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

