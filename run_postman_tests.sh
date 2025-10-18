#!/bin/bash

# 🧪 Newman Test Runner for Food & Beverage Management API
# This script runs the complete Postman collection with Newman

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
COLLECTION_FILE="Food_Beverage_API_Collection.postman_collection.json"
ENVIRONMENT_FILE="postman_environment.json"
REPORT_DIR="test_reports"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")

echo -e "${BLUE}🧪 Newman Test Runner for Food & Beverage Management API${NC}"
echo "=============================================================="

# Check if Newman is installed
if ! command -v newman &> /dev/null; then
    echo -e "${RED}❌ Newman is not installed. Installing...${NC}"
    npm install -g newman
fi

# Check if collection file exists
if [ ! -f "$COLLECTION_FILE" ]; then
    echo -e "${RED}❌ Collection file not found: $COLLECTION_FILE${NC}"
    echo "Please ensure the Postman collection is in the current directory."
    exit 1
fi

# Create environment file if it doesn't exist
if [ ! -f "$ENVIRONMENT_FILE" ]; then
    echo -e "${YELLOW}📝 Creating environment file...${NC}"
    cat > "$ENVIRONMENT_FILE" << EOF
{
    "id": "food-beverage-env",
    "name": "Food & Beverage Management Environment",
    "values": [
        {
            "key": "baseUrl",
            "value": "http://localhost:5152",
            "enabled": true
        },
        {
            "key": "accessToken",
            "value": "",
            "enabled": true
        },
        {
            "key": "refreshToken",
            "value": "",
            "enabled": true
        },
        {
            "key": "adminToken",
            "value": "",
            "enabled": true
        },
        {
            "key": "adminEmail",
            "value": "admin@system.com",
            "enabled": true
        },
        {
            "key": "adminPassword",
            "value": "Admin123!",
            "enabled": true
        },
        {
            "key": "testUserEmail",
            "value": "testuser@example.com",
            "enabled": true
        },
        {
            "key": "testUserPassword",
            "value": "Test123!",
            "enabled": true
        }
    ]
}
EOF
    echo -e "${GREEN}✅ Environment file created${NC}"
fi

# Create reports directory
mkdir -p "$REPORT_DIR"

# Function to run specific test suites
run_test_suite() {
    local suite_name=$1
    local folder_pattern=$2
    local report_file="$REPORT_DIR/${suite_name}_${TIMESTAMP}.html"
    
    echo -e "${YELLOW}🧪 Running $suite_name tests...${NC}"
    
    newman run "$COLLECTION_FILE" \
        --environment "$ENVIRONMENT_FILE" \
        --folder "$folder_pattern" \
        --reporters cli,html \
        --reporter-html-export "$report_file" \
        --timeout-request 10000 \
        --timeout-script 5000 \
        --delay-request 1000 \
        --bail
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ $suite_name tests passed${NC}"
        echo "Report: $report_file"
    else
        echo -e "${RED}❌ $suite_name tests failed${NC}"
        return 1
    fi
}

# Function to run all tests
run_all_tests() {
    local report_file="$REPORT_DIR/complete_test_${TIMESTAMP}.html"
    
    echo -e "${YELLOW}🧪 Running complete test suite...${NC}"
    
    newman run "$COLLECTION_FILE" \
        --environment "$ENVIRONMENT_FILE" \
        --reporters cli,html \
        --reporter-html-export "$report_file" \
        --timeout-request 10000 \
        --timeout-script 5000 \
        --delay-request 1000 \
        --bail
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}✅ All tests passed${NC}"
        echo "Report: $report_file"
    else
        echo -e "${RED}❌ Some tests failed${NC}"
        return 1
    fi
}

# Function to run smoke tests (critical paths only)
run_smoke_tests() {
    echo -e "${YELLOW}💨 Running smoke tests (critical paths only)...${NC}"
    
    # Authentication
    run_test_suite "Authentication" "🔐 Authentication"
    
    # Core CRUD operations
    run_test_suite "Core_CRUD" "📦 Products"
    run_test_suite "Categories" "📂 Categories"
    run_test_suite "Warehouses" "🏪 Warehouses"
    
    # Business workflows
    run_test_suite "Sales_Workflow" "🛍️ Sales Management"
    run_test_suite "Purchase_Workflow" "🛒 Purchase Management"
    
    echo -e "${GREEN}✅ Smoke tests completed${NC}"
}

# Function to run integration tests
run_integration_tests() {
    echo -e "${YELLOW}🔗 Running integration tests...${NC}"
    
    # User workflows
    run_test_suite "User_Workflows" "👤 User Experience"
    
    # Admin workflows
    run_test_suite "Admin_Workflows" "👑 Admin Dashboard"
    
    # Advanced features
    run_test_suite "Assembly" "🔧 Product Assembly"
    run_test_suite "Requests" "📋 Product Request"
    run_test_suite "Analytics" "📊 Product Movement Report"
    
    echo -e "${GREEN}✅ Integration tests completed${NC}"
}

# Function to generate test summary
generate_summary() {
    echo -e "${BLUE}📊 Test Summary${NC}"
    echo "=================="
    echo "Collection: $COLLECTION_FILE"
    echo "Environment: $ENVIRONMENT_FILE"
    echo "Reports Directory: $REPORT_DIR"
    echo "Timestamp: $TIMESTAMP"
    echo ""
    echo "Available Reports:"
    ls -la "$REPORT_DIR"/*.html 2>/dev/null || echo "No reports generated yet"
    echo ""
}

# Main menu
show_menu() {
    echo -e "${BLUE}Select test type:${NC}"
    echo "1) Smoke Tests (Critical paths only)"
    echo "2) Integration Tests (All workflows)"
    echo "3) Complete Test Suite (Everything)"
    echo "4) Custom Test Suite"
    echo "5) Generate Summary"
    echo "6) Exit"
    echo ""
    read -p "Enter your choice (1-6): " choice
}

# Main execution
main() {
    echo -e "${BLUE}Starting Newman test runner...${NC}"
    
    # Check if API is running
    echo -e "${YELLOW}🔍 Checking if API is running...${NC}"
    if curl -s http://localhost:5152/api/health > /dev/null; then
        echo -e "${GREEN}✅ API is running${NC}"
    else
        echo -e "${RED}❌ API is not running. Please start the API first.${NC}"
        echo "Run: cd Api && dotnet run"
        exit 1
    fi
    
    while true; do
        show_menu
        case $choice in
            1)
                run_smoke_tests
                ;;
            2)
                run_integration_tests
                ;;
            3)
                run_all_tests
                ;;
            4)
                echo -e "${YELLOW}Available folders:${NC}"
                newman run "$COLLECTION_FILE" --environment "$ENVIRONMENT_FILE" --dry-run | grep "Folder:"
                echo ""
                read -p "Enter folder name: " folder_name
                run_test_suite "Custom_$folder_name" "$folder_name"
                ;;
            5)
                generate_summary
                ;;
            6)
                echo -e "${GREEN}👋 Goodbye!${NC}"
                exit 0
                ;;
            *)
                echo -e "${RED}Invalid choice. Please try again.${NC}"
                ;;
        esac
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run if script is executed directly
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    main "$@"
fi


