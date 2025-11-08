#!/bin/bash

# HeartWise Risk Scoring - Database Setup Script
# This script sets up the risk scoring tables in the database

echo "🎯 HeartWise Risk Scoring - Database Setup"
echo "========================================"
echo ""

# Load environment variables
if [ -f .env ]; then
    source .env
else
    echo "⚠️  Warning: .env file not found, using defaults"
fi

# Database connection parameters
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-heartwise_ecg}"
DB_USER="${DB_USER:-postgres}"

echo "📊 Database Configuration:"
echo "   Host: $DB_HOST"
echo "   Port: $DB_PORT"
echo "   Database: $DB_NAME"
echo "   User: $DB_USER"
echo ""

# Check if PostgreSQL is running
echo "🔍 Checking PostgreSQL connection..."
if ! pg_isready -h $DB_HOST -p $DB_PORT -U $DB_USER > /dev/null 2>&1; then
    echo "❌ Error: Cannot connect to PostgreSQL at $DB_HOST:$DB_PORT"
    echo "   Please ensure PostgreSQL is running"
    exit 1
fi
echo "✅ PostgreSQL is running"
echo ""

# Run the schema
echo "📝 Creating risk scoring tables..."
PGPASSWORD=$DB_PASSWORD psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f database/risk_scoring_schema.sql

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Risk scoring database setup complete!"
    echo ""
    echo "📋 Created tables:"
    echo "   - risk_scores"
    echo "   - risk_factors"
    echo "   - risk_score_history"
    echo "   - risk_alerts"
    echo "   - risk_factor_definitions"
    echo ""
    echo "📊 Created views:"
    echo "   - v_user_risk_dashboard"
    echo ""
    echo "⚡ Created functions:"
    echo "   - get_latest_risk_score()"
    echo "   - calculate_risk_trend()"
    echo "   - create_critical_risk_alert()"
    echo "   - track_risk_score_history()"
    echo ""
    echo "🎉 Risk scoring system is ready!"
    echo ""
    echo "💡 Next steps:"
    echo "   1. Restart backend: cd backend && npm start"
    echo "   2. Restart ML service: cd ml-service && python app.py"
    echo "   3. Navigate to: http://localhost:3000/risk-score"
    echo ""
else
    echo ""
    echo "❌ Error: Failed to create risk scoring tables"
    echo "   Check the error messages above"
    exit 1
fi
