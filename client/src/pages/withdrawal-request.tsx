import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ChevronDown } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BankAccount } from "@shared/schema";

export default function WithdrawalRequest() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const [withdrawalAmount, setWithdrawalAmount] = useState("0");
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [showBankSelector, setShowBankSelector] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch user's bank accounts
  const { data: bankAccounts = [] } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
  });

  // Create withdrawal mutation
  const createWithdrawal = useMutation({
    mutationFn: async (data: { amount: string; bankAccountId: number }) => {
      const res = await apiRequest('POST', '/api/withdrawal-requests', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Withdrawal Request Submitted",
        description: "Your withdrawal request has been submitted successfully.",
      });
      setWithdrawalAmount("0");
      // Invalidate queries to refresh data
      queryClient.invalidateQueries({ queryKey: ['/api/withdrawal-requests'] });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/me'] });
      
      // Navigate to withdrawal record tab after delay
      setTimeout(() => {
        setLocation('/top-up-records?tab=withdrawal');
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit withdrawal request",
        variant: "destructive",
      });
    }
  });

  const handleBack = () => {
    setLocation('/withdrawal');
  };

  const handleWithdrawalRecord = () => {
    setLocation('/top-up-records?tab=withdrawal');
  };

  const handleMaxAmount = () => {
    const availableBalance = parseFloat(user?.availableBalance || user?.balance || "669522.6");
    setWithdrawalAmount(availableBalance.toString());
  };

  const handleDetermineWithdrawal = () => {
    if (!withdrawalAmount || parseFloat(withdrawalAmount) <= 0) {
      toast({
        title: "Invalid Amount", 
        description: "Please enter a valid withdrawal amount",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBankAccount) {
      toast({
        title: "No Bank Account Selected", 
        description: "Please select a bank account for withdrawal",
        variant: "destructive",
      });
      return;
    }

    console.log("Creating withdrawal with data:", {
      amount: withdrawalAmount, // Send as string
      bankAccountId: selectedBankAccount.id,
      selectedBankAccount: selectedBankAccount
    });
    
    createWithdrawal.mutate({
      amount: withdrawalAmount, // Send as string, not number
      bankAccountId: selectedBankAccount.id
    });
  };

  const availableBalance = parseFloat(user?.availableBalance || user?.balance || "669522.6");

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleBack}
            className="p-1 mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
        <h1 className="text-lg font-medium text-gray-900">Request for Withdrawal</h1>
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWithdrawalRecord}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Withdrawal Record
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-6">
        {/* Currency Withdrawal Section */}
        <div>
          <div className="text-gray-700 text-sm mb-2">Currency withdrawal ( Currency Account)</div>
          <div className="text-gray-600 text-sm font-medium mb-4">INR</div>
        </div>

        {/* Collection Information */}
        <div>
          <div className="text-gray-900 text-base font-medium mb-3">Collection Information</div>
          {bankAccounts.length === 0 ? (
            <div 
              className="rounded-lg p-4 border-l-4"
              style={{
                background: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)",
                borderLeftColor: "#F59E0B"
              }}
            >
              <div className="text-center text-white py-4">
                <div className="text-sm mb-2">No bank account available</div>
                <div className="text-xs opacity-75">Please add a bank account in Profile → Collection Information</div>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {/* Bank Account Selector */}
              <div className="relative">
                <Button
                  variant="outline"
                  onClick={() => setShowBankSelector(!showBankSelector)}
                  className="w-full justify-between h-12 px-4"
                >
                  <span className="text-gray-700">
                    {selectedBankAccount 
                      ? `${selectedBankAccount.bankName} - ***${selectedBankAccount.accountNumber.slice(-4)}`
                      : "Select Bank Account"
                    }
                  </span>
                  <ChevronDown className="w-4 h-4" />
                </Button>
                
                {showBankSelector && (
                  <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg">
                    {bankAccounts.map((account) => (
                      <button
                        key={account.id}
                        onClick={() => {
                          setSelectedBankAccount(account);
                          setShowBankSelector(false);
                        }}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 first:rounded-t-lg last:rounded-b-lg"
                      >
                        <div className="font-medium text-gray-900">{account.bankName}</div>
                        <div className="text-sm text-gray-600">{account.accountHolderName}</div>
                        <div className="text-sm text-gray-500">***{account.accountNumber.slice(-4)}</div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Selected Bank Account Details */}
              {selectedBankAccount && (
                <div 
                  className="rounded-lg p-4 border-l-4"
                  style={{
                    background: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)",
                    borderLeftColor: "#F59E0B"
                  }}
                >
                  <div className="flex justify-between items-start">
                    <div className="text-white space-y-1">
                      <div className="text-sm">Account Holder</div>
                      <div className="text-sm">Bank Name</div>
                      <div className="text-sm">Account Number</div>
                      <div className="text-sm">IFSC Code</div>
                    </div>
                    <div className="text-white text-right space-y-1">
                      <div className="text-sm">{selectedBankAccount.accountHolderName}</div>
                      <div className="text-sm">{selectedBankAccount.bankName}</div>
                      <div className="text-sm font-medium">***{selectedBankAccount.accountNumber.slice(-4)}</div>
                      <div className="text-sm">{selectedBankAccount.ifscCode}</div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quantity of Withdrawal */}
        <div>
          <div className="text-gray-900 text-base font-medium mb-3">Quantity of Withdrawal</div>
          <div className="relative">
            <input
              type="number"
              value={withdrawalAmount}
              onChange={(e) => setWithdrawalAmount(e.target.value)}
              className="w-full px-4 py-3 text-xl font-medium text-gray-900 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none"
              placeholder="0"
            />
            <Button
              onClick={handleMaxAmount}
              variant="ghost"
              className="absolute right-2 top-1/2 transform -translate-y-1/2 text-blue-600 hover:text-blue-700 text-sm"
            >
              All
            </Button>
          </div>
          <div className="text-gray-500 text-sm mt-2">
            Available Balance: {availableBalance.toFixed(1)}
          </div>
        </div>

        {/* Determine Withdrawal Button */}
        <div className="pt-8">
          <Button
            onClick={handleDetermineWithdrawal}
            disabled={createWithdrawal.isPending || !withdrawalAmount || parseFloat(withdrawalAmount) <= 0}
            className="w-full h-12 text-white font-medium rounded-full text-base disabled:opacity-50"
            style={{
              background: "linear-gradient(90deg, #F59E0B 0%, #F97316 100%)"
            }}
          >
            {createWithdrawal.isPending ? 'Processing...' : 'Determine Withdrawal'}
          </Button>
        </div>
      </div>
    </div>
  );
}