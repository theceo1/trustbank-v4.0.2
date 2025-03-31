#!/bin/bash

# Generate a random email
TIMESTAMP=$(date +%s)
EMAIL="test${TIMESTAMP}@example.com"
PASSWORD="trustbank123"
FIRST_NAME="Test"
LAST_NAME="User"

# Check if jq is installed
if ! command -v jq &> /dev/null; then
    echo "Error: jq is required but not installed. Please install jq first."
    exit 1
fi

# Create a cookie jar file
COOKIE_JAR="/tmp/test-signup-cookies.txt"
rm -f "$COOKIE_JAR"

echo "1. Creating new user with email: $EMAIL"
SIGNUP_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"firstName\":\"$FIRST_NAME\",\"lastName\":\"$LAST_NAME\"}")

echo "Signup Response:"
echo "$SIGNUP_RESPONSE" | jq '.' || echo "$SIGNUP_RESPONSE"

# Check if signup was successful
if [[ $(echo "$SIGNUP_RESPONSE" | jq -r '.error') != "null" ]]; then
    echo "Error during signup: $(echo "$SIGNUP_RESPONSE" | jq -r '.error')"
    rm -f "$COOKIE_JAR"
    exit 1
fi

# Extract Quidax ID from signup response
QUIDAX_ID=$(echo "$SIGNUP_RESPONSE" | jq -r '.data.quidax_id')
echo "Quidax ID: $QUIDAX_ID"

echo -e "\n2. Logging in with new user"
LOGIN_RESPONSE=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR" \
  -c "$COOKIE_JAR" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")

echo "Login Response:"
echo "$LOGIN_RESPONSE" | jq '.' || echo "$LOGIN_RESPONSE"

# Check if login was successful
if [[ $(echo "$LOGIN_RESPONSE" | jq -r '.error') != "null" ]]; then
    echo "Error during login: $(echo "$LOGIN_RESPONSE" | jq -r '.error')"
    rm -f "$COOKIE_JAR"
    exit 1
fi

echo -e "\n3. Fetching user profile"
PROFILE_RESPONSE=$(curl -s -X GET http://localhost:3000/api/user/profile \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR")

echo "Profile Response:"
echo "$PROFILE_RESPONSE" | jq '.' || echo "$PROFILE_RESPONSE"

# Check if profile fetch was successful
if [[ $(echo "$PROFILE_RESPONSE" | jq -r '.error') != "null" ]]; then
    echo "Error fetching profile: $(echo "$PROFILE_RESPONSE" | jq -r '.error')"
    rm -f "$COOKIE_JAR"
    exit 1
fi

echo -e "\n4. Fetching wallet data"
WALLET_RESPONSE=$(curl -s -X GET http://localhost:3000/api/wallet \
  -H "Content-Type: application/json" \
  -b "$COOKIE_JAR")

echo "Wallet Response:"
echo "$WALLET_RESPONSE" | jq '.' || echo "$WALLET_RESPONSE"

# Check if wallet fetch was successful
if [[ $(echo "$WALLET_RESPONSE" | jq -r '.error') != "null" ]]; then
    echo "Error fetching wallet: $(echo "$WALLET_RESPONSE" | jq -r '.error')"
    rm -f "$COOKIE_JAR"
    exit 1
fi

# Clean up
rm -f "$COOKIE_JAR"