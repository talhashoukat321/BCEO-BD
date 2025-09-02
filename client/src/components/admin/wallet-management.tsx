import { useUsers, useWithdrawalRequests, useUpdateWithdrawalRequest, useBankAccountsWithUsers } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Check, X, Wallet, CreditCard, Copy, Search, User, Building, Hash, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export function WalletManagement() {
  const { data: users, isLoading: usersLoading } = useUsers();
  const { data: withdrawalRequests, isLoading: requestsLoading } = useWithdrawalRequests();
  const { data: bankAccountsWithUsers, isLoading: bankAccountsLoading } = useBankAccountsWithUsers();
  const updateWithdrawalRequest = useUpdateWithdrawalRequest();
  const { toast } = useToast();
  const [rejectionNote, setRejectionNote] = useState("");
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [showNoteDialog, setShowNoteDialog] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const handleWithdrawalAction = (requestId: number, status: "approved" | "rejected", note?: string) => {
    updateWithdrawalRequest.mutate(
      { id: requestId, status, ...(note && { note }) }, 
      {
        onSuccess: () => {
          toast({
            title: "Request processed",
            description: `Withdrawal request has been ${status}`,
          });
          setShowNoteDialog(false);
          setRejectionNote("");
          setSelectedRequestId(null);
        },
        onError: () => {
          toast({
            title: "Action failed",
            description: `Failed to ${status} withdrawal request`,
            variant: "destructive",
          });
        },
      }
    );
  };

  const handleRejectWithNote = (requestId: number) => {
    setSelectedRequestId(requestId);
    setShowNoteDialog(true);
  };

  const confirmRejection = () => {
    if (selectedRequestId) {
      handleWithdrawalAction(selectedRequestId, "rejected", rejectionNote);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied",
      description: `${label} copied to clipboard`,
    });
  };

  // Group bank accounts by user
  const groupedBankAccounts = bankAccountsWithUsers?.reduce((acc, account) => {
    if (!acc[account.userId]) {
      acc[account.userId] = {
        user: {
          id: account.userId,
          name: account.userName,
          email: account.userEmail,
        },
        accounts: [],
      };
    }
    
    if (account.bankAccountId) {
      acc[account.userId].accounts.push({
        id: account.bankAccountId,
        accountHolderName: account.accountHolderName,
        bankName: account.bankName,
        accountNumber: account.accountNumber,
        ifscCode: account.ifscCode,
      });
    }
    
    return acc;
  }, {} as Record<number, { user: any; accounts: any[] }>);

  // Filter users based on search term
  const filteredUsers = Object.values(groupedBankAccounts || {}).filter(({ user }) =>
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Get bank account details for a specific withdrawal request
  const getBankAccountDetails = (request: any) => {
    const accountData = bankAccountsWithUsers?.find(
      account => account.bankAccountId === request.bankAccountId
    );
    return accountData ? {
      holderName: accountData.accountHolderName,
      bankName: accountData.bankName,
      accountNumber: accountData.accountNumber,
      ifscCode: accountData.ifscCode,
    } : null;
  };

  const customers = users?.filter(user => user.role === "customer") || [];

  if (usersLoading || requestsLoading || bankAccountsLoading) {
    return (
      <div className="p-6 space-y-6">
        <Skeleton className="w-full h-32" />
        <Skeleton className="w-full h-64" />
        <Skeleton className="w-full h-64" />
      </div>
    );
  }

  return (
    <div className="p-1 h-full">
      {/* Pending Withdrawal Requests */}
      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="w-5 h-5" />
              Pending Withdrawal Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            {!withdrawalRequests || withdrawalRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No pending requests</p>
              </div>
            ) : (
              <div className="space-y-4">
                {withdrawalRequests.map((request) => {
                  const user = customers.find(u => u.id === request.userId);
                  const bankDetails = getBankAccountDetails(request);
                  
                  return (
                    <div key={request.id} className="p-4 border border-orange-200 bg-orange-50 rounded-lg">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <div className="font-medium text-gray-900">{user?.name || 'Unknown User'}</div>
                          <div className="text-sm text-gray-500">{user?.email}</div>
                        </div>
                        <Badge variant="outline" className="text-orange-600 border-orange-300">
                          {request.status === 'pending' ? 'Applied' : request.status}
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4 mb-3">
                        <div>
                          <div className="text-sm text-gray-600">Amount</div>
                          <div className="font-medium">{parseFloat(request.amount).toFixed(0)}</div>
                        </div>
                        <div>
                          <div className="text-sm text-gray-600">Date</div>
                          <div className="text-sm">{new Date(request.createdAt).toLocaleDateString()}</div>
                        </div>
                      </div>

                      {/* Bank Account Details */}
                      {bankDetails && (
                        <div className="mb-3 p-3 bg-white rounded border">
                          <div className="text-sm font-medium text-gray-700 mb-2">Bank Account Details</div>
                          <div className="grid grid-cols-2 gap-2 text-xs">
                            <div className="flex items-center gap-1">
                              <User className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Holder:</span>
                              <span className="font-medium">{bankDetails.holderName}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0"
                                onClick={() => copyToClipboard(bankDetails.holderName, "Account Holder Name")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Building className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">Bank:</span>
                              <span className="font-medium">{bankDetails.bankName}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0"
                                onClick={() => copyToClipboard(bankDetails.bankName, "Bank Name")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Hash className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">A/C:</span>
                              <span className="font-medium">{bankDetails.accountNumber}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0"
                                onClick={() => copyToClipboard(bankDetails.accountNumber, "Account Number")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1">
                              <Code className="w-3 h-3 text-gray-400" />
                              <span className="text-gray-600">IFSC:</span>
                              <span className="font-medium">{bankDetails.ifscCode}</span>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-4 w-4 p-0"
                                onClick={() => copyToClipboard(bankDetails.ifscCode, "IFSC Code")}
                              >
                                <Copy className="w-3 h-3" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}

                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          onClick={() => handleWithdrawalAction(request.id, "approved")}
                          className="bg-green-600 hover:bg-green-700"
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Accept
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleRejectWithNote(request.id)}
                          className="border-red-300 text-red-600 hover:bg-red-50"
                        >
                          <X className="w-4 h-4 mr-1" />
                          Reject
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Bank Account Details Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Bank Account Details
          </CardTitle>
          <div className="flex items-center gap-2 mt-4">
            <Search className="w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search members by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-md"
            />
          </div>
        </CardHeader>
        <CardContent>
          {!groupedBankAccounts || Object.keys(groupedBankAccounts).length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <CreditCard className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No bank accounts found</p>
            </div>
          ) : (
            <Accordion type="single" collapsible className="w-full">
              {filteredUsers.map(({ user, accounts }) => (
                <AccordionItem key={user.id} value={`user-${user.id}`}>
                  <AccordionTrigger className="hover:no-underline">
                    <div className="flex items-center justify-between w-full pr-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                          <User className="w-4 h-4 text-blue-600" />
                        </div>
                        <div className="text-left">
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </div>
                      <Badge variant="secondary">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''}
                      </Badge>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent>
                    <div className="pt-4 space-y-4">
                      {accounts.length === 0 ? (
                        <div className="text-center py-4 text-gray-500">
                          <CreditCard className="w-6 h-6 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">No bank accounts added</p>
                        </div>
                      ) : (
                        accounts.map((account) => (
                          <div key={account.id} className="p-4 bg-gray-50 rounded-lg border">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Holder's Name:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{account.accountHolderName}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(account.accountHolderName, "Account Holder Name")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">Bank Name:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{account.bankName}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(account.bankName, "Bank Name")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">A/c No:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{account.accountNumber}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(account.accountNumber, "Account Number")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="text-sm text-gray-600">IFSC Code:</span>
                                  <div className="flex items-center gap-1">
                                    <span className="font-medium">{account.ifscCode}</span>
                                    <Button 
                                      variant="ghost" 
                                      size="sm" 
                                      className="h-6 w-6 p-0"
                                      onClick={() => copyToClipboard(account.ifscCode, "IFSC Code")}
                                    >
                                      <Copy className="w-3 h-3" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          )}
        </CardContent>
      </Card>

      {/* Rejection Note Dialog */}
      <Dialog open={showNoteDialog} onOpenChange={setShowNoteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject Withdrawal Request</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="rejection-note">Rejection Reason</Label>
              <Textarea
                id="rejection-note"
                placeholder="Enter reason for rejection..."
                value={rejectionNote}
                onChange={(e) => setRejectionNote(e.target.value)}
                rows={4}
              />
            </div>
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={() => setShowNoteDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={confirmRejection}
                disabled={!rejectionNote.trim()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reject Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}