import React, { useState } from "react";
import { useUsers, useUpdateUser, useCreateTransaction, useCreateMessage, useBankAccountsWithUsers, useUpdateBankAccount, useAdminCreateBankAccount } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Edit, Wallet, Lock, Eye, Plus, Minus, LockOpen, UserPlus, Settings, Ban, CheckCircle, XCircle, AlertTriangle, ChevronLeft, ChevronRight, ShieldCheck, Info, Send, MoreHorizontal, Trash2, CreditCard, DollarSign } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export function MemberManagement() {
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const limit = 25;
  
  const { data: response, isLoading } = useUsers(currentPage, limit, searchTerm);
  const updateUser = useUpdateUser();
  const createTransaction = useCreateTransaction();
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  const users = response?.users || [];
  const pagination = response?.pagination || {
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    hasNextPage: false,
    hasPrevPage: false
  };

  const filteredUsers = users.filter((user: any) => user.role === "customer");

  // Handle search term changes
  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    setCurrentPage(1); // Reset to first page when searching
  };

  // Pagination handlers
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUpdateUser = (updates: Partial<User>) => {
    if (!selectedUser) return;

    updateUser.mutate({ id: selectedUser.id, updates }, {
      onSuccess: () => {
        toast({
          title: "User updated",
          description: "User information has been updated successfully",
        });
        setEditDialogOpen(false);
      },
      onError: () => {
        toast({
          title: "Update failed",
          description: "Failed to update user information",
          variant: "destructive",
        });
      },
    });
  };

  const handleBalanceAction = (action: string, amount: string) => {
    if (!selectedUser || !amount || parseFloat(amount) <= 0) return;

    createTransaction.mutate({
      userId: selectedUser.id,
      type: action,
      amount,
      description: `Admin ${action}: ${amount}`,
    }, {
      onSuccess: () => {
        toast({
          title: "Transaction completed",
          description: `${action} of ${amount} completed successfully`,
        });
      },
      onError: () => {
        toast({
          title: "Transaction failed",
          description: `Failed to process ${action}`,
          variant: "destructive",
        });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <CardTitle>Customer List</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-12 w-12 rounded-full" />
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-[200px]" />
                    <Skeleton className="h-4 w-[150px]" />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6">
      <Card>
        <CardHeader>
          <CardTitle>Customer List</CardTitle>
          <div className="flex gap-4">
            <Input
              placeholder="Search customers..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-sm"
            />
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Customer</TableHead>
                <TableHead>Balance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredUsers.map((user: any) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium">
                        {user.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div>
                      <div className="font-medium">{parseFloat(user.balance).toFixed(2)}</div>
                      <div className="text-sm text-gray-500">
                        Available: {parseFloat(user.availableBalance).toFixed(2)}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={user.isBanned ? "destructive" : "default"}>
                      {user.isBanned ? "Banned" : "Active"}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 min-h-[80px]">
                      {/* Edit Button - First for visibility */}
                      <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={setEditDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-purple-600 hover:bg-purple-700 text-white border-purple-600 font-semibold"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            EDIT
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit User: {user.name}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && <ComprehensiveUserEditForm user={selectedUser} onUpdate={handleUpdateUser} onClose={() => setEditDialogOpen(false)} />}
                        </DialogContent>
                      </Dialog>

                      {/* Confidential Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-500 hover:bg-blue-600 text-white border-blue-500"
                        onClick={() => {
                          setSelectedUser(user);
                          handleUpdateUser({ isBanned: !user.isBanned });
                        }}
                      >
                        <ShieldCheck className="w-3 h-3 mr-1" />
                        Confidential
                      </Button>

                      {/* Details Button */}
                      <Dialog open={detailsDialogOpen && selectedUser?.id === user.id} onOpenChange={setDetailsDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-green-500 hover:bg-green-600 text-white border-green-500"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Info className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle>Edit Customer: {user.name}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && <CustomerEditForm user={selectedUser} onUpdate={handleUpdateUser} onBalanceAction={handleBalanceAction} />}
                        </DialogContent>
                      </Dialog>

                      {/* Deposit Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-orange-500 hover:bg-orange-600 text-white border-orange-500"
                        onClick={() => {
                          const amount = prompt('Enter deposit amount:');
                          if (amount && parseFloat(amount) > 0) {
                            setSelectedUser(user);
                            handleBalanceAction('deposit', amount);
                          }
                        }}
                      >
                        <Plus className="w-3 h-3 mr-1" />
                        Deposit
                      </Button>

                      {/* Deduction Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-500 hover:bg-red-600 text-white border-red-500"
                        onClick={() => {
                          const amount = prompt('Enter deduction amount:');
                          if (amount && parseFloat(amount) > 0) {
                            setSelectedUser(user);
                            handleBalanceAction('withdrawal', amount);
                          }
                        }}
                      >
                        <Minus className="w-3 h-3 mr-1" />
                        Deduction
                      </Button>

                      {/* Freeze Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white border-blue-600"
                        onClick={() => {
                          const amount = prompt('Enter freeze amount:');
                          if (amount && parseFloat(amount) > 0) {
                            setSelectedUser(user);
                            handleBalanceAction('freeze', amount);
                          }
                        }}
                      >
                        <Lock className="w-3 h-3 mr-1" />
                        Freeze
                      </Button>

                      {/* Unfreeze Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-green-600 hover:bg-green-700 text-white border-green-600"
                        onClick={() => {
                          const amount = prompt('Enter unfreeze amount:');
                          if (amount && parseFloat(amount) > 0) {
                            setSelectedUser(user);
                            handleBalanceAction('unfreeze', amount);
                          }
                        }}
                      >
                        <LockOpen className="w-3 h-3 mr-1" />
                        Unfreeze
                      </Button>

                      {/* Send a letter Button */}
                      <Dialog open={messageDialogOpen && selectedUser?.id === user.id} onOpenChange={setMessageDialogOpen}>
                        <DialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="bg-yellow-500 hover:bg-yellow-600 text-white border-yellow-500"
                            onClick={() => setSelectedUser(user)}
                          >
                            <Send className="w-3 h-3 mr-1" />
                            Send a letter
                          </Button>
                        </DialogTrigger>
                        <DialogContent>
                          <DialogHeader>
                            <DialogTitle>Send Message to {user.name}</DialogTitle>
                          </DialogHeader>
                          {selectedUser && <MessageForm user={selectedUser} onClose={() => setMessageDialogOpen(false)} />}
                        </DialogContent>
                      </Dialog>


                      {/* Other Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-purple-500 hover:bg-purple-600 text-white border-purple-500"
                        onClick={() => {
                          // Additional actions
                          toast({
                            title: "Other actions",
                            description: "Additional functionality can be added here",
                          });
                        }}
                      >
                        <MoreHorizontal className="w-3 h-3 mr-1" />
                        Other
                      </Button>

                      {/* Delete Button */}
                      <Button
                        variant="outline"
                        size="sm"
                        className="bg-red-600 hover:bg-red-700 text-white border-red-600"
                        onClick={() => {
                          if (confirm(`Are you sure you want to delete ${user.name}?`)) {
                            // Handle delete user
                            toast({
                              title: "Delete functionality",
                              description: "Delete functionality would be implemented here",
                            });
                          }
                        }}
                      >
                        <Trash2 className="w-3 h-3 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {/* Pagination */}
          <div className="flex items-center justify-between pt-4">
            <div className="text-sm text-gray-500">
              Showing {((currentPage - 1) * limit) + 1} to {Math.min(currentPage * limit, pagination.totalCount)} of {pagination.totalCount} customers
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const pageNum = currentPage <= 3 
                    ? i + 1 
                    : currentPage >= pagination.totalPages - 2
                    ? pagination.totalPages - 4 + i
                    : currentPage - 2 + i;
                  
                  if (pageNum > pagination.totalPages || pageNum < 1) return null;
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === currentPage ? "default" : "outline"}
                      size="sm"
                      onClick={() => handlePageChange(pageNum)}
                      className="w-8 h-8 p-0"
                    >
                      {pageNum}
                    </Button>
                  );
                })}
              </div>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CustomerEditForm({ 
  user, 
  onUpdate, 
  onBalanceAction 
}: { 
  user: User; 
  onUpdate: (updates: Partial<User>) => void;
  onBalanceAction: (action: string, amount: string) => void;
}) {
  const [formData, setFormData] = useState({
    reputation: user.reputation,
    winLoseSetting: user.winLoseSetting,
    direction: user.direction,
    isBanned: user.isBanned,
    withdrawalProhibited: user.withdrawalProhibited,
    tasksBan: user.tasksBan || "Allowed",
  });

  const [balanceActions, setBalanceActions] = useState({
    deposit: "",
    deduct: "",
    freeze: "",
    unfreeze: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="reputation">Reputation (0-100)</Label>
            <Input
              id="reputation"
              type="number"
              min="0"
              max="100"
              value={formData.reputation}
              onChange={(e) => setFormData({ ...formData, reputation: parseInt(e.target.value) })}
            />
          </div>
          <div>
            <Label htmlFor="winLose">Win/Lose Setting</Label>
            <Select value={formData.winLoseSetting} onValueChange={(value) => setFormData({ ...formData, winLoseSetting: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="To Win">To Win</SelectItem>
                <SelectItem value="To Lose">To Lose</SelectItem>
                <SelectItem value="Random">Random</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="direction">Direction</Label>
            <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Buy Up">Buy Up</SelectItem>
                <SelectItem value="Buy the Dip">Buy the Dip</SelectItem>
                <SelectItem value="Actual">Actual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="accountStatus">Account Status</Label>
            <Select value={formData.isBanned ? "Banned" : "Active"} onValueChange={(value) => setFormData({ ...formData, isBanned: value === "Banned" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Banned">Banned</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="withdrawalStatus">Withdrawal Status</Label>
            <Select value={formData.withdrawalProhibited ? "Prohibited" : "Allowed"} onValueChange={(value) => setFormData({ ...formData, withdrawalProhibited: value === "Prohibited" })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Allowed">Allowed</SelectItem>
                <SelectItem value="Prohibited">Prohibited</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="tasksBan">Tasks Ban</Label>
            <Select value={formData.tasksBan} onValueChange={(value) => setFormData({ ...formData, tasksBan: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Allowed">Allowed</SelectItem>
                <SelectItem value="Prohibit">Prohibit</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <Button type="submit" className="w-full">Save Changes</Button>
      </form>

      <div className="border-t pt-4">
        <h4 className="font-medium mb-3">Balance Actions</h4>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <Label>Deposit</Label>
            <div className="flex">
              <Input
                type="number"
                placeholder="Amount"
                value={balanceActions.deposit}
                onChange={(e) => setBalanceActions({ ...balanceActions, deposit: e.target.value })}
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => {
                  onBalanceAction("deposit", balanceActions.deposit);
                  setBalanceActions({ ...balanceActions, deposit: "" });
                }}
                className="rounded-l-none bg-success hover:bg-success/90"
              >
                <Plus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Deduct</Label>
            <div className="flex">
              <Input
                type="number"
                placeholder="Amount"
                value={balanceActions.deduct}
                onChange={(e) => setBalanceActions({ ...balanceActions, deduct: e.target.value })}
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => {
                  onBalanceAction("withdrawal", balanceActions.deduct);
                  setBalanceActions({ ...balanceActions, deduct: "" });
                }}
                className="rounded-l-none bg-destructive hover:bg-destructive/90"
              >
                <Minus className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Freeze</Label>
            <div className="flex">
              <Input
                type="number"
                placeholder="Amount"
                value={balanceActions.freeze}
                onChange={(e) => setBalanceActions({ ...balanceActions, freeze: e.target.value })}
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => {
                  onBalanceAction("freeze", balanceActions.freeze);
                  setBalanceActions({ ...balanceActions, freeze: "" });
                }}
                className="rounded-l-none bg-warning hover:bg-warning/90"
              >
                <Lock className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <div>
            <Label>Unfreeze</Label>
            <div className="flex">
              <Input
                type="number"
                placeholder="Amount"
                value={balanceActions.unfreeze}
                onChange={(e) => setBalanceActions({ ...balanceActions, unfreeze: e.target.value })}
                className="rounded-r-none"
              />
              <Button
                type="button"
                onClick={() => {
                  onBalanceAction("unfreeze", balanceActions.unfreeze);
                  setBalanceActions({ ...balanceActions, unfreeze: "" });
                }}
                className="rounded-l-none bg-primary hover:bg-primary/90"
              >
                <LockOpen className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageForm({ 
  user, 
  onClose 
}: { 
  user: User; 
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const createMessage = useCreateMessage();
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim() || !content.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    createMessage.mutate({ 
      recipientId: user.id, 
      title, 
      content 
    }, {
      onSuccess: () => {
        toast({
          title: "Message sent",
          description: `Message sent to ${user.name} successfully`,
        });
        onClose();
      },
      onError: () => {
        toast({
          title: "Failed to send message",
          description: "Please try again",
          variant: "destructive",
        });
      },
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="title">Message Title</Label>
        <Input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Enter message title"
          required
        />
      </div>
      <div>
        <Label htmlFor="content">Message Content</Label>
        <textarea
          id="content"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="Enter message content"
          rows={4}
          className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          required
        />
      </div>
      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button type="submit" disabled={createMessage.isPending}>
          {createMessage.isPending ? "Sending..." : "Send Message"}
        </Button>
      </div>
    </form>
  );
}

function ComprehensiveUserEditForm({ 
  user, 
  onUpdate, 
  onClose 
}: { 
  user: User; 
  onUpdate: (updates: Partial<User>) => void;
  onClose: () => void;
}) {
  const [formData, setFormData] = useState({
    // User basic information
    name: user.name,
    email: user.email,
    username: user.username,
    
    // User settings
    reputation: user.reputation,
    creditScore: user.creditScore,
    winLoseSetting: user.winLoseSetting,
    direction: user.direction,
    isBanned: user.isBanned,
    withdrawalProhibited: user.withdrawalProhibited,
    tasksBan: user.tasksBan || "Allowed",
    userType: user.userType || "Normal",
    generalAgent: user.generalAgent || "",
    remark: user.remark || "",
    fundPassword: user.fundPassword || "",
    agentInvitationCode: user.agentInvitationCode || "",
    invitationCode: user.invitationCode || "",
  });

  const [bankData, setBankData] = useState({
    accountHolderName: "",
    accountNumber: "",
    bankName: "",
    branchName: "",
    ifscCode: "",
    bindingType: "Bank Card",
    currency: "INR",
  });

  const { data: bankAccountsData } = useBankAccountsWithUsers();
  const updateBankAccount = useUpdateBankAccount();
  const createBankAccount = useAdminCreateBankAccount();
  const { toast } = useToast();

  // Find user's bank account
  const userBankAccount = bankAccountsData?.find((account: any) => account.userId === user.id);

  // Initialize bank data when component mounts or user changes
  React.useEffect(() => {
    if (userBankAccount) {
      setBankData({
        accountHolderName: userBankAccount.accountHolderName || "",
        accountNumber: userBankAccount.accountNumber || "",
        bankName: userBankAccount.bankName || "",
        branchName: userBankAccount.branchName || "",
        ifscCode: userBankAccount.ifscCode || "",
        bindingType: userBankAccount.bindingType || "Bank Card",
        currency: userBankAccount.currency || "INR",
      });
    }
  }, [userBankAccount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Update user information
    onUpdate(formData);
    
    // Update or create bank account if data is provided
    if (bankData.accountHolderName && bankData.accountNumber && bankData.bankName) {
      if (userBankAccount) {
        // Update existing bank account
        updateBankAccount.mutate({ 
          id: userBankAccount.id, 
          ...bankData 
        }, {
          onSuccess: () => {
            toast({
              title: "Bank information updated",
              description: "Bank account information has been updated successfully",
            });
          },
          onError: () => {
            toast({
              title: "Bank update failed",
              description: "Failed to update bank account information",
              variant: "destructive",
            });
          },
        });
      } else {
        // Create new bank account
        createBankAccount.mutate({ ...bankData, userId: user.id }, {
          onSuccess: () => {
            toast({
              title: "Bank account created",
              description: "Bank account has been created successfully",
            });
          },
          onError: () => {
            toast({
              title: "Bank creation failed",
              description: "Failed to create bank account",
              variant: "destructive",
            });
          },
        });
      }
    }
    
    onClose();
    
    // Redirect to admin dashboard after successful edit
    window.location.href = '/admin/dashboard';
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic User Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Basic Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="userType">User Type</Label>
              <Select value={formData.userType} onValueChange={(value) => setFormData({ ...formData, userType: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="VIP">VIP</SelectItem>
                  <SelectItem value="Agent">Agent</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Account Settings */}
        <div>
          <h3 className="text-lg font-medium mb-4">Account Settings</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="reputation">Reputation (0-100)</Label>
              <Input
                id="reputation"
                type="number"
                min="0"
                max="100"
                value={formData.reputation}
                onChange={(e) => setFormData({ ...formData, reputation: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="creditScore">Credit Score (0-100)</Label>
              <Input
                id="creditScore"
                type="number"
                min="0"
                max="100"
                value={formData.creditScore}
                onChange={(e) => setFormData({ ...formData, creditScore: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <Label htmlFor="winLose">Win/Lose Setting</Label>
              <Select value={formData.winLoseSetting} onValueChange={(value) => setFormData({ ...formData, winLoseSetting: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="To Win">To Win</SelectItem>
                  <SelectItem value="To Lose">To Lose</SelectItem>
                  <SelectItem value="Random">Random</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="direction">Direction</Label>
              <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Buy Up">Buy Up</SelectItem>
                  <SelectItem value="Buy the Dip">Buy the Dip</SelectItem>
                  <SelectItem value="Actual">Actual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="accountStatus">Account Status</Label>
              <Select value={formData.isBanned ? "Banned" : "Active"} onValueChange={(value) => setFormData({ ...formData, isBanned: value === "Banned" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Banned">Banned</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="withdrawalStatus">Withdrawal Status</Label>
              <Select value={formData.withdrawalProhibited ? "Prohibited" : "Allowed"} onValueChange={(value) => setFormData({ ...formData, withdrawalProhibited: value === "Prohibited" })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Prohibited">Prohibited</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="tasksBan">Tasks Ban</Label>
              <Select value={formData.tasksBan} onValueChange={(value) => setFormData({ ...formData, tasksBan: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Allowed">Allowed</SelectItem>
                  <SelectItem value="Prohibit">Prohibit</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="fundPassword">Fund Password</Label>
              <Input
                id="fundPassword"
                type="password"
                value={formData.fundPassword}
                onChange={(e) => setFormData({ ...formData, fundPassword: e.target.value })}
                placeholder="Enter fund password"
              />
            </div>
          </div>
        </div>

        {/* Additional Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Additional Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="generalAgent">General Agent</Label>
              <Input
                id="generalAgent"
                value={formData.generalAgent}
                onChange={(e) => setFormData({ ...formData, generalAgent: e.target.value })}
                placeholder="Enter general agent"
              />
            </div>
            <div>
              <Label htmlFor="agentInvitationCode">Agent Invitation Code</Label>
              <Input
                id="agentInvitationCode"
                value={formData.agentInvitationCode}
                onChange={(e) => setFormData({ ...formData, agentInvitationCode: e.target.value })}
                placeholder="Enter agent invitation code"
              />
            </div>
            <div>
              <Label htmlFor="invitationCode">Invitation Code</Label>
              <Input
                id="invitationCode"
                value={formData.invitationCode}
                onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
                placeholder="Enter invitation code"
              />
            </div>
            <div>
              <Label htmlFor="remark">Remark</Label>
              <Input
                id="remark"
                value={formData.remark}
                onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                placeholder="Enter remark"
              />
            </div>
          </div>
        </div>

        {/* Bank Information */}
        <div>
          <h3 className="text-lg font-medium mb-4">Bank Information</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="accountHolderName">Account Holder Name</Label>
              <Input
                id="accountHolderName"
                value={bankData.accountHolderName}
                onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                placeholder="Enter account holder name"
              />
            </div>
            <div>
              <Label htmlFor="accountNumber">Account Number</Label>
              <Input
                id="accountNumber"
                value={bankData.accountNumber}
                onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                placeholder="Enter account number"
              />
            </div>
            <div>
              <Label htmlFor="bankName">Bank Name</Label>
              <Input
                id="bankName"
                value={bankData.bankName}
                onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                placeholder="Enter bank name"
              />
            </div>
            <div>
              <Label htmlFor="branchName">Branch Name</Label>
              <Input
                id="branchName"
                value={bankData.branchName}
                onChange={(e) => setBankData({ ...bankData, branchName: e.target.value })}
                placeholder="Enter branch name (optional)"
              />
            </div>
            <div>
              <Label htmlFor="ifscCode">IFSC Code</Label>
              <Input
                id="ifscCode"
                value={bankData.ifscCode}
                onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value })}
                placeholder="Enter IFSC code (optional)"
              />
            </div>
            <div>
              <Label htmlFor="currency">Currency</Label>
              <Select value={bankData.currency} onValueChange={(value) => setBankData({ ...bankData, currency: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="INR">INR</SelectItem>
                  <SelectItem value="USD">USD</SelectItem>
                  <SelectItem value="EUR">EUR</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-2 pt-4 border-t">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Save All Changes
          </Button>
        </div>
      </form>
    </div>
  );
}
