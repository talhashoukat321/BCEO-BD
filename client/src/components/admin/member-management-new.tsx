import React, { useState, useEffect } from "react";
import { useUsers, useUpdateUser, useCreateUser, useCreateTransaction, useTransactions, useUpdateTransaction, useDeleteUser, useCreateMessage, useBankAccountsWithUsers, useAdminUpdateBankAccount, useAdminCreateBankAccount } from "@/lib/api";
import { queryClient } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";
import { Edit, Wallet, Lock, Eye, Plus, Minus, LockOpen, UserPlus, Settings, Ban, CheckCircle, XCircle, AlertTriangle, Unlock, Trash2, Send, Key, FileText } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { User } from "@shared/schema";

export function MemberManagement() {
  const { data: users, isLoading } = useUsers();
  const { data: transactions } = useTransactions();
  const updateUser = useUpdateUser();
  const createUser = useCreateUser();
  const createTransaction = useCreateTransaction();
  const updateTransaction = useUpdateTransaction();
  const deleteUser = useDeleteUser();
  const createMessage = useCreateMessage();
  const { toast } = useToast();

  // Auto-refresh user data every 2 seconds for real-time updates
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);
  const [depositDialogOpen, setDepositDialogOpen] = useState(false);
  const [deductionDialogOpen, setDeductionDialogOpen] = useState(false);
  const [orderDialogOpen, setOrderDialogOpen] = useState(false);
  const [messageDialogOpen, setMessageDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [depositAmount, setDepositAmount] = useState("");
  const [deductionAmount, setDeductionAmount] = useState("");
  const [messageTitle, setMessageTitle] = useState("");
  const [messageContent, setMessageContent] = useState("");
  const [freezeDialogOpen, setFreezeDialogOpen] = useState(false);
  const [freezeAmount, setFreezeAmount] = useState("");
  const [unfreezeDialogOpen, setUnfreezeDialogOpen] = useState(false);
  const [unfreezeAmount, setUnfreezeAmount] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otherDialogOpen, setOtherDialogOpen] = useState(false);
  const [creditScore, setCreditScore] = useState("");
  const [addMemberDialogOpen, setAddMemberDialogOpen] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    username: "",
    email: "",
    password: "",
    name: "",
    reputation: 100,
    creditScore: 100
  });

  // Filter and sort users based on search term, ID descending (newest first)
  const filteredUsers = users?.filter(user => 
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username?.toLowerCase().includes(searchTerm.toLowerCase())
  ).sort((a, b) => b.id - a.id) || [];

  const handleQuickUpdate = (user: User, updates: Partial<User>) => {
    updateUser.mutate(
      { id: user.id, updates },
      {
        onSuccess: () => {
          toast({ title: "User updated successfully" });
          // Immediately refresh the data for real-time updates
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });
          queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
        },
        onError: () => {
          toast({ title: "Failed to update user", variant: "destructive" });
        },
      }
    );
  };

  const handleFreezeAmount = (user: User, amount: number) => {
    const currentAvailable = parseFloat(user.availableBalance || "0");
    const currentFrozen = parseFloat(user.frozenBalance || "0");
    
    if (amount > currentAvailable) {
      toast({ title: "Insufficient available balance", variant: "destructive" });
      return;
    }

    const newAvailable = currentAvailable - amount;
    const newFrozen = currentFrozen + amount;

    handleQuickUpdate(user, {
      availableBalance: newAvailable.toString(),
      frozenBalance: newFrozen.toString(),
    });
    setFreezeAmount("");
    setFreezeDialogOpen(false);
  };

  const handleUnfreezeAmount = (user: User, amount: number) => {
    const currentAvailable = parseFloat(user.availableBalance || "0");
    const currentFrozen = parseFloat(user.frozenBalance || "0");
    
    if (amount > currentFrozen) {
      toast({ title: "Insufficient frozen balance", variant: "destructive" });
      return;
    }

    const newAvailable = currentAvailable + amount;
    const newFrozen = currentFrozen - amount;

    handleQuickUpdate(user, {
      availableBalance: newAvailable.toString(),
      frozenBalance: newFrozen.toString(),
    });
    setUnfreezeAmount("");
    setUnfreezeDialogOpen(false);
  };

  const handleDepositWithdraw = (type: "deposit" | "withdraw", amount: number) => {
    if (!selectedUser || amount <= 0) return;

    const currentBalance = parseFloat(selectedUser.balance || "0");
    const currentAvailable = parseFloat(selectedUser.availableBalance || "0");
    
    let newBalance, newAvailable;
    
    if (type === "deposit") {
      newBalance = currentBalance + amount;
      newAvailable = currentAvailable + amount;
    } else {
      if (amount > currentAvailable) {
        toast({ title: "Insufficient available balance", variant: "destructive" });
        return;
      }
      newBalance = currentBalance - amount;
      newAvailable = currentAvailable - amount;
    }

    handleQuickUpdate(selectedUser, {
      balance: newBalance.toString(),
      availableBalance: newAvailable.toString(),
    });

    // Reset states
    setDepositAmount("");
    setDeductionAmount("");
    setDepositDialogOpen(false);
    setDeductionDialogOpen(false);
  };

  const handleDeleteUser = (user: User) => {
    deleteUser.mutate(user.id, {
      onSuccess: () => {
        toast({ title: "User deleted successfully" });
        setDeleteDialogOpen(false);
        setSelectedUser(null);
        // Immediately refresh the data for real-time updates
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: () => {
        toast({ title: "Failed to delete user", variant: "destructive" });
      },
    });
  };

  const handleSendMessage = () => {
    if (!selectedUser || !messageTitle || !messageContent) return;

    createMessage.mutate({
      recipientId: selectedUser.id,
      title: messageTitle,
      content: messageContent,
    }, {
      onSuccess: () => {
        toast({ title: "Message sent successfully" });
        setMessageTitle("");
        setMessageContent("");
        setMessageDialogOpen(false);
        // Immediately refresh the data for real-time updates
        queryClient.invalidateQueries({ queryKey: ["/api/messages"] });
      },
      onError: () => {
        toast({ title: "Failed to send message", variant: "destructive" });
      },
    });
  };

  const handleAddMember = () => {
    createUser.mutate({
      ...newMemberData,
      role: "customer",
      availableBalance: "0.00",
      frozenBalance: "0.00",
      invitationCode: `100${String(Date.now()).slice(-3)}`,
      userType: "Normal",
      generalAgent: "Agent001",
      remark: "New Member",
      creditScore: newMemberData.creditScore || 100,
    }, {
      onSuccess: () => {
        toast({ title: "Member added successfully" });
        setAddMemberDialogOpen(false);
        setNewMemberData({
          username: "",
          email: "",
          password: "",
          name: "",
          reputation: 100,
          creditScore: 100
        });
        // Immediately refresh the data for real-time updates
        queryClient.invalidateQueries({ queryKey: ["/api/users"] });
      },
      onError: () => {
        toast({ title: "Failed to add member", variant: "destructive" });
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="h-full bg-gray-900">
      <Card className="h-full bg-gray-800 border-gray-700">
        <CardHeader className="p-6">
          <CardTitle className="text-white">Member Management</CardTitle>
          <div className="flex gap-1 justify-between">
            <Input
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm bg-gray-700 border-gray-600 text-white placeholder-gray-400"
            />
            <Dialog open={addMemberDialogOpen} onOpenChange={setAddMemberDialogOpen}>
              <DialogTrigger asChild>
                <Button className="bg-blue-600 hover:bg-blue-700">
                  <UserPlus className="w-4 h-4 mr-2" />
                  Add New Member
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Member</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Username</Label>
                    <Input 
                      value={newMemberData.username}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, username: e.target.value }))}
                      placeholder="Enter username"
                    />
                  </div>
                  <div>
                    <Label>Email</Label>
                    <Input 
                      type="email"
                      value={newMemberData.email}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="Enter email"
                    />
                  </div>
                  <div>
                    <Label>Password</Label>
                    <Input 
                      type="password"
                      value={newMemberData.password}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, password: e.target.value }))}
                      placeholder="Enter password"
                    />
                  </div>
                  <div>
                    <Label>Full Name</Label>
                    <Input 
                      value={newMemberData.name}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="Enter full name"
                    />
                  </div>
                  <div>
                    <Label>VIP Level (Reputation)</Label>
                    <Input 
                      type="number"
                      value={newMemberData.reputation}
                      onChange={(e) => setNewMemberData(prev => ({ ...prev, reputation: parseInt(e.target.value) || 100 }))}
                      placeholder="Enter reputation (0-100)"
                      min="0"
                      max="100"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="outline" 
                      onClick={() => {
                        setAddMemberDialogOpen(false);
                        setNewMemberData({
                          username: "",
                          email: "",
                          password: "",
                          name: "",
                          reputation: 100,
                          creditScore: 100
                        });
                      }}
                    >
                      Cancel
                    </Button>
                    <Button 
                      onClick={handleAddMember}
                      disabled={!newMemberData.username || !newMemberData.email || !newMemberData.password || !newMemberData.name}
                    >
                      Add Member
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent className="p-2 bg-gray-800">
          <div className="overflow-x-auto">
            <Table className="min-w-[1660px] table-fixed">
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="w-[50px] text-center text-gray-300">ID</TableHead>
                  <TableHead className="w-[100px] text-gray-300">Username</TableHead>
                  <TableHead className="w-[180px] text-gray-300">Balance</TableHead>
                  <TableHead className="w-[80px] text-center text-gray-300">Credit Score</TableHead>
                  <TableHead className="w-[100px] text-center text-gray-300">General Agent</TableHead>
                  <TableHead className="w-[100px] text-center text-gray-300">Invitation Code</TableHead>
                  <TableHead className="w-[80px] text-center text-gray-300">Type</TableHead>
                  <TableHead className="w-[90px] text-center text-gray-300">Direction</TableHead>
                  <TableHead className="w-[60px] text-center text-gray-300">Ban</TableHead>
                  <TableHead className="w-[80px] text-center text-gray-300">Withdraw</TableHead>
                  <TableHead className="w-[110px] text-center text-gray-300">Registration Time</TableHead>
                  <TableHead className="w-[100px] text-center text-gray-300">Remark</TableHead>
                  <TableHead className="w-[500px] text-center text-gray-300">Operate</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id} className="border-gray-700 hover:bg-gray-750">
                    <TableCell className="font-mono text-sm text-center w-[50px] text-gray-200">{user.id}</TableCell>
                    <TableCell className="font-medium w-[100px] truncate text-gray-200">{user.username}</TableCell>
                    <TableCell className="w-[180px]">
                      <div className="space-y-1 text-xs">
                        <div className="text-gray-200">
                          Total: {(parseFloat(user.availableBalance || "0") + parseFloat(user.frozenBalance || "0")).toFixed(2)}
                        </div>
                        <div className="text-gray-400">
                          Available: {parseFloat(user.availableBalance || "0").toFixed(2)}
                        </div>
                        <div className="text-gray-400">
                          Frozen: {parseFloat(user.frozenBalance || "0").toFixed(2)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="text-center w-[80px]">
                      <Badge variant="outline" className="text-xs px-1 py-0.5 border-gray-600 text-gray-200">
                        {user.creditScore || 100}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-xs text-center w-[100px] truncate text-gray-300">{user.generalAgent || "admin"}</TableCell>
                    <TableCell className="text-xs text-center w-[100px] truncate text-gray-300">{user.invitationCode || "100025"}</TableCell>
                    <TableCell className="w-[80px]">
                      <Select
                        value={user.userType || "Normal"}
                        onValueChange={(value) => handleQuickUpdate(user, { userType: value })}
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-gray-700 border-gray-600 text-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="Normal" className="text-gray-200">Normal</SelectItem>
                          <SelectItem value="VIP" className="text-gray-200">VIP</SelectItem>
                          <SelectItem value="Agent" className="text-gray-200">Agent</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="w-[90px]">
                      <Select
                        value={user.direction || "Actual"}
                        onValueChange={(value) => handleQuickUpdate(user, { direction: value })}
                      >
                        <SelectTrigger className="w-full h-7 text-xs bg-gray-700 border-gray-600 text-gray-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          <SelectItem value="Buy Up" className="text-gray-200">Buy Up</SelectItem>
                          <SelectItem value="Buy Down" className="text-gray-200">Buy Down</SelectItem>
                          <SelectItem value="Actual" className="text-gray-200">Actual</SelectItem>
                        </SelectContent>
                      </Select>
                    </TableCell>
                    <TableCell className="text-center w-[60px]">
                      <Switch
                        checked={user.isBanned || false}
                        onCheckedChange={(checked) => handleQuickUpdate(user, { isBanned: checked })}
                        className="scale-75 data-[state=checked]:bg-red-600 data-[state=unchecked]:bg-gray-600"
                      />
                    </TableCell>
                    <TableCell className="text-center w-[80px]">
                      <Switch
                        checked={user.withdrawalProhibited || false}
                        onCheckedChange={(checked) => handleQuickUpdate(user, { withdrawalProhibited: checked })}
                        className="scale-75 data-[state=checked]:bg-orange-600 data-[state=unchecked]:bg-gray-600"
                      />
                    </TableCell>
                    <TableCell className="w-[110px]">
                      <div className="text-xs text-center text-gray-300">
                        {user.registrationTime ? 
                          new Date(user.registrationTime).toLocaleDateString('en-GB') : 
                          new Date().toLocaleDateString('en-GB')
                        }
                      </div>
                    </TableCell>
                    <TableCell className="w-[100px]">
                      <Input
                        value={user.remark || ""}
                        onChange={(e) => handleQuickUpdate(user, { remark: e.target.value })}
                        className="w-full h-7 text-xs bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
                        placeholder="Remark"
                      />
                    </TableCell>
                    <TableCell className="w-[500px]">
                      <div className="flex flex-wrap gap-1 justify-start">
                        {/* Edit Button - First for visibility */}
                        <Dialog open={editDialogOpen && selectedUser?.id === user.id} onOpenChange={setEditDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-purple-900 text-purple-200 border-purple-600 hover:bg-purple-800 font-semibold"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              EDIT
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
                            <DialogHeader>
                              <DialogTitle>Edit User: {user.name}</DialogTitle>
                            </DialogHeader>
                            {selectedUser && <ComprehensiveUserEditForm user={selectedUser} onUpdate={handleQuickUpdate} onClose={() => setEditDialogOpen(false)} />}
                          </DialogContent>
                        </Dialog>

                        {/* Password Management Button */}
                        <Dialog open={passwordDialogOpen && selectedUser?.id === user.id} onOpenChange={setPasswordDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-blue-900 text-blue-200 border-blue-600 hover:bg-blue-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Key className="w-3 h-3 mr-1" />
                              Confidential
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Password Management</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="space-y-4">
                                <div>
                                  <Label htmlFor="new-password">New Password</Label>
                                  <Input
                                    id="new-password"
                                    type="password"
                                    value={newPassword}
                                    onChange={(e) => setNewPassword(e.target.value)}
                                    placeholder="Enter new password"
                                  />
                                </div>
                                <div>
                                  <Label htmlFor="confirm-password">Confirm Password</Label>
                                  <Input
                                    id="confirm-password"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    placeholder="Confirm new password"
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button
                                    variant="outline"
                                    onClick={() => {
                                      setPasswordDialogOpen(false);
                                      setNewPassword("");
                                      setConfirmPassword("");
                                    }}
                                  >
                                    Cancel
                                  </Button>
                                  <Button
                                    onClick={() => {
                                      if (newPassword !== confirmPassword) {
                                        toast({ title: "Passwords do not match", variant: "destructive" });
                                        return;
                                      }
                                      if (newPassword.length < 4) {
                                        toast({ title: "Password must be at least 4 characters", variant: "destructive" });
                                        return;
                                      }
                                      if (selectedUser) {
                                        handleQuickUpdate(selectedUser, { password: newPassword });
                                        setPasswordDialogOpen(false);
                                        setNewPassword("");
                                        setConfirmPassword("");
                                        toast({ title: "Password updated successfully" });
                                      }
                                    }}
                                    disabled={!newPassword || !confirmPassword}
                                  >
                                    Update Password
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Details Button */}
                        <Dialog open={detailsDialogOpen && selectedUser?.id === user.id} onOpenChange={setDetailsDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-green-900 text-green-200 border-green-600 hover:bg-green-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Details
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-2xl">
                            <DialogHeader>
                              <DialogTitle>User Details: {selectedUser?.name}</DialogTitle>
                            </DialogHeader>
                            {selectedUser && (
                              <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">User ID</Label>
                                    <p className="text-sm">{selectedUser.id}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Username</Label>
                                    <p className="text-sm">{selectedUser.username}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Email</Label>
                                    <p className="text-sm">{selectedUser.email}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Name</Label>
                                    <p className="text-sm">{selectedUser.name}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Role</Label>
                                    <Badge>{selectedUser.role}</Badge>
                                  </div>
                                </div>
                                <div className="space-y-3">
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Total Balance</Label>
                                    <p className="text-sm font-semibold">{(parseFloat(selectedUser.availableBalance || "0") + parseFloat(selectedUser.frozenBalance || "0")).toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Available Balance</Label>
                                    <p className="text-sm">{parseFloat(selectedUser.availableBalance || "0").toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Frozen Balance</Label>
                                    <p className="text-sm">{parseFloat(selectedUser.frozenBalance || "0").toFixed(2)}</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Reputation</Label>
                                    <p className="text-sm">{selectedUser.reputation}/100</p>
                                  </div>
                                  <div>
                                    <Label className="text-sm font-medium text-gray-600">Account Status</Label>
                                    <Badge variant={selectedUser.isActive ? "default" : "destructive"}>
                                      {selectedUser.isActive ? "Active" : "Inactive"}
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                            )}
                          </DialogContent>
                        </Dialog>



                        {/* Deposit Button */}
                        <Dialog open={depositDialogOpen && selectedUser?.id === user.id} onOpenChange={setDepositDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-orange-900 text-orange-200 border-orange-600 hover:bg-orange-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Plus className="w-3 h-3 mr-1" />
                              Deposit
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Deposit Funds</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Balance: {(parseFloat(user.availableBalance || "0") + parseFloat(user.frozenBalance || "0")).toFixed(2)}</Label>
                              </div>
                              <div>
                                <Label>Deposit Amount</Label>
                                <Input 
                                  type="number"
                                  value={depositAmount}
                                  onChange={(e) => setDepositAmount(e.target.value)}
                                  placeholder="Enter amount to deposit"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDepositDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleDepositWithdraw("deposit", parseFloat(depositAmount))} disabled={!depositAmount}>
                                  Deposit {depositAmount || "0"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Deduction Button */}
                        <Dialog open={deductionDialogOpen && selectedUser?.id === user.id} onOpenChange={setDeductionDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-red-900 text-red-200 border-red-600 hover:bg-red-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Minus className="w-3 h-3 mr-1" />
                              Deduction
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Deduct Funds</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Current Balance: {(parseFloat(user.availableBalance || "0") + parseFloat(user.frozenBalance || "0")).toFixed(2)}</Label>
                              </div>
                              <div>
                                <Label>Deduction Amount</Label>
                                <Input 
                                  type="number"
                                  value={deductionAmount}
                                  onChange={(e) => setDeductionAmount(e.target.value)}
                                  placeholder="Enter amount to deduct"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDeductionDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleDepositWithdraw("withdraw", parseFloat(deductionAmount))} disabled={!deductionAmount} variant="destructive">
                                  Deduct {deductionAmount || "0"}
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>



                        {/* Freeze Button */}
                        <Dialog open={freezeDialogOpen && selectedUser?.id === user.id} onOpenChange={setFreezeDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-blue-900 text-blue-200 border-blue-600 hover:bg-blue-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Lock className="w-3 h-3 mr-1" />
                              Freeze
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Freeze Balance</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="freezeAmount">Amount to Freeze</Label>
                                <Input
                                  id="freezeAmount"
                                  type="number"
                                  placeholder="Enter amount to freeze"
                                  value={freezeAmount}
                                  onChange={(e) => setFreezeAmount(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Available Balance: {user.availableBalance}
                                </p>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setFreezeDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => handleFreezeAmount(user, parseFloat(freezeAmount))} 
                                  className="bg-blue-600 hover:bg-blue-700"
                                >
                                  Freeze Amount
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Unfreeze Button */}
                        <Dialog open={unfreezeDialogOpen && selectedUser?.id === user.id} onOpenChange={setUnfreezeDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-green-900 text-green-200 border-green-600 hover:bg-green-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Unlock className="w-3 h-3 mr-1" />
                              Unfreeze
                            </Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle>Unfreeze Balance</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label htmlFor="unfreezeAmount">Amount to Unfreeze</Label>
                                <Input
                                  id="unfreezeAmount"
                                  type="number"
                                  placeholder="Enter amount to unfreeze"
                                  value={unfreezeAmount}
                                  onChange={(e) => setUnfreezeAmount(e.target.value)}
                                />
                                <p className="text-sm text-muted-foreground mt-1">
                                  Frozen Balance: {user.frozenBalance}
                                </p>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setUnfreezeDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={() => handleUnfreezeAmount(user, parseFloat(unfreezeAmount))} className="bg-green-600 hover:bg-green-700">
                                  Unfreeze Amount
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Send Message Button */}
                        <Dialog open={messageDialogOpen && selectedUser?.id === user.id} onOpenChange={setMessageDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-yellow-900 text-yellow-200 border-yellow-600 hover:bg-yellow-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Send className="w-3 h-3 mr-1" />
                              Send a letter
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Send Message to {selectedUser?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Message Title</Label>
                                <Input 
                                  value={messageTitle}
                                  onChange={(e) => setMessageTitle(e.target.value)}
                                  placeholder="Enter message title"
                                />
                              </div>
                              <div>
                                <Label>Message Content</Label>
                                <Textarea 
                                  value={messageContent}
                                  onChange={(e) => setMessageContent(e.target.value)}
                                  placeholder="Enter your message here..."
                                  rows={4}
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setMessageDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button onClick={handleSendMessage} disabled={!messageTitle || !messageContent}>
                                  Send Message
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Other Button */}
                        <Dialog open={otherDialogOpen && selectedUser?.id === user.id} onOpenChange={setOtherDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-purple-900 text-purple-200 border-purple-600 hover:bg-purple-800"
                              onClick={() => {
                                setSelectedUser(user);
                                setCreditScore(user.reputation?.toString() || "100");
                              }}
                            >
                              <Settings className="w-3 h-3 mr-1" />
                              Other
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Other Settings for {selectedUser?.name}</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div>
                                <Label>Credit Score</Label>
                                <Input
                                  type="number"
                                  value={creditScore || selectedUser?.creditScore || 100}
                                  onChange={(e) => setCreditScore(e.target.value)}
                                  min="0"
                                  max="100"
                                  placeholder="Credit Score (0-100)"
                                />
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => {
                                  setOtherDialogOpen(false);
                                  setCreditScore("");
                                }}>
                                  Cancel
                                </Button>
                                <Button onClick={() => {
                                  const newScore = parseInt(creditScore);
                                  if (newScore >= 0 && newScore <= 100 && selectedUser) {
                                    handleQuickUpdate(selectedUser, { creditScore: newScore });
                                    setOtherDialogOpen(false);
                                    setCreditScore("");
                                    toast({ title: "Credit score updated successfully" });
                                  } else {
                                    toast({ title: "Please enter a valid score (0-100)", variant: "destructive" });
                                  }
                                }}>
                                  Save
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>

                        {/* Delete Button */}
                        <Dialog open={deleteDialogOpen && selectedUser?.id === user.id} onOpenChange={setDeleteDialogOpen}>
                          <DialogTrigger asChild>
                            <Button 
                              size="sm" 
                              variant="outline" 
                              className="h-6 px-2 text-xs bg-red-900 text-red-200 border-red-600 hover:bg-red-800"
                              onClick={() => setSelectedUser(user)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-md">
                            <DialogHeader>
                              <DialogTitle>Delete User</DialogTitle>
                            </DialogHeader>
                            <div className="space-y-4">
                              <div className="text-center py-4">
                                <AlertTriangle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                                <p className="text-lg font-semibold">Are you sure?</p>
                                <p className="text-sm text-gray-600">
                                  This will permanently delete user "{selectedUser?.name}" and all associated data.
                                </p>
                                <p className="text-sm text-red-600 font-medium">
                                  This action cannot be undone.
                                </p>
                              </div>
                              <div className="flex justify-end gap-2">
                                <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
                                  Cancel
                                </Button>
                                <Button 
                                  onClick={() => selectedUser && handleDeleteUser(selectedUser)}
                                  variant="destructive"
                                >
                                  Delete User
                                </Button>
                              </div>
                            </div>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

interface ComprehensiveUserEditFormProps {
  user: User;
  onUpdate: (user: User, updates: Partial<User>) => void;
  onClose: () => void;
}

function ComprehensiveUserEditForm({ user, onUpdate, onClose }: ComprehensiveUserEditFormProps) {
  const { data: allBankAccounts, refetch: refetchBankAccounts } = useBankAccountsWithUsers();
  const updateBankAccount = useAdminUpdateBankAccount();
  const adminCreateBankAccount = useAdminCreateBankAccount();
  const { toast } = useToast();

  // Filter bank accounts for the specific user
  const bankAccounts = allBankAccounts?.filter(account => account.userId === user.id) || [];

  const [formData, setFormData] = useState({
    username: user.username || "",
    email: user.email || "",
    name: user.name || "",
    role: user.role || "customer",
    availableBalance: user.availableBalance || "0",
    frozenBalance: user.frozenBalance || "0",
    reputation: user.reputation || 100,
    creditScore: user.creditScore || 100,
    userType: user.userType || "Normal",
    direction: user.direction || "Actual",
    isBanned: user.isBanned || false,
    withdrawalProhibited: user.withdrawalProhibited || false,
    remark: user.remark || "",
    generalAgent: user.generalAgent || "",
    invitationCode: user.invitationCode || "",
  });

  const [bankAccountData, setBankAccountData] = useState({
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    routingNumber: "",
    accountType: "checking" as const,
  });

  // Local state to track bank account changes before saving
  const [bankAccountChanges, setBankAccountChanges] = useState<Record<number, any>>({});

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Convert string values to appropriate types
    const updates = {
      ...formData,
      reputation: Number(formData.reputation),
      creditScore: Number(formData.creditScore),
    };

    // Save bank account changes if any
    const bankAccountUpdatePromises = Object.entries(bankAccountChanges).map(([accountId, changes]) => {
      return new Promise((resolve, reject) => {
        updateBankAccount.mutate(
          { id: parseInt(accountId), ...changes },
          {
            onSuccess: resolve,
            onError: reject,
          }
        );
      });
    });

    // Save user updates and bank account changes
    Promise.all([...bankAccountUpdatePromises]).then(() => {
      onUpdate(user, updates);
      setBankAccountChanges({}); // Clear pending changes
      refetchBankAccounts();
      toast({ title: "User and bank accounts updated successfully" });
      onClose();
    }).catch(() => {
      toast({ title: "Error updating some information", variant: "destructive" });
    });
  };

  const handleBankAccountChange = (accountId: number, field: string, value: string) => {
    setBankAccountChanges(prev => ({
      ...prev,
      [accountId]: {
        ...prev[accountId],
        [field]: value
      }
    }));
  };

  const getBankAccountValue = (account: any, field: string) => {
    // Return the pending change value if it exists, otherwise the original value
    if (bankAccountChanges[account.bankAccountId] && bankAccountChanges[account.bankAccountId][field] !== undefined) {
      return bankAccountChanges[account.bankAccountId][field];
    }
    
    switch (field) {
      case 'bankName': return account.bankName || "";
      case 'accountHolderName': return account.accountHolderName || account.accountHolder || "";
      case 'accountNumber': return account.accountNumber || "";
      case 'ifscCode': return account.ifscCode || account.routingNumber || "";
      default: return "";
    }
  };

  const handleCreateBankAccount = () => {
    adminCreateBankAccount.mutate(
      { 
        userId: user.id, 
        accountHolderName: bankAccountData.accountHolder,
        bankName: bankAccountData.bankName,
        accountNumber: bankAccountData.accountNumber,
        ifscCode: bankAccountData.routingNumber
      },
      {
        onSuccess: () => {
          toast({ title: "Bank account created successfully" });
          setBankAccountData({
            bankName: "",
            accountNumber: "",
            accountHolder: "",
            routingNumber: "",
            accountType: "checking",
          });
          refetchBankAccounts();
        },
        onError: () => {
          toast({ title: "Failed to create bank account", variant: "destructive" });
        },
      }
    );
  };

  return (
    <div className="space-y-6">
      <form onSubmit={handleFormSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label htmlFor="role">Role</Label>
                <Select value={formData.role} onValueChange={(value) => setFormData({ ...formData, role: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="customer">Customer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Account Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account Settings</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
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
              <div>
                <Label htmlFor="direction">Direction</Label>
                <Select value={formData.direction} onValueChange={(value) => setFormData({ ...formData, direction: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Buy Up">Buy Up</SelectItem>
                    <SelectItem value="Buy Down">Buy Down</SelectItem>
                    <SelectItem value="Actual">Actual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="banned"
                  checked={formData.isBanned}
                  onCheckedChange={(checked) => setFormData({ ...formData, isBanned: checked })}
                />
                <Label htmlFor="banned">Account Banned</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="withdrawal-prohibited"
                  checked={formData.withdrawalProhibited}
                  onCheckedChange={(checked) => setFormData({ ...formData, withdrawalProhibited: checked })}
                />
                <Label htmlFor="withdrawal-prohibited">Withdrawal Prohibited</Label>
              </div>
            </CardContent>
          </Card>

          {/* Financial Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Financial Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="availableBalance">Available Balance</Label>
                <Input
                  id="availableBalance"
                  type="number"
                  step="0.01"
                  value={formData.availableBalance}
                  onChange={(e) => setFormData({ ...formData, availableBalance: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="frozenBalance">Frozen Balance</Label>
                <Input
                  id="frozenBalance"
                  type="number"
                  step="0.01"
                  value={formData.frozenBalance}
                  onChange={(e) => setFormData({ ...formData, frozenBalance: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="creditScore">Credit Score</Label>
                <Input
                  id="creditScore"
                  type="number"
                  min="0"
                  max="1000"
                  value={formData.creditScore}
                  onChange={(e) => setFormData({ ...formData, creditScore: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="reputation">Reputation</Label>
                <Input
                  id="reputation"
                  type="number"
                  min="0"
                  max="100"
                  value={formData.reputation}
                  onChange={(e) => setFormData({ ...formData, reputation: Number(e.target.value) })}
                />
              </div>
            </CardContent>
          </Card>

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="generalAgent">General Agent</Label>
                <Input
                  id="generalAgent"
                  value={formData.generalAgent}
                  onChange={(e) => setFormData({ ...formData, generalAgent: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="invitationCode">Invitation Code</Label>
                <Input
                  id="invitationCode"
                  value={formData.invitationCode}
                  onChange={(e) => setFormData({ ...formData, invitationCode: e.target.value })}
                />
              </div>
              <div>
                <Label htmlFor="remark">Remark</Label>
                <Textarea
                  id="remark"
                  value={formData.remark}
                  onChange={(e) => setFormData({ ...formData, remark: e.target.value })}
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bank Accounts Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Bank Accounts</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Existing Bank Accounts */}
            {bankAccounts && bankAccounts.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-semibold">Existing Accounts</h4>
                {bankAccounts.map((account, index) => (
                  <div key={account.bankAccountId || `bank-account-${index}`} className="border rounded-lg p-4 space-y-3">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Bank Name</Label>
                        <Input
                          value={getBankAccountValue(account, 'bankName')}
                          onChange={(e) => handleBankAccountChange(account.bankAccountId, 'bankName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Account Holder</Label>
                        <Input
                          value={getBankAccountValue(account, 'accountHolderName')}
                          onChange={(e) => handleBankAccountChange(account.bankAccountId, 'accountHolderName', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Account Number</Label>
                        <Input
                          value={getBankAccountValue(account, 'accountNumber')}
                          onChange={(e) => handleBankAccountChange(account.bankAccountId, 'accountNumber', e.target.value)}
                        />
                      </div>
                      <div>
                        <Label>Routing Number</Label>
                        <Input
                          value={getBankAccountValue(account, 'ifscCode')}
                          onChange={(e) => handleBankAccountChange(account.bankAccountId, 'ifscCode', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Add New Bank Account */}
            <div className="border-t pt-4">
              <h4 className="font-semibold mb-3">Add New Bank Account</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="bankName">Bank Name</Label>
                  <Input
                    id="bankName"
                    value={bankAccountData.bankName}
                    onChange={(e) => setBankAccountData({ ...bankAccountData, bankName: e.target.value })}
                    placeholder="Enter bank name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountHolder">Account Holder</Label>
                  <Input
                    id="accountHolder"
                    value={bankAccountData.accountHolder}
                    onChange={(e) => setBankAccountData({ ...bankAccountData, accountHolder: e.target.value })}
                    placeholder="Enter account holder name"
                  />
                </div>
                <div>
                  <Label htmlFor="accountNumber">Account Number</Label>
                  <Input
                    id="accountNumber"
                    value={bankAccountData.accountNumber}
                    onChange={(e) => setBankAccountData({ ...bankAccountData, accountNumber: e.target.value })}
                    placeholder="Enter account number"
                  />
                </div>
                <div>
                  <Label htmlFor="routingNumber">Routing Number</Label>
                  <Input
                    id="routingNumber"
                    value={bankAccountData.routingNumber}
                    onChange={(e) => setBankAccountData({ ...bankAccountData, routingNumber: e.target.value })}
                    placeholder="Enter routing number"
                  />
                </div>
              </div>
              <div className="mt-3">
                <Button
                  type="button"
                  onClick={handleCreateBankAccount}
                  disabled={!bankAccountData.bankName || !bankAccountData.accountNumber || !bankAccountData.accountHolder}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Add Bank Account
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3">
          <Button type="button" variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
            Save Changes
          </Button>
        </div>
      </form>
    </div>
  );
}