# Kopy Products - Shopify Product Importer

A free Shopify app that allows you to easily import products from any Shopify store to your own store.

## Features

- ✅ **Single Product Import**: Import products one by one with full editing capabilities
- ✅ **Bulk Import**: Import multiple products at once in the background
- ✅ **Product Editing**: Edit title, description, images, variants, and pricing before import
- ✅ **Pricing Configuration**: Apply markup or multiplier to product prices
- ✅ **Image Management**: Reorder, add, or remove product images
- ✅ **Collection Support**: Assign imported products to collections
- ✅ **Import History**: Track all your imported products
- ✅ **Background Processing**: Bulk imports run in the background
- ✅ **100% Free**: All features available at no cost

## Tech Stack

- **Frontend**: React with React Router v7
- **Backend**: Node.js with React Router
- **Database**: MySQL (production) / SQLite (development)
- **ORM**: Prisma
- **UI**: Shopify Polaris Web Components
- **API**: Shopify Admin GraphQL API

## Quick Start

### Prerequisites

- Node.js 18+ installed
- Shopify Partner account
- Test store (development or sandbox)
- MySQL database (for production)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd kopy-products
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
cp .env.example .env
```

Edit `.env` with your Shopify app credentials.

4. Run database setup:
```bash
npm run setup
```

5. Start development server:
```bash
npm run dev
```

## Production Deployment

📖 See [PRODUCTION.md](./PRODUCTION.md) for detailed deployment instructions including:
- MySQL database setup
- Environment configuration
- Deployment to Fly.io, Railway, or Heroku
- Post-deployment checklist

## Project Structure

```
app/
├── routes/              # React Router routes
│   ├── app._index.tsx   # Single product import
│   ├── app.bulk-import.tsx  # Bulk import page
│   ├── app.history.tsx  # Import history
│   └── api/             # API endpoints
├── services/            # Business logic
├── models/              # Database models
└── utils/               # Utility functions

prisma/
└── schema.prisma        # Database schema (MySQL compatible)
```

## Usage

### Single Product Import

1. Go to the main page
2. Enter a Shopify product URL
3. Edit product details (title, description, images, variants)
4. Configure pricing (markup or multiplier)
5. Select product status and collection
6. Click "Import Product"

### Bulk Import

1. Navigate to "Bulk Import"
2. Enter a Shopify store URL
3. Click "Fetch Products" to see all available products
4. Select products (individually or "Select All")
5. Configure pricing and settings
6. Click "Import X products"
7. Monitor progress on the tracking page

Import continues in background even if you leave the page!

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/fetch-product` | POST | Fetch product from source store |
| `/api/import-product` | POST | Import single product |
| `/api/bulk/fetch-products` | POST | Fetch all products from store |
| `/api/bulk/start-import` | POST | Start bulk import job |
| `/api/bulk/job-status` | POST | Get import job status |

## Database Schema

Main tables:
- **Session**: Shopify session management
- **AppSettings**: Per-store configuration
- **ImportedProduct**: Imported product records
- **VariantMapping**: Variant price mapping
- **BulkImportJob**: Background job tracking

## Development

### Running Tests
```bash
npm test
```

### Type Checking
```bash
npm run typecheck
```

### Linting
```bash
npm run lint
```

### Database Migrations
```bash
npx prisma migrate dev
```

## Configuration

### Pricing Modes

- **Markup**: Add a fixed amount to source prices
- **Multiplier**: Multiply source prices by a factor

### Product Status

- **Active**: Product is published and visible
- **Draft**: Product is saved but not published

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL in .env
- Check MySQL server is running
- Ensure proper database permissions

### Import Failures
- Check source store is accessible
- Verify product URL format
- Review error messages in job status

### Development Server Issues
```bash
# Clear cache and restart
rm -rf node_modules .react-router
npm install
npm run dev
```

## Contributing

Contributions are welcome! Please:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

MIT License - free to use for commercial and personal projects

## Support

- 📖 Read [PRODUCTION.md](./PRODUCTION.md) for deployment help
- 🐛 Report issues on GitHub
- 📚 Check [Shopify App documentation](https://shopify.dev/docs/apps)

## Roadmap

- [ ] Add internationalization (i18n) for multiple languages
- [ ] Product synchronization between stores
- [ ] CSV import/export functionality
- [ ] Scheduled bulk imports
- [ ] Webhook support for real-time updates
- [ ] Advanced filtering and search
- [ ] Product templates
- [ ] Automated pricing rules

## Resources

### Shopify
- [Shopify App Dev Docs](https://shopify.dev/docs/apps)
- [Shopify Admin API](https://shopify.dev/docs/api/admin)
- [Polaris Web Components](https://shopify.dev/docs/api/app-home/polaris-web-components)

### React Router
- [React Router Docs](https://reactrouter.com)
- [React Router v7 Guide](https://reactrouter.com/home)

### Database
- [Prisma Documentation](https://www.prisma.io/docs)
- [MySQL Documentation](https://dev.mysql.com/doc/)

## Credits

Built with ❤️ using:
- Shopify App Template
- React Router v7
- Prisma ORM
- Shopify Polaris
