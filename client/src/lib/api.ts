import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import type { User, Transaction, BettingOrder, WithdrawalRequest, Announcement, BankAccount, Message } from "@shared/schema";

// Users API
export function useUsers(page = 1, limit = 25, search = '') {
  return useQuery({
    queryKey: ["/api/users", page, limit, search],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
        ...(search && { search })
      });
      const response = await apiRequest("GET", `/api/users?${params}`);
      return response.json();
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (userData: { username: string; email: string; password: string; name: string; role?: string; reputation?: number }) => {
      const response = await apiRequest("POST", "/api/users", userData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useUpdateUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<User> }) => {
      const response = await apiRequest("PATCH", `/api/users/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/users/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useCreateMessage() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (message: { recipientId: number; content: string; title: string }) => {
      const response = await apiRequest("POST", "/api/messages", message);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });
}

// Transactions API
export function useTransactions() {
  return useQuery<Transaction[]>({
    queryKey: ["/api/transactions"],
  });
}

export function useCreateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (transaction: { userId: number; type: string; amount: string; description?: string; status?: string }) => {
      const response = await apiRequest("POST", "/api/transactions", transaction);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: { status?: string; [key: string]: any } }) => {
      const response = await apiRequest("PATCH", `/api/transactions/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

export function useUpdateTransactionDetails() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, transactionNo, rechargeInfo }: { id: number; transactionNo: string; rechargeInfo?: string }) => {
      const response = await apiRequest("PATCH", `/api/transactions/${id}/details`, {
        transactionNo,
        rechargeInfo
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}

// Betting Orders API
export function useBettingOrders() {
  return useQuery<BettingOrder[]>({
    queryKey: ["/api/betting-orders"],
  });
}

export function useActiveBettingOrders() {
  return useQuery<BettingOrder[]>({
    queryKey: ["/api/betting-orders/active"],
  });
}

export function useCreateBettingOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (order: { asset: string; amount: string; direction: string; duration: number; entryPrice: string; actualDirection?: string }) => {
      const response = await apiRequest("POST", "/api/betting-orders", order);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders/active"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    },
  });
}

export function useUpdateBettingOrder() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: Partial<BettingOrder> }) => {
      const response = await apiRequest("PATCH", `/api/betting-orders/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders/active"] });
    },
  });
}

// Withdrawal Requests API
export function useWithdrawalRequests() {
  return useQuery<WithdrawalRequest[]>({
    queryKey: ["/api/withdrawal-requests"],
  });
}

export function useCreateWithdrawalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (request: { bankAccountId: number; amount: string }) => {
      const response = await apiRequest("POST", "/api/withdrawal-requests", request);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}

export function useUpdateWithdrawalRequest() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, status, note }: { id: number; status: string; note?: string }) => {
      const updateData: any = { status };
      if (note) {
        updateData.note = note;
      }
      const response = await apiRequest("PATCH", `/api/withdrawal-requests/${id}`, updateData);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/withdrawal-requests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
    },
  });
}

// Announcements API
export function useAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["/api/announcements"],
  });
}

export function useAllAnnouncements() {
  return useQuery<Announcement[]>({
    queryKey: ["/api/announcements/all"],
  });
}

export function useCreateAnnouncement() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (announcement: { title: string; content: string; type: string }) => {
      const response = await apiRequest("POST", "/api/announcements", announcement);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/announcements"] });
      queryClient.invalidateQueries({ queryKey: ["/api/announcements/all"] });
    },
  });
}

// Messages API
export function useMessages() {
  return useQuery<Message[]>({
    queryKey: ["/api/messages"],
  });
}

export function useMarkMessageAsRead() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (messageId: number) => {
      const response = await apiRequest("PATCH", `/api/messages/${messageId}/read`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
    },
  });
}



// Bank Accounts API
export function useBankAccounts() {
  return useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });
}

export function useBankAccountsWithUsers(userId?: number) {
  return useQuery<any[]>({
    queryKey: ["/api/bank-accounts-with-users", userId],
    queryFn: async () => {
      const url = userId ? `/api/bank-accounts-with-users?userId=${userId}` : "/api/bank-accounts-with-users";
      const response = await apiRequest("GET", url);
      return response.json();
    },
  });
}

export function useCreateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bankAccount: { accountHolderName: string; accountNumber: string; bankName: string; ifscCode: string }) => {
      const response = await apiRequest("POST", "/api/bank-accounts", bankAccount);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
  });
}

export function useAdminCreateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (bankAccount: { userId: number; accountHolderName: string; accountNumber: string; bankName: string; branchName?: string; ifscCode?: string; bindingType?: string; currency?: string }) => {
      const response = await apiRequest("POST", "/api/admin/bank-accounts", bankAccount);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts-with-users"] });
    },
  });
}

export function useUpdateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; accountHolderName?: string; bankName?: string; accountNumber?: string; ifscCode?: string }) => {
      const response = await apiRequest("PATCH", `/api/bank-accounts/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
  });
}

export function useAdminUpdateBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, ...updates }: { id: number; accountHolderName?: string; bankName?: string; accountNumber?: string; ifscCode?: string }) => {
      const response = await apiRequest("PATCH", `/api/admin/bank-accounts/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts-with-users"] });
    },
  });
}

export function useDeleteBankAccount() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest("DELETE", `/api/bank-accounts/${id}`);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
    },
  });
}

// Profile Update API
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (updates: { signatureData?: string | null; signatureName?: string | null; profileImage?: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", updates);
      return response.json();
    },
    onSuccess: (updatedUser) => {
      // Update the auth cache with the new user data
      queryClient.setQueryData(["/api/auth/me"], { user: updatedUser });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

// Password Change API
export function useChangePassword() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (passwordData: { currentPassword: string; newPassword: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", { 
        password: passwordData.newPassword 
      });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], { user: updatedUser });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

// Fund Password Change API
export function useChangeFundPassword() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (fundPasswordData: { currentFundPassword: string; newFundPassword: string }) => {
      const response = await apiRequest("PATCH", "/api/profile", { 
        fundPassword: fundPasswordData.newFundPassword 
      });
      return response.json();
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData(["/api/auth/me"], { user: updatedUser });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
    },
  });
}

// Crypto Prices API
export function useCryptoPrices() {
  return useQuery({
    queryKey: ["/api/crypto-prices"],
    refetchInterval: 60000, // Refetch every 1 minute (60 seconds)
    refetchIntervalInBackground: true, // Continue refetching when window is in background
    staleTime: 0, // Always consider data stale to ensure fresh updates
  });
}
