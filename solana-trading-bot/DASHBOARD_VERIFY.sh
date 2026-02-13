#!/bin/bash

# Dashboard Verification Script
# Checks that all dashboard files are in place and ready

echo "🔍 Dashboard Verification Script"
echo "================================="
echo ""

ERRORS=0
WARNINGS=0

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} $1"
    else
        echo -e "${RED}✗${NC} $1"
        ERRORS=$((ERRORS + 1))
    fi
}

check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} $1/"
    else
        echo -e "${RED}✗${NC} $1/"
        ERRORS=$((ERRORS + 1))
    fi
}

echo "📁 Checking Frontend Structure..."
echo ""

# Frontend directories
check_dir "web/src"
check_dir "web/src/components"
check_dir "web/src/pages"
check_dir "web/src/hooks"

echo ""
echo "📄 Checking Frontend Components..."
echo ""

# Components
check_file "web/src/components/StatusPanel.jsx"
check_file "web/src/components/PortfolioOverview.jsx"
check_file "web/src/components/PositionsTable.jsx"
check_file "web/src/components/Charts.jsx"
check_file "web/src/components/TradeHistory.jsx"
check_file "web/src/components/AlertsFeed.jsx"
check_file "web/src/components/RiskMonitor.jsx"
check_file "web/src/components/SentimentAnalysis.jsx"

echo ""
echo "📄 Checking Frontend Pages & Core..."
echo ""

# Pages
check_file "web/src/pages/Dashboard.jsx"
check_file "web/src/App.jsx"
check_file "web/src/main.jsx"
check_file "web/src/index.css"

echo ""
echo "🪝 Checking Custom Hooks..."
echo ""

# Hooks
check_file "web/src/hooks/useApi.js"
check_file "web/src/hooks/useWebSocket.js"

echo ""
echo "⚙️  Checking Configuration Files..."
echo ""

# Configuration
check_file "web/package.json"
check_file "web/vite.config.js"
check_file "web/tailwind.config.js"
check_file "web/postcss.config.js"
check_file "web/.eslintrc.json"
check_file "web/index.html"

echo ""
echo "🔙 Checking Backend..."
echo ""

# Backend
check_file "src/dashboardServer.js"

echo ""
echo "📚 Checking Documentation..."
echo ""

# Documentation
check_file "DASHBOARD.md"
check_file "DASHBOARD_QUICKSTART.md"
check_file "DASHBOARD_BUILD_SUMMARY.md"
check_file "DASHBOARD_CHECKLIST.md"
check_file "DASHBOARD_INDEX.md"
check_file "web/README.md"

echo ""
echo "📋 Checking Root Configuration..."
echo ""

# Root config
check_file "package.json"
check_file ".env.example"
check_file "web/.env.example"
check_file "web/.gitignore"

echo ""
echo "================================="
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✅ All files present!${NC}"
    echo ""
    echo "📊 Dashboard File Summary:"
    echo "  Components: 8"
    echo "  Pages: 1"
    echo "  Hooks: 2"
    echo "  Backend: 1 (Express server)"
    echo "  Documentation: 6 guides"
    echo "  Configuration: 8 files"
    echo "  Total: 26+ files"
    echo ""
    echo "🚀 Ready to run:"
    echo "  npm run web:build   # Build production"
    echo "  npm run dashboard   # Run on port 3001"
    echo ""
    echo "💡 Or for development:"
    echo "  npm run web:dev     # Vite dev server on port 5173"
    echo ""
else
    echo -e "${RED}❌ Missing $ERRORS file(s)!${NC}"
    echo ""
    echo "Please run the dashboard build again:"
    echo "  npm run web:build"
    echo ""
fi

if [ $WARNINGS -gt 0 ]; then
    echo -e "${YELLOW}⚠️  $WARNINGS warning(s)${NC}"
fi

echo ""
echo "For more info, see DASHBOARD_INDEX.md"
