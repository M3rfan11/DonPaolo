#!/bin/bash
# Verification script to ensure deployment readiness

echo "🔍 Verifying Deployment Readiness..."
echo ""

ERRORS=0

# Check if printer folder is in .gitignore
if grep -q "^printer/" .gitignore; then
    echo "✅ printer/ folder is in .gitignore"
else
    echo "❌ printer/ folder is NOT in .gitignore"
    ERRORS=$((ERRORS + 1))
fi

# Check if ePOS SDK exists in public folder
if [ -f "frontend/public/epos-2.27.0.js" ]; then
    echo "✅ ePOS SDK found in frontend/public/"
else
    echo "❌ ePOS SDK NOT found in frontend/public/"
    ERRORS=$((ERRORS + 1))
fi

# Check if .dockerignore exists
if [ -f ".dockerignore" ]; then
    if grep -q "printer/" .dockerignore; then
        echo "✅ .dockerignore excludes printer/"
    else
        echo "⚠️  .dockerignore exists but doesn't exclude printer/"
    fi
else
    echo "⚠️  .dockerignore not found (optional)"
fi

# Check if Api/.dockerignore exists
if [ -f "Api/.dockerignore" ]; then
    if grep -q "printer/" Api/.dockerignore; then
        echo "✅ Api/.dockerignore excludes printer/"
    else
        echo "⚠️  Api/.dockerignore exists but doesn't exclude printer/"
    fi
else
    echo "⚠️  Api/.dockerignore not found (optional)"
fi

# Check backend build
echo ""
echo "🔨 Testing backend build..."
cd Api
if dotnet build -c Release --no-restore > /dev/null 2>&1; then
    echo "✅ Backend builds successfully"
else
    echo "❌ Backend build failed"
    ERRORS=$((ERRORS + 1))
fi
cd ..

# Check frontend build (just verify structure)
echo ""
echo "🔨 Testing frontend structure..."
if [ -f "frontend/package.json" ]; then
    echo "✅ Frontend package.json found"
    if [ -d "frontend/src" ]; then
        echo "✅ Frontend src directory exists"
    else
        echo "❌ Frontend src directory missing"
        ERRORS=$((ERRORS + 1))
    fi
else
    echo "❌ Frontend package.json not found"
    ERRORS=$((ERRORS + 1))
fi

# Check deployment files
echo ""
echo "📦 Checking deployment files..."
if [ -f "render.yaml" ]; then
    echo "✅ render.yaml found"
fi
if [ -f "vercel.json" ]; then
    echo "✅ vercel.json found"
fi
if [ -f "deploy-backend.sh" ]; then
    echo "✅ deploy-backend.sh found"
fi
if [ -f "deploy-frontend.sh" ]; then
    echo "✅ deploy-frontend.sh found"
fi

echo ""
if [ $ERRORS -eq 0 ]; then
    echo "🎉 All checks passed! Ready for deployment."
    exit 0
else
    echo "❌ Found $ERRORS error(s). Please fix before deploying."
    exit 1
fi

