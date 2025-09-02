import { useState, useEffect, useRef } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home, TrendingUp, TrendingDown, X, Menu } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// TradingView Chart Component
function TradingViewChart({ cryptoSymbol, timeframe }: { cryptoSymbol: string, timeframe: string }) {
  const chartRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (chartRef.current) {
      // Clear previous chart
      chartRef.current.innerHTML = '';
      
      // Create TradingView widget
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        if ((window as any).TradingView && chartRef.current) {
          new (window as any).TradingView.widget({
            autosize: true,
            symbol: `BINANCE:${cryptoSymbol.replace("/", "")}`,
            interval: timeframe === "1M" ? "1" : 
                     timeframe === "5M" ? "5" : 
                     timeframe === "30M" ? "30" : 
                     timeframe === "1H" ? "60" : 
                     timeframe === "4H" ? "240" : "1D",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#1f2937",
            enable_publishing: false,
            hide_side_toolbar: true,
            container_id: "tradingview-chart-widget",
            width: "100%",
            height: "100%",
          });
        }
      };
      
      // Only add script if it doesn't exist
      if (!document.querySelector('script[src="https://s3.tradingview.com/tv.js"]')) {
        document.head.appendChild(script);
      } else if ((window as any).TradingView) {
        // TradingView is already loaded
        script.onload?.({} as Event);
      }
    }
  }, [cryptoSymbol, timeframe]);

  return <div id="tradingview-chart-widget" ref={chartRef} className="w-full h-full" />;
}

// Crypto data matching the home page
const cryptoData: { [key: string]: any } = {
  "BTC": {
    symbol: "BTC/USDT",
    name: "Bitcoin",
    icon: "₿",
    color: "#F7931A",
  },
  "ETH": {
    symbol: "ETH/USDT", 
    name: "Ethereum",
    icon: "Ξ",
    color: "#627EEA",
  },
  "SUP": {
    symbol: "SUP/USDT",
    name: "SuperCoin", 
    icon: "Ⓢ",
    color: "#C2A633",
  },
  "CHZ": {
    symbol: "CHZ/USDT",
    name: "Chiliz",
    icon: "🌶️",
    color: "#CD212A",
  },
  "PSG": {
    symbol: "PSG/USDT",
    name: "Paris Saint-Germain",
    icon: "⚽",
    color: "#004170",
  },
  "ATM": {
    symbol: "ATM/USDT",
    name: "Atletico Madrid",
    icon: "⚽", 
    color: "#CE3524",
  },
  "JUV": {
    symbol: "JUV/USDT",
    name: "Juventus",
    icon: "⚽",
    color: "#000000",
  },
  "KSM": {
    symbol: "KSM/USDT",
    name: "Kusama",
    icon: "🔗",
    color: "#000000",
  },
  "LTC": {
    symbol: "LTC/USDT",
    name: "Litecoin",
    icon: "Ł",
    color: "#345D9D",
  },
  "EOS": {
    symbol: "EOS/USDT",
    name: "EOS",
    icon: "📡",
    color: "#443F54",
  },
  "BTS": {
    symbol: "BTS/USDT",
    name: "BitShares",
    icon: "💎",
    color: "#35BAFF",
  },
  "LINK": {
    symbol: "LINK/USDT",
    name: "Chainlink",
    icon: "🔗",
    color: "#375BD2",
  },
};

const timeframes = ["1M", "5M", "30M", "1H", "4H", "1D"];

interface CryptoPriceData {
  price: string;
  change: string;
}

interface CryptoPrices {
  [key: string]: CryptoPriceData;
}

export function CryptoSingle() {
  const [match, params] = useRoute("/crypto/:cryptoId");
  const [, setLocation] = useLocation();
  const cryptoId = params?.cryptoId?.toUpperCase() || null;
  const [activeTimeframe, setActiveTimeframe] = useState("5M");
  const [quantity, setQuantity] = useState("9000");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTradePopup, setShowTradePopup] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<"up" | "down">("up");
  const [selectedDuration, setSelectedDuration] = useState("60");
  const { user } = useAuth();
  const { toast } = useToast();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();
  
  const crypto = cryptoId ? cryptoData[cryptoId] : null;

  // Available cryptocurrency options for the dropdown
  const cryptoOptions = [
    { symbol: "BTC/USDT", name: "Bitcoin" },
    { symbol: "ETH/USDT", name: "Ethereum" },
    { symbol: "SUP/USDT", name: "SuperCoin" },
    { symbol: "CHZ/USDT", name: "Chiliz" },
    { symbol: "PSG/USDT", name: "Paris Saint-Germain" },
    { symbol: "ATM/USDT", name: "Atletico Madrid" },
    { symbol: "JUV/USDT", name: "Juventus" },
    { symbol: "KSM/USDT", name: "Kusama" },
    { symbol: "LTC/USDT", name: "Litecoin" },
    { symbol: "EOS/USDT", name: "EOS" },
    { symbol: "BTS/USDT", name: "BitShares" },
    { symbol: "LINK/USDT", name: "Chainlink" },
  ];

  const formatPrice = (price: string | number) => {
    const numPrice = typeof price === "string" ? parseFloat(price) : price;
    if (numPrice < 1) {
      return numPrice.toFixed(4);
    } else if (numPrice < 100) {
      return numPrice.toFixed(2);
    } else {
      return numPrice.toFixed(0);
    }
  };

  const handleCurrencyChange = (newCurrency: string) => {
    const baseCurrency = newCurrency.split('/')[0];
    // Navigate to the selected currency page
    setLocation(`/crypto/${baseCurrency.toLowerCase()}`);
  };

  const handleSpotOrdersClick = () => {
    setLocation('/customer?tab=orders');
  };

  const tradeDurations = [
    { value: "60", label: "60S", seconds: 60 },
    { value: "120", label: "120S", seconds: 120 },
    { value: "180", label: "180S", seconds: 180 },
  ];

  // Get real-time crypto prices
  const { data: cryptoPrices = {} } = useQuery<CryptoPrices>({
    queryKey: ["/api/crypto-prices"],
    refetchInterval: 5000,
  });

  const [tradeHistory, setTradeHistory] = useState([
    { time: "12:49:08", direction: "Buy", price: "115348.00", quantity: "0.0001" },
    { time: "12:49:11", direction: "Buy", price: "115355.00", quantity: "0.0001" },
    { time: "12:49:06", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:13", direction: "Buy", price: "115350.00", quantity: "0.0001" },
    { time: "12:49:07", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:33", direction: "Buy", price: "115367.0700", quantity: "0.2000" },
    { time: "12:49:13", direction: "Buy", price: "115362.5100", quantity: "0.0050" },
    { time: "12:49:07", direction: "Buy", price: "115345.00", quantity: "0.0001" },
    { time: "12:00:31", direction: "Sell", price: "115365.9900", quantity: "0.0001" },
  ]);
  
  if (!crypto) {
    return (
      <div className="min-h-screen bg-gray-100 p-4">
        <div className="text-center mt-20">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Cryptocurrency Not Found</h1>
          <Link href="/">
            <Button className="bg-blue-600 text-white">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  // Update time every second
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Get real-time price data
  const price = cryptoPrices[crypto?.symbol]?.price || "115366.9629";
  const change = cryptoPrices[crypto?.symbol]?.change || "-2.43";
  const isPositive = parseFloat(change) >= 0;
  
  // Handle trading functionality
  const placeTradeMutation = useMutation({
    mutationFn: async (tradeData: any) => {
      const response = await fetch("/api/betting-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(tradeData),
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Placed Successfully",
        description: `${tradeDirection === "up" ? "Buy Up" : "Buy Down"} order for ${quantity} USDT has been placed.`,
      });
      setShowTradePopup(false);
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] }); // Update user balance
      
      // Redirect to Orders tab Position section
      window.location.href = "/customer/orders?tab=position";
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade order",
        variant: "destructive",
      });
    },
  });

  const handlePlaceTrade = () => {
    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to place trades",
        variant: "destructive",
      });
      return;
    }

    // Calculate profit/loss based on direction and duration
    const amount = parseFloat(quantity);
    let profitLoss = 0;
    
    if (tradeDirection === "up") {
      // Buy Up - Calculate profit
      if (selectedDuration === "60") profitLoss = amount * 0.20; // 20% profit
      else if (selectedDuration === "120") profitLoss = amount * 0.30; // 30% profit  
      else if (selectedDuration === "180") profitLoss = amount * 0.50; // 50% profit
    } else {
      // Buy Down - Calculate loss (negative)
      if (selectedDuration === "60") profitLoss = amount * -0.20; // 20% loss
      else if (selectedDuration === "120") profitLoss = amount * -0.30; // 30% loss
      else if (selectedDuration === "180") profitLoss = amount * -0.50; // 50% loss
    }

    const tradeData = {
      asset: crypto.symbol,
      amount: quantity,
      direction: tradeDirection === "up" ? "Buy Up" : "Buy Down",
      duration: parseInt(selectedDuration), // Send actual seconds: 60, 120, or 180
      entryPrice: price,
      profitLoss: profitLoss, // Send calculated profit/loss to backend
    };

    placeTradeMutation.mutate(tradeData);
  };

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      {/* Top Header */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-gray-700 flex items-center space-x-1 px-2 py-1 h-auto font-medium text-sm"
              >
                <span>{crypto.symbol}</span>
                <Menu className="w-3 h-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-gray-700">
              <div className="bg-black text-white max-h-96 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-red-500 font-medium border-b border-gray-800 bg-gray-900">
                  Spot
                </div>
                {cryptoOptions.map((crypto) => {
                  const price = cryptoPrices[crypto.symbol]?.price || "0.00";
                  const change = cryptoPrices[crypto.symbol]?.change || "0.00";
                  const isPositive = !change.toString().startsWith('-');
                  
                  return (
                    <DropdownMenuItem
                      key={crypto.symbol}
                      className="text-white hover:bg-gray-800 cursor-pointer flex justify-between items-center px-3 py-2 focus:bg-gray-800 border-none"
                      onClick={() => handleCurrencyChange(crypto.symbol)}
                    >
                      <span className="text-sm font-medium text-white">{crypto.symbol}</span>
                      <div className="text-right">
                        <div className={`text-sm font-medium ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {formatPrice(price)}
                        </div>
                        <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                          {change}%
                        </div>
                      </div>
                    </DropdownMenuItem>
                  );
                })}
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">{crypto.symbol}</div>
        </div>
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSpotOrdersClick}
            className="text-white hover:bg-gray-700 text-sm"
          >
            Spot Orders &gt;
          </Button>
        </div>
      </div>

      {/* Price Section - Exact Blocnix Style */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-400">{crypto.symbol}</div>
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
          </div>
          <div className="text-center flex-1">
            <div className="text-2xl font-bold text-red-400">{price}</div>
            <div className="text-sm text-red-400">{change}%</div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>24H High: 115395.3500</div>
            <div>24H Low: 115366.9629</div>
            <div>24H Volume: 152.43M</div>
            <div>24H Turnover: 1.31K</div>
          </div>
        </div>
      </div>

      {/* Chart Timeframe Buttons - Exact Blocnix Style */}
      <div className="bg-gray-900 border-b border-gray-800">
        <div className="px-4 py-2 flex space-x-4">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-3 py-1 text-sm font-medium ${
                activeTimeframe === tf
                  ? "text-blue-400 border-b-2 border-blue-400"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* TradingView Chart - Increased height */}
      <div className="bg-gray-950 h-96 relative">
        <div id="tradingview-chart" className="w-full h-full"></div>
        <TradingViewChart cryptoSymbol={crypto.symbol} timeframe={activeTimeframe} />
      </div>

      {/* Trading History Table - Single table without duplication */}
      <div className="bg-gray-950 flex-1">
        <div className="px-4 py-3">
          <div className="grid grid-cols-4 gap-4 text-xs text-gray-400 border-b border-gray-800 pb-2 mb-2">
            <div>Time</div>
            <div>Direction</div>
            <div>Price</div>
            <div>Quantity</div>
          </div>
          {tradeHistory.map((trade, index) => (
            <div key={index} className="grid grid-cols-4 gap-4 text-xs py-1">
              <div className="text-gray-400">{trade.time}</div>
              <div className={trade.direction === "Buy" ? "text-green-400" : "text-red-400"}>
                {trade.direction}
              </div>
              <div className="text-white">{trade.price}</div>
              <div className="text-white">{trade.quantity}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Buy Up / Buy Down Buttons with proper spacing */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 p-4">
        <div className="flex space-x-4">
          <Button 
            onClick={() => {
              setTradeDirection("up");
              setShowTradePopup(true);
            }}
            className="flex-1 bg-green-600 hover:bg-green-700 text-white py-6 text-lg font-bold rounded-lg"
          >
            Buy Up
          </Button>
          <Button 
            onClick={() => {
              setTradeDirection("down");
              setShowTradePopup(true);
            }}
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-6 text-lg font-bold rounded-lg"
          >
            Buy Down
          </Button>
        </div>
      </div>

      {/* Trading Popup - Exact match to uploaded image */}
      <Dialog open={showTradePopup} onOpenChange={setShowTradePopup}>
        <DialogContent className="bg-gray-900 text-white border-gray-700 max-w-md mx-auto p-0">
          <div className="p-6">
            {/* Header Section */}
            <div className="mb-6">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="text-gray-400 text-sm">Product Name</div>
                  <div className="text-white font-bold text-lg">{crypto.symbol}</div>
                </div>
                <div className="text-right">
                  <div className="text-gray-400 text-sm">Direction</div>
                  <div className={`text-lg font-bold ${tradeDirection === "up" ? "text-green-400" : "text-red-400"}`}>
                    {tradeDirection === "up" ? "Buy Up" : "Buy Down"}
                  </div>
                </div>
              </div>
              
              <div className="mb-4">
                <div className="text-gray-400 text-sm">Current price</div>
                <div className="text-white font-bold text-lg">{price}</div>
              </div>

              <div className="flex items-center space-x-2 mb-6">
                <span className="text-gray-400 text-sm">Trading Time</span>
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center text-white text-xs">
                  i
                </div>
              </div>
            </div>

            {/* Time Selection Cards */}
            <div className="grid grid-cols-3 gap-3 mb-6">
              {tradeDurations.map((duration) => (
                <button
                  key={duration.value}
                  onClick={() => setSelectedDuration(duration.value)}
                  className={`p-4 rounded-lg border text-center transition-all ${
                    selectedDuration === duration.value
                      ? "bg-blue-600 border-blue-500 text-white"
                      : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                  }`}
                >
                  <div className="text-blue-300 text-sm mb-1">Time</div>
                  <div className="text-lg font-bold mb-1">{duration.label}</div>
                  <div className="text-green-400 text-xs">
                    Scale: {duration.value === "60" ? "20.00%" : 
                           duration.value === "120" ? "30.00%" : "50.00%"}
                  </div>
                </button>
              ))}
            </div>

            {/* Available Balance */}
            <div className="flex justify-between items-center mb-4">
              <span className="text-white">Available Balance: {user?.availableBalance || user?.balance || "671902.6000"}</span>
              <span className="text-blue-400">Expected Earnings: 0</span>
            </div>

            {/* Amount Input */}
            <div className="mb-6">
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-4 bg-transparent border border-gray-600 rounded-lg text-white text-lg"
                placeholder="0"
              />
            </div>

            {/* Order Confirmation Button */}
            <Button
              onClick={handlePlaceTrade}
              disabled={placeTradeMutation.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 text-lg rounded-lg"
            >
              {placeTradeMutation.isPending ? "Processing..." : "Order Confirmation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}