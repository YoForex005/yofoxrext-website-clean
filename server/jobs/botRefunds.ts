import cron from "node-cron";
import { storage } from "../storage";

// Run daily at 3 AM
export const startBotRefundJob = () => {
  cron.schedule("0 3 * * *", async () => {
    try {
      console.log("[BOT REFUNDS] Processing bot refunds...");
      
      const pendingRefunds = await storage.getPendingRefunds(new Date());
      console.log(`[BOT REFUNDS] Found ${pendingRefunds.length} pending refunds`);
      
      for (const refund of pendingRefunds) {
        try {
          // Deduct coins from seller (reverse the sale)
          await storage.createCoinTransaction({
            userId: refund.sellerId,
            amount: -refund.refundAmount,
            type: "bot_refund",
            description: "Bot purchase refund (automated)",
            metadata: { 
              botActionId: refund.botActionId,
              botId: refund.botId,
              isBot: true
            }
          });

          // Refund treasury
          await storage.refillTreasury(refund.originalAmount);
          
          // Mark action as refunded
          await storage.markActionAsRefunded(refund.botActionId);
          
          // Mark refund as processed
          await storage.markRefundAsProcessed(refund.id);
          
          console.log(`[BOT REFUNDS] Refunded ${refund.refundAmount} coins from seller ${refund.sellerId}, treasury refilled ${refund.originalAmount} coins`);
        } catch (error) {
          console.error(`[BOT REFUNDS] Failed to process refund ${refund.id}:`, error);
          await storage.markRefundAsProcessed(refund.id, error instanceof Error ? error.message : "Unknown error");
        }
      }
      
      console.log(`[BOT REFUNDS] Processed ${pendingRefunds.length} refunds`);
      
      // Reset daily spend counter
      await storage.resetDailySpend();
      console.log("[BOT REFUNDS] Reset daily spend counter");
    } catch (error) {
      console.error("[BOT REFUNDS] Bot refund job failed:", error);
    }
  });

  console.log("Bot refund job scheduled (daily at 3 AM)");
};
