import { useState } from "react";
import { useCreateBettingOrder } from "@/lib/api";
import { useCryptoPrices } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

const durations = [30, 60, 120, 180, 240];

export function TradingInterface() {
  const [selectedAsset, setSelectedAsset] = useState("BTC/USDT");
  const [amount, setAmount] = useState("");
  const [duration, setDuration] = useState(30);
  const [selectedDirection, setSelectedDirection] = useState<
    "Buy Up" | "Buy Down" | null
  >(null);
  const [validationError, setValidationError] = useState("");
  const { data: prices } = useCryptoPrices();
  const createOrder = useCreateBettingOrder();
  const { toast } = useToast();

  const handleTrade = (direction: "Buy Up" | "Buy Down") => {
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid trading amount",
        variant: "destructive",
      });
      return;
    }

    // Minimum order validation
    if (parseFloat(amount) < 1000) {
      setValidationError("Amount cannot be less than 1000");
      return;
    }

    // Clear validation error if amount is valid
    setValidationError("");

    const entryPrice = (prices as any)?.[selectedAsset]?.price || "0";

    // For "Actual" direction, always use the clicked direction (not admin override)
    createOrder.mutate(
      {
        asset: selectedAsset,
        amount,
        direction: "Actual", // Always send "Actual" for this interface
        actualDirection: direction, // Pass the actual clicked direction
        duration,
        entryPrice,
      },
      {
        onSuccess: () => {
          // Invalidate all relevant caches immediately
          queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
          queryClient.invalidateQueries({ queryKey: ["/api/betting-orders"] });
          queryClient.invalidateQueries({ queryKey: ["/api/users"] });

          toast({
            title: "Order placed",
            description: `${direction} order for ${selectedAsset} placed successfully`,
          });
          setAmount("");
        },
        onError: () => {
          toast({
            title: "Order failed",
            description: "Failed to place order. Please try again.",
            variant: "destructive",
          });
        },
      },
    );
  };

  const assets = prices ? Object.keys(prices) : ["BTC/USDT", "ETH/USDT"];

  return (
    <div className="p-4 sm:p-6 lg:p-8">
      <Card>
        <CardHeader>
          <CardTitle className="text-lg sm:text-xl lg:text-2xl">
            Quick Trade
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 sm:space-y-6">
          {/* Asset Selection */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Select Asset
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 sm:gap-3">
              {assets.map((asset) => {
                const priceData = (prices as any)?.[asset];
                const isSelected = selectedAsset === asset;
                return (
                  <button
                    key={asset}
                    onClick={() => setSelectedAsset(asset)}
                    className={`p-3 sm:p-4 rounded-lg border-2 transition-colors ${
                      isSelected
                        ? "border-primary bg-blue-50"
                        : "border-gray-300 hover:border-gray-400"
                    }`}
                  >
                    <div className="font-medium text-gray-900 text-sm sm:text-base">
                      {asset}
                    </div>
                    <div
                      className={`text-sm sm:text-base ${
                        priceData?.changeType === "positive"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      ${priceData?.price || "0"}
                    </div>
                    <div
                      className={`text-xs sm:text-sm ${
                        priceData?.changeType === "positive"
                          ? "text-success"
                          : "text-destructive"
                      }`}
                    >
                      {priceData?.change || "0%"}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Investment Amount
            </label>
            <Input
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => {
                setAmount(e.target.value);
                setValidationError(""); // Clear error when user types
              }}
              step="0.01"
              className="text-sm sm:text-base"
            />
            {validationError && (
              <p className="text-red-500 text-sm mt-1">{validationError}</p>
            )}
          </div>

          {/* Direction Selection */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Trading Direction
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              <Button
                onClick={() => setSelectedDirection("Buy Up")}
                variant={selectedDirection === "Buy Up" ? "default" : "outline"}
                className={`h-10 flex items-center justify-center ${
                  selectedDirection === "Buy Up"
                    ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                    : "border-green-500 text-green-500 hover:bg-green-50"
                }`}
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Buy Up
              </Button>
              <Button
                onClick={() => setSelectedDirection("Buy Down")}
                variant={
                  selectedDirection === "Buy Down" ? "default" : "outline"
                }
                className={`h-10 flex items-center justify-center ${
                  selectedDirection === "Buy Down"
                    ? "bg-green-500 hover:bg-green-600 text-white border-green-500"
                    : "border-green-500 text-green-500 hover:bg-green-50"
                }`}
              >
                <TrendingDown className="w-4 h-4 mr-2" />
                Buy Down
              </Button>
            </div>
          </div>

          {/* Duration Selection */}
          <div>
            <label className="block text-sm sm:text-base font-medium text-gray-700 mb-2">
              Trading Duration
            </label>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {durations.map((d) => {
                const isSelected = duration === d;
                const baseColor = "green";
                const colorClasses = selectedDirection
                  ? isSelected
                    ? "bg-green-500 border-green-500 text-white"
                    : "border-green-300 text-green-600 hover:border-green-400 hover:bg-green-50"
                  : isSelected
                    ? "border-primary bg-blue-50"
                    : "border-gray-300 hover:border-gray-400";

                return (
                  <button
                    key={d}
                    onClick={() => setDuration(d)}
                    className={`py-2 px-2 sm:px-3 text-xs sm:text-sm rounded-lg border-2 transition-colors ${colorClasses}`}
                  >
                    {d}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Place Order Button */}
          <div>
            <Button
              onClick={() =>
                selectedDirection && handleTrade(selectedDirection)
              }
              disabled={
                createOrder.isPending ||
                !selectedDirection ||
                !amount ||
                parseFloat(amount) < 1000
              }
              className="w-full h-16 text-lg font-medium bg-green-500 hover:bg-green-600 text-white"
            >
              {createOrder.isPending ? "Placing Order..." : "Submit Order"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
