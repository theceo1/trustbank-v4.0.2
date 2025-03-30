import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatAmount } from "../utils/currency";
import { TradePreviewModalProps } from "../types";

export function TradePreview({ 
  isOpen, 
  onClose, 
  onConfirm, 
  trade,
  countdown,
}: TradePreviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md bg-white dark:bg-gray-800">
        <DialogHeader>
          <DialogTitle>Confirm Swap</DialogTitle>
          <DialogDescription>
            Please review your swap details. This quote expires in {countdown} seconds.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <Card>
            <CardContent className="space-y-6 pt-6">
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground">From</p>
                    <p className="font-medium">
                      {formatAmount(trade.amount, trade.currency)} {trade.currency}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      ≈ ₦{trade.ngn_equivalent.toLocaleString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">To</p>
                    <p className="font-medium">{trade.quote_amount}</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Exchange Rate</span>
                    <span className="font-medium">
                      1 {trade.currency} = ₦{trade.rate.toLocaleString()}
                    </span>
                  </div>
                </div>

                <div className="space-y-2 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Platform Fee</span>
                    <span className="font-medium">₦{trade.fees.platform.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Service Fee</span>
                    <span className="font-medium">₦{trade.fees.service.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Fee</span>
                    <span>₦{trade.fees.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="pt-4 border-t">
                  <div className="flex justify-between items-center font-medium">
                    <span>Total Amount (incl. fees)</span>
                    <span>₦{trade.total.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              className="flex-1 bg-green-600 hover:bg-green-700"
              onClick={onConfirm}
            >
              Confirm Swap
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 