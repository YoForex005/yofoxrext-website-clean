"use client";

import { useState } from "react";
import { Coins, Gift, AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import type { RedemptionOption } from "../../shared/schema";

interface RedemptionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: RedemptionOption | null;
  currentBalance: number;
}

const redemptionFormSchema = z.object({
  email: z.string().email("Invalid email address").optional(),
  notes: z.string().max(500).optional(),
});

type RedemptionFormData = z.infer<typeof redemptionFormSchema>;

export default function RedemptionModal({
  open,
  onOpenChange,
  item,
  currentBalance,
}: RedemptionModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [redemptionCode, setRedemptionCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const form = useForm<RedemptionFormData>({
    resolver: zodResolver(redemptionFormSchema),
    defaultValues: {
      email: "",
      notes: "",
    },
  });

  const redeemMutation = useMutation({
    mutationFn: async (data: RedemptionFormData) => {
      const response = await fetch("/api/sweets/redemptions/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          optionId: item?.id,
          metadata: data,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to redeem item");
      }

      return response.json();
    },
    onSuccess: (data) => {
      setRedemptionCode(data.redemptionCode || "Processing");
      queryClient.invalidateQueries({ queryKey: ["/api/sweets/balance/me"] });
      queryClient.invalidateQueries({ queryKey: ["/api/sweets/redemptions/orders/me"] });
      form.reset();
    },
    onError: (err: Error) => {
      setError(err.message);
    },
  });

  const handleSubmit = (data: RedemptionFormData) => {
    setError(null);
    redeemMutation.mutate(data);
  };

  const handleClose = () => {
    onOpenChange(false);
    setTimeout(() => {
      setRedemptionCode(null);
      setError(null);
      form.reset();
    }, 300);
  };

  if (!item) return null;

  const balanceAfter = currentBalance - item.coinCost;
  const hasInsufficientBalance = currentBalance < item.coinCost;
  const isOutOfStock = item.stock !== null && item.stock <= 0;
  const canRedeem = !hasInsufficientBalance && !isOutOfStock && !redemptionCode;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-[500px] dark:bg-gray-900 dark:border-gray-800"
        data-testid="modal-redeem"
      >
        {!redemptionCode ? (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 dark:text-white">
                <Gift className="h-5 w-5 text-primary" />
                Confirm Redemption
              </DialogTitle>
              <DialogDescription className="dark:text-gray-400">
                Review the details before redeeming this item
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              {/* Item Details */}
              <div className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <h4 className="font-semibold text-lg mb-2 dark:text-white">{item.name}</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {item.description}
                </p>
                <div className="flex items-center gap-2">
                  <Coins className="h-5 w-5 text-yellow-500" />
                  <span className="font-bold text-lg dark:text-white">
                    {item.coinCost.toLocaleString()} coins
                  </span>
                </div>
              </div>

              {/* Balance Summary */}
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Current Balance:</span>
                  <span className="font-semibold dark:text-white">
                    {currentBalance.toLocaleString()} coins
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Cost:</span>
                  <span className="font-semibold text-red-600 dark:text-red-400">
                    -{item.coinCost.toLocaleString()} coins
                  </span>
                </div>
                <div className="border-t pt-2 dark:border-gray-700">
                  <div className="flex justify-between text-sm font-bold">
                    <span className="dark:text-white">Balance After:</span>
                    <span
                      className={
                        balanceAfter >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }
                    >
                      {balanceAfter.toLocaleString()} coins
                    </span>
                  </div>
                </div>
              </div>

              {/* Errors */}
              {error && (
                <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {hasInsufficientBalance && (
                <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Insufficient balance. You need{" "}
                    {(item.coinCost - currentBalance).toLocaleString()} more coins.
                  </AlertDescription>
                </Alert>
              )}

              {isOutOfStock && (
                <Alert variant="destructive" className="dark:bg-red-900/20 dark:border-red-800">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    This item is currently out of stock.
                  </AlertDescription>
                </Alert>
              )}

              {/* Form for additional details */}
              {item.category === "gift_card" && canRedeem && (
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="dark:text-gray-300">
                            Email for Gift Card Delivery
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="your@email.com"
                              {...field}
                              className="dark:bg-gray-800 dark:border-gray-700 dark:text-white"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </form>
                </Form>
              )}

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1 dark:bg-gray-800 dark:border-gray-700 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={form.handleSubmit(handleSubmit)}
                  disabled={!canRedeem || redeemMutation.isPending}
                  className="flex-1"
                  data-testid="button-confirm-redeem"
                >
                  {redeemMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Confirm Redemption"
                  )}
                </Button>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                <CheckCircle2 className="h-5 w-5" />
                Redemption Successful!
              </DialogTitle>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="text-center p-6 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
                <Gift className="h-12 w-12 mx-auto mb-4 text-green-600 dark:text-green-400" />
                <h4 className="font-semibold text-lg mb-2 dark:text-white">
                  {item.name}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Your redemption code:
                </p>
                <div
                  className="p-3 bg-white dark:bg-gray-800 rounded border border-green-300 dark:border-green-700 font-mono text-lg font-bold"
                  data-testid="text-redemption-code"
                >
                  {redemptionCode}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
                  Save this code! You can also find it in your redemption history.
                </p>
              </div>

              <Button
                onClick={handleClose}
                className="w-full"
              >
                Done
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
