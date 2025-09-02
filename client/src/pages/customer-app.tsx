import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { BalanceCard } from "@/components/customer/balance-card";
import { TradingInterface } from "@/components/customer/trading-interface";
import { TransactionHistory } from "@/components/customer/transaction-history";
import { Profile } from "@/components/customer/profile";
import { CryptoHome } from "@/components/customer/crypto-home";
import { CryptoMarketplace } from "@/components/customer/crypto-marketplace";
import { SpotOrders } from "@/components/customer/spot-orders";
import { CryptoTrading } from "@/components/customer/crypto-trading";
import { CustomerBettingOrders } from "@/components/customer/betting-orders";
import { AssetsPage } from "@/components/customer/assets-page";
import {
  Home,
  TrendingUp,
  CreditCard,
  User,
  FileText,
  Settings,
  LogOut,
} from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  { id: "home", label: "Home", icon: Home },
  { id: "orders", label: "Orders", icon: FileText },
  { id: "market", label: "Market", icon: TrendingUp },
  { id: "assets", label: "Assets", icon: CreditCard },
  { id: "profile", label: "Profile", icon: User },
];

export default function CustomerApp() {
  const [activeSection, setActiveSection] = useState("home");
  const [selectedCurrency, setSelectedCurrency] = useState<string | null>(null);
  const [showFullMarketView, setShowFullMarketView] = useState(false);
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Check URL parameters for navigation from crypto single pages and home selections
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const tab = urlParams.get('tab');
    const crypto = urlParams.get('crypto');
    
    if (tab === 'market') {
      setActiveSection('market');
      setShowFullMarketView(true);
      if (crypto) {
        setSelectedCurrency(`${crypto.toUpperCase()}/USDT`);
      }
    }
  }, []);

  // Handle crypto selection from home dashboard
  const handleCryptoSelection = (crypto: string) => {
    setSelectedCurrency(`${crypto.toUpperCase()}/USDT`);
    setActiveSection('market');
    setShowFullMarketView(true);
  };

  const renderSection = () => {
    // If full market view is active, show market
    if (showFullMarketView) {
      return (
        <div className="h-full">
          <SpotOrders 
            selectedCoin={selectedCurrency} 
            onNavigateToOrders={() => {
              setShowFullMarketView(false);
              setActiveSection('orders');
              setSelectedCurrency(null); // Clear selected currency
            }}
          />
        </div>
      );
    }

    // If a currency is selected, show the trading page
    if (selectedCurrency && !showFullMarketView) {
      return (
        <CryptoTrading
          currency={selectedCurrency}
          onBack={() => setSelectedCurrency(null)}
        />
      );
    }

    switch (activeSection) {
      case "home":
        return <CryptoMarketplace onSelectCurrency={handleCryptoSelection} />;
      case "market":
        return <SpotOrders />;
      case "orders":
        return <CustomerBettingOrders />;
      case "assets":
        return <AssetsPage />;
      case "profile":
        return <Profile />;
      default:
        return <CryptoMarketplace onSelectCurrency={handleCryptoSelection} />;
    }
  };

  return (
    <div className="h-screen w-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="w-full px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              {user?.profileImage ? (
                <img
                  src={user.profileImage}
                  alt="Profile"
                  className="w-8 h-8 rounded-full object-cover mr-3"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center text-sm font-medium mr-3">
                  {user?.username?.charAt(0).toUpperCase() ||
                    user?.name?.charAt(0)?.toUpperCase() ||
                    "U"}
                </div>
              )}
              <div>
                <div className="text-sm font-medium text-gray-900">
                  {user?.name || user?.username}
                </div>
                <div className="text-xs text-gray-500">Welcome back</div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              {user?.role === "admin" && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setLocation("/admin")}
                >
                  <Settings className="w-4 h-4" />
                </Button>
              )}
{showFullMarketView && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    setShowFullMarketView(false);
                    setActiveSection('home');
                  }}
                  className="text-gray-600 hover:text-gray-900"
                >
                  <Home className="w-4 h-4" />
                </Button>
              )}
              <Button variant="ghost" size="sm" onClick={() => logout()}>
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className={`flex-1 overflow-auto ${showFullMarketView ? '' : 'pb-[90px] sm:pb-[100px] md:pb-[80px]'}`}>
        <div className="w-full h-full">
          <div className={showFullMarketView ? 'h-full' : 'pb-6 sm:pb-8 md:pb-10'}>{renderSection()}</div>
        </div>
      </main>

      {/* Bottom Navigation - Hide when full market view is active */}
      {!showFullMarketView && (
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-50 safe-area-inset">
        <div className="w-full max-w-screen-xl mx-auto">
          <div className="grid grid-cols-5 py-3 sm:py-4 min-h-[70px] sm:min-h-[80px]">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    if (section.id === 'home') {
                      setShowFullMarketView(false);
                      setSelectedCurrency(null);
                      setActiveSection(section.id);
                    } else if (section.id === 'market') {
                      setShowFullMarketView(true);
                    } else {
                      setShowFullMarketView(false);
                      setSelectedCurrency(null);
                      setActiveSection(section.id);
                    }
                  }}
                  className={`flex flex-col items-center justify-center py-2 px-1 transition-colors duration-200 ${
                    (activeSection === section.id && !selectedCurrency) || (section.id === 'market' && showFullMarketView)
                      ? "text-primary bg-primary/5"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                >
                  <Icon className="w-6 h-6 sm:w-7 sm:h-7 mb-1" />
                  <span className="text-xs sm:text-sm font-medium">
                    {section.label}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        </nav>
      )}
    </div>
  );
}
