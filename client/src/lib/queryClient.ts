import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const sessionId = localStorage.getItem('sessionId');
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (sessionId) {
      headers["X-Session-Id"] = sessionId;
    }

    const res = await fetch(url, {
      method,
      headers,
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    console.error('API request error:', error);
    if (error instanceof Error && error.message.includes('Failed to fetch')) {
      throw new Error('Network connection error. Please check your internet connection and try again.');
    }
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const sessionId = localStorage.getItem('sessionId');
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      
      if (sessionId) {
        headers["X-Session-Id"] = sessionId;
      }

      const res = await fetch(queryKey[0] as string, {
        credentials: "include",
        headers,
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      console.error('Query fetch error:', error);
      if (error instanceof Error && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection error. Please check your internet connection and try again.');
      }
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: 30000, // Auto-refetch every 30 seconds
      refetchOnWindowFocus: true,
      refetchOnMount: true,
      refetchOnReconnect: true,
      refetchIntervalInBackground: true,
      staleTime: 5 * 1000, // 5 seconds
      gcTime: 60 * 60 * 1000, // 1 hour
      retry: 1,
    },
    mutations: {
      retry: false,
    },
  },
});

// Auto-invalidate key queries every 10 seconds for real-time updates
setInterval(() => {
  queryClient.invalidateQueries({ queryKey: ["/api/users"] });
  queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
  queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
  queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
}, 10000);
