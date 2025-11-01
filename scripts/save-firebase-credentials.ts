import { db } from "../server/db";
import { serviceCredentials } from "@shared/schema";

async function saveFirebaseCredentials() {
  console.log("Starting Firebase credentials backup to database...");

  const firebaseEnvVars = [
    { key: "NEXT_PUBLIC_FIREBASE_API_KEY", description: "Firebase Web API Key" },
    { key: "NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN", description: "Firebase Auth Domain" },
    { key: "NEXT_PUBLIC_FIREBASE_PROJECT_ID", description: "Firebase Project ID" },
    { key: "NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET", description: "Firebase Storage Bucket" },
    { key: "NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID", description: "Firebase Cloud Messaging Sender ID" },
    { key: "NEXT_PUBLIC_FIREBASE_APP_ID", description: "Firebase App ID" },
    { key: "NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID", description: "Firebase Analytics Measurement ID" },
  ];

  let savedCount = 0;
  let skippedCount = 0;

  for (const { key, description } of firebaseEnvVars) {
    const value = process.env[key];

    if (!value) {
      console.log(`⚠️  Skipping ${key} - not found in environment`);
      skippedCount++;
      continue;
    }

    try {
      await db.insert(serviceCredentials).values({
        serviceName: "firebase_web",
        credentialKey: key,
        credentialValue: value,
        environment: "production",
        isActive: true,
        description: `${description} for Google OAuth`,
      }).onConflictDoUpdate({
        target: [
          serviceCredentials.serviceName,
          serviceCredentials.credentialKey,
          serviceCredentials.environment
        ],
        set: {
          credentialValue: value,
          updatedAt: new Date(),
        },
      });

      console.log(`✅ Saved ${key} to database`);
      savedCount++;
    } catch (error) {
      console.error(`❌ Error saving ${key}:`, error instanceof Error ? error.message : error);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   ✅ Saved: ${savedCount} credentials`);
  console.log(`   ⚠️  Skipped: ${skippedCount} credentials`);
  console.log(`\n✨ Firebase credentials backup complete!`);
  console.log(`\n💡 To restore credentials from database, run:`);
  console.log(`   SELECT credential_key, credential_value FROM service_credentials WHERE service_name = 'firebase_web';`);

  process.exit(0);
}

saveFirebaseCredentials().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
