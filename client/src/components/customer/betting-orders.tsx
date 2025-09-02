import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { useBettingOrders, useUpdateBettingOrder } from "@/lib/api";
import { FileText, Copy, ChevronRight, ArrowLeft } from "lucide-react";
import { format } from "date-fns";
import { queryClient } from "@/lib/queryClient";
// import { useToast } from "@/hooks/use-toast";

export function CustomerBettingOrders() {
  const { user } = useAuth();
  const { data: allBettingOrders, isLoading, error } = useBettingOrders();
  const updateBettingOrder = useUpdateBettingOrder();
  // const { toast } = useToast();
  
  // Check for tab parameter in URL to navigate directly to Position Orders
  const urlParams = new URLSearchParams(window.location.search);
  const tabFromUrl = urlParams.get('tab') as 'position' | 'closing' | null;
  
  const [activeTab, setActiveTab] = useState<"position" | "closing">(tabFromUrl || "position");
  const [timeFilter, setTimeFilter] = useState("today");
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [showDetailView, setShowDetailView] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Auto-refresh betting orders every 1 second to catch completed orders and update countdown
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    }, 1000); // Refresh every 1 second for real-time countdown

    return () => clearInterval(interval);
  }, []);

  // Function to get payout percentage based on duration
  const getPayoutPercentage = (duration: number) => {
    const payoutMap: { [key: number]: string } = {
      30: "20%",
      60: "30%", 
      120: "40%",
      180: "50%",
      240: "60%"
    };
    return payoutMap[duration] || "30%"; // Default to 30% if duration not found
  };

  // Function to calculate remaining time for position orders
  const getRemainingTime = (order: any) => {
    const now = new Date().getTime();
    const expiresAt = new Date(order.expiresAt).getTime();
    const remaining = Math.max(0, expiresAt - now);
    
    if (remaining <= 0) return "00:00";
    
    const minutes = Math.floor(remaining / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  // Function to check if order should be moved to closed
  const isOrderExpired = (order: any) => {
    const now = new Date().getTime();
    const expiresAt = new Date(order.expiresAt).getTime();
    return now >= expiresAt;
  };

  // Function to calculate profit based on order amount and duration
  const calculateProfit = (order: any) => {
    const orderAmount = parseFloat(order.amount);
    const profitPercentageMap: { [key: number]: number } = {
      30: 0.20,  // 20%
      60: 0.30,  // 30%
      120: 0.40, // 40%
      180: 0.50, // 50%
      240: 0.60  // 60%
    };
    
    const profitRate = profitPercentageMap[order.duration] || 0.30; // Default to 30%
    
    // For active orders, show expected profit
    if (order.status === "active") {
      return orderAmount * profitRate;
    }
    
    // For completed orders, show actual profit (should be positive for display)
    if (order.status === "completed" && order.profit) {
      return Math.abs(parseFloat(order.profit));
    }
    
    return orderAmount * profitRate;
  };

  // Handle time filter change
  const handleTimeFilterChange = (value: string) => {
    setTimeFilter(value);
    // Reset dates when switching away from conditional
    if (value !== "conditional") {
      setStartDate("");
      setEndDate("");
    }
  };





  // Filter orders for current user - Debug logging
  const userBettingOrders = allBettingOrders?.filter(order => order.userId === user?.id) || [];
  


  // Auto-expire orders when their duration is reached
  useEffect(() => {
    const checkExpiredOrders = () => {
      const now = new Date();
      userBettingOrders.forEach(order => {
        if (order.status === "active" && order.expiresAt && new Date(order.expiresAt) <= now) {
          // Calculate profit based on direction and random outcome
          const isWin = Math.random() > 0.5; // 50% win rate simulation
          const profitAmount = isWin ? parseFloat(order.amount) * 0.8 : -parseFloat(order.amount);
          
          updateBettingOrder.mutate({
            id: order.id,
            updates: {
              status: "completed",
              result: isWin ? "win" : "loss",
              exitPrice: order.entryPrice, // Using same price for simplicity
            }
          });
        }
      });
    };

    const interval = setInterval(checkExpiredOrders, 1000); // Check every second
    return () => clearInterval(interval);
  }, [userBettingOrders, updateBettingOrder]);

  // Filter by status and time - Position Order (active) and Closing Order (completed)
  const filteredOrders = userBettingOrders.filter(order => {
    const statusMatch = activeTab === "position" ? order.status === "active" :
                       activeTab === "closing" ? order.status === "completed" :
                       false;

    // Time filtering logic
    const orderDate = new Date(order.createdAt);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    let timeMatch = true;
    if (timeFilter === "today") {
      timeMatch = orderDate >= todayStart;
    } else if (timeFilter === "yesterday") {
      const yesterdayStart = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      yesterdayStart.setHours(0, 0, 0, 0);
      const yesterdayEnd = new Date(yesterdayStart.getTime() + 24 * 60 * 60 * 1000);
      timeMatch = orderDate >= yesterdayStart && orderDate < yesterdayEnd;
    } else if (timeFilter === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      timeMatch = orderDate >= weekAgo;
    } else if (timeFilter === "month") {
      const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      timeMatch = orderDate >= monthAgo;
    } else if (timeFilter === "3months") {
      const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      timeMatch = orderDate >= threeMonthsAgo;
    } else if (timeFilter === "conditional" && startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999); // Include full end date
      timeMatch = orderDate >= start && orderDate <= end;
    } else if (timeFilter === "all") {
      timeMatch = true;
    }

    return statusMatch && timeMatch;
  });

  const copyOrderDetails = (order: any) => {
    const orderNumber = order.orderId || `B${Date.now().toString().slice(-12)}${order.id.toString().padStart(3, '0')}`;
    
    // Only copy Order No.
    navigator.clipboard.writeText(orderNumber);
    console.log("Order No. copied:", orderNumber);
  };

  const openDetailView = (order: any) => {
    setSelectedOrder(order);
    setShowDetailView(true);
  };

  if (isLoading) {
    return <div className="p-4">Loading orders...</div>;
  }

  // Detailed order view
  if (showDetailView && selectedOrder) {
    const orderNumber = selectedOrder.orderId || `${selectedOrder.id}`;
    
    // Calculate profit for the selected order
    const profit = calculateProfit(selectedOrder);
    
    return (
      <div className="p-4 bg-white min-h-screen">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <Button
            variant="ghost"
            onClick={() => setShowDetailView(false)}
            className="flex items-center text-gray-600"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <Button
            variant="ghost"
            onClick={() => copyOrderDetails(selectedOrder)}
            className="text-blue-600"
          >
            Copy Order No.
          </Button>
        </div>

        {/* Order Details */}
        <div className="space-y-4">
          {[
            { label: "Order No.", value: orderNumber },
            { label: "Currency", value: selectedOrder.asset.includes("/") ? selectedOrder.asset : `${selectedOrder.asset}/USDT` },
            { label: "Buy Price", value: selectedOrder.entryPrice },
            { label: "Close Price", value: selectedOrder.exitPrice || selectedOrder.entryPrice },
            { label: "Buy Time", value: format(new Date(selectedOrder.createdAt), 'yyyy-MM-dd HH:mm:ss') },
            { label: "Close Time", value: selectedOrder.status === 'completed' ? format(new Date(selectedOrder.expiresAt), 'yyyy-MM-dd HH:mm:ss') : 'Pending' },
            { label: "Billing Time", value: `${selectedOrder.duration}s` },
            { label: "Order Amount", value: selectedOrder.amount },
            { label: "Order Status", value: selectedOrder.status === 'active' ? 'Pending' : selectedOrder.status },
            { label: "Profit Amount", value: `${profit > 0 ? '+' : ''}{profit.toFixed(0)}`, isProfit: true },
            { label: "Scale", value: `${selectedOrder.duration === 60 ? '20' : selectedOrder.duration === 120 ? '30' : '50'}%` },
            { label: "Buy Direction", value: user?.direction === "Actual" ? (selectedOrder.direction || "Buy Up") : user?.direction === "Buy Up" ? "Buy Up" : "Buy Down", isDirection: true },
            { label: "Actual Rise Fall", value: selectedOrder.result === 'win' ? 'Rise' : selectedOrder.result === 'loss' ? 'Fall' : 'Rise', isActual: true },
            { label: "Order Time", value: format(new Date(selectedOrder.createdAt), 'yyyy-MM-dd HH:mm:ss') }
          ].map((item, index) => (
            <div key={index} className="flex justify-between items-center py-3 border-b border-gray-100">
              <span className="text-gray-600 text-sm">{item.label}</span>
              <span className={`text-sm font-medium ${
                item.isProfit ? (profit > 0 ? 'text-red-500' : 'text-green-500') :
                item.isDirection ? (
                  user?.direction === "Actual" ? 
                    (selectedOrder.direction === "Buy Up" ? 'text-green-500' : 'text-red-500') :
                    (user?.direction === 'Buy Up' ? 'text-green-500' : 'text-red-500')
                ) :
                item.isActual ? 'text-red-500' :
                'text-gray-900'
              }`}>
                {item.value}
              </span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 space-y-4 pb-16 sm:pb-20 md:pb-24">
      {/* Header */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Order</h1>
          <Select value={timeFilter} onValueChange={handleTimeFilterChange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="yesterday">Yesterday</SelectItem>
              <SelectItem value="week">Last Week</SelectItem>
              <SelectItem value="month">Last Month</SelectItem>
              <SelectItem value="3months">Last 3 Months</SelectItem>
              <SelectItem value="all">All Orders</SelectItem>
              <SelectItem value="conditional">Conditional Query</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        {/* Conditional Date Inputs */}
        {timeFilter === "conditional" && (
          <div className="space-y-2">
            <div className="space-y-1">
              <Label htmlFor="headerStartDate" className="text-sm text-gray-600">Start date</Label>
              <Input
                id="headerStartDate"
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="headerEndDate" className="text-sm text-gray-600">End date</Label>
              <Input
                id="headerEndDate"
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full"
              />
            </div>
          </div>
        )}
      </div>

      {/* Order Record Header */}
      <div className="text-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Record</h2>
        
        {/* Tab Navigation - Exact Match to Screenshot */}
        <div className="flex justify-center space-x-1">
          <Button
            variant={activeTab === "position" ? "default" : "outline"}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              activeTab === "position" 
                ? "bg-yellow-500 text-black hover:bg-yellow-600" 
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("position")}
          >
            Position Order
          </Button>
          <Button
            variant={activeTab === "closing" ? "default" : "outline"}
            className={`px-6 py-2 rounded-full text-sm font-medium ${
              activeTab === "closing"
                ? "bg-yellow-500 text-black hover:bg-yellow-600"
                : "bg-white text-gray-600 border-gray-300 hover:bg-gray-50"
            }`}
            onClick={() => setActiveTab("closing")}
          >
            Closing Order
          </Button>
        </div>
      </div>

      {/* Orders Content */}
      <div className="min-h-96">

        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-96 text-gray-400">
            {/* Empty state icon matching screenshot */}
            <div className="w-24 h-24 mb-4 flex items-center justify-center">
              <div className="relative">
                <div className="w-16 h-12 border-2 border-gray-300 rounded bg-gray-50 flex items-center justify-center">
                  <div className="w-8 h-6 border border-gray-300 rounded bg-white"></div>
                </div>
                <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                  <div className="w-6 h-4 border border-gray-300 rounded-b bg-gray-50"></div>
                </div>
              </div>
            </div>
            <p className="text-gray-400 text-sm">No More</p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => {
              const orderNumber = order.orderId || `${order.id}`;
              
              // Calculate profit using our function
              const profit = calculateProfit(order);
              const isProfit = profit > 0;
              
              return (
                <Card key={order.id} className="bg-white border border-gray-200">
                  <CardContent className="p-4">
                    {/* Header with currency and timestamp */}
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <h3 className="font-bold text-lg text-gray-900">
                          {order.asset.includes("/") ? order.asset : `${order.asset}/USDT`}
                        </h3>
                      </div>
                      <div className="text-right text-sm text-gray-600">
                        {format(new Date(order.createdAt), 'yyyy-MM-dd HH:mm:ss')}
                      </div>
                    </div>

                    {/* Settlement Timing - Centered with live countdown */}
                    <div className="text-center mb-4">
                      <div className="text-sm text-gray-600 mb-1">Settlement Timing</div>
                      <div className="text-lg font-bold text-gray-900">
                        {order.status === 'active' ? 
                          getRemainingTime(order) : 
                          `${order.duration}s`
                        }
                      </div>
                    </div>

                    {/* Main content grid - 4 columns matching screenshot */}
                    <div className="grid grid-cols-4 gap-4 text-sm">
                      {/* Column 1: Investment Amount & Buy Price */}
                      <div className="space-y-3">
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Investment Amount</div>
                          <div className="font-medium">{order.amount}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Buy Price</div>
                          <div className="font-medium">{order.entryPrice}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Closing Price</div>
                          <div className="font-medium">{order.exitPrice || order.entryPrice}</div>
                        </div>
                        <div>
                          <div className="text-gray-500 text-xs mb-1">Profit</div>
                          <div className={`font-medium ${isProfit ? 'text-red-500' : 'text-green-500'}`}>
                            {/* Don't show profit for position orders, only for closed orders */}
                            {order.status === 'active' ? '0.00' : (isProfit ? '+' : '') + profit.toFixed(0)}
                          </div>
                        </div>
                      </div>

                      {/* Column 2: Direction */}
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-gray-500 text-xs mb-1">Direction</div>
                          <div className={`font-medium text-lg ${
                            user?.direction === "Actual" ? 
                              (order.direction === "Buy Up" ? 'text-green-500' : 'text-red-500') :
                              (user?.direction === 'Buy Up' ? 'text-green-500' : 'text-red-500')
                          }`}>
                            {order.direction === "Buy Up" ? "Up" : "Down"}
                          </div>
                        </div>
                      </div>

                      {/* Column 3: Scale */}
                      <div className="flex items-center justify-center">
                        <div className="text-center">
                          <div className="text-gray-500 text-xs mb-1">Scale</div>
                          <div className="font-medium">
                            {order.duration === 60 ? '20.00%' : 
                             order.duration === 120 ? '30.00%' : '50.00%'}
                          </div>
                        </div>
                      </div>

                      {/* Column 4: Investment Time */}
                      <div className="text-right">
                        <div className="text-gray-500 text-xs mb-1">Investment Time</div>
                        <div className="font-medium text-xs">{order.duration}s</div>
                        <div className="font-medium text-xs mt-2">
                          {parseFloat(order.entryPrice).toFixed(4)}
                        </div>
                        <div className="font-medium text-xs">
                          {order.exitPrice ? parseFloat(order.exitPrice).toFixed(4) : '0.0000'}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          ——————
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
}