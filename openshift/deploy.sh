#!/bin/bash

# Rahti Deployment Script for Picture Store API
# Usage: ./deploy.sh [npm-token] [jwt-secret] [mongodb-uri]

set -e

echo "🚀 Deploying Picture Store API to Rahti..."

# Check if oc is installed
if ! command -v oc &> /dev/null; then
    echo "❌ Error: oc CLI tool is not installed"
    echo "Please install it from: https://docs.openshift.com/container-platform/4.9/cli_reference/openshift_cli/getting-started-cli.html"
    exit 1
fi

# Check if logged in to OpenShift
if ! oc whoami &> /dev/null; then
    echo "❌ Error: Not logged in to OpenShift"
    echo "Please login first: oc login https://rahti.csc.fi:8443"
    exit 1
fi

# Get current project
PROJECT=$(oc project -q)
echo "📁 Current project: $PROJECT"

# Get parameters
NPM_TOKEN=${1:-""}
JWT_SECRET=${2:-""}
MONGODB_URI=${3:-""}

# Prompt for missing parameters
if [ -z "$NPM_TOKEN" ]; then
    read -p "🔑 Enter NPM token (or press Enter to skip): " NPM_TOKEN
fi

if [ -z "$JWT_SECRET" ]; then
    read -p "🔐 Enter JWT secret (64 characters recommended): " JWT_SECRET
fi

if [ -z "$MONGODB_URI" ]; then
    read -p "🗄️ Enter MongoDB URI (or press Enter for local file storage): " MONGODB_URI
fi

# Set default MongoDB URI if empty
if [ -z "$MONGODB_URI" ]; then
    MONGODB_URI="file://local"
fi

echo ""
echo "📋 Deployment Summary:"
echo "   Project: $PROJECT"
echo "   NPM Token: ${NPM_TOKEN:+***configured***}"
echo "   JWT Secret: ${JWT_SECRET:+***configured***}"
echo "   MongoDB URI: ${MONGODB_URI}"
echo ""

read -p "Continue with deployment? (y/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "❌ Deployment cancelled"
    exit 1
fi

echo "🔧 Creating secrets..."

# Create NPM token secret if provided
if [ ! -z "$NPM_TOKEN" ]; then
    oc create secret generic npm-token-secret \
        --from-literal=NPM_TOKEN="$NPM_TOKEN" \
        --dry-run=client -o yaml | oc apply -f -
    echo "✅ NPM token secret created/updated"
fi

# Create application secrets
oc create secret generic app-secrets \
    --from-literal=JWT_SECRET="$JWT_SECRET" \
    --from-literal=MONGODB_URI="$MONGODB_URI" \
    --dry-run=client -o yaml | oc apply -f -
echo "✅ Application secrets created/updated"

echo "💾 Creating persistent volumes..."
oc apply -f pvc.yaml
echo "✅ Persistent volumes created"

echo "🏗️ Creating build configuration..."
oc apply -f buildconfig.yaml
echo "✅ Build configuration created"

echo "🚀 Creating deployment configuration..."
oc apply -f deploymentconfig.yaml
echo "✅ Deployment configuration created"

echo "🌐 Creating service and route..."
oc apply -f service-route.yaml
echo "✅ Service and route created"

echo "🔨 Starting build..."
oc start-build picture-store-api --follow

echo "⏳ Waiting for deployment..."
oc rollout status dc/picture-store-api --timeout=300s

echo "🔍 Getting route URL..."
ROUTE_URL=$(oc get route picture-store-api-route -o jsonpath='{.spec.host}')

echo ""
echo "🎉 Deployment completed successfully!"
echo ""
echo "📊 Deployment Status:"
oc get pods -l app=picture-store-api
echo ""
echo "🌍 Application URL: https://$ROUTE_URL"
echo "🏥 Health Check: https://$ROUTE_URL/health"
echo ""
echo "📝 Useful commands:"
echo "   View logs: oc logs -f dc/picture-store-api"
echo "   Scale app: oc scale dc/picture-store-api --replicas=2"
echo "   Get status: oc get all -l app=picture-store-api"
echo ""

# Test health endpoint
echo "🏥 Testing health endpoint..."
if curl -s -f "https://$ROUTE_URL/health" > /dev/null; then
    echo "✅ Health check passed!"
else
    echo "⚠️ Health check failed - application may still be starting"
fi

echo "✨ Deployment script completed!"
