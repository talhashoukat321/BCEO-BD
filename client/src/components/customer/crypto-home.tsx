import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ChevronRight, TrendingUp, TrendingDown, RotateCcw, ChevronLeft, RefreshCw } from "lucide-react";
import { useCryptoPrices } from "@/lib/api";
import { useAuth } from "@/hooks/use-auth";
import { useQueryClient } from "@tanstack/react-query";
import cryptoExchangeImg from "@assets/1000000575770863_1751631239841.png";
import paymentCardImg from "@assets/1000001387435998_1751631239844.jpg";
import bannerTradingImg from "@assets/ats_middle_1751631513890.jpg";

interface CryptoHomeProps {
  onSelectCurrency: (currency: string) => void;
  onNavigateToProfile?: () => void;
}

export function CryptoHome({ onSelectCurrency, onNavigateToProfile }: CryptoHomeProps) {
  const { data: cryptoPrices } = useCryptoPrices();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [cryptoSlideIndex, setCryptoSlideIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Slider images
  const sliderImages = [
    cryptoExchangeImg,  // 1st image - Crypto Exchange
    paymentCardImg      // 2nd image - Payment Card (was 3rd)
  ];

  // Auto-slide every 5 seconds for banner
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % sliderImages.length);
    }, 5000);

    return () => clearInterval(interval);
  }, [sliderImages.length]);

  // Auto-refresh balance every 2 minutes (120 seconds)
  useEffect(() => {
    const balanceRefreshInterval = setInterval(() => {
      if (user) {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
      }
    }, 120000); // 2 minutes

    return () => clearInterval(balanceRefreshInterval);
  }, [user, queryClient]);

  // Manual refresh balance function
  const handleManualRefresh = async () => {
    if (user && !isRefreshing) {
      setIsRefreshing(true);
      try {
        await queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        // Add a small delay to show the refresh animation
        setTimeout(() => {
          setIsRefreshing(false);
        }, 500);
      } catch (error) {
        setIsRefreshing(false);
      }
    }
  };



  const cryptoData = [
    {
      symbol: "BTC/USDT",
      name: "Bitcoin",
      price: cryptoPrices?.["BTC/USD"]?.price || "42150.00",
      change: cryptoPrices?.["BTC/USD"]?.change || "+2.4%",
      isPositive: cryptoPrices?.["BTC/USD"]?.change ? !cryptoPrices["BTC/USD"].change.startsWith('-') : true,
      icon: "₿",
      color: "orange"
    },
    {
      symbol: "ETH/USDT", 
      name: "Ethereum",
      price: cryptoPrices?.["ETH/USD"]?.price || "2850.00",
      change: cryptoPrices?.["ETH/USD"]?.change || "-1.2%",
      isPositive: cryptoPrices?.["ETH/USD"]?.change ? !cryptoPrices["ETH/USD"].change.startsWith('-') : false,
      icon: "⧫",
      color: "blue"
    },
    {
      symbol: "SUP/USDT",
      name: "SuperCoin", 
      price: cryptoPrices?.["SUP/USD"]?.price || "0.18",
      change: cryptoPrices?.["SUP/USD"]?.change || "-1.3%",
      isPositive: cryptoPrices?.["SUP/USD"]?.change ? !cryptoPrices["SUP/USD"].change.startsWith('-') : false,
      icon: "Ⓢ",
      color: "yellow"
    },

    {
      symbol: "LTC/USDT",
      name: "Litecoin",
      price: cryptoPrices?.["LTC/USD"]?.price || "412.89",
      change: cryptoPrices?.["LTC/USD"]?.change || "+2.1%",
      isPositive: cryptoPrices?.["LTC/USD"]?.change ? !cryptoPrices["LTC/USD"].change.startsWith('-') : true,
      icon: "Ł",
      color: "gray"
    },

    {
      symbol: "CHZ/USDT",
      name: "Chiliz",
      price: cryptoPrices?.["CHZ/USD"]?.price || "0.03457",
      change: cryptoPrices?.["CHZ/USD"]?.change || "-2.59%",
      isPositive: cryptoPrices?.["CHZ/USD"]?.change ? !cryptoPrices["CHZ/USD"].change.startsWith('-') : false,
      icon: "⚽",
      color: "red"
    },
    {
      symbol: "BCH/USDT",
      name: "Bitcoin Cash",
      price: cryptoPrices?.["BCH/USD"]?.price || "502.8",
      change: cryptoPrices?.["BCH/USD"]?.change || "+0.50%",
      isPositive: cryptoPrices?.["BCH/USD"]?.change ? !cryptoPrices["BCH/USD"].change.startsWith('-') : true,
      icon: "₿",
      color: "green"
    },

    {
      symbol: "TRX/USDT",
      name: "TRON",
      price: cryptoPrices?.["TRX/USD"]?.price || "0.2712",
      change: cryptoPrices?.["TRX/USD"]?.change || "+0.15%",
      isPositive: cryptoPrices?.["TRX/USD"]?.change ? !cryptoPrices["TRX/USD"].change.startsWith('-') : true,
      icon: "⬢",
      color: "green"
    },
    {
      symbol: "ETC/USDT",
      name: "Ethereum Classic",
      price: cryptoPrices?.["ETC/USD"]?.price || "16.19",
      change: cryptoPrices?.["ETC/USD"]?.change || "-2.00%",
      isPositive: cryptoPrices?.["ETC/USD"]?.change ? !cryptoPrices["ETC/USD"].change.startsWith('-') : false,
      icon: "⧫",
      color: "green"
    },
    {
      symbol: "BTS/USDT",
      name: "BitShares",
      price: cryptoPrices?.["BTS/USD"]?.price || "0.0045",
      change: cryptoPrices?.["BTS/USD"]?.change || "+0.50%",
      isPositive: cryptoPrices?.["BTS/USD"]?.change ? !cryptoPrices["BTS/USD"].change.startsWith('-') : true,
      icon: "◆",
      color: "blue"
    }
  ];

  // Auto-slide crypto boxes every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setCryptoSlideIndex((prev) => (prev + 1) % cryptoData.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [cryptoData.length]);

  return (
    <div className="w-full max-w-[1240px] mx-auto px-2 sm:px-3 lg:px-4 space-y-2 pb-16 sm:pb-20 md:pb-24">
      {/* Header */}
      <div className="flex items-center justify-between py-1">
        <Avatar 
          className="w-8 h-8 cursor-pointer hover:ring-2 hover:ring-blue-300 transition-all"
          onClick={onNavigateToProfile}
        >
          <AvatarImage src={user?.profileImage || `/api/placeholder/40/40`} alt={user?.name || 'Profile'} />
          <AvatarFallback className="bg-blue-500 text-white font-bold text-sm">
            {user?.name?.charAt(0)?.toUpperCase() || user?.username?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 text-center">
          <h1 className="text-lg font-bold">Home</h1>
        </div>
        <div className="text-right flex items-center gap-1">
          <p className="text-xs text-gray-600">
            {user?.availableBalance ? parseFloat(user.availableBalance).toLocaleString() : '0'}
          </p>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1 h-6 w-6"
          >
            <RefreshCw 
              className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} 
            />
          </Button>
        </div>
      </div>

      {/* Image Slider */}
      <Card className="overflow-hidden">
        <div className="relative h-[180px] sm:h-[200px] md:h-[280px] lg:h-[350px] xl:h-[400px]">
          {sliderImages.map((image, index) => (
            <div
              key={index}
              className={`absolute inset-0 transition-opacity duration-1000 ${
                index === currentSlide ? 'opacity-100' : 'opacity-0'
              }`}
            >
              <img 
                src={image} 
                alt={`Slide ${index + 1}`}
                className="w-full h-full object-cover"
              />
            </div>
          ))}
          
          {/* Slide indicators */}
          <div className="absolute bottom-1 sm:bottom-2 md:bottom-3 left-1/2 transform -translate-x-1/2 flex space-x-1">
            {sliderImages.map((_, index) => (
              <button
                key={index}
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  index === currentSlide ? 'bg-white' : 'bg-white/50'
                }`}
                onClick={() => setCurrentSlide(index)}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Crypto Slider */}
      <div className="relative">
        <div className="overflow-hidden">
          <div 
            className="flex transition-transform duration-500 ease-in-out"
            style={{ transform: `translateX(-${cryptoSlideIndex * (100 / 4)}%)` }}
          >
            {/* Create duplicated array for seamless infinite loop */}
            {[...cryptoData, ...cryptoData].map((crypto, index) => (
              <div key={index} className="flex-shrink-0 w-1/4 lg:w-1/5 xl:w-1/6">
                <div className="px-1.5">
                  <Card 
                    className="cursor-pointer hover:shadow-md transition-shadow border-green-200"
                    onClick={() => onSelectCurrency(crypto.symbol.split('/')[0])}
                  >
                    <CardContent className="p-1 sm:p-1.5 lg:p-2">
                      <div className="text-center space-y-0.5 sm:space-y-1">
                        <div>
                          <p className="font-semibold text-[9px] sm:text-[10px] lg:text-xs text-center">{crypto.symbol}</p>
                        </div>
                        
                        <div className="space-y-0.5">
                          <p className="text-[9px] sm:text-[10px] lg:text-xs font-bold text-center">{crypto.price}</p>
                          <div className="flex items-center justify-center space-x-0.5">
                            {crypto.isPositive ? (
                              <TrendingUp className="w-1.5 h-1.5 lg:w-2 lg:h-2 text-green-500" />
                            ) : (
                              <TrendingDown className="w-1.5 h-1.5 lg:w-2 lg:h-2 text-red-500" />
                            )}
                            <span className={`text-[8px] sm:text-[9px] lg:text-[10px] ${crypto.isPositive ? 'text-green-500' : 'text-red-500'}`}>
                              {crypto.change}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Trading Chart Banner */}
      <Card className="overflow-hidden rounded-lg">
        <div className="h-[120px] sm:h-[140px] md:h-[180px] lg:h-[220px] xl:h-[280px]">
          <img 
            src={bannerTradingImg} 
            alt="Trading Chart"
            className="w-full h-full object-cover"
          />
        </div>
      </Card>

      {/* Currency List */}
      <div className="space-y-1 sm:space-y-2">
        {/* Table Header */}
        <div className="grid grid-cols-3 gap-1 sm:gap-2 py-1.5 sm:py-2 px-1.5 sm:px-3 bg-gray-50 rounded-lg border">
          <div className="text-[10px] sm:text-xs font-semibold text-gray-700">Currency</div>
          <div className="text-[10px] sm:text-xs font-semibold text-gray-700 text-center">Real Price</div>
          <div className="text-[10px] sm:text-xs font-semibold text-gray-700 text-center">Rise Fall</div>
        </div>
        
        {cryptoData.map((crypto) => (
          <Card 
            key={crypto.symbol}
            className="cursor-pointer hover:shadow-md transition-shadow"
            onClick={() => onSelectCurrency(crypto.symbol)}
          >
            <CardContent className="p-1.5 sm:p-2">
              <div className="grid grid-cols-3 gap-1 sm:gap-2 items-center">
                {/* Currency Column */}
                <div className="flex items-center space-x-1 sm:space-x-2">
                  <div className={`w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 rounded-full flex items-center justify-center text-white font-bold text-[8px] sm:text-[10px] lg:text-xs
                    ${crypto.color === 'orange' ? 'bg-orange-500' :
                      crypto.color === 'blue' ? 'bg-blue-500' :
                      crypto.color === 'yellow' ? 'bg-yellow-500' :
                      crypto.color === 'red' ? 'bg-red-500' :
                      'bg-gray-500'}`}>
                    {crypto.icon}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-[10px] sm:text-xs lg:text-sm truncate">{crypto.symbol}</div>
                    <div className="text-[8px] sm:text-[10px] lg:text-xs text-gray-600 truncate">{crypto.name}</div>
                  </div>
                </div>
                
                {/* Real Price Column */}
                <div className="text-center">
                  <div className="font-medium text-[10px] sm:text-xs lg:text-sm">{crypto.price}</div>
                </div>
                
                {/* Rise Fall Column */}
                <div className="text-center">
                  <Badge 
                    variant={crypto.isPositive ? "default" : "destructive"}
                    className={`text-[8px] sm:text-[10px] px-1 py-0.5 ${crypto.isPositive ? "bg-green-500" : "bg-red-500"}`}
                  >
                    {crypto.change}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}