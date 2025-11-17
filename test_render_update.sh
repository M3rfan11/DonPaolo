#!/bin/bash
# Test script to verify user update on Render deployment

RENDER_URL="https://donpaolo.onrender.com"

echo "🧪 Testing User Update on Render"
echo "=================================="
echo ""

# Step 1: Login and get token
echo "1️⃣ Logging in to Render backend..."
LOGIN_RESPONSE=$(curl -s -X POST "$RENDER_URL/api/Auth/login" \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@company.com","password":"admin123"}')

TOKEN=$(echo $LOGIN_RESPONSE | python3 -c "import sys, json; print(json.load(sys.stdin).get('accessToken', ''))" 2>/dev/null)

if [ -z "$TOKEN" ]; then
  echo "❌ Failed to get authentication token"
  echo "Response: $LOGIN_RESPONSE"
  exit 1
fi

echo "✅ Login successful"
echo ""

# Step 2: Get current user data
echo "2️⃣ Getting current user data (ID: 1)..."
BEFORE=$(curl -s -X GET "$RENDER_URL/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

BEFORE_NAME=$(echo $BEFORE | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)
BEFORE_UPDATED=$(echo $BEFORE | python3 -c "import sys, json; print(json.load(sys.stdin).get('updatedAt', 'ERROR'))" 2>/dev/null)

echo "   Current FullName: $BEFORE_NAME"
echo "   Last Updated: $BEFORE_UPDATED"
echo ""

# Step 3: Update user
TEST_NAME="Render Test $(date +%H:%M:%S)"
echo "3️⃣ Updating FullName to: '$TEST_NAME'..."
UPDATE_RESPONSE=$(curl -s -X PATCH "$RENDER_URL/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"fullName\":\"$TEST_NAME\"}" \
  -w "\nHTTP_CODE:%{http_code}")

HTTP_CODE=$(echo "$UPDATE_RESPONSE" | grep "HTTP_CODE" | sed 's/HTTP_CODE://')
UPDATE_BODY=$(echo "$UPDATE_RESPONSE" | grep -v "HTTP_CODE")

if [ "$HTTP_CODE" = "200" ]; then
  UPDATE_NAME=$(echo $UPDATE_BODY | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)
  if [ "$UPDATE_NAME" = "$TEST_NAME" ]; then
    echo "   ✅ Update successful in API response (HTTP $HTTP_CODE)"
  else
    echo "   ⚠️ Update returned HTTP $HTTP_CODE but FullName mismatch: $UPDATE_NAME"
  fi
else
  echo "   ❌ Update failed - HTTP $HTTP_CODE"
  echo "   Response: $UPDATE_BODY"
  exit 1
fi
echo ""

# Step 4: Verify update persisted
echo "4️⃣ Verifying update persisted..."
sleep 3  # Wait a moment for database to sync

AFTER=$(curl -s -X GET "$RENDER_URL/api/Users/1" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json")

AFTER_NAME=$(echo $AFTER | python3 -c "import sys, json; print(json.load(sys.stdin).get('fullName', 'ERROR'))" 2>/dev/null)
AFTER_UPDATED=$(echo $AFTER | python3 -c "import sys, json; print(json.load(sys.stdin).get('updatedAt', 'ERROR'))" 2>/dev/null)

echo "   FullName in API: $AFTER_NAME"
echo "   UpdatedAt: $AFTER_UPDATED"
echo ""

if [ "$AFTER_NAME" = "$TEST_NAME" ]; then
  echo "✅ SUCCESS: Update persisted in Render API!"
  echo ""
  echo "📋 Final Step:"
  echo "   1. Open your Supabase dashboard"
  echo "   2. Go to Table Editor → Users table"
  echo "   3. Check user ID 1"
  echo "   4. FullName should be: '$TEST_NAME'"
  echo ""
  echo "   If Supabase shows '$TEST_NAME', then ✅ EVERYTHING WORKS!"
else
  echo "❌ FAILED: Update did not persist in API"
  echo "   Expected: $TEST_NAME"
  echo "   Got: $AFTER_NAME"
  exit 1
fi

