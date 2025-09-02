import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { RotateCcw, CreditCard, ChevronDown, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export function AssetsPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState<"recharge" | "withdrawal">("recharge");
  const [selectedCurrency, setSelectedCurrency] = useState<"INR" | "USD">("INR");
  const [showCurrencyDropdown, setShowCurrencyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Exchange rates (INR to USD)
  const exchangeRate = 83; // 1 USD = 83 INR
  
  // Get user balance from backend
  const availableBalance = parseFloat(user?.availableBalance || user?.balance || "0");
  const frozenBalance = parseFloat(user?.frozenBalance || "0");
  const totalBalance = availableBalance + frozenBalance;

  // Convert amounts based on selected currency
  const convertAmount = (amount: number) => {
    if (selectedCurrency === "USD") {
      return (amount / exchangeRate).toFixed(2);
    }
    return amount.toFixed(2);
  };

  const getCurrencySymbol = () => ""; // Remove currency symbols

  // Handle clicks outside dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowCurrencyDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleRechargeClick = () => {
    setLocation('/top-up-records?tab=top-up');
  };

  const handleWithdrawalClick = () => {
    setLocation('/withdrawal-request');
  };
  
  return (
    <div className="min-h-screen bg-white">
      {/* Blue Gradient Header Section */}
      <div 
        className="px-4 py-8"
        style={{
          background: "linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)"
        }}
      >
        {/* Asset Information Title */}
        <div className="text-center mb-6">
          <h1 className="text-white text-lg font-medium">Asset Information</h1>
        </div>

        {/* Total Assets */}
        <div className="mb-6">
          <div className="text-white text-sm mb-1">Total Assets</div>
          <div className="text-white text-2xl font-bold mb-1">{convertAmount(totalBalance)} <span className="text-sm font-normal">{selectedCurrency}</span></div>
          <div className="flex items-center text-white text-sm relative">
            <span>≈ {convertAmount(totalBalance)}</span>
            <span className="ml-1">{selectedCurrency}</span>
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="p-0 ml-2 h-auto"
                onClick={() => setShowCurrencyDropdown(!showCurrencyDropdown)}
              >
                <ChevronDown className="text-white w-3 h-3" />
              </Button>
              
              {/* Currency Dropdown */}
              {showCurrencyDropdown && (
                <div className="absolute top-6 right-0 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 min-w-[80px]">
                  <button
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedCurrency === 'INR' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedCurrency('INR');
                      setShowCurrencyDropdown(false);
                    }}
                  >
                    INR
                  </button>
                  <button
                    className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                      selectedCurrency === 'USD' ? 'bg-blue-50 text-blue-600' : 'text-gray-700'
                    }`}
                    onClick={() => {
                      setSelectedCurrency('USD');
                      setShowCurrencyDropdown(false);
                    }}
                  >
                    USD
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Tabs Section */}
        <div className="bg-white rounded-t-3xl px-4 py-4">
          <div className="flex justify-center space-x-8 sm:space-x-16">
            {/* Recharge Tab */}
            <Button
              variant="ghost"
              className={`flex flex-col items-center space-y-2 p-3 ${
                activeTab === "recharge" ? "text-blue-600" : "text-gray-600"
              }`}
              onClick={handleRechargeClick}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeTab === "recharge" ? "bg-blue-100" : "bg-gray-100"
              }`}>
                <RotateCcw className={`w-5 h-5 ${
                  activeTab === "recharge" ? "text-blue-600" : "text-gray-600"
                }`} />
              </div>
              <span className="text-xs text-center">Recharge</span>
            </Button>

            {/* Withdrawal Tab */}
            <Button
              variant="ghost"
              className={`flex flex-col items-center space-y-2 p-3 ${
                activeTab === "withdrawal" ? "text-red-600" : "text-gray-600"
              }`}
              onClick={handleWithdrawalClick}
            >
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                activeTab === "withdrawal" ? "bg-red-100" : "bg-gray-100"
              }`}>
                <CreditCard className={`w-5 h-5 ${
                  activeTab === "withdrawal" ? "text-red-600" : "text-gray-600"
                }`} />
              </div>
              <span className="text-xs text-center">Withdrawal</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Content Section */}
      <div className="bg-gray-50 px-4 py-6">
        {/* INR Section - Clickable */}
        <div 
          className="bg-white rounded-lg border border-gray-200 p-4 cursor-pointer hover:bg-gray-50 transition-colors"
          onClick={() => setLocation('/funding-information')}
        >
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
            {/* Left Section - Currency and Available Balance */}
            <div className="flex-1">
              <div className="text-lg font-medium text-gray-900 mb-2">{selectedCurrency}</div>
              <div className="text-xl sm:text-2xl font-bold text-blue-600">{convertAmount(availableBalance)}</div>
              <div className="text-xs text-gray-500">Available Balance</div>
            </div>
            
            {/* Center Section - Frozen */}
            <div className="flex-1 text-left sm:text-center">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 sm:mt-8">{convertAmount(frozenBalance)}</div>
              <div className="text-xs text-gray-500">Frozen</div>
            </div>
            
            {/* Right Section - Total Balance */}
            <div className="flex-1 text-left sm:text-right">
              <div className="text-xl sm:text-2xl font-bold text-blue-600 sm:mt-8">{convertAmount(totalBalance)}</div>
              <div className="text-xs text-gray-500">Balance</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}