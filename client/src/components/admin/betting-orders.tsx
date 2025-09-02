import { useBettingOrders, useUpdateBettingOrder } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { X, TrendingUp, TrendingDown, Volume2, VolumeX } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNotificationSound } from "@/lib/notifications";
import { useEffect, useRef, useState } from "react";

const durations = [30, 60, 120, 180, 240];

export function BettingOrders() {
  const { data: orders, isLoading } = useBettingOrders();
  const updateOrder = useUpdateBettingOrder();
  const { toast } = useToast();
  const { playNewOrderSound, toggleNotifications, testSound, isEnabled } = useNotificationSound();
  const previousOrderCountRef = useRef<number>(0);

  // Track new active orders and play notification sound
  useEffect(() => {
    if (orders && Array.isArray(orders)) {
      const activeOrders = orders.filter(order => order.status === "active");
      const currentActiveOrderCount = activeOrders.length;
      console.log("Active orders count changed:", previousOrderCountRef.current, "->", currentActiveOrderCount);
      
      // Only play sound if we have more active orders than before (new orders added)
      if (previousOrderCountRef.current > 0 && currentActiveOrderCount > previousOrderCountRef.current) {
        console.log("New active orders detected, playing sound");
        playNewOrderSound();
        toast({
          title: "New Betting Order",
          description: `${currentActiveOrderCount - previousOrderCountRef.current} new order(s) received`,
        });
      }
      
      previousOrderCountRef.current = currentActiveOrderCount;
    }
  }, [orders, playNewOrderSound, toast]);

  // Add test sound function for debugging
  const handleTestSound = () => {
    console.log("Testing sound manually");
    testSound();
  };

  const handleUpdateDuration = (orderId: number, newDuration: number) => {
    const newExpiresAt = new Date(Date.now() + newDuration * 1000);
    
    updateOrder.mutate({ 
      id: orderId, 
      updates: { 
        duration: newDuration,
        expiresAt: newExpiresAt
      }
    }, {
      onSuccess: () => {
        toast({
          title: "Order updated",
          description: "Order duration has been updated successfully",
        });
      },
      onError: () => {
        toast({
          title: "Update failed",
          description: "Failed to update order duration",
          variant: "destructive",
        });
      },
    });
  };

  const handleCancelOrder = (orderId: number) => {
    updateOrder.mutate({ 
      id: orderId, 
      updates: { status: "cancelled" }
    }, {
      onSuccess: () => {
        toast({
          title: "Order cancelled",
          description: "Order has been cancelled successfully",
        });
      },
      onError: () => {
        toast({
          title: "Cancellation failed",
          description: "Failed to cancel order",
          variant: "destructive",
        });
      },
    });
  };

  const getRemainingTime = (expiresAt: Date) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const remaining = Math.max(0, Math.floor((expiry.getTime() - now.getTime()) / 1000));
    return remaining;
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Betting Orders</CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
                className="flex items-center gap-2"
              >
                {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {isEnabled ? "Sound On" : "Sound Off"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-1 h-full bg-gray-900">
      <Card className="h-full bg-gray-800 border-gray-700">
        <CardHeader className="p-2">
          <div className="flex justify-between items-center mb-2">
            <CardTitle className="text-white">All Betting Orders</CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={toggleNotifications}
                className={`flex items-center gap-2 border-gray-600 ${isEnabled ? 'bg-green-800 border-green-600 text-green-200' : 'bg-red-800 border-red-600 text-red-200'}`}
              >
                {isEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                {isEnabled ? "Sound On" : "Sound Off"}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleTestSound}
                className="flex items-center gap-2 bg-blue-800 border-blue-600 text-blue-200"
              >
                Test Sound
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button variant="default" size="sm">All Orders</Button>
            {durations.map((duration) => (
              <Button key={duration} variant="outline" size="sm">
                {duration}s
              </Button>
            ))}
          </div>
        </CardHeader>
        <CardContent className="bg-gray-800">
          {!orders || orders.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <TrendingUp className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p>No betting orders</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="border-gray-700">
                  <TableHead className="text-gray-300">Order ID</TableHead>
                  <TableHead className="text-gray-300">Customer Name</TableHead>
                  <TableHead className="text-gray-300">Asset</TableHead>
                  <TableHead className="text-gray-300">Amount</TableHead>
                  <TableHead className="text-gray-300">Direction</TableHead>
                  <TableHead className="text-gray-300">Status</TableHead>
                  <TableHead className="text-gray-300">Timer</TableHead>
                  <TableHead className="text-gray-300">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const remainingTime = getRemainingTime(order.expiresAt);
                  const progressPercent = Math.max(0, (remainingTime / order.duration) * 100);
                  
                  return (
                    <TableRow key={order.id} className="border-gray-700 hover:bg-gray-750">
                      <TableCell className="font-medium text-gray-200">{order.id}-{(order as any).username || `User${order.userId}`}</TableCell>
                      <TableCell className="font-medium text-gray-200">{(order as any).username || `User${order.userId}`}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium text-gray-200">{order.asset}</div>
                          <div className="text-sm text-gray-400">{parseFloat(order.entryPrice).toFixed(2)}</div>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-200">{parseFloat(order.amount).toFixed(2)}</TableCell>
                      <TableCell>
                        <Badge 
                          variant={order.direction === "Buy Up" ? "default" : "destructive"}
                          className="flex items-center w-fit"
                        >
                          {order.direction === "Buy Up" ? (
                            <TrendingUp className="w-3 h-3 mr-1" />
                          ) : (
                            <TrendingDown className="w-3 h-3 mr-1" />
                          )}
                          {order.direction}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={order.status === "active" ? "default" : 
                                   order.status === "completed" ? "secondary" : "destructive"}
                        >
                          {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {order.status === "active" ? (
                          <div>
                            <div className="text-sm font-medium text-yellow-400">
                              {remainingTime}s
                            </div>
                            <div className="w-20 bg-gray-600 rounded-full h-1 mt-1">
                              <div 
                                className="bg-yellow-400 h-1 rounded-full transition-all duration-1000"
                                style={{ width: `${progressPercent}%` }}
                              />
                            </div>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            {order.status === "completed" ? "Completed" : "Cancelled"}
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {order.status === "active" ? (
                          <div className="flex space-x-2">
                            <Select 
                              value={order.duration.toString()} 
                              onValueChange={(value) => handleUpdateDuration(order.id, parseInt(value))}
                            >
                              <SelectTrigger className="w-20">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {durations.map((duration) => (
                                  <SelectItem key={duration} value={duration.toString()}>
                                    {duration}s
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="text-sm text-gray-400">
                            {order.status === "completed" && order.profit && (
                              <div>
                                Profit: {parseFloat(order.profit).toFixed(2)}
                              </div>
                            )}
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
