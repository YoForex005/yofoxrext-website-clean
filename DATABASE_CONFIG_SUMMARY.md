# YoForex Database Configuration Summary

## ✅ Current Database Status
- **Database Type**: PostgreSQL (Neon)
- **Total Users**: 33
- **Total Threads**: 23
- **Total Tables**: 93
- **Status**: ✅ Connected and Working

## 🔧 Environment Variables Configuration

### Required Secrets (Set in Replit Secrets)
```
USE_POSTGRES=true
DATABASE_URL=postgresql://neondb_owner:<PASSWORD>@ep-broad-rain-ahbhjnk0-pooler.c-3.us-east-1.aws.neon.tech/yoforexnet_db?sslmode=require&channel_binding=require
SESSION_SECRET=<YOUR_SESSION_SECRET>
```

### Database Connection Details
- **Host**: ep-broad-rain-ahbhjnk0-pooler.c-3.us-east-1.aws.neon.tech
- **Port**: 5432
- **Database**: yoforexnet_db
- **User**: neondb_owner
- **SSL Mode**: require
- **Connection Pooling**: Enabled (max 14 connections)

## 📊 Verified Data

### Sample Users (from your Neon database)
- nellyrivera270903_1761955388495
- venysgabrielius410_1761943570831
- sonofsatya93_1761936837690
- yoforexpremium_1761934906356
- sarvanubanerjee10_1761930518891
- progya.timd_1761930433273
- YoForexAdmin
- YOTest
- newuser
- admin
- Epic1st
- Sarvanu
- Ardhendu

### Sample Threads (from your Neon database)
- Best Scalping Strategies for XAUUSD on M5
- hccgvj jvjvyvv viyvi ibyi kbyibibo kvibi
- Let me test it
- Jugghhuhghghyyyyy
- mkcm jnclncl ncoinc nocwnindcp nonc nwencdodc kncodco
- Oscillator indicators – RSI vs Stochastic?
- Swing trading on D1 – patience is key
- VPS recommendations for MT4 EAs

## 🚀 Export/Import Instructions

### To Export Your Database
```bash
# Using pg_dump from Neon dashboard or CLI
pg_dump "postgresql://neondb_owner:<PASSWORD>@ep-broad-rain-ahbhjnk0-pooler.c-3.us-east-1.aws.neon.tech/yoforexnet_db?sslmode=require" > yoforex_backup.sql
```

### To Import to Another Platform
1. **Update DATABASE_URL** secret to point to your new database
2. **Keep USE_POSTGRES=true**
3. **Run migration** (if needed):
   ```bash
   npm run db:push
   ```
4. **Import data** (if needed):
   ```bash
   psql "YOUR_NEW_DATABASE_URL" < yoforex_backup.sql
   ```

## 📝 Key Files for Database Configuration

### Application Configuration
- **Storage Config**: `server/storage.ts` (line 15626-15628)
  ```typescript
  const USE_POSTGRES = process.env.USE_POSTGRES !== "false";
  export const storage: IStorage = USE_POSTGRES 
    ? new DrizzleStorage()
    : new MemStorage();
  ```

- **Database Connection**: `server/db.ts`
  - Connection pool initialization
  - Retry logic (5 attempts)
  - SSL configuration

- **Schema Definition**: `shared/schema.ts`
  - All table definitions
  - 93 tables total

### Environment Variables
- **Development**: Managed via Replit Secrets
- **Production**: Set via deployment environment

## ✅ Verification Checklist
- [x] Database connected to Neon
- [x] All 33 users loading correctly
- [x] All 23 threads loading correctly
- [x] Database queries executing successfully
- [x] Connection pooling working
- [x] SSL enabled and working
- [x] Application can export/import data

## 🔐 Security Notes
- Database credentials stored in Replit Secrets (encrypted)
- SSL/TLS encryption enabled
- Password authentication required
- No hardcoded credentials in code

## 📍 Next Steps for Platform Migration
1. Export database using pg_dump
2. Set up new database on target platform
3. Update DATABASE_URL secret
4. Import data using psql
5. Verify connection with npm run dev
6. Test all functionality

---
Generated: November 1, 2025
