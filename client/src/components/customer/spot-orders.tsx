import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Home,
  TrendingUp,
  TrendingDown,
  X,
  Menu,
  ChevronDown,
} from "lucide-react";
import { useLocation } from "wouter";
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

const timeframes = ["1M", "5M", "30M", "1H", "4H", "1D"];

interface CryptoPriceData {
  price: string;
  change: string;
}

interface CryptoPrices {
  [key: string]: CryptoPriceData;
}

interface Candle {
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

interface SpotOrdersProps {
  selectedCoin?: string | null;
  onNavigateToOrders?: () => void;
}

export function SpotOrders({
  selectedCoin,
  onNavigateToOrders,
}: SpotOrdersProps) {
  const [, setLocation] = useLocation();
  const [activeTimeframe, setActiveTimeframe] = useState("5M");
  const [quantity, setQuantity] = useState("0");
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showTradePopup, setShowTradePopup] = useState(false);
  const [tradeDirection, setTradeDirection] = useState<"up" | "down">("up");
  const [selectedDuration, setSelectedDuration] = useState("60");
  const { user } = useAuth();
  const { toast } = useToast();

  // Set crypto based on selectedCoin parameter or default to BTC
  const [selectedCrypto, setSelectedCrypto] = useState(
    selectedCoin ? selectedCoin.replace("/USDT", "") : "BTC",
  );

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
    const baseCurrency = newCurrency.split("/")[0];
    setSelectedCrypto(baseCurrency);
    // Don't navigate, just update the currency in place
    // This allows the popup to show the updated currency
  };

  const handleHomeClick = () => {
    setLocation("/customer");
  };

  const handleSpotOrdersClick = () => {
    if (onNavigateToOrders) {
      onNavigateToOrders();
    } else {
      setLocation("/customer?tab=orders");
    }
  };

  const tradeDurations = [
    { value: "60", label: "60S", seconds: 60 },
    { value: "120", label: "120S", seconds: 120 },
    { value: "180", label: "180S", seconds: 180 },
  ];
  const [tradeHistory, setTradeHistory] = useState([
    {
      time: "12:49:08",
      direction: "Buy",
      price: "115348.00",
      quantity: "0.0001",
    },
    {
      time: "12:49:11",
      direction: "Buy",
      price: "115355.00",
      quantity: "0.0001",
    },
    {
      time: "12:49:06",
      direction: "Buy",
      price: "115344.00",
      quantity: "0.0001",
    },
    {
      time: "12:49:13",
      direction: "Buy",
      price: "115350.00",
      quantity: "0.0001",
    },
    {
      time: "12:49:07",
      direction: "Buy",
      price: "115344.00",
      quantity: "0.0001",
    },
    {
      time: "12:49:33",
      direction: "Buy",
      price: "115367.0700",
      quantity: "0.2000",
    },
    {
      time: "12:49:13",
      direction: "Buy",
      price: "115362.5100",
      quantity: "0.0050",
    },
    {
      time: "12:49:07",
      direction: "Buy",
      price: "115345.00",
      quantity: "0.0001",
    },
    {
      time: "12:00:31",
      direction: "Sell",
      price: "115365.9900",
      quantity: "0.0001",
    },
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const queryClient = useQueryClient();

  // Get real-time crypto prices
  const { data: cryptoPrices = {} } = useQuery<CryptoPrices>({
    queryKey: ["/api/crypto-prices"],
    refetchInterval: 5000,
  });

  // Get price data for selected crypto or default to BTC
  const cryptoSymbol = `${selectedCrypto}/USDT`;
  const btcPrice =
    cryptoPrices[cryptoSymbol]?.price ||
    cryptoPrices["BTC/USDT"]?.price ||
    "115044.00";
  const btcChange =
    cryptoPrices[cryptoSymbol]?.change ||
    cryptoPrices["BTC/USDT"]?.change ||
    "+2.84";

  // Update current time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Trading mutation
  const placeTrade = useMutation({
    mutationFn: async (data: {
      asset: string;
      direction: string;
      amount: number;
      duration: number;
      entryPrice: string;
      profitLoss: number;
    }) => {
      const res = await apiRequest("POST", "/api/betting-orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Trade Placed Successfully",
        description: "Your trading order has been placed.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });

      // Navigate to pending orders using React routing to prevent logout
      if (onNavigateToOrders) {
        setTimeout(() => {
          onNavigateToOrders();
        }, 1000);
      } else {
        // Fallback: use React router navigation
        setTimeout(() => {
          setLocation("/customer");
        }, 1000);
      }
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

  const handleTradeClick = (direction: "up" | "down") => {
    setTradeDirection(direction);
    setShowTradePopup(true);
  };

  const handlePlaceTrade = () => {
    const duration = tradeDurations.find((d) => d.value === selectedDuration);
    if (!duration || !user) return;

    // Calculate profit/loss based on direction and duration
    const amount = parseFloat(quantity);
    let profitLoss = 0;

    if (tradeDirection === "up") {
      // Buy Up - Calculate profit
      if (selectedDuration === "60")
        profitLoss = amount * 0.2; // 20% profit
      else if (selectedDuration === "120")
        profitLoss = amount * 0.3; // 30% profit
      else if (selectedDuration === "180") profitLoss = amount * 0.5; // 50% profit
    } else {
      // Buy Down - Calculate loss (negative)
      if (selectedDuration === "60")
        profitLoss = amount * -0.2; // 20% loss
      else if (selectedDuration === "120")
        profitLoss = amount * -0.3; // 30% loss
      else if (selectedDuration === "180") profitLoss = amount * -0.5; // 50% loss
    }

    const currentPrice =
      cryptoPrices[`${selectedCrypto}/USDT`]?.price ||
      cryptoPrices["BTC/USDT"]?.price ||
      "115044.00";

    const orderData = {
      asset: `${selectedCrypto}/USDT`,
      direction: tradeDirection === "up" ? "Buy Up" : "Buy Down",
      amount: parseFloat(quantity),
      duration: duration.seconds, // Send actual seconds: 60, 120, or 180
      entryPrice: currentPrice,
      profitLoss: profitLoss,
    };

    console.log("Frontend sending order data:", orderData);
    console.log("Selected crypto:", selectedCrypto);
    console.log("Asset being sent:", orderData.asset);

    placeTrade.mutate(orderData);

    setShowTradePopup(false);
  };

  // Advanced candlestick chart drawing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas size
    canvas.width = canvas.offsetWidth * window.devicePixelRatio;
    canvas.height = canvas.offsetHeight * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const width = canvas.offsetWidth;
    const height = canvas.offsetHeight;

    // Dark background gradient
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, "#0a0e27");
    gradient.addColorStop(1, "#1a1e37");
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);

    // Grid lines
    ctx.strokeStyle = "#252841";
    ctx.lineWidth = 0.5;

    // Horizontal grid lines
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }

    // Vertical grid lines
    for (let i = 0; i <= 20; i++) {
      const x = (width / 20) * i;
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();
    }

    // Price scale on right
    ctx.fillStyle = "#8892b0";
    ctx.font = "10px monospace";
    const basePrice = parseFloat(btcPrice);
    for (let i = 0; i <= 10; i++) {
      const y = (height / 10) * i;
      const price = basePrice + (5 - i) * 20; // Price range
      ctx.fillText(price.toFixed(2), width - 60, y + 3);
    }

    // Generate realistic candlestick data
    const candles: Candle[] = [];
    const numCandles = 50;
    let price = basePrice;

    for (let i = 0; i < numCandles; i++) {
      const volatility = 0.02;
      const change = (Math.random() - 0.5) * volatility * price;
      const open = price;
      const close = price + change;
      const high = Math.max(open, close) + Math.random() * 10;
      const low = Math.min(open, close) - Math.random() * 10;

      candles.push({
        open,
        high,
        low,
        close,
        volume: Math.random() * 1000 + 500,
      });
      price = close;
    }

    // Draw candlesticks
    const candleWidth = (width / numCandles) * 0.8;
    const priceRange =
      Math.max(...candles.map((c) => c.high)) -
      Math.min(...candles.map((c) => c.low));
    const chartHeight = height * 0.7; // Leave space for volume

    candles.forEach((candle, i) => {
      const x = (width / numCandles) * i + candleWidth / 4;
      const bodyTop =
        chartHeight -
        ((candle.open - Math.min(...candles.map((c) => c.low))) / priceRange) *
          chartHeight;
      const bodyBottom =
        chartHeight -
        ((candle.close - Math.min(...candles.map((c) => c.low))) / priceRange) *
          chartHeight;
      const wickTop =
        chartHeight -
        ((candle.high - Math.min(...candles.map((c) => c.low))) / priceRange) *
          chartHeight;
      const wickBottom =
        chartHeight -
        ((candle.low - Math.min(...candles.map((c) => c.low))) / priceRange) *
          chartHeight;

      const isGreen = candle.close > candle.open;
      ctx.fillStyle = isGreen ? "#26a69a" : "#ef5350";
      ctx.strokeStyle = isGreen ? "#26a69a" : "#ef5350";

      // Draw wick
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x + candleWidth / 2, wickTop);
      ctx.lineTo(x + candleWidth / 2, wickBottom);
      ctx.stroke();

      // Draw body
      ctx.fillRect(
        x,
        Math.min(bodyTop, bodyBottom),
        candleWidth,
        Math.abs(bodyTop - bodyBottom),
      );

      // Draw volume bars
      const volumeHeight = (candle.volume / 1500) * (height - chartHeight);
      ctx.fillStyle = isGreen ? "#26a69a40" : "#ef535040";
      ctx.fillRect(x, chartHeight, candleWidth, volumeHeight);
    });

    // Current price line
    const currentPriceY =
      chartHeight -
      ((basePrice - Math.min(...candles.map((c) => c.low))) / priceRange) *
        chartHeight;
    ctx.strokeStyle = "#ffd700";
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(0, currentPriceY);
    ctx.lineTo(width, currentPriceY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Price label
    ctx.fillStyle = "#ffd700";
    ctx.fillRect(width - 80, currentPriceY - 10, 75, 20);
    ctx.fillStyle = "#000";
    ctx.font = "bold 10px monospace";
    ctx.fillText(basePrice.toFixed(2), width - 75, currentPriceY + 3);

    // TradingView watermark
    ctx.fillStyle = "#ffffff20";
    ctx.font = "12px Arial";
    ctx.fillText("Chart by TradingView", 10, height - 20);
  }, [btcPrice, activeTimeframe]);

  const handleTrade = (direction: "Buy Up" | "Buy Down") => {
    const amount = parseFloat(quantity);
    if (!amount || amount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid trade amount",
        variant: "destructive",
      });
      return;
    }

    placeTrade.mutate({
      direction,
      amount,
      duration: 180, // 3 minutes default
    });
  };

  return (
    <div className="h-screen w-screen bg-gray-900 text-white flex flex-col overflow-hidden">
      {/* Top Header */}
      <div className="bg-gray-900 px-4 py-2 flex items-center justify-between border-b border-gray-700">
        <div className="flex items-center space-x-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-gray-700 flex items-center space-x-1 px-2 py-1 h-auto font-medium text-sm"
              >
                <span>{selectedCrypto}/USDT</span>
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
                  const isPositive = !change.toString().startsWith("-");

                  return (
                    <DropdownMenuItem
                      key={crypto.symbol}
                      className="text-white hover:bg-gray-800 cursor-pointer flex justify-between items-center px-3 py-2 focus:bg-gray-800 border-none"
                      onClick={() => handleCurrencyChange(crypto.symbol)}
                    >
                      <span className="text-sm font-medium text-white">
                        {crypto.symbol}
                      </span>
                      <div className="text-right">
                        <div
                          className={`text-sm font-medium ${isPositive ? "text-green-400" : "text-red-400"}`}
                        >
                          {formatPrice(price)}
                        </div>
                        <div
                          className={`text-xs ${isPositive ? "text-green-400" : "text-red-400"}`}
                        >
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
          <div className="text-white font-bold">{selectedCrypto}/USDT</div>
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

      {/* Price and Stats Display */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-700">
        <div className="flex justify-between items-start">
          <div>
            <div className="text-2xl font-bold text-red-400 font-mono">
              {parseFloat(btcPrice).toFixed(4)}
            </div>
            <div className="text-sm text-red-400">{btcChange}%</div>
          </div>
          <div className="text-center text-xs text-gray-400">
            <div>24H High: 116305.3500</div>
            <div>24H Low: 115366.9629</div>
          </div>
          <div className="text-right text-xs text-gray-400">
            <div>24H Volume: 152.43M</div>
            <div>24H Turnover: 1.31K</div>
          </div>
        </div>
      </div>

      {/* Timeframe Tabs */}
      <div className="bg-gray-800 px-4 py-2 border-b border-gray-700">
        <div className="flex space-x-1">
          {timeframes.map((tf) => (
            <button
              key={tf}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-4 py-2 text-sm rounded transition-colors ${
                activeTimeframe === tf
                  ? "bg-blue-600 text-white"
                  : "text-gray-400 hover:text-white hover:bg-gray-700"
              }`}
            >
              {tf}
            </button>
          ))}
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 p-4">
        <canvas
          ref={canvasRef}
          className="w-full h-full rounded-lg"
          style={{
            background: "linear-gradient(180deg, #0a0e27 0%, #1a1e37 100%)",
          }}
        />
      </div>

      {/* Trading Panel */}
      <div className="bg-gray-800 border-t border-gray-700">
        {/* Trade Table Header */}
        <div className="grid grid-cols-4 gap-4 px-4 py-2 text-sm text-gray-400 border-b border-gray-700">
          <div>Time</div>
          <div>Direction</div>
          <div>Price</div>
          <div>Quantity</div>
        </div>

        {/* Dynamic Trade Rows */}
        <div className="max-h-32 overflow-y-auto">
          {tradeHistory.map((trade, index) => (
            <div
              key={index}
              className="grid grid-cols-4 gap-4 px-4 py-1 text-sm text-white"
            >
              <div>{trade.time}</div>
              <div
                className={
                  trade.direction === "Buy" ? "text-green-400" : "text-red-400"
                }
              >
                {trade.direction}
              </div>
              <div className="font-mono">{trade.price}</div>
              <div className="font-mono">{trade.quantity}</div>
            </div>
          ))}
        </div>

        {/* Bottom Buy/Sell Buttons */}
        <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4">
          <div className="flex space-x-4">
            <Button
              onClick={() => handleTradeClick("up")}
              disabled={placeTrade.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg"
            >
              <TrendingUp className="w-5 h-5 mr-2" />
              Buy Up
            </Button>
            <Button
              onClick={() => handleTradeClick("down")}
              disabled={placeTrade.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg"
            >
              <TrendingDown className="w-5 h-5 mr-2" />
              Buy Down
            </Button>
          </div>
        </div>
      </div>

      {/* Trade Time Selection Popup - Matching Screenshot Design */}
      <Dialog open={showTradePopup} onOpenChange={setShowTradePopup}>
        <DialogContent className="sm:max-w-lg bg-gray-900 text-white border-gray-700">
          <div className="space-y-6">
            {/* Header with Product Info */}
            <div className="border-b border-gray-700 pb-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="text-sm text-gray-400">Product Name</div>
                  <div className="text-lg font-bold text-white">
                    {selectedCrypto}/USDT
                  </div>
                  <div className="text-sm text-gray-400 mt-1">Direction</div>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-400">Current price</div>
                  <div className="text-lg font-bold text-white">
                    {cryptoPrices[`${selectedCrypto}/USDT`]?.price ||
                      cryptoPrices["BTC/USDT"]?.price ||
                      "115044.00"}
                  </div>
                </div>
              </div>
            </div>

            {/* Trading Time Selection */}
            <div>
              <div className="flex items-center mb-4">
                <div className="text-sm text-gray-400 mr-2">Trading Time</div>
                <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {tradeDurations.map((duration) => (
                  <button
                    key={duration.value}
                    onClick={() => setSelectedDuration(duration.value)}
                    className={`p-4 rounded-lg border-2 transition-all ${
                      selectedDuration === duration.value
                        ? "bg-blue-600 border-blue-500 text-white"
                        : "bg-gray-800 border-gray-600 text-gray-300 hover:bg-gray-700"
                    }`}
                  >
                    <div className="text-center">
                      <div className="text-xs text-gray-400">Time</div>
                      <div className="text-lg font-bold">{duration.label}</div>
                      <div className="text-xs text-green-400">
                        Scale:
                        {duration.value === "60"
                          ? "20"
                          : duration.value === "120"
                            ? "30"
                            : "50"}
                        %
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Balance and Expected Earnings */}
            <div className="border-t border-gray-700 pt-4">
              <div className="flex justify-between items-center mb-4">
                <div className="text-sm text-gray-400">
                  Available Balance: {user?.availableBalance || "0"}
                </div>
                <div className="text-sm text-blue-400">
                  Billing Time: {selectedDuration}s
                </div>
              </div>

              {/* Hidden field to capture selected cryptocurrency */}
              <input type="hidden" value={`${selectedCrypto}/USDT`} readOnly />

              {/* Amount Input */}
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                className="w-full p-3 bg-gray-800 border border-gray-600 rounded-lg text-white placeholder-gray-400"
                placeholder="0"
              />
            </div>

            {/* Order Confirmation Button */}
            <Button
              onClick={handlePlaceTrade}
              disabled={placeTrade.isPending}
              className="w-full bg-yellow-500 hover:bg-yellow-600 text-black font-bold py-4 rounded-lg text-lg"
            >
              {placeTrade.isPending ? "Processing..." : "Order Confirmation"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
