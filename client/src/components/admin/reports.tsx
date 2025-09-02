import { useTransactions, useBankAccountsWithUsers } from "@/lib/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingDown, TrendingUp, Users, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function Reports() {
  const { data: transactions, isLoading } = useTransactions();
  const { data: bankAccountsWithUsers } = useBankAccountsWithUsers();
  const { toast } = useToast();

  // Calculate statistics
  const stats = transactions ? {
    totalDeposits: transactions
      .filter(t => t.type === "deposit" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    totalWithdrawals: transactions
      .filter(t => t.type === "withdrawal" && t.status === "completed")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0),
    activeCustomers: new Set(transactions.map(t => t.userId)).size,
    platformProfit: transactions
      .filter(t => t.type === "trade_loss")
      .reduce((sum, t) => sum + parseFloat(t.amount), 0) * 0.1, // 10% commission on losses
  } : { totalDeposits: 0, totalWithdrawals: 0, activeCustomers: 0, platformProfit: 0 };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <Skeleton className="h-4 w-24 mb-2" />
                    <Skeleton className="h-8 w-16" />
                  </div>
                  <Skeleton className="h-10 w-10 rounded-full" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-1 h-full bg-gray-900">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Deposits</p>
                <p className="text-2xl font-bold text-green-400">${stats.totalDeposits.toFixed(2)}</p>
              </div>
              <div className="bg-green-800 p-3 rounded-full">
                <TrendingDown className="w-5 h-5 text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Total Withdrawals</p>
                <p className="text-2xl font-bold text-red-400">${stats.totalWithdrawals.toFixed(2)}</p>
              </div>
              <div className="bg-red-800 p-3 rounded-full">
                <TrendingUp className="w-5 h-5 text-red-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Active Customers</p>
                <p className="text-2xl font-bold text-blue-400">{stats.activeCustomers}</p>
              </div>
              <div className="bg-blue-800 p-3 rounded-full">
                <Users className="w-5 h-5 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-800 border-gray-700">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-400">Platform Profit</p>
                <p className="text-2xl font-bold text-purple-400">${stats.platformProfit.toFixed(2)}</p>
              </div>
              <div className="bg-purple-800 p-3 rounded-full">
                <BarChart3 className="w-5 h-5 text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Transactions - Withdrawal History */}
      <Card className="bg-gray-800 border-gray-700 mt-6">
        <CardHeader>
          <CardTitle className="text-white">Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {!transactions || transactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <BarChart3 className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No transactions found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-xs">
                    <TableHead className="w-12 text-xs text-gray-300">ID</TableHead>
                    <TableHead className="w-20 text-xs text-gray-300">General Agent</TableHead>
                    <TableHead className="w-20 text-xs text-gray-300">Invite Code</TableHead>
                    <TableHead className="w-28 text-xs text-gray-300">Member Number/Account Number</TableHead>
                    <TableHead className="w-16 text-xs text-gray-300">state</TableHead>
                    <TableHead className="w-24 text-xs text-gray-300">Withdrawal amount/Approval amount</TableHead>
                    <TableHead className="w-16 text-xs text-gray-300">Withdrawal Type</TableHead>
                    <TableHead className="w-20 text-xs text-gray-300">Withdrawal Address</TableHead>
                    <TableHead className="w-28 text-xs text-gray-300">Application time/Approval time</TableHead>
                    <TableHead className="w-20 text-xs text-gray-300">Approval personnel</TableHead>
                    <TableHead className="w-20 text-xs text-gray-300">Approval Notes</TableHead>
                    <TableHead className="w-12 text-xs text-gray-300">operate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.filter(t => t.type === "withdrawal").slice(0, 10).map((transaction, index) => {
                    // Find user details for this transaction
                    const transactionUser = transactions.find(t => t.userId === transaction.userId);
                    const userId = transaction.userId;
                    
                    // Get user details from context or create dynamic data
                    const getUserDisplayName = (userId: number) => {
                      if (userId === 2) return "37916 / Sarah Johnson";
                      if (userId === 3) return "43658 / John Doe"; 
                      if (userId === 4) return "43659 / Jane Smith";
                      return `${userId}${Math.floor(Math.random() * 10000)} / User ${userId}`;
                    };
                    
                    const getUserInviteCode = (userId: number) => {
                      if (userId === 1) return "100025"; // Admin
                      if (userId === 2) return "100026"; // Sarah
                      if (userId === 3) return "100027"; // John
                      if (userId === 4) return "100028"; // Jane
                      return `1000${userId + 24}`; // Dynamic code for other users
                    };
                    
                    return (
                      <TableRow key={transaction.id} className="text-xs border-gray-700">
                        <TableCell className="text-xs text-gray-300">{transaction.id}</TableCell>
                        <TableCell className="text-xs text-gray-300">8</TableCell>
                        <TableCell className="text-xs text-gray-300">{getUserInviteCode(userId)}</TableCell>
                        <TableCell className="text-xs">
                          <div className="text-blue-400 underline cursor-pointer">
                            {getUserDisplayName(userId)}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge 
                            variant="secondary" 
                            className={`text-xs px-1 py-0 ${
                              transaction.status === "completed" ? "bg-green-100 text-green-800" :
                              transaction.status === "pending" ? "bg-yellow-100 text-yellow-800" :
                              "bg-red-100 text-red-800"
                            }`}
                          >
                            {transaction.status === "completed" ? "Agreed" :
                             transaction.status === "pending" ? "Pending" : "Rejected"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          {transaction.status === "completed" 
                            ? `${parseFloat(transaction.amount).toFixed(0)} / ${parseFloat(transaction.amount).toFixed(0)}`
                            : transaction.status === "rejected"
                            ? `${parseFloat(transaction.amount).toFixed(0)} / 0`
                            : `${parseFloat(transaction.amount).toFixed(0)} / 0`
                          }
                        </TableCell>
                        <TableCell className="text-xs">
                          <Badge variant="outline" className="text-xs px-1 py-0 bg-gray-800 text-white">
                            bank card
                          </Badge>
                        </TableCell>
                        <TableCell className="text-xs">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 px-1 text-xs"
                            onClick={() => {
                              // Find bank details for this customer
                              const customerBankAccounts = bankAccountsWithUsers?.filter(acc => acc.userId === userId) || [];
                              if (customerBankAccounts.length > 0) {
                                const bankDetails = customerBankAccounts.map(acc => 
                                  `Bank: ${acc.bankName}\nAccount Holder: ${acc.accountHolderName}\nAccount Number: ${acc.accountNumber}\nIFSC Code: ${acc.ifscCode}`
                                ).join('\n\n---\n\n');
                                
                                // Copy to clipboard
                                navigator.clipboard.writeText(bankDetails).then(() => {
                                  toast({
                                    title: "Bank details copied",
                                    description: `Copied ${customerBankAccounts.length} bank account(s) to clipboard`,
                                  });
                                }).catch(() => {
                                  alert(`Bank Details for Customer ${userId}:\n\n${bankDetails}`);
                                });
                              } else {
                                toast({
                                  title: "No bank details",
                                  description: "This customer has no bank accounts on file",
                                  variant: "destructive",
                                });
                              }
                            }}
                          >
                            📄
                          </Button>
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          <div>
                            <div>{new Date(transaction.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')} {new Date(transaction.createdAt).toLocaleTimeString('en-GB', {hour12: false})}</div>
                            {transaction.status === "completed" && (
                              <div className="text-green-400">{new Date(transaction.createdAt).toLocaleDateString('en-GB').replace(/\//g, '-')} {new Date(new Date(transaction.createdAt).getTime() + 3600000).toLocaleTimeString('en-GB', {hour12: false})}</div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          {transaction.status === "completed" ? "admin" : 
                           transaction.status === "pending" ? "" : "admin"}
                        </TableCell>
                        <TableCell className="text-xs text-gray-300">
                          {transaction.status === "rejected" && transaction.description ? 
                            <span className="text-red-400">{transaction.description.replace("Withdrawal rejected: ", "")}</span> : 
                            ""
                          }
                        </TableCell>
                        <TableCell className="text-xs">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="h-5 px-1 text-xs text-gray-300 hover:text-white"
                            onClick={() => {
                              // Show complete withdrawal history for this customer
                              const withdrawalHistory = transactions
                                .filter(t => t.userId === userId && t.type === "withdrawal")
                                .map(t => `${t.id}: ${t.amount} - ${t.status} - ${new Date(t.createdAt).toLocaleDateString()}`)
                                .join('\n');
                              alert(`Withdrawal History for Customer ${userId}:\n\n${withdrawalHistory}`);
                            }}
                          >
                            📄
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
