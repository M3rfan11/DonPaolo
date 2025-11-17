#!/bin/bash

# Script to test database connection from Render shell
# Run this in Render Shell: bash test_db_connection.sh

echo "========================================="
echo "Database Connection Test Script"
echo "========================================="
echo ""

# 1. Check if connection string environment variable is set
echo "1. Checking environment variables..."
echo "-----------------------------------"
if [ -z "$ConnectionStrings__DefaultConnection" ]; then
    echo "❌ ConnectionStrings__DefaultConnection is NOT set"
    echo "   Checking DATABASE_URL..."
    if [ -z "$DATABASE_URL" ]; then
        echo "❌ DATABASE_URL is also NOT set"
        echo "   Please set ConnectionStrings__DefaultConnection in Render dashboard"
        exit 1
    else
        echo "✅ DATABASE_URL is set"
        CONN_STRING="$DATABASE_URL"
    fi
else
    echo "✅ ConnectionStrings__DefaultConnection is set"
    CONN_STRING="$ConnectionStrings__DefaultConnection"
fi

# Mask password for display
MASKED_CONN=$(echo "$CONN_STRING" | sed 's/:[^@]*@/:***@/')
echo "   Connection string (masked): $MASKED_CONN"
echo ""

# 2. Parse connection string to extract components
echo "2. Parsing connection string..."
echo "-----------------------------------"
if [[ "$CONN_STRING" == postgresql://* ]] || [[ "$CONN_STRING" == postgres://* ]]; then
    # Extract components from URI format
    # postgresql://user:password@host:port/database
    PROTOCOL=$(echo "$CONN_STRING" | cut -d: -f1)
    USER_PASS=$(echo "$CONN_STRING" | cut -d@ -f1 | cut -d/ -f3)
    USERNAME=$(echo "$USER_PASS" | cut -d: -f1)
    PASSWORD=$(echo "$USER_PASS" | cut -d: -f2)
    HOST_PORT=$(echo "$CONN_STRING" | cut -d@ -f2 | cut -d/ -f1)
    HOST=$(echo "$HOST_PORT" | cut -d: -f1)
    PORT=$(echo "$HOST_PORT" | cut -d: -f2)
    DATABASE=$(echo "$CONN_STRING" | cut -d/ -f4 | cut -d? -f1)
    
    echo "   Protocol: $PROTOCOL"
    echo "   Username: $USERNAME"
    echo "   Password: *** (hidden)"
    echo "   Host: $HOST"
    echo "   Port: ${PORT:-5432}"
    echo "   Database: $DATABASE"
else
    echo "   Connection string is not in URI format"
    echo "   Trying to extract from standard format..."
    # Try to extract from standard format: Host=...;Port=...;Database=...;Username=...;Password=...
    HOST=$(echo "$CONN_STRING" | grep -oP 'Host=\K[^;]+' || echo "")
    PORT=$(echo "$CONN_STRING" | grep -oP 'Port=\K[^;]+' || echo "5432")
    DATABASE=$(echo "$CONN_STRING" | grep -oP 'Database=\K[^;]+' || echo "")
    USERNAME=$(echo "$CONN_STRING" | grep -oP 'Username=\K[^;]+' || echo "")
    PASSWORD=$(echo "$CONN_STRING" | grep -oP 'Password=\K[^;]+' || echo "")
    
    echo "   Host: $HOST"
    echo "   Port: $PORT"
    echo "   Database: $DATABASE"
    echo "   Username: $USERNAME"
    echo "   Password: *** (hidden)"
fi
echo ""

# 3. Test DNS resolution
echo "3. Testing DNS resolution..."
echo "-----------------------------------"
if [ -n "$HOST" ]; then
    echo "   Resolving hostname: $HOST"
    if command -v nslookup &> /dev/null; then
        nslookup "$HOST" 2>&1 | head -10
    elif command -v host &> /dev/null; then
        host "$HOST" 2>&1
    else
        echo "   DNS tools not available, trying ping..."
        ping -c 2 "$HOST" 2>&1 | head -5
    fi
else
    echo "   ❌ Could not extract hostname from connection string"
fi
echo ""

# 4. Test network connectivity
echo "4. Testing network connectivity..."
echo "-----------------------------------"
if [ -n "$HOST" ] && [ -n "$PORT" ]; then
    echo "   Testing connection to $HOST:$PORT"
    if command -v nc &> /dev/null; then
        if nc -zv -w 5 "$HOST" "${PORT:-5432}" 2>&1; then
            echo "   ✅ Port is open and reachable"
        else
            echo "   ❌ Cannot reach $HOST:$PORT"
            echo "   This could indicate:"
            echo "   - Firewall blocking the connection"
            echo "   - Network routing issues"
            echo "   - Host is down"
        fi
    elif command -v timeout &> /dev/null && command -v bash &> /dev/null; then
        # Fallback: try to connect using bash
        timeout 5 bash -c "echo > /dev/tcp/$HOST/${PORT:-5432}" 2>&1
        if [ $? -eq 0 ]; then
            echo "   ✅ Port is open and reachable"
        else
            echo "   ❌ Cannot reach $HOST:$PORT"
        fi
    else
        echo "   ⚠️  Network testing tools not available"
    fi
else
    echo "   ❌ Cannot test connectivity (missing host/port)"
fi
echo ""

# 5. Test PostgreSQL connection with psql (if available)
echo "5. Testing PostgreSQL connection..."
echo "-----------------------------------"
if command -v psql &> /dev/null; then
    echo "   Attempting connection with psql..."
    export PGPASSWORD="$PASSWORD"
    if psql -h "$HOST" -p "${PORT:-5432}" -U "$USERNAME" -d "$DATABASE" -c "SELECT version();" 2>&1; then
        echo "   ✅ PostgreSQL connection successful!"
    else
        echo "   ❌ PostgreSQL connection failed"
        echo "   Error details above"
    fi
    unset PGPASSWORD
else
    echo "   ⚠️  psql not available in this environment"
    echo "   You can install it or test from your local machine"
fi
echo ""

# 6. Summary
echo "========================================="
echo "Summary"
echo "========================================="
echo "Connection String: $MASKED_CONN"
echo ""
echo "If connection failed, check:"
echo "1. Supabase → Settings → Database → Network Restrictions"
echo "   Make sure 'all IP addresses' is allowed"
echo "2. Verify password is correct in connection string"
echo "3. Check if using connection pooler (recommended)"
echo "4. Verify hostname resolves to IPv4 (not just IPv6)"
echo ""

