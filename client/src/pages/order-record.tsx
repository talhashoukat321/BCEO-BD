import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";

interface OrderRecord {
  id: number;
  pair: string;
  investmentAmount: number;
  direction: string;
  scale: number;
  buyPrice: number;
  closingPrice?: number;
  profit?: number;
  investmentTime: string;
  settlementTiming: string;
  status: 'active' | 'closed';
}

export default function OrderRecord() {
  const [activeTab, setActiveTab] = useState<'position' | 'closing'>('position');
  const { user } = useAuth();

  // Fetch betting orders (positions)
  const { data: bettingOrders = [] } = useQuery({
    queryKey: ['/api/betting-orders'],
    select: (data: any) => (Array.isArray(data) ? data : [])
  });

  // Map betting orders to order records
  const mapToOrderRecord = (order: any): OrderRecord => ({
    id: order.id,
    pair: order.symbol || 'BTC/USDT',
    investmentAmount: parseFloat(order.amount),
    direction: order.direction === 'up' ? 'Up' : 'Down',
    scale: parseFloat(order.leverage || 20),
    buyPrice: parseFloat(order.entryPrice || order.price || 115000),
    closingPrice: order.status === 'closed' ? parseFloat(order.closingPrice || order.exitPrice || 115500) : undefined,
    profit: order.status === 'closed' ? parseFloat(order.profit || 0) : undefined,
    investmentTime: new Date(order.createdAt).toLocaleString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    }).replace(',', ''),
    settlementTiming: order.status === 'active' ? `${Math.floor((order.duration || 60) / 60)}m ${(order.duration || 60) % 60}s` : 
      new Date(order.updatedAt || order.createdAt).toLocaleString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
      }).replace(',', ''),
    status: order.status === 'closed' ? 'closed' : 'active'
  });

  const allOrders = bettingOrders.map(mapToOrderRecord);
  const positionOrders = allOrders.filter(order => order.status === 'active');
  const closingOrders = allOrders.filter(order => order.status === 'closed');

  const currentOrders = activeTab === 'position' ? positionOrders : closingOrders;

  const handleBack = () => {
    window.history.back();
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 flex items-center justify-between border-b border-gray-200">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={handleBack}
          className="p-1"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </Button>
        <h1 className="text-lg font-medium text-gray-900">Order Record</h1>
        <div className="w-6"></div>
      </div>

      {/* Tab Buttons */}
      <div className="bg-white px-4 py-3 flex gap-2 border-b border-gray-100">
        <Button
          onClick={() => setActiveTab('position')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'position'
              ? 'bg-yellow-400 text-black hover:bg-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Position Order
        </Button>
        <Button
          onClick={() => setActiveTab('closing')}
          className={`px-6 py-2 rounded-full text-sm font-medium transition-colors ${
            activeTab === 'closing'
              ? 'bg-yellow-400 text-black hover:bg-yellow-500'
              : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          Closing Order
        </Button>
      </div>

      {/* Order Content */}
      <div className="p-4">
        {currentOrders.length > 0 ? (
          currentOrders.map((order) => (
            <div key={order.id} className="bg-white rounded-lg border border-gray-200 mb-4 overflow-hidden">
              {/* Header Section */}
              <div className="p-4 border-b border-gray-100">
                <div className="flex justify-between items-start mb-3">
                  <div className="font-medium text-gray-900">{order.pair}</div>
                  <div className="text-sm text-gray-500">
                    {activeTab === 'position' ? `Settlement Timing: ${order.settlementTiming}` : order.settlementTiming}
                  </div>
                </div>
              </div>

              {/* Details Section */}
              <div className="p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {/* Left Column */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Amount</span>
                      <span className="text-gray-900 font-medium">{order.investmentAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Buy Price</span>
                      <span className="text-gray-900 font-medium">{order.buyPrice.toFixed(4)}</span>
                    </div>
                    {activeTab === 'closing' && order.closingPrice && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Closing Price</span>
                        <span className="text-gray-900 font-medium">{order.closingPrice.toFixed(4)}</span>
                      </div>
                    )}
                    {activeTab === 'closing' && order.profit !== undefined && (
                      <div className="flex justify-between">
                        <span className="text-gray-600">Profit</span>
                        <span className={`font-medium ${order.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {order.profit >= 0 ? '+' : ''}{order.profit.toFixed(4)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Right Column */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Direction</span>
                      <span className={`font-medium ${order.direction === 'Up' ? 'text-green-600' : 'text-red-600'}`}>
                        {order.direction}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Scale</span>
                      <span className="text-gray-900 font-medium">{order.scale.toFixed(2)}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Investment Time</span>
                      <span className="text-gray-900 font-medium text-xs">{order.investmentTime}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-16">
            <div className="text-gray-400 text-lg mb-2">No More</div>
            <div className="text-gray-500 text-sm">
              {activeTab === 'position' ? 'No active positions' : 'No closed orders'}
            </div>
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2">
        <div className="flex justify-around items-center">
          <div className="flex flex-col items-center py-2">
            <Home className="w-6 h-6 text-gray-400" />
            <span className="text-xs text-gray-400 mt-1">Home</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-blue-500 rounded" />
            <span className="text-xs text-gray-400 mt-1">Market</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-600 rounded-full flex items-center justify-center">
              <div className="w-3 h-3 bg-white rounded-full" />
            </div>
            <span className="text-xs text-gray-900 mt-1 font-medium">Record</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-400 rounded" />
            <span className="text-xs text-gray-400 mt-1">Asset</span>
          </div>
          <div className="flex flex-col items-center py-2">
            <div className="w-6 h-6 bg-gray-400 rounded-full" />
            <span className="text-xs text-gray-400 mt-1">Mine</span>
          </div>
        </div>
      </div>
    </div>
  );
}