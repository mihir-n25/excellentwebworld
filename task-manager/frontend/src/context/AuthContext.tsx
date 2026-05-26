import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  useRef,
  ReactNode,
} from "react";
import { User } from "../types";
import { disconnectSocket } from "../socket/socket";
import api from "../api/axios";

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (accessToken: string, user: User) => void;
  logout: () => Promise<void>;
  refreshAuth: () => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Custom hook with proper error handling
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Store access token in memory only (not localStorage)
  const accessTokenRef = useRef<string | null>(null);

  // Get access token (for axios interceptor)
  const getAccessToken = useCallback(() => accessTokenRef.current, []);

  // Set access token in memory
  const setAccessToken = useCallback((token: string | null) => {
    accessTokenRef.current = token;
  }, []);

  // Refresh access token using refresh token from HttpOnly cookie
  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const response = await api.post<{ accessToken: string; user: User }>(
        "/auth/refresh",
        {},
        { withCredentials: true } // Send cookies
      );

      const { accessToken, user: userData } = response.data;
      
      setAccessToken(accessToken);
      setUser(userData);

      return true;
    } catch (error) {
      // Refresh token expired or invalid
      setAccessToken(null);
      setUser(null);
      disconnectSocket();
      return false;
    }
  }, [setAccessToken]);

  // Login function
  const login = useCallback(
    (accessToken: string, userData: User) => {
      setAccessToken(accessToken);
      setUser(userData);
    },
    [setAccessToken]
  );

  // Logout function
  const logout = useCallback(async () => {
    try {
      // Call backend logout to clear refresh token cookie
      await api.post("/auth/logout", {}, { withCredentials: true });
    } catch (error) {
      console.error("Logout error:", error);
    } finally {
      // Clear local state regardless of API call result
      setAccessToken(null);
      setUser(null);
      disconnectSocket();
    }
  }, [setAccessToken]);

  // Initialize auth on mount - try to refresh token
  useEffect(() => {
    let isMounted = true;

    const initAuth = async () => {
      const success = await refreshAuth();
      
      if (isMounted) {
        setIsLoading(false);
      }

      // If refresh failed, user stays null (shows login page)
      if (!success && isMounted) {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      isMounted = false;
    };
  }, [refreshAuth]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectSocket();
    };
  }, []);

  // Setup axios interceptor to add access token to requests
  useEffect(() => {
    const requestInterceptor = api.interceptors.request.use(
      (config) => {
        const token = getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        // Always send cookies for refresh token
        config.withCredentials = true;
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Setup response interceptor for automatic token refresh on 401
    const responseInterceptor = api.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        // If 401 and not already retried, try to refresh token
        if (
          error.response?.status === 401 &&
          !originalRequest._retry &&
          originalRequest.url !== "/auth/refresh" &&
          originalRequest.url !== "/auth/login"
        ) {
          originalRequest._retry = true;

          const refreshed = await refreshAuth();

          if (refreshed) {
            // Retry original request with new token
            const token = getAccessToken();
            if (token) {
              originalRequest.headers.Authorization = `Bearer ${token}`;
            }
            return api(originalRequest);
          }
        }

        return Promise.reject(error);
      }
    );

    // Cleanup interceptors
    return () => {
      api.interceptors.request.eject(requestInterceptor);
      api.interceptors.response.eject(responseInterceptor);
    };
  }, [getAccessToken, refreshAuth]);

  // Memoize context value to prevent unnecessary rerenders
  const contextValue = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
      refreshAuth,
    }),
    [user, isLoading, login, logout, refreshAuth]
  );

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};
