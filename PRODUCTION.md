# Production Deployment Guide for Kopy Products

## Overview
This guide will help you deploy Kopy Products to production with MySQL database.

## Prerequisites

- A MySQL database (AWS RDS, Digital Ocean, PlanetScale, etc.)
- A hosting platform (Fly.io, Railway, Heroku, etc.)
- Node.js 18+ installed
- Shopify App credentials

## 1. Database Configuration

### Get your MySQL connection string
Your MySQL connection string should look like:
```
mysql://username:password@host:3306/database_name
```

### Update environment variables
Copy `.env.example` to `.env` and update:

```env
# Shopify App Configuration
SHOPIFY_API_KEY=your_api_key
SHOPIFY_API_SECRET=your_api_secret
SCOPES=read_products,write_products

# Production App URL
SHOPIFY_APP_URL=https://your-production-domain.com

# MySQL Database
DATABASE_URL="mysql://username:password@host:3306/database_name"
```

## 2. Database Setup

### Install dependencies
```bash
npm install
```

### Generate Prisma Client for MySQL
```bash
npx prisma generate
```

### Create the database schema
```bash
npx prisma db push
```

**Note:** This project uses `prisma db push` for database schema management. Do NOT use `prisma migrate deploy` as it will cause errors. The `db push` command creates all necessary tables automatically.

### Quick start script (recommended)
```bash
./start-production.sh
```

This script will:
- Generate Prisma Client
- Create database schema
- Build the application
- Start the server

## 3. Build for Production

```bash
npm run build
```

## 4. Deploy

### Option A: Fly.io

1. Install Fly CLI:
```bash
curl -L https://fly.io/install.sh | sh
```

2. Login to Fly:
```bash
fly auth login
```

3. Create and configure app:
```bash
fly launch
```

4. Set secrets:
```bash
fly secrets set SHOPIFY_API_KEY=your_key
fly secrets set SHOPIFY_API_SECRET=your_secret
fly secrets set DATABASE_URL="your_mysql_url"
fly secrets set SHOPIFY_APP_URL=https://your-app.fly.dev
```

5. Deploy:
```bash
fly deploy
```

### Option B: Railway

1. Connect your GitHub repository to Railway
2. Add environment variables in Railway dashboard
3. Railway will automatically build and deploy

### Option C: Heroku

1. Create Heroku app:
```bash
heroku create your-app-name
```

2. Add MySQL add-on (JawsDB or ClearDB):
```bash
heroku addons:create jawsdb:kitefin
```

3. Set environment variables:
```bash
heroku config:set SHOPIFY_API_KEY=your_key
heroku config:set SHOPIFY_API_SECRET=your_secret
heroku config:set SHOPIFY_APP_URL=https://your-app.herokuapp.com
```

4. Deploy:
```bash
git push heroku main
```

5. Run database migrations:
```bash
heroku run npx prisma db push
```

## 5. Update Shopify App Settings

1. Go to your Shopify Partner Dashboard
2. Navigate to your app
3. Update these URLs:
   - App URL: `https://your-production-domain.com`
   - Allowed redirection URL(s): `https://your-production-domain.com/auth/callback`

## 6. Post-Deployment

### Verify the app works
1. Visit your production URL
2. Install the app on a test store
3. Test importing products
4. Test bulk import functionality

### Monitor logs
```bash
# Fly.io
fly logs

# Railway
railway logs

# Heroku
heroku logs --tail
```

## Features Overview

### Current Features (All Free)
- ✅ Import single products from any Shopify store
- ✅ Bulk import multiple products
- ✅ Edit product details before importing
- ✅ Pricing configuration (markup/multiplier)
- ✅ Image management
- ✅ Variant support
- ✅ Collection assignment
- ✅ Import history
- ✅ Background job processing
- ✅ No product limits
- ✅ Completely free

## Troubleshooting

### Database Connection Issues
- Verify your DATABASE_URL is correct
- Check if your hosting platform can connect to your MySQL database
- Ensure your MySQL database allows connections from your hosting IP
- Test connection: `npx prisma db pull`

### Database Schema Issues
**Important:** This project uses `prisma db push`, NOT `prisma migrate`.

If you encounter schema errors:
```bash
# Regenerate Prisma Client
npx prisma generate

# Sync schema with database
npx prisma db push
```

If you need to reset (⚠️ **WARNING: Deletes all data**):
```bash
npx prisma db push --force-reset
```

**Do NOT use** `prisma migrate deploy` - it will cause errors!

### Migration Lock Error (P3019)
If you see "datasource provider specified in migration_lock.toml doesn't match":
```bash
# Remove old migrations (if switching from SQLite to MySQL)
rm -rf prisma/migrations

# Use db push instead
npx prisma db push
```

### Build Failures
- Clear node_modules and reinstall: `rm -rf node_modules && npm install`
- Clear Prisma cache: `npx prisma generate`
- Clear build cache: `rm -rf .react-router build`

## Security Notes

- Never commit `.env` file to version control
- Keep your SHOPIFY_API_SECRET secure
- Use strong MySQL passwords
- Enable SSL for database connections in production
- Regularly update dependencies: `npm update`

## Performance Tips

- Enable database connection pooling in Prisma
- Use CDN for static assets
- Enable caching for frequently accessed data
- Monitor database query performance
- Set up proper indexes on frequently queried fields

## Support

For issues or questions:
- Check Shopify App documentation
- Review Prisma documentation for database issues
- Check your hosting platform's documentation
