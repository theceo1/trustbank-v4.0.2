# TrustBank - Cryptocurrency Exchange Platform

A secure and user-friendly cryptocurrency exchange platform targeting global emerging markets, built with Next.js 14, TypeScript, and Supabase.

## Features

- 🔒 Secure Authentication with 2FA
- 💳 Multi-currency Wallet System
- 🤝 P2P Trading Platform
- 💱 Instant Cryptocurrency Swaps
- 📊 Real-time Market Data
- 📱 Mobile-responsive Design
- 🔍 Advanced KYC Verification

## Tech Stack

- **Frontend**: Next.js 14 (App Router) with TypeScript
- **Database/Auth**: Supabase
- **Styling**: TailwindCSS + shadcn/ui
- **Deployment**: Vercel
- **Mobile**: React Native with Expo (Coming Soon)

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Vercel account (for deployment)

## Environment Variables

Create a `.env.local` file with the following variables:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# Quidax API
QUIDAX_SECRET_KEY=your_quidax_secret_key
QUIDAX_PUBLIC_KEY=your_quidax_public_key

# Dojah API
DOJAH_API_KEY=your_dojah_api_key
DOJAH_APP_ID=your_dojah_app_id

# Redis (Rate Limiting)
UPSTASH_REDIS_REST_URL=your_redis_url
UPSTASH_REDIS_REST_TOKEN=your_redis_token
```

## Getting Started

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/trustbank.git
   cd trustbank
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Run database migrations:
   ```bash
   npm run db:migrate
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Documentation

- [API Documentation](./docs/API.md)
- [Architecture Overview](./docs/ARCHITECTURE.md)
- [Deployment Guide](./docs/DEPLOYMENT.md)
- [Security Guidelines](./docs/SECURITY.md)
- [Contributing Guidelines](./docs/CONTRIBUTING.md)

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Build production bundle
- `npm run start` - Start production server
- `npm run lint` - Run ESLint
- `npm run test` - Run tests
- `npm run db:migrate` - Run database migrations
- `npm run db:seed` - Seed database with sample data

## Deployment

See [Deployment Guide](./docs/DEPLOYMENT.md) for detailed instructions.

## Security

See [Security Guidelines](./docs/SECURITY.md) for security best practices.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, email support@trustbank.com or join our Slack channel.
