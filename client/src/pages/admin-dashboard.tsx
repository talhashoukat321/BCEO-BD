import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MemberManagement } from "@/components/admin/member-management-new";
import { BettingOrders } from "@/components/admin/betting-orders";
import { WalletManagement } from "@/components/admin/wallet-management";
import { Reports } from "@/components/admin/reports";
import { Announcements } from "@/components/admin/announcements";
import { Users, ChartLine, Wallet, BarChart3, Megaphone, Smartphone, LogOut } from "lucide-react";
import { useLocation } from "wouter";

const sections = [
  { id: "members", label: "Member Management", icon: Users },
  { id: "orders", label: "Betting Orders", icon: ChartLine },
  { id: "wallets", label: "Wallet Management", icon: Wallet },
  { id: "reports", label: "Reports", icon: BarChart3 },
  { id: "announcements", label: "Announcements", icon: Megaphone },
];

export default function AdminDashboard() {
  const [activeSection, setActiveSection] = useState("members");
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const renderSection = () => {
    switch (activeSection) {
      case "members":
        return <MemberManagement />;
      case "orders":
        return <BettingOrders />;
      case "wallets":
        return <WalletManagement />;
      case "reports":
        return <Reports />;
      case "announcements":
        return <Announcements />;
      default:
        return <MemberManagement />;
    }
  };

  const getSectionTitle = () => {
    return sections.find(s => s.id === activeSection)?.label || "Dashboard";
  };

  return (
    <div className="h-screen w-screen bg-gray-900 flex">
      {/* Sidebar */}
      <div className="w-48 sm:w-56 lg:w-64 bg-gray-800 shadow-2xl border-r border-gray-700">
        <div className="p-6 border-b border-gray-700">
          <h1 className="text-lg sm:text-xl font-bold text-white">C BOE Admin</h1>
          <p className="text-xs sm:text-sm text-gray-300">Management Dashboard</p>
        </div>
        
        <nav className="mt-8">
          <div className="px-6 space-y-2">
            {sections.map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center px-4 py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                    activeSection === section.id
                      ? "bg-blue-600 text-white shadow-md"
                      : "text-gray-300 hover:bg-gray-700 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 sm:w-5 sm:h-5 mr-3 flex-shrink-0" />
                  <span className="truncate">{section.label}</span>
                </button>
              );
            })}
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0 h-screen">
        <div className="w-full flex flex-col flex-1">
          {/* Header */}
          <div className="bg-gray-800 shadow-lg border-b border-gray-700 p-6">
            <div className="flex justify-between items-center">
              <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-white truncate">{getSectionTitle()}</h2>
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setLocation("/customer")}
                  className="flex items-center space-x-1 text-xs sm:text-sm bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600 hover:text-white"
                  size="sm"
                >
                  <Smartphone className="w-3 h-3 sm:w-4 sm:h-4" />
                  <span className="hidden sm:inline">Customer View</span>
                  <span className="sm:hidden">Customer</span>
                </Button>
                <div className="flex items-center space-x-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs sm:text-sm font-medium">
                    {user?.username?.charAt(0).toUpperCase() || user?.name?.charAt(0)?.toUpperCase() || 'U'}
                  </div>
                  <span className="text-gray-200 text-sm sm:text-base hidden md:inline truncate">{user?.name || user?.username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => logout()}
                    className="text-gray-300 hover:text-white hover:bg-gray-700"
                  >
                    <LogOut className="w-3 h-3 sm:w-4 sm:h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto bg-gray-900">
            {renderSection()}
          </div>
        </div>
      </div>
    </div>
  );
}
