import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  CreditCard, 
  Shield, 
  MessageSquare, 
  HelpCircle, 
  Settings,
  ArrowLeft,
  LogOut,
  Home,
  Key,
  Globe,
  Eye,
  Plus,
  Trash2
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { BankAccount } from "@shared/schema";
import { UserMessages } from "./user-messages";

export function Profile() {
  const { user, logout } = useAuth();
  const [currentView, setCurrentView] = useState<'main' | 'settings' | 'collection' | 'authentication' | 'userMessage' | 'helpCenter' | 'loginPassword' | 'switchLanguage' | 'capitalCode' | 'addBank'>('main');
  const [fundsPassword, setFundsPassword] = useState<string[]>(Array(6).fill(''));
  const [bankForm, setBankForm] = useState({
    bindingType: 'Bank Card',
    currency: 'INR',
    accountNumber: '',
    accountHolderName: '',
    bankName: '',
    branchName: '',
    ifscCode: ''
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  if (!user) return null;

  const handleLogout = () => {
    logout();
  };

  // Fetch user's bank accounts
  const { data: bankAccounts = [], isLoading: bankAccountsLoading } = useQuery<BankAccount[]>({
    queryKey: ["/api/bank-accounts"],
    enabled: currentView === 'collection'
  });

  // Create bank account mutation
  const createBankAccount = useMutation({
    mutationFn: async (data: typeof bankForm) => {
      const res = await apiRequest('POST', '/api/bank-accounts', data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Bank Account Added",
        description: "Your bank account has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/bank-accounts"] });
      setBankForm({
        bindingType: 'Bank Card',
        currency: 'INR',
        accountNumber: '',
        accountHolderName: '',
        bankName: '',
        branchName: '',
        ifscCode: ''
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to add bank account",
        variant: "destructive",
      });
    }
  });

  const handleCreateBankAccount = () => {
    if (!bankForm.accountHolderName || !bankForm.accountNumber || !bankForm.bankName) {
      toast({
        title: "Missing Information", 
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    createBankAccount.mutate(bankForm);
  };

  // Collection Information Page
  if (currentView === 'collection') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('main')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Collection Information</h1>
          <div className="w-8"></div>
        </div>

        {/* Content */}
        <div className="p-4 pb-24">
          {bankAccountsLoading ? (
            <div className="text-center text-gray-500 py-8">
              <div className="text-sm">Loading bank accounts...</div>
            </div>
          ) : (
            <>
              {/* Existing Bank Accounts */}
              {bankAccounts.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-medium text-gray-900 mb-3">Your Bank Accounts</h3>
                  <div className="space-y-3">
                    {bankAccounts.map((account) => (
                      <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-4">
                        <div className="space-y-2">
                          <div className="font-medium text-gray-900">{account.bankName}</div>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Account Holder:</span>
                              <div className="text-gray-800">{account.accountHolderName}</div>
                            </div>
                            <div>
                              <span className="text-gray-500">Account Number:</span>
                              <div className="text-gray-800">***{account.accountNumber.slice(-4)}</div>
                            </div>
                            {account.ifscCode && (
                              <div>
                                <span className="text-gray-500">IFSC Code:</span>
                                <div className="text-gray-800">{account.ifscCode}</div>
                              </div>
                            )}
                            {account.branchName && (
                              <div>
                                <span className="text-gray-500">Branch:</span>
                                <div className="text-gray-800">{account.branchName}</div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Add New Bank Account Form */}
              <div className="bg-white rounded-lg border border-gray-200 p-4">
                <h3 className="text-sm font-medium text-gray-900 mb-4">Add New Bank Account</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Binding Type
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={bankForm.bindingType === 'Bank Card' ? 'default' : 'outline'}
                        onClick={() => setBankForm({ ...bankForm, bindingType: 'Bank Card' })}
                        className="px-4 py-2 rounded"
                        style={{
                          background: bankForm.bindingType === 'Bank Card' ? '#FFA500' : 'transparent',
                          color: bankForm.bindingType === 'Bank Card' ? 'white' : '#666',
                          border: '1px solid #ddd'
                        }}
                      >
                        Bank Card
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Currency <span className="text-red-500">*</span>
                    </label>
                    <div className="flex gap-2">
                      <Button
                        type="button"
                        variant={bankForm.currency === 'INR' ? 'default' : 'outline'}
                        onClick={() => setBankForm({ ...bankForm, currency: 'INR' })}
                        className="px-4 py-2 rounded"
                        style={{
                          background: bankForm.currency === 'INR' ? '#FFA500' : 'transparent',
                          color: bankForm.currency === 'INR' ? 'white' : '#666',
                          border: '1px solid #ddd'
                        }}
                      >
                        INR
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Number
                    </label>
                    <Input
                      type="text"
                      value={bankForm.accountNumber}
                      onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
                      placeholder=""
                      className="w-full border-red-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Account Holder
                    </label>
                    <Input
                      type="text"
                      value={bankForm.accountHolderName}
                      onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
                      placeholder=""
                      className="w-full border-red-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Bank Name
                    </label>
                    <Input
                      type="text"
                      value={bankForm.bankName}
                      onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
                      placeholder=""
                      className="w-full border-red-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Branch Name
                    </label>
                    <Input
                      type="text"
                      value={bankForm.branchName}
                      onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
                      placeholder=""
                      className="w-full border-red-300"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      IFSC Code
                    </label>
                    <Input
                      type="text"
                      value={bankForm.ifscCode}
                      onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
                      placeholder=""
                      className="w-full border-red-300"
                    />
                  </div>

                  <Button
                    onClick={handleCreateBankAccount}
                    disabled={createBankAccount.isPending}
                    className="w-full h-12 text-white font-medium rounded-2xl"
                    style={{
                      background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
                    }}
                  >
                    {createBankAccount.isPending ? "Adding..." : "Add Bank Account"}
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>


      </div>
    );
  }

  // Add Bank Account Page
  if (currentView === 'addBank') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('collection')}
              className="p-1 mr-2"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Add Bank Account</h1>
          <div className="w-8"></div>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Binding Type
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={bankForm.bindingType === 'Bank Card' ? 'default' : 'outline'}
                onClick={() => setBankForm({ ...bankForm, bindingType: 'Bank Card' })}
                className="px-4 py-2 rounded"
                style={{
                  background: bankForm.bindingType === 'Bank Card' ? '#FFA500' : 'transparent',
                  color: bankForm.bindingType === 'Bank Card' ? 'white' : '#666',
                  border: '1px solid #ddd'
                }}
              >
                Bank Card
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Currency <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant={bankForm.currency === 'INR' ? 'default' : 'outline'}
                onClick={() => setBankForm({ ...bankForm, currency: 'INR' })}
                className="px-4 py-2 rounded"
                style={{
                  background: bankForm.currency === 'INR' ? '#FFA500' : 'transparent',
                  color: bankForm.currency === 'INR' ? 'white' : '#666',
                  border: '1px solid #ddd'
                }}
              >
                INR
              </Button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Number
            </label>
            <Input
              type="text"
              value={bankForm.accountNumber}
              onChange={(e) => setBankForm({ ...bankForm, accountNumber: e.target.value })}
              placeholder=""
              className="w-full border-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account Holder
            </label>
            <Input
              type="text"
              value={bankForm.accountHolderName}
              onChange={(e) => setBankForm({ ...bankForm, accountHolderName: e.target.value })}
              placeholder=""
              className="w-full border-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Bank Name
            </label>
            <Input
              type="text"
              value={bankForm.bankName}
              onChange={(e) => setBankForm({ ...bankForm, bankName: e.target.value })}
              placeholder=""
              className="w-full border-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Branch Name
            </label>
            <Input
              type="text"
              value={bankForm.branchName}
              onChange={(e) => setBankForm({ ...bankForm, branchName: e.target.value })}
              placeholder=""
              className="w-full border-red-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              IFSC Code
            </label>
            <Input
              type="text"
              value={bankForm.ifscCode}
              onChange={(e) => setBankForm({ ...bankForm, ifscCode: e.target.value })}
              placeholder=""
              className="w-full border-red-300"
            />
          </div>

          <div className="pt-6">
            <Button
              onClick={handleCreateBankAccount}
              disabled={createBankAccount.isPending}
              className="w-full h-12 text-white font-medium rounded-2xl"
              style={{
                background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
              }}
            >
              {createBankAccount.isPending ? "Adding..." : "Add Bank Account"}
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Authentication Page
  if (currentView === 'authentication') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('main')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Authentication</h1>
          <div className="w-8"></div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Basic Authentication */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">Basic Authentication</h3>
              <span className="text-xs text-green-600 bg-green-100 px-2 py-1 rounded">Completed</span>
            </div>
            <p className="text-xs text-gray-500">
              Complete basic email or mobile phone authentication, therefore, the fund transaction will be automatically notified by e-mail or mobile phone, and the market dynamics will be immediately tracked
            </p>
          </div>

          {/* Identity Authentication */}
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start mb-2">
              <h3 className="font-medium text-gray-900">Identity Authentication</h3>
              <span className="text-xs text-gray-500">Not authenticated</span>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Authentication of True Identity Information. We will arrange a 7*24 hour dedicated VIP customer service manager to analysis for you
            </p>
            
            <Button
              className="w-full h-12 text-white font-medium rounded-2xl"
              style={{
                background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
              }}
            >
              Start Authentication
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // User Message Page (Empty)
  if (currentView === 'userMessage') {
    return <UserMessages onBack={() => setCurrentView('main')} />;
  }

  // Help Center Page (Empty)
  if (currentView === 'helpCenter') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('main')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Help Center</h1>
          <div className="w-8"></div>
        </div>

        {/* Empty Content */}
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center text-gray-500">
            <div className="text-lg mb-2">Help Center</div>
            <div className="text-sm">Contact support for assistance.</div>
          </div>
        </div>
      </div>
    );
  }

  // Login Password Page
  if (currentView === 'loginPassword') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('settings')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Login Password</h1>
          <div className="w-8"></div>
        </div>

        {/* Content */}
        <div className="p-4 space-y-6">
          {/* Old login password */}
          <div>
            <div className="relative">
              <Input
                type="password"
                placeholder="Old login password"
                className="h-12 pr-12 text-gray-600 placeholder-gray-500"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Eye className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* New Login Password */}
          <div>
            <div className="relative">
              <Input
                type="password"
                placeholder="New Login Password"
                className="h-12 pr-12 text-gray-600 placeholder-gray-500"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Eye className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* confirm new password */}
          <div>
            <div className="relative">
              <Input
                type="password"
                placeholder="confirm new password"
                className="h-12 pr-12 text-gray-600 placeholder-gray-500"
              />
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                <Eye className="w-5 h-5 text-gray-400" />
              </Button>
            </div>
          </div>

          {/* Submit Settings Button */}
          <div className="pt-6">
            <Button
              className="w-full h-12 text-white font-medium rounded-2xl"
              style={{
                background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
              }}
            >
              Submit Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Capital Code Page
  if (currentView === 'capitalCode') {
    const handlePasswordChange = (index: number, value: string) => {
      if (value.length <= 1 && /^\d*$/.test(value)) {
        const newPassword = [...fundsPassword];
        newPassword[index] = value;
        setFundsPassword(newPassword);
      }
    };

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('settings')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Capital Code</h1>
          <div className="w-8"></div>
        </div>

        {/* Content */}
        <div className="p-4">
          {/* Set Funds Password Section */}
          <div className="text-center mb-8">
            <h2 className="text-lg font-medium text-gray-900 mb-8">Set Funds Password</h2>
            
            {/* Password Input Circles */}
            <div className="flex justify-center space-x-4 mb-12">
              {fundsPassword.map((digit, index) => (
                <div key={index} className="relative">
                  <input
                    type="password"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handlePasswordChange(index, e.target.value)}
                    className="w-12 h-12 rounded-full border-2 border-yellow-400 bg-yellow-100 text-center text-lg font-bold text-gray-900 focus:outline-none focus:border-yellow-500"
                    style={{
                      background: index === 0 ? "linear-gradient(135deg, #FCD34D 0%, #F59E0B 100%)" : "#FEF3C7"
                    }}
                  />
                  <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-lg font-bold text-gray-700">
                    {index + 1}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Submit Settings Button */}
          <div className="pt-6">
            <Button
              className="w-full h-12 text-white font-medium rounded-2xl"
              style={{
                background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
              }}
              onClick={() => {
                // Handle form submission
                console.log('Funds Password:', fundsPassword.join(''));
              }}
            >
              Submit Settings
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Switch Language Page
  if (currentView === 'switchLanguage') {
    const languages = [
      { code: 'en', name: 'English' },
      { code: 'rupiah', name: 'Rupiah' },
      { code: 'bangla', name: 'বাংলা' },
      { code: 'de', name: 'Deutsch' },
      { code: 'ru', name: 'Russian' },
      { code: 'vi', name: 'Tiếng Việt' },
      { code: 'es', name: 'Español' },
      { code: 'it', name: 'Italian' },
      { code: 'ja', name: '日本語' },
      { code: 'fr', name: 'Français' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'zh', name: '简体中文' },
      { code: 'ar', name: 'عربي' }
    ];

    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('settings')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Switch Language</h1>
          <div className="w-8"></div>
        </div>

        {/* Language Options */}
        <div className="p-4">
          {languages.map((language, index) => (
            <div key={language.code} className="mb-3">
              <Button
                variant="ghost"
                className={`w-full h-12 justify-center text-gray-900 bg-white border border-gray-200 rounded-full hover:bg-gray-50 ${
                  language.code === 'en' ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                {language.name}
              </Button>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Settings Page
  if (currentView === 'settings') {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
          <div className="flex items-center">
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => setCurrentView('main')}
              className="p-1 mr-2"
            >
              <Home className="w-5 h-5 text-gray-600" />
            </Button>
          </div>
          <h1 className="text-lg font-medium text-gray-900">Settings</h1>
          <div className="w-8"></div>
        </div>

        {/* Settings Menu */}
        <div className="p-4 space-y-1">
          {/* Login Password */}
          <div className="bg-white rounded-lg border border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-14 px-4"
              onClick={() => setCurrentView('loginPassword')}
            >
              <div className="flex items-center space-x-3">
                <Key className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Login Password</span>
              </div>
            </Button>
          </div>

          {/* Capital Code */}
          <div className="bg-white rounded-lg border border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-14 px-4"
              onClick={() => setCurrentView('capitalCode')}
            >
              <div className="flex items-center space-x-3">
                <Shield className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Capital Code</span>
              </div>
            </Button>
          </div>

          {/* Switch Language */}
          <div className="bg-white rounded-lg border border-gray-200">
            <Button 
              variant="ghost" 
              className="w-full justify-start h-14 px-4"
              onClick={() => setCurrentView('switchLanguage')}
            >
              <div className="flex items-center space-x-3">
                <Globe className="w-5 h-5 text-gray-600" />
                <span className="text-gray-900">Switch Language</span>
              </div>
            </Button>
          </div>
        </div>

        {/* Exit Login Button */}
        <div className="p-4 mt-8">
          <Button
            onClick={handleLogout}
            className="w-full h-14 text-white font-medium rounded-2xl"
            style={{
              background: "linear-gradient(90deg, #FFA500 0%, #FF6B35 100%)"
            }}
          >
            Exit Login
          </Button>
        </div>
      </div>
    );
  }

  // Main Profile Page
  return (
    <div className="min-h-screen" style={{
      background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
    }}>
      {/* Header Section with User Info */}
      <div className="px-4 py-8">
        <div className="flex items-center space-x-4 text-white">
          <Avatar className="w-12 h-12">
            <AvatarImage src="/fish-avatar.png" alt="Profile" />
            <AvatarFallback className="bg-white bg-opacity-20 text-white flex items-center justify-center">
              <img src="/fish-avatar.png" alt="Profile Avatar" className="w-full h-full rounded-full object-cover" />
            </AvatarFallback>
          </Avatar>
          <div>
            <div className="text-lg font-medium">{user.username}</div>
            <div className="text-sm opacity-90">UID:{user.id}00100102J</div>
            <div className="text-sm opacity-90">Credit Score:{user.creditScore || 80}</div>
            <div className="text-sm opacity-90">Available Balance:{parseFloat(user.availableBalance || user.balance || "0").toFixed(2)} INR</div>
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="bg-gray-50 flex-1 px-4 py-4 space-y-1">
        {/* Collection Information */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-14 px-4"
            onClick={() => setCurrentView('collection')}
          >
            <div className="flex items-center space-x-3">
              <CreditCard className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Collection Information</span>
            </div>
          </Button>
        </div>

        {/* Authentication */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-14 px-4"
            onClick={() => setCurrentView('authentication')}
          >
            <div className="flex items-center space-x-3">
              <Shield className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Authentication</span>
            </div>
          </Button>
        </div>

        {/* User Message */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-14 px-4"
            onClick={() => setCurrentView('userMessage')}
          >
            <div className="flex items-center space-x-3">
              <MessageSquare className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">User Message</span>
            </div>
          </Button>
        </div>

        {/* Help Center */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-14 px-4"
            onClick={() => setCurrentView('helpCenter')}
          >
            <div className="flex items-center space-x-3">
              <HelpCircle className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Help Center</span>
            </div>
          </Button>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg border border-gray-200">
          <Button 
            variant="ghost" 
            className="w-full justify-start h-14 px-4"
            onClick={() => setCurrentView('settings')}
          >
            <div className="flex items-center space-x-3">
              <Settings className="w-5 h-5 text-gray-600" />
              <span className="text-gray-900">Settings</span>
            </div>
          </Button>
        </div>
      </div>
    </div>
  );
}