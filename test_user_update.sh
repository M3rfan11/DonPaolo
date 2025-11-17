#!/bin/bash
# Test script to verify user update functionality

echo "🧪 Testing User Update Functionality"
echo "======================================"
echo ""

# Step 1: Login and get token
echo "1️⃣ Logging in..."
LOGIN_RESPONSE=$(curl -s -X POST https://donpaolo.onrender.com/api/Auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['accessToken'])" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get current user data
echo "2️⃣ Getting current user data (ID: 1)..."
BEFORE=$(curl -s -X GET "https://donpaolo.onrender.com/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

BEFORE_NAME=$(echo $BEFORE | python3 -c "import sys, json; print(json.load(sys.stdin)['fullName'])" 2>/dev/null)
BEFORE_UPDATED=$(echo $BEFORE | python3 -c "import sys, json; print(json.load(sys.stdin)['updatedAt'])" 2>/dev/null)

echo "   Current FullName: $BEFORE_NAME"
echo "   Last Updated: $BEFORE_UPDATED"
echo ""

# Step 3: Update user
TEST_NAME="Test Update $(date +%H:%M:%S)"
echo "3️⃣ Updating FullName to: '$TEST_NAME'..."
UPDATE_RESPONSE=$(curl -s -X PATCH "https://donpaolo.onrender.com/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"$TEST_NAME\"}")

UPDATE_NAME=$(echo $UPDATE_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin)['fullName'])" 2>/dev/null)

if [ "$UPDATE_NAME" = "$TEST_NAME" ]; then
  echo "   ✅ Update successful in API response"
else
  echo "   ❌ Update failed - API returned: $UPDATE_NAME"
  exit 1
fi
echo ""

# Step 4: Verify update persisted
echo "4️⃣ Verifying update persisted..."
sleep 2  # Wait a moment for database to sync

AFTER=$(curl -s -X GET "https://donpaolo.onrender.com/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

AFTER_NAME=$(echo $AFTER | python3 -c "import sys, json; print(json.load(sys.stdin)['fullName'])" 2>/dev/null)
AFTER_UPDATED=$(echo $AFTER | python3 -c "import sys, json; print(json.load(sys.stdin)['updatedAt'])" 2>/dev/null)

echo "   FullName in API: $AFTER_NAME"
echo "   UpdatedAt: $AFTER_UPDATED"
echo ""

if [ "$AFTER_NAME" = "$TEST_NAME" ]; then
  echo "✅ SUCCESS: Update persisted in API!"
  echo ""
  echo "📋 Next Steps:"
  echo "   1. Open your Supabase dashboard"
  echo "   2. Go to Table Editor → Users table"
  echo "   3. Check user ID 1"
  echo "   4. FullName should be: '$TEST_NAME'"
  echo ""
  echo "   If Supabase shows '$TEST_NAME', then ✅ the update is working!"
  echo "   If Supabase shows something else, then ❌ there's a database sync issue"
else
  echo "❌ FAILED: Update did not persist"
  exit 1
fi

