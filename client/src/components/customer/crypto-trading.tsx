import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ArrowLeft, Menu } from "lucide-react";
import { useCryptoPrices } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import "@/types/tradingview.d.ts";

interface CryptoTradingProps {
  currency: string;
  onBack: () => void;
}

export function CryptoTrading({ currency, onBack }: CryptoTradingProps) {
  const { data: cryptoPrices } = useCryptoPrices();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedTime, setSelectedTime] = useState("60S");
  const [direction, setDirection] = useState<"up" | "down" | null>(null);
  const [amount, setAmount] = useState("");
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [selectedCurrency, setSelectedCurrency] = useState(currency + "/USDT");

  const timeOptions = [
    { label: "60S", value: "60S", rate: "Scale:20.00%" },
    { label: "120S", value: "120S", rate: "Scale:30.00%" },
    { label: "180S", value: "180S", rate: "Scale:50.00%" }
  ];

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
    setSelectedCurrency(newCurrency);
    // We could trigger an onCurrencyChange callback here if needed
  };

  // Extract base currency from selectedCurrency for price lookup
  const baseCurrency = selectedCurrency.split('/')[0];
  const currentPrice = (cryptoPrices as any)?.[baseCurrency + '/USDT']?.price || "115365.9629";
  const priceChange = (cryptoPrices as any)?.[baseCurrency + '/USDT']?.change || "-2.43";

  const createOrderMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/betting-orders", data);
      return res.json();
    },
    onSuccess: () => {
      toast({
        title: "Order Placed",
        description: "Your trading order has been placed successfully.",
      });
      setAmount("");
      setDirection(null);
      setShowOrderForm(false);
      // Only invalidate betting orders, let auth refresh on its own schedule
      queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
      // Delay auth refresh slightly to avoid conflicts
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }, 1000);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to place order",
        variant: "destructive",
      });
    },
  });

  const handleOrderSubmit = () => {
    if (!amount || !direction || !selectedTime) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    const orderAmount = parseFloat(amount);
    const userBalance = parseFloat(user?.availableBalance || "0");

    if (orderAmount > userBalance) {
      toast({
        title: "Insufficient Balance",
        description: "You don't have enough available balance for this order",
        variant: "destructive",
      });
      return;
    }

    createOrderMutation.mutate({
      asset: selectedCurrency,
      amount: orderAmount,
      direction: direction === "up" ? "Buy Up" : "Buy Down",
      duration: parseInt(selectedTime.replace('S', '')),
      entryPrice: parseFloat(currentPrice),
    });
  };

  const handleDirectionSelect = (dir: "up" | "down") => {
    setDirection(dir);
    setShowOrderForm(true);
  };

  const expectedEarnings = amount ? 
    (parseFloat(amount) * (selectedTime === "60S" ? 0.2 : selectedTime === "120S" ? 0.3 : 0.5)).toFixed(2) : "0";

  // TradingView Widget Effect
  useEffect(() => {
    if (!window.TradingView) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.onload = () => {
        createTradingViewWidget();
      };
      document.head.appendChild(script);
    } else {
      createTradingViewWidget();
    }

    function createTradingViewWidget() {
      if (window.TradingView) {
        new window.TradingView.widget({
          autosize: true,
          symbol: `BINANCE:${baseCurrency}USDT`,
          interval: "1",
          theme: "dark",
          style: "1",
          locale: "en",
          toolbar_bg: "#1a1a1a",
          enable_publishing: false,
          hide_side_toolbar: false,
          container_id: "tradingview_chart"
        });
      }
    }
  }, [selectedCurrency, baseCurrency]);

  // Mock trading data that matches the image exactly
  const tradingData = [
    { time: "12:49:08", direction: "Buy", price: "115348.00", quantity: "0.0001" },
    { time: "12:49:11", direction: "Buy", price: "115355.00", quantity: "0.0001" },
    { time: "12:49:06", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:15", direction: "Buy", price: "115350.00", quantity: "0.0001" },
    { time: "12:49:07", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:23", direction: "Buy", price: "115367.5700", quantity: "0.2002" },
    { time: "12:49:13", direction: "Buy", price: "115362.5100", quantity: "0.0020" },
    { time: "12:49:07", direction: "Buy", price: "115345.00", quantity: "0.0001" },
  ];

  const moreData = [
    { time: "12:49:08", direction: "Buy", price: "115348.00", quantity: "0.0001" },
    { time: "12:49:11", direction: "Buy", price: "115355.00", quantity: "0.0001" },
    { time: "12:49:06", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:15", direction: "Buy", price: "115350.00", quantity: "0.0001" },
    { time: "12:49:07", direction: "Buy", price: "115344.00", quantity: "0.0001" },
    { time: "12:49:23", direction: "Buy", price: "115367.5700", quantity: "0.2002" },
    { time: "12:49:13", direction: "Buy", price: "115362.5100", quantity: "0.0020" },
    { time: "12:49:07", direction: "Buy", price: "115345.00", quantity: "0.0001" },
    { time: "12:49:02", direction: "Sell", price: "115365.3900", quantity: "0.0001" },
  ];

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="bg-gray-900 px-4 py-3 flex items-center justify-between border-b border-gray-800">
        <div className="flex items-center gap-4">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="text-white hover:bg-gray-800 flex items-center space-x-1 px-2 py-1 h-auto font-medium text-lg"
              >
                <span>{selectedCurrency}</span>
                <Menu className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-black border-gray-700">
              <div className="bg-black text-white max-h-96 overflow-y-auto">
                <div className="px-3 py-2 text-xs text-red-500 font-medium border-b border-gray-800 bg-gray-900">
                  Spot
                </div>
                {cryptoOptions.map((crypto) => {
                  const price = (cryptoPrices as any)?.[crypto.symbol]?.price || "0.00";
                  const change = (cryptoPrices as any)?.[crypto.symbol]?.change || "0.00";
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
          <h1 className="text-lg font-medium">{selectedCurrency}</h1>
        </div>
        <div className="text-right flex items-center gap-3">
          <Button
            onClick={() => window.location.href = '/order-record'}
            variant="ghost"
            size="sm"
            className="text-blue-400 hover:bg-blue-400/10 px-3 py-1.5 text-sm border border-blue-400/30 rounded-md"
          >
            Order
          </Button>
          <div className="text-sm text-gray-400">Spot Orders →</div>
        </div>
      </div>

      {/* Price Info */}
      <div className="bg-gray-900 px-4 py-3 border-b border-gray-800">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-sm text-gray-400">{currency}</div>
            <div className="text-2xl font-medium text-red-400">{currentPrice}</div>
            <div className="text-sm text-red-400">{priceChange}%</div>
          </div>
          <div className="text-right space-y-1">
            <div className="text-xs text-gray-400">24H High: 118395.3500</div>
            <div className="text-xs text-gray-400">24H Low: 115365.9629</div>
            <div className="text-xs text-gray-400">24H Volume: 152.43M</div>
            <div className="text-xs text-gray-400">24H Turnover: 1.31K</div>
          </div>
        </div>
      </div>

      {/* Chart Area with Time Controls */}
      <div className="bg-gray-900 h-80 relative border-b border-gray-800">
        <div className="absolute top-4 left-4 z-10 flex space-x-2">
          <button className="text-xs text-gray-400 px-2 py-1 hover:text-white">1M</button>
          <button className="text-xs bg-blue-600 text-white px-2 py-1 rounded">5M</button>
          <button className="text-xs text-gray-400 px-2 py-1 hover:text-white">30M</button>
          <button className="text-xs text-gray-400 px-2 py-1 hover:text-white">1H</button>
          <button className="text-xs text-gray-400 px-2 py-1 hover:text-white">4H</button>
          <button className="text-xs text-gray-400 px-2 py-1 hover:text-white">1D</button>
        </div>
        
        <div className="absolute top-4 right-4 z-10 text-xs text-gray-400">
          • Loading...
        </div>
        
        <div 
          id="tradingview_chart" 
          className="w-full h-full"
        ></div>
      </div>

      {/* Trading Data Table */}
      <div className="bg-gray-800 border-t border-gray-700">
        <div className="grid grid-cols-4 text-xs text-gray-400 px-4 py-3 border-b border-gray-700">
          <div>Time</div>
          <div>Direction</div>
          <div className="text-right">Price</div>
          <div className="text-right">Quantity</div>
        </div>
        <div className="px-4 py-2 space-y-1 max-h-64 overflow-y-auto">
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115074.4300</div>
            <div className="text-right">0.0002</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:16</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115060.0100</div>
            <div className="text-right">0.0001</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115069.2000</div>
            <div className="text-right">0.0075</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115072.00</div>
            <div className="text-right">0.0001</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115078.7800</div>
            <div className="text-right">0.0041</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115066.00</div>
            <div className="text-right">0.0001</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:31</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115042.9700</div>
            <div className="text-right">0.0002</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:31</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115048.00</div>
            <div className="text-right">0.0003</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:35</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115069.00</div>
            <div className="text-right">0.0001</div>
          </div>
          <div className="grid grid-cols-4 text-xs text-white">
            <div>14:47:41</div>
            <div className="text-green-400">Buy</div>
            <div className="text-right">115060.00</div>
            <div className="text-right">0.0002</div>
          </div>
        </div>
      </div>

      {/* Spacer for bottom buttons */}
      <div className="flex-1 bg-gray-900 pb-24"></div>

      {/* Bottom Buttons - Fixed position exactly like in the image */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 p-4 flex space-x-4 border-t border-gray-800">
        <Button
          onClick={() => handleDirectionSelect("up")}
          className="flex-1 bg-green-600 hover:bg-green-700 text-white py-4 text-lg font-semibold rounded-3xl"
          disabled={createOrderMutation.isPending}
        >
          Buy Up
        </Button>
        <Button
          onClick={() => handleDirectionSelect("down")}
          className="flex-1 bg-red-600 hover:bg-red-700 text-white py-4 text-lg font-semibold rounded-3xl"
          disabled={createOrderMutation.isPending}
        >
          Buy down
        </Button>
      </div>

      {/* Order Form Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end z-50">
          <div className="bg-gray-800 w-full rounded-t-3xl p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                onClick={() => setShowOrderForm(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </Button>
            </div>

            <div className="space-y-6">
              {/* Product Name */}
              <div className="flex justify-between items-center">
                <div>
                  <div className="text-sm text-gray-400 mb-1">Product Name</div>
                  <div className="text-white font-medium">{selectedCurrency}</div>
                </div>
                <div>
                  <div className="text-sm text-gray-400 mb-1">Current price</div>
                  <div className="text-white font-bold text-lg">{parseFloat(currentPrice).toLocaleString()}</div>
                </div>
              </div>

              {/* Direction section removed - no buttons */}

              {/* Trading Time */}
              <div>
                <div className="text-sm text-gray-400 mb-3 flex items-center">
                  Trading Time 
                  <div className="ml-2 w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 bg-white rounded-full"></div>
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  {timeOptions.map((option) => (
                    <Button
                      key={option.value}
                      onClick={() => setSelectedTime(option.value)}
                      className={`p-4 rounded-lg border ${
                        selectedTime === option.value
                          ? "bg-blue-600 border-blue-600 text-white"
                          : "bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600"
                      }`}
                    >
                      <div className="text-center">
                        <div className="text-xs text-gray-400">Time</div>
                        <div className="font-bold text-lg">{option.label}</div>
                        <div className="text-xs text-green-400">{option.rate}</div>
                      </div>
                    </Button>
                  ))}
                </div>
              </div>

              {/* Available Balance and Billing Time */}
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-400">Available Balance: {parseFloat(user?.availableBalance || "0").toLocaleString()}</span>
                <span className="text-blue-400">Billing Time: {selectedTime.replace('S', 's')}</span>
              </div>

              {/* Investment Amount */}
              <div>
                <Input
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="9000"
                  className="text-lg bg-gray-700 border-gray-600 text-white h-14 text-center font-bold"
                />
              </div>

              {/* Order Confirmation Button */}
              <Button
                onClick={handleOrderSubmit}
                disabled={createOrderMutation.isPending || !amount}
                className="w-full py-4 text-lg font-semibold bg-yellow-500 hover:bg-yellow-600 text-black rounded-lg"
              >
                {createOrderMutation.isPending ? "Processing..." : "Order Confirmation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}