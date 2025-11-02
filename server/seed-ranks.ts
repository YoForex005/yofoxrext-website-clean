import { db } from "./db";
import { rankTiers, featureUnlocks } from "@shared/schema";
import { eq } from "drizzle-orm";

async function seedRanks() {
  console.log("🌱 Seeding rank tiers and feature unlocks...");

  const rankTiersData = [
    {
      name: "Contributor",
      minXp: 0,
      maxXp: 1999,
      colorHex: "#9CA3AF",
      iconName: "star",
      perks: ["Join community", "Browse marketplace"],
      sortOrder: 1,
    },
    {
      name: "Explorer",
      minXp: 2000,
      maxXp: 5999,
      colorHex: "#60A5FA",
      iconName: "compass",
      perks: ["Upload attachments", "Create polls", "Post in forums"],
      sortOrder: 2,
    },
    {
      name: "Expert",
      minXp: 6000,
      maxXp: 14999,
      colorHex: "#A78BFA",
      iconName: "award",
      perks: ["List items in marketplace", "Host webinars", "Custom badge"],
      sortOrder: 3,
    },
    {
      name: "Master",
      minXp: 15000,
      maxXp: null,
      colorHex: "#F59E0B",
      iconName: "crown",
      perks: ["Priority support", "Featured profile", "Revenue share", "Early beta access"],
      sortOrder: 4,
    },
  ];

  const insertedRanks = [];
  for (const rankData of rankTiersData) {
    const [rank] = await db.insert(rankTiers).values(rankData).onConflictDoNothing().returning();
    if (rank) {
      insertedRanks.push(rank);
    } else {
      const existing = await db.select().from(rankTiers).where(eq(rankTiers.name, rankData.name)).limit(1);
      if (existing[0]) insertedRanks.push(existing[0]);
    }
  }

  console.log(`✅ Created ${insertedRanks.length} rank tiers`);

  const featureUnlocksData = [
    { rankId: insertedRanks[0].id, featureKey: "browse_marketplace", featureName: "Browse Marketplace" },
    { rankId: insertedRanks[0].id, featureKey: "join_community", featureName: "Join Community" },
    { rankId: insertedRanks[1].id, featureKey: "upload_attachments", featureName: "Upload Attachments" },
    { rankId: insertedRanks[1].id, featureKey: "create_polls", featureName: "Create Polls" },
    { rankId: insertedRanks[1].id, featureKey: "post_forums", featureName: "Post in Forums" },
    { rankId: insertedRanks[2].id, featureKey: "list_marketplace", featureName: "List in Marketplace" },
    { rankId: insertedRanks[2].id, featureKey: "host_webinars", featureName: "Host Webinars" },
    { rankId: insertedRanks[2].id, featureKey: "custom_badge", featureName: "Custom Badge" },
    { rankId: insertedRanks[3].id, featureKey: "priority_support", featureName: "Priority Support" },
    { rankId: insertedRanks[3].id, featureKey: "featured_profile", featureName: "Featured Profile" },
    { rankId: insertedRanks[3].id, featureKey: "revenue_share", featureName: "Revenue Share" },
    { rankId: insertedRanks[3].id, featureKey: "early_beta_access", featureName: "Early Beta Access" },
  ];

  for (const unlockData of featureUnlocksData) {
    await db.insert(featureUnlocks).values(unlockData).onConflictDoNothing();
  }

  console.log(`✅ Created ${featureUnlocksData.length} feature unlocks`);
  console.log("✅ Rank tiers and feature unlocks seeded successfully!");
}

seedRanks()
  .then(() => {
    console.log("✅ Seeding complete");
    process.exit(0);
  })
  .catch((error) => {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  });
