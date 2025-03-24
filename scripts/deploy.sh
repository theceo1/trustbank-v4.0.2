#!/bin/bash

# Exit on error
set -e

# Load environment variables
source .env.production

# Configuration
ENVIRONMENT=${1:-production}
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="./backups"
LOG_DIR="./logs"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m'

# Create necessary directories
mkdir -p $BACKUP_DIR $LOG_DIR

echo -e "${GREEN}Starting deployment process for $ENVIRONMENT environment${NC}"

# 1. Pre-deployment checks
echo "Running pre-deployment checks..."

# Check required environment variables
required_vars=("NEXT_PUBLIC_SUPABASE_URL" "NEXT_PUBLIC_SUPABASE_ANON_KEY" "NEXT_PUBLIC_SENTRY_DSN")
for var in "${required_vars[@]}"; do
    if [ -z "${!var}" ]; then
        echo -e "${RED}Error: $var is not set${NC}"
        exit 1
    fi
done

# Check node version
required_node="18.0.0"
current_node=$(node -v | cut -d'v' -f2)
if [ $(printf '%s\n' "$required_node" "$current_node" | sort -V | head -n1) != "$required_node" ]; then
    echo -e "${RED}Error: Node.js version must be >= $required_node${NC}"
    exit 1
fi

# 2. Create backup
echo "Creating backup..."
timestamp=$(date +%Y%m%d_%H%M%S)
tar -czf "$BACKUP_DIR/backup_$timestamp.tar.gz" .

# 3. Install dependencies
echo "Installing dependencies..."
npm ci

# 4. Run tests
echo "Running tests..."
npm run test

# 5. Build application
echo "Building application..."
npm run build

# 6. Database migrations
echo "Running database migrations..."
npm run migrate

# 7. Deploy
echo "Deploying to $ENVIRONMENT..."
case $ENVIRONMENT in
  production)
    # Add production deployment commands
    npm run deploy:production
    ;;
  staging)
    # Add staging deployment commands
    npm run deploy:staging
    ;;
  *)
    echo -e "${RED}Invalid environment: $ENVIRONMENT${NC}"
    exit 1
    ;;
esac

# 8. Post-deployment checks
echo "Running post-deployment checks..."
# Add health check
curl -f http://localhost:3000/api/health || {
    echo -e "${RED}Health check failed${NC}"
    # Trigger rollback
    echo "Rolling back..."
    npm run rollback
    exit 1
}

# 9. Clean up
echo "Cleaning up..."
npm run clean

echo -e "${GREEN}Deployment completed successfully!${NC}" 