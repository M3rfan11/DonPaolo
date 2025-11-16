#!/bin/bash
# Backend Deployment Script for Don Paolo Restaurant Management System

set -e

echo "🚀 Starting Backend Deployment..."

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Azure CLI is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install it first:"
    echo "   https://docs.microsoft.com/en-us/cli/azure/install-azure-cli"
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "🔐 Please login to Azure..."
    az login
fi

# Configuration
RESOURCE_GROUP="donpaolo-rg"
APP_NAME="donpaolo-api"
APP_PLAN="donpaolo-plan"
LOCATION="eastus"

echo -e "${YELLOW}📋 Configuration:${NC}"
echo "   Resource Group: $RESOURCE_GROUP"
echo "   App Name: $APP_NAME"
echo "   Location: $LOCATION"
echo ""

# Navigate to API directory
cd Api

# Build the project
echo -e "${GREEN}📦 Building project...${NC}"
dotnet publish -c Release -o ./publish

# Check if resource group exists
if ! az group show --name $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}📦 Creating resource group...${NC}"
    az group create --name $RESOURCE_GROUP --location $LOCATION
fi

# Check if app service plan exists
if ! az appservice plan show --name $APP_PLAN --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}📦 Creating App Service Plan...${NC}"
    az appservice plan create \
        --name $APP_PLAN \
        --resource-group $RESOURCE_GROUP \
        --sku B1 \
        --is-linux
fi

# Check if web app exists
if ! az webapp show --name $APP_NAME --resource-group $RESOURCE_GROUP &> /dev/null; then
    echo -e "${YELLOW}📦 Creating Web App...${NC}"
    az webapp create \
        --resource-group $RESOURCE_GROUP \
        --plan $APP_PLAN \
        --name $APP_NAME \
        --runtime "DOTNET|9.0"
fi

# Deploy
echo -e "${GREEN}☁️ Deploying to Azure...${NC}"
az webapp deploy \
    --resource-group $RESOURCE_GROUP \
    --name $APP_NAME \
    --src-path ./publish \
    --type zip

echo -e "${GREEN}✅ Backend deployed successfully!${NC}"
echo ""
echo "🌐 Your API is available at:"
echo "   https://$APP_NAME.azurewebsites.net"
echo ""
echo "📝 Next steps:"
echo "   1. Configure environment variables:"
echo "      az webapp config appsettings set --resource-group $RESOURCE_GROUP --name $APP_NAME --settings Jwt__Key='YOUR_SECRET'"
echo "   2. Set connection string:"
echo "      az webapp config connection-string set --resource-group $RESOURCE_GROUP --name $APP_NAME --connection-string-type SQLAzure --settings DefaultConnection='YOUR_CONNECTION_STRING'"
echo "   3. Run migrations:"
echo "      az webapp ssh --resource-group $RESOURCE_GROUP --name $APP_NAME --command 'cd /home/site/wwwroot && dotnet ef database update'"

