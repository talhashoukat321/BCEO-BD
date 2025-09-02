import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User } from "@shared/schema";
import { useEffect, useState } from "react";

interface AuthResponse {
  user: User;
}

export function useAuth() {
  const queryClient = useQueryClient();
  const [isInitialized, setIsInitialized] = useState(false);

  // Check for existing session on mount
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (sessionId) {
      // If we have a sessionId, enable the auth query and fetch once
      queryClient.setQueryDefaults(["/api/auth/me"], { enabled: true });
      queryClient.refetchQueries({ queryKey: ["/api/auth/me"] }).then(() => {
        setIsInitialized(true);
      }).catch((error) => {
        console.log("Session validation failed on mount:", error);
        // Clear invalid session and mark as initialized
        localStorage.removeItem('sessionId');
        queryClient.setQueryData(["/api/auth/me"], null);
        setIsInitialized(true);
      });
    } else {
      setIsInitialized(true);
    }
  }, [queryClient]);

  // Auto-refresh balance every 30 seconds when user is logged in (reduced frequency)
  useEffect(() => {
    const sessionId = localStorage.getItem('sessionId');
    if (!sessionId) return;
    
    const interval = setInterval(() => {
      // Only invalidate if the user is currently authenticated
      const currentAuth = queryClient.getQueryData(["/api/auth/me"]);
      if (currentAuth) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    }, 30000); // Refresh every 30 seconds instead of 10
    
    return () => clearInterval(interval);
  }, [queryClient]);

  const { data: authData, isLoading } = useQuery<AuthResponse | null>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const response = await fetch("/api/auth/me", {
        credentials: "include",
        headers,
      });

      if (response.status === 401) {
        // Session is invalid or expired - clear it but don't be too aggressive
        console.log("Session unauthorized, clearing localStorage");
        localStorage.removeItem('sessionId');
        queryClient.setQueryDefaults(["/api/auth/me"], { enabled: false });
        queryClient.setQueryData(["/api/auth/me"], null);
        return null;
      }

      if (!response.ok) {
        throw new Error("Auth check failed");
      }

      return await response.json();
    },
    retry: false,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    refetchInterval: false,
    refetchIntervalInBackground: false,
    staleTime: 7 * 24 * 60 * 60 * 1000, // 7 days  
    gcTime: 30 * 24 * 60 * 60 * 1000, // 30 days
    enabled: false, // Will be enabled programmatically
  });

  const loginMutation = useMutation({
    mutationFn: async (credentials: { username: string; password: string }) => {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(credentials),
      });
      
      if (!response.ok) {
        throw new Error("Login failed");
      }
      
      const data = await response.json();
      
      // Store sessionId for header-based authentication
      if (data.sessionId) {
        localStorage.setItem('sessionId', data.sessionId);
      }
      
      return data;
    },
    onSuccess: (data) => {
      // Set auth data directly and enable future queries
      queryClient.setQueryData(["/api/auth/me"], data);
      queryClient.setQueryDefaults(["/api/auth/me"], { enabled: true });
    },
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      const sessionId = localStorage.getItem('sessionId');
      await fetch("/api/auth/logout", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(sessionId && { "X-Session-Id": sessionId })
        },
        credentials: "include",
      });
      localStorage.removeItem('sessionId');
    },
    onSuccess: () => {
      queryClient.setQueryData(["/api/auth/me"], null);
      queryClient.setQueryDefaults(["/api/auth/me"], { enabled: false });
    },
  });

  return {
    user: authData?.user,
    isLoading: !isInitialized || isLoading,
    login: loginMutation.mutate,
    logout: logoutMutation.mutate,
    isLoginPending: loginMutation.isPending,
    loginError: loginMutation.error,
  };
}
