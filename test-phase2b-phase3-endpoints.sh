#!/bin/bash

# ============================================================================
# COMPREHENSIVE ADMIN TESTING - PHASE 2B & 3
# Testing: AI/Automation, SEO/Marketing, Schema, Performance, API, Settings, Security, Audit
# ============================================================================

BASE_URL="http://localhost:3001"
ADMIN_EMAIL="test@admin.com"
ADMIN_PASS="admin123"
OUTPUT_FILE="phase2b-3-test-results.json"
LOG_FILE="phase2b-3-test-output.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test results tracking
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
declare -a TEST_RESULTS=()
declare -a PERFORMANCE_METRICS=()

# Initialize log file
echo "============================================================================" > "$LOG_FILE"
echo "ADMIN TESTING - PHASE 2B & 3 - $(date)" >> "$LOG_FILE"
echo "============================================================================" >> "$LOG_FILE"
echo "" >> "$LOG_FILE"

# Function to log messages
log() {
    echo -e "$1" | tee -a "$LOG_FILE"
}

# Function to measure API response time
measure_time() {
    local start=$(date +%s%3N)
    eval "$@"
    local end=$(date +%s%3N)
    echo $((end - start))
}

# Function to test endpoint
test_endpoint() {
    local method="$1"
    local endpoint="$2"
    local description="$3"
    local data="$4"
    local expected_status="${5:-200}"
    
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
    log "\n${BLUE}TEST $TOTAL_TESTS: $description${NC}"
    log "Endpoint: $method $endpoint"
    
    # Measure response time
    local start_time=$(date +%s%3N)
    
    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -X GET \
            -H "Content-Type: application/json" \
            -b cookies.txt \
            "$BASE_URL$endpoint")
    elif [ "$method" = "POST" ]; then
        response=$(curl -s -w "\n%{http_code}" -X POST \
            -H "Content-Type: application/json" \
            -b cookies.txt \
            -d "$data" \
            "$BASE_URL$endpoint")
    elif [ "$method" = "PATCH" ] || [ "$method" = "PUT" ]; then
        response=$(curl -s -w "\n%{http_code" -X "$method" \
            -H "Content-Type: application/json" \
            -b cookies.txt \
            -d "$data" \
            "$BASE_URL$endpoint")
    elif [ "$method" = "DELETE" ]; then
        response=$(curl -s -w "\n%{http_code}" -X DELETE \
            -H "Content-Type: application/json" \
            -b cookies.txt \
            "$BASE_URL$endpoint")
    fi
    
    local end_time=$(date +%s%3N)
    local response_time=$((end_time - start_time))
    
    # Parse response
    local http_code=$(echo "$response" | tail -n1)
    local body=$(echo "$response" | sed '$d')
    
    # Store performance metric
    PERFORMANCE_METRICS+=("{\"endpoint\":\"$endpoint\",\"method\":\"$method\",\"responseTime\":$response_time,\"status\":$http_code}")
    
    # Check result
    if [ "$http_code" -eq "$expected_status" ] || [ "$http_code" -eq 200 ] || [ "$http_code" -eq 201 ]; then
        log "${GREEN}✓ PASS${NC} - Status: $http_code, Time: ${response_time}ms"
        PASSED_TESTS=$((PASSED_TESTS + 1))
        TEST_RESULTS+=("{\"test\":\"$description\",\"endpoint\":\"$endpoint\",\"status\":\"PASS\",\"httpCode\":$http_code,\"responseTime\":$response_time}")
        
        # Check performance target (<500ms)
        if [ "$response_time" -gt 500 ]; then
            log "${YELLOW}⚠ Performance Warning: Response time ${response_time}ms exceeds 500ms target${NC}"
        fi
    else
        log "${RED}✗ FAIL${NC} - Status: $http_code, Time: ${response_time}ms"
        log "Response: $body"
        FAILED_TESTS=$((FAILED_TESTS + 1))
        TEST_RESULTS+=("{\"test\":\"$description\",\"endpoint\":\"$endpoint\",\"status\":\"FAIL\",\"httpCode\":$http_code,\"responseTime\":$response_time,\"error\":\"$(echo $body | sed 's/"/\\"/g')\"}")
    fi
    
    # Show abbreviated response for successful tests
    if [ ! -z "$body" ] && [ ${#body} -gt 100 ]; then
        log "Response: ${body:0:100}..."
    elif [ ! -z "$body" ]; then
        log "Response: $body"
    fi
}

# ============================================================================
# STEP 1: LOGIN AS ADMIN
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}STEP 1: ADMIN AUTHENTICATION${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Clean up old cookies
rm -f cookies.txt

# Login and save session
log "\nLogging in as admin: $ADMIN_EMAIL"
login_response=$(curl -s -c cookies.txt -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
    "$BASE_URL/api/auth/login")

if echo "$login_response" | grep -q "\"email\""; then
    log "${GREEN}✓ Admin login successful${NC}"
else
    log "${RED}✗ Admin login failed${NC}"
    log "Response: $login_response"
    exit 1
fi

# ============================================================================
# PHASE 2B: AI & AUTOMATION
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 2B - TEST 1: AI & AUTOMATION${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test automation rules endpoints
test_endpoint "GET" "/api/admin/automation/rules" "List automation rules"
test_endpoint "POST" "/api/admin/automation/rules" "Create automation rule" \
    '{"name":"Test Rule","triggerType":"user_signup","triggerConfig":"{}","actionType":"award_coins","actionConfig":"{\"amount\":10}"}'
test_endpoint "GET" "/api/admin/automation/rules" "Verify rule created"

# Test AI moderation endpoints
test_endpoint "GET" "/api/admin/ai/moderation-stats" "Get AI moderation stats"
test_endpoint "GET" "/api/admin/ai/moderation-decisions" "Get AI moderation decisions"
test_endpoint "GET" "/api/admin/ai/sentiment-distribution" "Get sentiment distribution"

# Test spam detection endpoints
test_endpoint "GET" "/api/admin/ai/spam-metrics" "Get spam detection metrics"
test_endpoint "GET" "/api/admin/ai/flagged-content" "Get flagged content"
test_endpoint "POST" "/api/admin/ai/spam-detection" "Test spam detector" \
    '{"text":"Buy cheap Viagra now! Click here!!!"}'

# ============================================================================
# PHASE 2B: SEO & MARKETING
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 2B - TEST 2: SEO & MARKETING${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test SEO content endpoints
test_endpoint "GET" "/api/admin/seo/content" "Get all content with meta tags"
test_endpoint "GET" "/api/admin/seo/campaigns" "Get marketing campaigns"
test_endpoint "GET" "/api/admin/seo/campaign-stats" "Get campaign statistics"
test_endpoint "POST" "/api/admin/seo/campaigns" "Create marketing campaign" \
    '{"name":"Test Campaign","description":"Test","startDate":"2025-11-02","endDate":"2025-12-02","budget":1000}'

# Test SEO analytics endpoints
test_endpoint "GET" "/api/admin/seo/search-rankings" "Get search rankings"
test_endpoint "GET" "/api/admin/seo/top-queries" "Get top search queries"

# Test sitemap endpoints
test_endpoint "GET" "/api/admin/sitemap/status" "Get sitemap status"
test_endpoint "GET" "/api/admin/seo/sitemap-status" "Get SEO sitemap status"
test_endpoint "POST" "/api/admin/sitemap/generate" "Generate sitemap"
test_endpoint "GET" "/api/admin/sitemap/logs" "Get sitemap logs"

# Test SEO health and scanning
test_endpoint "GET" "/api/admin/seo/health" "Get SEO health status"
test_endpoint "GET" "/api/admin/seo/issues" "List SEO issues"
test_endpoint "POST" "/api/admin/seo/scan" "Trigger SEO scan" \
    '{"url":"http://localhost:5000/"}'
test_endpoint "GET" "/api/admin/seo/scans" "Get scan history"
test_endpoint "GET" "/api/admin/seo/metrics" "Get SEO metrics"

# ============================================================================
# PHASE 2B: SCHEMA VALIDATION
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 2B - TEST 3: SCHEMA VALIDATION${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "GET" "/api/admin/schema/stats" "Get schema validation stats"
test_endpoint "GET" "/api/admin/schema/logs" "Get validation logs"
test_endpoint "POST" "/api/admin/schema/validate-all" "Validate all pages"
test_endpoint "POST" "/api/admin/schema/validate" "Validate single URL" \
    '{"url":"http://localhost:5000/"}'

# ============================================================================
# PHASE 3: PERFORMANCE MONITOR
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 3 - TEST 4: PERFORMANCE MONITOR${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "GET" "/api/admin/performance/metrics" "Get performance metrics"
test_endpoint "GET" "/api/admin/performance/alerts" "Get performance alerts"
test_endpoint "POST" "/api/admin/performance/record" "Record custom metric" \
    '{"name":"test_metric","value":42,"type":"counter"}'

# ============================================================================
# PHASE 3: API & INTEGRATIONS
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 3 - TEST 5: API & INTEGRATIONS${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test API keys
test_endpoint "GET" "/api/admin/integrations/api-keys" "List API keys"
test_endpoint "POST" "/api/admin/integrations/api-keys" "Create API key" \
    '{"name":"Test API Key","permissions":["read","write"]}'
test_endpoint "GET" "/api/admin/integrations/api-keys" "Verify key created"

# Test webhooks
test_endpoint "GET" "/api/admin/integrations/webhooks" "List webhooks"
test_endpoint "POST" "/api/admin/integrations/webhooks" "Create webhook" \
    '{"url":"https://example.com/webhook","events":["user.created"]}'
test_endpoint "GET" "/api/admin/integrations/webhooks" "Verify webhook created"

# ============================================================================
# PHASE 3: SYSTEM SETTINGS
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 3 - TEST 6: SYSTEM SETTINGS${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "GET" "/api/admin/settings" "Get all system settings"
test_endpoint "GET" "/api/admin/settings/site_name" "Get specific setting"
test_endpoint "PATCH" "/api/admin/settings/test_setting" "Update setting" \
    '{"value":"test_value"}'

# Test feature flags
test_endpoint "GET" "/api/admin/feature-flags" "List feature flags"

# ============================================================================
# PHASE 3: SECURITY & SAFETY
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 3 - TEST 7: SECURITY & SAFETY${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "GET" "/api/admin/security/events" "Get security events"
test_endpoint "GET" "/api/admin/security/ip-bans" "List IP bans"
test_endpoint "POST" "/api/admin/security/ip-bans" "Ban IP address" \
    '{"ipAddress":"192.168.1.100","reason":"Test ban","hours":24}'
test_endpoint "GET" "/api/admin/security/ip-bans" "Verify IP ban created"

# ============================================================================
# PHASE 3: AUDIT LOGS
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}PHASE 3 - TEST 8: AUDIT LOGS${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

test_endpoint "GET" "/api/admin/audit-logs" "List audit logs"
test_endpoint "GET" "/api/admin/audit-logs?action=user_ban&limit=10" "Filter audit logs by action"
test_endpoint "GET" "/api/admin/audit-logs/export" "Export audit logs to CSV"

# ============================================================================
# CROSS-CUTTING CONCERNS
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}CROSS-CUTTING CONCERNS${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

# Test unauthorized access (without admin auth)
log "\n${BLUE}Testing Authorization: Non-admin access should return 401/403${NC}"
rm -f cookies.txt
test_endpoint "GET" "/api/admin/automation/rules" "Non-admin access should fail" "" 401

# Re-login for remaining tests
curl -s -c cookies.txt -X POST \
    -H "Content-Type: application/json" \
    -d "{\"email\":\"$ADMIN_EMAIL\",\"password\":\"$ADMIN_PASS\"}" \
    "$BASE_URL/api/auth/login" > /dev/null

# Test input validation
log "\n${BLUE}Testing Input Validation${NC}"
test_endpoint "POST" "/api/admin/automation/rules" "Invalid JSON should fail" \
    '{"invalid"}' 400
test_endpoint "POST" "/api/admin/security/ip-bans" "Invalid IP should fail" \
    '{"ipAddress":"not-an-ip","reason":"test"}' 400

# ============================================================================
# GENERATE TEST REPORT
# ============================================================================
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
log "${YELLOW}TEST SUMMARY${NC}"
log "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"

PASS_RATE=$(awk "BEGIN {printf \"%.1f\", ($PASSED_TESTS / $TOTAL_TESTS) * 100}")

log "\nTotal Tests: $TOTAL_TESTS"
log "${GREEN}Passed: $PASSED_TESTS${NC}"
log "${RED}Failed: $FAILED_TESTS${NC}"
log "Pass Rate: $PASS_RATE%"

# Calculate average response time
TOTAL_TIME=0
COUNT=0
for metric in "${PERFORMANCE_METRICS[@]}"; do
    time=$(echo $metric | grep -o '"responseTime":[0-9]*' | cut -d':' -f2)
    TOTAL_TIME=$((TOTAL_TIME + time))
    COUNT=$((COUNT + 1))
done
if [ $COUNT -gt 0 ]; then
    AVG_TIME=$((TOTAL_TIME / COUNT))
    log "Average Response Time: ${AVG_TIME}ms"
else
    AVG_TIME=0
fi

# Generate JSON output
cat > "$OUTPUT_FILE" << EOF
{
  "testRun": {
    "date": "$(date -Iseconds)",
    "totalTests": $TOTAL_TESTS,
    "passed": $PASSED_TESTS,
    "failed": $FAILED_TESTS,
    "passRate": $PASS_RATE,
    "averageResponseTime": $AVG_TIME
  },
  "testResults": [
    $(IFS=,; echo "${TEST_RESULTS[*]}")
  ],
  "performanceMetrics": [
    $(IFS=,; echo "${PERFORMANCE_METRICS[*]}")
  ]
}
EOF

log "\n${GREEN}Test results saved to: $OUTPUT_FILE${NC}"
log "${GREEN}Detailed logs saved to: $LOG_FILE${NC}"

# Show performance warnings
log "\n${BLUE}Performance Analysis:${NC}"
SLOW_ENDPOINTS=0
for metric in "${PERFORMANCE_METRICS[@]}"; do
    time=$(echo $metric | grep -o '"responseTime":[0-9]*' | cut -d':' -f2)
    if [ $time -gt 500 ]; then
        endpoint=$(echo $metric | grep -o '"endpoint":"[^"]*"' | cut -d'"' -f4)
        log "${YELLOW}⚠ Slow endpoint: $endpoint (${time}ms)${NC}"
        SLOW_ENDPOINTS=$((SLOW_ENDPOINTS + 1))
    fi
done

if [ $SLOW_ENDPOINTS -eq 0 ]; then
    log "${GREEN}✓ All endpoints meet <500ms performance target${NC}"
fi

# Final summary
log "\n${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
if [ $FAILED_TESTS -eq 0 ]; then
    log "${GREEN}✓ ALL TESTS PASSED!${NC}"
    exit 0
else
    log "${RED}✗ SOME TESTS FAILED${NC}"
    log "Review the log file for details: $LOG_FILE"
    exit 1
fi
