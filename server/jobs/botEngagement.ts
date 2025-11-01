import cron from "node-cron";
import { storage } from "../storage";
import { createBotOrchestrator } from "../services/botOrchestrator";

const orchestrator = createBotOrchestrator(storage);

// Run every 10 minutes during active hours (8 AM - 10 PM UTC)
export const startBotEngagementJob = () => {
  cron.schedule("*/10 8-22 * * *", async () => {
    try {
      const settings = await storage.getBotSettings();
      if (!settings || !settings.globalEnabled) {
        console.log("Bot engagement disabled globally");
        return;
      }

      console.log("Running bot engagement cycle...");
      
      await orchestrator.scanForNewContent();
      await orchestrator.scanForNewEAs();
      
      console.log("Bot engagement cycle complete");
    } catch (error) {
      console.error("Bot engagement job failed:", error);
    }
  });

  console.log("Bot engagement job scheduled (every 10 minutes, 8 AM - 10 PM UTC)");
};
