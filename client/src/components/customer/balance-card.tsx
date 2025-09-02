import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";

export function BalanceCard() {
  const { user } = useAuth();

  const balance = parseFloat(user?.balance || "0");
  const availableBalance = parseFloat(user?.availableBalance || "0");
  const tradingBalance = balance - availableBalance;

  return (
    <div className="bg-gradient-to-r from-primary to-accent p-4 sm:p-6 lg:p-8 text-white">
      <div className="text-center">
        <div className="text-sm sm:text-base opacity-90 mb-1 sm:mb-2">Total Balance</div>
        <div className="text-2xl sm:text-3xl lg:text-4xl font-bold mb-4 sm:mb-6">{balance.toFixed(2)}</div>
        
        <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:gap-6">
          <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm opacity-90">Available</div>
            <div className="text-base sm:text-lg lg:text-xl font-semibold">{availableBalance.toFixed(2)}</div>
          </div>
          <div className="bg-white bg-opacity-20 rounded-lg p-3 sm:p-4">
            <div className="text-xs sm:text-sm opacity-90">In Trading</div>
            <div className="text-base sm:text-lg lg:text-xl font-semibold">{tradingBalance.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
