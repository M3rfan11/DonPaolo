#!/bin/bash
echo "🧪 Testing Local Connection to Supabase Pooler"
echo "=============================================="
echo ""

# Check if backend is running
if ! lsof -ti:5152 > /dev/null 2>&1; then
    echo "❌ Backend is not running on port 5152"
    echo "💡 Start it with: cd Api && dotnet run"
    exit 1
fi

echo "✅ Backend is running"
echo ""

# Test connection
echo "1️⃣ Testing database connection..."
HEALTH=$(curl -s http://localhost:5152/api/Health 2>/dev/null)

if [ -z "$HEALTH" ]; then
    echo "❌ Backend not responding"
    exit 1
fi

echo "✅ Backend is responding"
echo ""

# Test login
echo "2️⃣ Testing login..."
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:5152/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo "❌ Login failed"
    echo "Response: $LOGIN_RESPONSE"
    exit 1
fi

echo "✅ Login successful"
echo ""

# Test user update
echo "3️⃣ Testing user update (ID: 1)..."
BEFORE=$(curl -s -X GET "http://localhost:5152/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

BEFORE_NAME=$(echo $BEFORE | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)
echo "   Current FullName: $BEFORE_NAME"
echo ""

TEST_NAME="Local Test $(date +%H:%M:%S)"
echo "4️⃣ Updating FullName to: '$TEST_NAME'..."
UPDATE_RESPONSE=$(curl -s -X PATCH "http://localhost:5152/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"$TEST_NAME\"}")

UPDATE_NAME=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)

if [ "$UPDATE_NAME" = "$TEST_NAME" ]; then
    echo "   ✅ Update successful in API"
else
    echo "   ❌ Update failed - API returned: $UPDATE_NAME"
    exit 1
fi
echo ""

# Wait a moment
echo "5️⃣ Waiting 2 seconds for database sync..."
sleep 2

# Verify in Supabase (via API)
echo "6️⃣ Verifying update persisted..."
AFTER=$(curl -s -X GET "http://localhost:5152/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

AFTER_NAME=$(echo $AFTER | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)

echo "   FullName in API: $AFTER_NAME"
echo ""

if [ "$AFTER_NAME" = "$TEST_NAME" ]; then
    echo "✅ SUCCESS: Update persisted!"
    echo ""
    echo "📋 Next Steps:"
    echo "   1. Check Supabase dashboard - FullName should be: '$TEST_NAME'"
    echo "   2. If Supabase shows '$TEST_NAME', then ✅ everything works!"
    echo "   3. Update Render with the same pooler connection string"
else
    echo "❌ FAILED: Update did not persist"
    exit 1
fi
