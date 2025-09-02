import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Copy } from "lucide-react";
import { useTransactions, useUpdateTransactionDetails } from "@/lib/api";

export function RechargeDetail() {
  const { id } = useParams();
  const [, setLocation] = useLocation();
  const { data: transactions } = useTransactions();
  const { toast } = useToast();
  const updateTransactionMutation = useUpdateTransactionDetails();
  
  const [formData, setFormData] = useState({
    transactionNo: "",
    rechargeInfo: ""
  });
  
  const [showErrorDialog, setShowErrorDialog] = useState(false);

  // Find the specific transaction
  const transaction = transactions?.find(t => t.id === parseInt(id || "0") && t.type === "deposit");

  // Load existing transaction details when transaction data is available
  useEffect(() => {
    if (transaction?.description?.includes('Transaction No:')) {
      const existingTransactionNo = transaction.description.split('Transaction No:')[1]?.split('|')[0]?.trim();
      const existingRechargeInfo = transaction.description.includes('Info:') 
        ? transaction.description.split('Info:')[1]?.trim() 
        : '';
      
      if (existingTransactionNo) {
        setFormData({
          transactionNo: existingTransactionNo,
          rechargeInfo: existingRechargeInfo || ""
        });
      }
    }
  }, [transaction]);

  if (!transaction) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="flex items-center mb-6">
          <button onClick={() => setLocation("/customer#assets")} className="mr-4">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h1 className="text-lg font-medium">Recharge Detail</h1>
        </div>
        <div className="text-center py-8">
          <p className="text-gray-600">Transaction not found</p>
        </div>
      </div>
    );
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copy Successful",
      description: "Text copied to clipboard",
    });
  };

  const handleSubmit = async () => {
    if (!formData.transactionNo.trim()) {
      setShowErrorDialog(true);
      return;
    }

    try {
      await updateTransactionMutation.mutateAsync({
        id: transaction!.id,
        transactionNo: formData.transactionNo,
        rechargeInfo: formData.rechargeInfo || undefined
      });

      toast({
        title: "Success",
        description: "Transaction details updated successfully",
      });

      // Go back to previous page after successful submission
      setTimeout(() => {
        setLocation("/customer#assets");
      }, 1000);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save transaction details",
        variant: "destructive",
      });
    }
  };

  // Generate a mock order number for display
  const orderNo = `T-X${transaction.id}7514474469${Math.floor(Math.random() * 100)}`;

  return (
    <div className="min-h-screen bg-white">
      <div className="p-4">
        {/* Header */}
        <div className="flex items-center mb-6">
          <button onClick={() => setLocation("/customer#assets")} className="mr-4">
            <ArrowLeft className="w-6 h-6 text-gray-700" />
          </button>
          <h1 className="text-lg font-medium text-gray-900">Recharge Detail</h1>
        </div>

        {/* Transaction Details Card */}
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          {/* Transaction No. */}
          <div className="mb-4">
            <Label className="text-sm text-gray-600">Transaction No.</Label>
            <Input 
              value={formData.transactionNo}
              onChange={(e) => setFormData({...formData, transactionNo: e.target.value})}
              placeholder="Enter transaction number"
              className="mt-1"
            />
          </div>

          {/* Amount */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Amount</span>
            <span className="text-sm font-medium">{parseFloat(transaction.amount).toFixed(0)}</span>
          </div>

          {/* Status */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Status</span>
            <span className="text-sm text-blue-600 font-medium">Applied</span>
          </div>

          {/* Order No. */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Order No.</span>
            <div className="flex items-center">
              <span className="text-sm font-medium mr-2">{orderNo}</span>
              <button 
                onClick={() => handleCopy(orderNo)}
                className="text-red-500 hover:text-red-600"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Apply Time */}
          <div className="flex items-center justify-between py-2 border-b border-gray-100">
            <span className="text-sm text-gray-600">Apply Time</span>
            <span className="text-sm text-gray-700">
              {new Date(transaction.createdAt).toLocaleString('en-CA', {
                year: 'numeric',
                month: '2-digit', 
                day: '2-digit',
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              }).replace(',', '')}
            </span>
          </div>



          {/* Recharge Info */}
          <div className="mb-6">
            <Label className="text-sm text-gray-600">Recharge Info.</Label>
            <Textarea 
              value={formData.rechargeInfo}
              onChange={(e) => setFormData({...formData, rechargeInfo: e.target.value})}
              placeholder="Enter recharge information"
              className="mt-1 min-h-[100px]"
            />
          </div>

          {/* Submit Button */}
          <Button 
            onClick={handleSubmit}
            disabled={updateTransactionMutation.isPending}
            className="w-full bg-green-500 hover:bg-green-600 text-white disabled:opacity-50"
          >
            {updateTransactionMutation.isPending ? "Saving..." : "Supply Recharge Info."}
          </Button>
        </div>
      </div>

      {/* Error Dialog */}
      <Dialog open={showErrorDialog} onOpenChange={setShowErrorDialog}>
        <DialogContent className="max-w-sm mx-auto bg-white">
          <DialogHeader>
            <DialogTitle className="text-center text-gray-900 font-medium">
              Transaction No. cannot be empty
            </DialogTitle>
          </DialogHeader>
          <div className="flex justify-center pt-4">
            <Button 
              onClick={() => setShowErrorDialog(false)}
              className="px-8 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
            >
              OK
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}