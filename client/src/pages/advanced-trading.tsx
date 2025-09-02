import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

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

export default function AdvancedTrading() {
  const [, setLocation] = useLocation();
  const [activeTimeframe, setActiveTimeframe] = useState("5M");
  const [quantity, setQuantity] = useState("9000");
  const [currentTime, setCurrentTime] = useState(new Date());
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
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Get real-time crypto prices
  const { data: cryptoPrices = {} } = useQuery<CryptoPrices>({
    queryKey: ["/api/crypto-prices"],
    refetchInterval: 5000,
  });

  const btcPrice = cryptoPrices["BTC/USDT"]?.price || "115044.00";
  const btcChange = cryptoPrices["BTC/USDT"]?.change || "+2.84";

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
      direction: string;
      amount: number;
      duration: number;
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
    },
    onError: (error: any) => {
      toast({
        title: "Trade Failed",
        description: error.message || "Failed to place trade",
        variant: "destructive",
      });
    },
  });

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
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/customer")}
            className="text-white hover:bg-gray-700"
          >
            <Home className="w-4 h-4" />
          </Button>
          <div className="text-white text-sm">BTC/USDT</div>
        </div>
        <div className="text-center">
          <div className="text-white font-bold">BTC/USDT</div>
        </div>
        <div className="text-right">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setLocation("/spot-orders")}
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
              onClick={() => handleTrade("Buy Up")}
              disabled={placeTrade.isPending}
              className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-lg text-lg"
            >
              Buy Up
            </Button>
            <Button
              onClick={() => handleTrade("Buy Down")}
              disabled={placeTrade.isPending}
              className="flex-1 bg-red-600 hover:bg-red-700 text-white font-bold py-4 rounded-lg text-lg"
            >
              Buy down
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
