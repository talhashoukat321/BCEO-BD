import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function WithdrawalPage() {
  const [, setLocation] = useLocation();

  const handleBack = () => {
    setLocation('/customer');
  };

  const handleWithdrawalRecord = () => {
    // Navigate to withdrawal record tab
    console.log('Navigate to withdrawal record');
    setLocation('/top-up-records?tab=withdrawal');
  };

  return (
    <div className="min-h-screen bg-gray-50">
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
        <h1 className="text-lg font-medium text-gray-900">Request for Withdrawal</h1>
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleWithdrawalRecord}
            className="text-blue-600 hover:text-blue-700 text-sm"
          >
            Withdrawal Record
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        {/* BDT Currency Label - Clickable */}
        <div 
          className="mb-6 cursor-pointer hover:bg-gray-100 p-2 rounded transition-colors"
          onClick={() => setLocation('/withdrawal-request')}
        >
          <div className="text-gray-600 text-sm font-medium">INR</div>
        </div>

        {/* Empty space - matching the clean design */}
        <div className="flex-1 min-h-[400px]">
          {/* This space is intentionally empty to match your reference image */}
        </div>
      </div>
    </div>
  );
}