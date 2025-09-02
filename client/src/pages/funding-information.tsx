import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";

export default function FundingInformation() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleBack = () => {
    setLocation('/customer');
  };

  // Sample transaction data matching the image
  const transactions = [
    {
      id: 1,
      type: "Futures Earnings",
      amount: "+5.00 INR",
      date: "2025-08-16 14:55:59",
      badgeColor: "bg-green-500"
    },
    {
      id: 2,
      type: "Futures Buy",
      amount: "-5.00 INR",
      date: "2025-08-16 14:59:59",
      badgeColor: "bg-red-500"
    },
    {
      id: 3,
      type: "Futures Earnings",
      amount: "+5400.00 INR",
      date: "2025-08-16 17:24:46",
      badgeColor: "bg-green-500"
    },
    {
      id: 4,
      type: "Futures Buy",
      amount: "-4500.00 INR",
      date: "2025-08-16 19:35:46",
      badgeColor: "bg-red-500"
    },
    {
      id: 5,
      type: "Futures Earnings",
      amount: "+5400.00 INR",
      date: "2025-08-16 19:35:15",
      badgeColor: "bg-green-500"
    },
    {
      id: 6,
      type: "Futures Buy",
      amount: "-4500.00 INR",
      date: "2025-08-16 20:34:15",
      badgeColor: "bg-red-500"
    },
    {
      id: 7,
      type: "Futures Earnings",
      amount: "+12.00 INR",
      date: "2025-08-17 11:44:17",
      badgeColor: "bg-green-500"
    },
    {
      id: 8,
      type: "Futures Buy",
      amount: "-10.00 INR",
      date: "2025-08-17 11:44:17",
      badgeColor: "bg-red-500"
    },
    {
      id: 9,
      type: "Withdrawal of Currency",
      amount: "-200000.00 INR",
      date: "2025-08-17 19:09:35",
      badgeColor: "bg-purple-500"
    },
    {
      id: 10,
      type: "Futures Earnings",
      amount: "+12.00 INR",
      date: "2025-08-17 19:07:56",
      badgeColor: "bg-green-500"
    }
  ];

  const availableBalance = parseFloat(user?.availableBalance || user?.balance || "669522.600000");
  const frozenBalance = parseFloat(user?.frozenBalance || "0.0000");
  const totalBalance = availableBalance + frozenBalance;

  return (
    <div className="min-h-screen bg-gray-100">
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
        <h1 className="text-lg font-medium text-gray-900">Funding Information</h1>
        <div className="w-8"></div>
      </div>

      {/* Balance Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-gray-500">INR</div>
            <div className="text-lg font-bold text-blue-600">{availableBalance.toFixed(6)}</div>
            <div className="text-xs text-gray-500">Available Balance</div>
          </div>
          
          <div className="text-center">
            <div className="text-lg font-bold text-blue-600">{frozenBalance.toFixed(4)}</div>
            <div className="text-xs text-gray-500">Frozen</div>
          </div>
          
          <div className="text-right">
            <div className="text-lg font-bold text-blue-600">{totalBalance.toFixed(6)}</div>
            <div className="text-xs text-gray-500">Balance</div>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="px-4 py-4 space-y-2">
        {transactions.map((transaction) => (
          <div key={transaction.id} className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="text-sm font-medium text-orange-500 mb-1">Currency Account</div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded text-white ${transaction.badgeColor}`}>
                    {transaction.type}
                  </span>
                </div>
                <div className="text-xs text-gray-500 mt-2">{transaction.date}</div>
              </div>
              
              <div className="text-right">
                <div className={`text-lg font-bold ${
                  transaction.amount.startsWith('+') ? 'text-green-600' : 
                  transaction.amount.startsWith('-') ? 'text-red-600' : 'text-blue-600'
                }`}>
                  {transaction.amount}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Load More Button */}
      <div className="p-4 text-center">
        <Button variant="ghost" className="text-gray-500 text-sm">
          Click to Load More
        </Button>
      </div>
    </div>
  );
}