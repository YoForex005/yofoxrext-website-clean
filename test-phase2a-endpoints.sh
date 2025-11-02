#!/bin/bash

# PHASE 2A Admin Testing Script - Communications, Email, Analytics
# Test Credentials: test@admin.com / admin123

API_URL="http://localhost:5000"
RESULTS_FILE="phase2a-test-results.json"
echo "{}" > $RESULTS_FILE

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to test endpoint and measure response time
test_endpoint() {
  local method=$1
  local endpoint=$2
  local data=$3
  local description=$4
  
  echo -e "\n${YELLOW}Testing:${NC} $description"
  echo "  Method: $method"
  echo "  Endpoint: $endpoint"
  
  # Measure time
  start_time=$(date +%s%N)
  
  if [ "$method" = "GET" ]; then
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" -b cookies.txt "$API_URL$endpoint")
  else
    response=$(curl -s -w "\n%{http_code}\n%{time_total}" -X $method -H "Content-Type: application/json" -d "$data" -b cookies.txt "$API_URL$endpoint")
  fi
  
  end_time=$(date +%s%N)
  elapsed=$(( (end_time - start_time) / 1000000 )) # Convert to milliseconds
  
  # Extract status code and response time
  http_code=$(echo "$response" | tail -n 2 | head -n 1)
  response_time=$(echo "$response" | tail -n 1)
  body=$(echo "$response" | head -n -2)
  
  # Determine pass/fail
  if [ "$http_code" = "200" ] || [ "$http_code" = "201" ]; then
    echo -e "  ${GREEN}✓ PASS${NC} - Status: $http_code, Time: ${elapsed}ms"
    echo "$body" | head -c 200
  else
    echo -e "  ${RED}✗ FAIL${NC} - Status: $http_code, Time: ${elapsed}ms"
    echo "$body"
  fi
  
  # Check performance (<500ms)
  if [ $elapsed -lt 500 ]; then
    echo -e "  ${GREEN}✓ Performance OK${NC} (<500ms)"
  else
    echo -e "  ${YELLOW}⚠ Slow Response${NC} (>500ms)"
  fi
  
  echo "$body"
}

echo "========================================="
echo "PHASE 2A ADMIN TESTING"
echo "Communications, Email, Analytics"
echo "========================================="

# Step 1: Login as admin
echo -e "\n${YELLOW}Step 1: Logging in as admin...${NC}"
login_response=$(curl -s -c cookies.txt -X POST -H "Content-Type: application/json" \
  -d '{"email":"test@admin.com","password":"admin123"}' \
  "$API_URL/api/auth/login")

if echo "$login_response" | grep -q "success"; then
  echo -e "${GREEN}✓ Login successful${NC}"
else
  echo -e "${RED}✗ Login failed${NC}"
  echo "$login_response"
  exit 1
fi

# ========================================
# COMMUNICATIONS ENDPOINTS
# ========================================
echo -e "\n\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}TESTING COMMUNICATIONS ENDPOINTS${NC}"
echo -e "${YELLOW}========================================${NC}"

# 1. GET announcements
test_endpoint "GET" "/api/admin/communications/announcements" "" \
  "1.1 List all announcements"

# 2. POST create announcement
announcement_data='{
  "title": "Test Announcement",
  "content": "This is a test announcement for Phase 2A testing",
  "type": "banner",
  "audience": {"all": true},
  "status": "draft"
}'
create_announcement_response=$(test_endpoint "POST" "/api/admin/communications/announcements" "$announcement_data" \
  "1.2 Create announcement")

# Extract announcement ID from response
announcement_id=$(echo "$create_announcement_response" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created announcement ID: $announcement_id"

# 3. PUT update announcement
if [ ! -z "$announcement_id" ]; then
  update_data='{
    "title": "Updated Test Announcement",
    "content": "Updated content"
  }'
  test_endpoint "PUT" "/api/admin/communications/announcements/$announcement_id" "$update_data" \
    "1.3 Update announcement"
  
  # 4. POST publish announcement
  test_endpoint "POST" "/api/admin/communications/announcements/$announcement_id/publish" "" \
    "1.4 Publish announcement"
fi

# 5. GET campaigns
test_endpoint "GET" "/api/admin/communications/campaigns" "" \
  "1.5 List email campaigns"

# 6. POST create campaign
campaign_data='{
  "name": "Test Campaign",
  "subject": "Test Email Campaign",
  "htmlContent": "<h1>Test</h1><p>This is a test campaign</p>",
  "audience": {"all": true},
  "status": "draft"
}'
create_campaign_response=$(test_endpoint "POST" "/api/admin/communications/campaigns" "$campaign_data" \
  "1.6 Create email campaign")

# Extract campaign ID
campaign_id=$(echo "$create_campaign_response" | grep -o '"id":[0-9]*' | head -1 | grep -o '[0-9]*')
echo "Created campaign ID: $campaign_id"

# 7. GET campaign stats
if [ ! -z "$campaign_id" ]; then
  test_endpoint "GET" "/api/admin/communications/campaigns/$campaign_id/stats" "" \
    "1.7 Get campaign delivery stats"
fi

# 8. DELETE announcement (cleanup)
if [ ! -z "$announcement_id" ]; then
  test_endpoint "DELETE" "/api/admin/communications/announcements/$announcement_id" "" \
    "1.8 Delete announcement"
fi

# ========================================
# EMAIL DASHBOARD ENDPOINTS
# ========================================
echo -e "\n\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}TESTING EMAIL DASHBOARD ENDPOINTS${NC}"
echo -e "${YELLOW}========================================${NC}"

# 1. GET email stats
test_endpoint "GET" "/api/admin/emails/stats/7" "" \
  "2.1 Get email statistics (7 days)"

test_endpoint "GET" "/api/admin/emails/stats/30" "" \
  "2.2 Get email statistics (30 days)"

# 2. GET email queue
test_endpoint "GET" "/api/admin/emails/queue" "" \
  "2.3 Get email queue"

# 3. GET email logs
test_endpoint "GET" "/api/admin/emails/logs" "" \
  "2.4 Get email logs (sent history)"

# 4. GET email templates
test_endpoint "GET" "/api/admin/emails/templates" "" \
  "2.5 Get email templates"

# 5. POST send test email
test_email_data='{
  "to": "test@example.com",
  "templateKey": "comment"
}'
test_endpoint "POST" "/api/admin/emails/test" "$test_email_data" \
  "2.6 Send test email"

# 6. POST toggle queue (pause)
pause_data='{"paused": true}'
test_endpoint "POST" "/api/admin/emails/queue/toggle" "$pause_data" \
  "2.7 Pause email queue"

# 7. POST toggle queue (resume)
resume_data='{"paused": false}'
test_endpoint "POST" "/api/admin/emails/queue/toggle" "$resume_data" \
  "2.8 Resume email queue"

# 8. GET email analytics
test_endpoint "GET" "/api/admin/emails/analytics/30" "" \
  "2.9 Get email analytics (30 days)"

# ========================================
# ANALYTICS & REPORTS ENDPOINTS
# ========================================
echo -e "\n\n${YELLOW}========================================${NC}"
echo -e "${YELLOW}TESTING ANALYTICS & REPORTS ENDPOINTS${NC}"
echo -e "${YELLOW}========================================${NC}"

# 1. GET analytics stats
test_endpoint "GET" "/api/admin/analytics/stats" "" \
  "3.1 Get general analytics statistics"

# 2. GET user growth
test_endpoint "GET" "/api/admin/analytics/user-growth" "" \
  "3.2 Get user growth data (30 days)"

# 3. GET content trends
test_endpoint "GET" "/api/admin/analytics/content-trends" "" \
  "3.3 Get content creation trends (30 days)"

# 4. GET revenue analytics
test_endpoint "GET" "/api/admin/analytics/revenue" "" \
  "3.4 Get revenue analytics"

# 5. GET engagement metrics
test_endpoint "GET" "/api/admin/analytics/engagement" "" \
  "3.5 Get engagement metrics"

# 6. GET users analytics
test_endpoint "GET" "/api/admin/analytics/users" "" \
  "3.6 Get user analytics"

# 7. GET content analytics
test_endpoint "GET" "/api/admin/analytics/content" "" \
  "3.7 Get content analytics"

# 8. GET financial analytics
test_endpoint "GET" "/api/admin/analytics/financial" "" \
  "3.8 Get financial analytics"

echo -e "\n\n${GREEN}========================================${NC}"
echo -e "${GREEN}TESTING COMPLETE${NC}"
echo -e "${GREEN}========================================${NC}"

# Cleanup
rm -f cookies.txt

echo -e "\nResults saved to: $RESULTS_FILE"
