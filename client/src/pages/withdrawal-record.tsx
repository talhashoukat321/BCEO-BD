import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";

interface WithdrawalRecord {
  id: number;
  currency: string;
  quantityOfWithdrawal: number;
  actualQuantity: number;
  status: 'Under review' | 'Success' | 'Failed';
  createdAt: string;
}

export default function WithdrawalRecord() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  const handleBack = () => {
    setLocation('/withdrawal-request');
  };

  // Fetch withdrawal records
  const { data: withdrawalRecords = [] } = useQuery<any[]>({
    queryKey: ['/api/withdrawal-requests'],
    select: (data: any) => (Array.isArray(data) ? data : [])
  });

  // Map API data to match the expected format
  const mapToWithdrawalRecord = (apiRecord: any): WithdrawalRecord => ({
    id: apiRecord.id,
    currency: "INR",
    quantityOfWithdrawal: parseFloat(apiRecord.amount),
    actualQuantity: parseFloat(apiRecord.amount),
    status: apiRecord.status as 'Under review' | 'Success' | 'Failed',
    createdAt: new Date(apiRecord.createdAt || apiRecord.created_at).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit', 
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).replace(',', '')
  });

  const records: WithdrawalRecord[] = withdrawalRecords.map(mapToWithdrawalRecord);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Under review':
        return (
          <span className="px-3 py-1 text-xs font-medium text-white bg-orange-500 rounded-full">
            Under review
          </span>
        );
      case 'Success':
        return (
          <span className="px-3 py-1 text-xs font-medium text-white bg-green-500 rounded-full">
            Success
          </span>
        );
      case 'Failed':
        return (
          <span className="px-3 py-1 text-xs font-medium text-white bg-red-500 rounded-full">
            Failed
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium text-white bg-gray-500 rounded-full">
            {status}
          </span>
        );
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
            onClick={handleBack}
            className="p-1 mr-2"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
        </div>
        <h1 className="text-lg font-medium text-gray-900">Withdrawal Record</h1>
        <div className="w-8"></div>
      </div>

      {/* Content */}
      <div className="p-4">
        {records.length > 0 ? (
          <div className="space-y-4">
            {records.map((record) => (
              <div key={record.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Record Header */}
                <div className="flex justify-between items-center p-4 border-b border-gray-200 bg-gray-50">
                  <div className="text-sm font-medium text-gray-900">{record.currency}</div>
                  <div className="text-xs text-gray-500">{record.createdAt}</div>
                </div>

                {/* Record Content */}
                <div className="p-4 space-y-3">
                  {/* Quantity of Withdrawal */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">Quantity of Withdrawal</div>
                    <div className="text-sm font-medium text-gray-900">{record.quantityOfWithdrawal.toFixed(2)}</div>
                  </div>

                  {/* Actual Quantity */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">Actual quantity</div>
                    <div className="text-sm font-medium text-gray-900">{record.actualQuantity.toFixed(2)}</div>
                  </div>

                  {/* Withdrawal Status */}
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-700">Withdrawal Status</div>
                    <div>{getStatusBadge(record.status)}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="text-gray-500 text-sm">No withdrawal records found</div>
          </div>
        )}
      </div>
    </div>
  );
}