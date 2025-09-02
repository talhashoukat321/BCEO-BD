#!/bin/bash

# SuperCoin Hostinger Deployment Script
echo "🚀 Starting SuperCoin deployment preparation..."

# Step 1: Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/
rm -rf node_modules/.cache/

# Step 2: Install dependencies
echo "📦 Installing dependencies..."
npm install

# Step 3: Build the application
echo "🔨 Building application..."
npm run build

# Step 4: Create production package
echo "📋 Creating deployment package..."

# Create deployment directory
mkdir -p deployment_package

# Copy necessary files
cp -r dist/ deployment_package/
cp package.json deployment_package/
cp package-lock.json deployment_package/
cp -r server/ deployment_package/
cp -r shared/ deployment_package/
cp drizzle.config.ts deployment_package/

# Create .env template
cat > deployment_package/.env.template << EOL
NODE_ENV=production
DATABASE_URL=postgresql://username:password@hostname:port/database_name
PORT=5000
EOL

# Create deployment instructions
cat > deployment_package/DEPLOYMENT_INSTRUCTIONS.txt << EOL
SuperCoin Hostinger Deployment Instructions
==========================================

1. Upload all files in this deployment_package folder to your Hostinger public_html directory

2. Create .env file from .env.template with your actual database credentials:
   - Copy .env.template to .env
   - Replace placeholder values with your Hostinger PostgreSQL details

3. In Hostinger control panel:
   - Go to Advanced > Node.js
   - Create new Node.js application
   - Set startup file to: dist/index.js
   - Set Node.js version to 18 or 20

4. Install dependencies on server:
   npm install --production

5. Start the application from Hostinger Node.js panel

6. Test the application:
   - Admin login: admin / admin123
   - Customer login: sarah / password123 or john / password123

For detailed instructions, see HOSTINGER_DEPLOYMENT.md
EOL

# Create zip file for easy upload
if command -v zip &> /dev/null; then
    echo "📦 Creating deployment zip file..."
    cd deployment_package
    zip -r ../supercoin-hostinger-deployment.zip .
    cd ..
    echo "✅ Created supercoin-hostinger-deployment.zip"
else
    echo "ℹ️  Zip not available. Manual file upload required."
fi

echo ""
echo "✅ Deployment preparation complete!"
echo ""
echo "📁 Files ready in: deployment_package/"
echo "📦 Zip file: supercoin-hostinger-deployment.zip"
echo ""
echo "Next steps:"
echo "1. Upload deployment_package contents to your Hostinger server"
echo "2. Set up PostgreSQL database in Hostinger control panel"
echo "3. Configure .env file with your database credentials"
echo "4. Set up Node.js application in Hostinger control panel"
echo "5. Install dependencies and start the application"
echo ""
echo "📖 See HOSTINGER_DEPLOYMENT.md for detailed instructions"