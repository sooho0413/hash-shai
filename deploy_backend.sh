#!/bin/bash

# Configuration
SERVICE_NAME="shai-ai-service"
REGION="asia-northeast3" # Seoul region (modifiable)

echo "☁️  Deploying Backend to Google Cloud Run..."

# 1. Check for Gemini API Key
if [ -z "$GEMINI_API_KEY" ]; then
    echo "🔑 Enter your GEMINI_API_KEY:"
    read -s GEMINI_API_KEY
fi

# 2. Check for Firebase Service Account File
FIREBASE_KEY_FILE="serviceAccountKey.json"
if [ ! -f "$FIREBASE_KEY_FILE" ]; then
    echo "❌ '$FIREBASE_KEY_FILE' not found in the current directory."
    echo "   Please place your Firebase Admin SDK JSON file here and rename it to '$FIREBASE_KEY_FILE'."
    exit 1
fi

# 3. Create Env Var File (Base64 Encoded for Safety)
echo "📜 Preparing configuration..."
FIREBASE_B64=$(base64 < $FIREBASE_KEY_FILE | tr -d '\n')
cat > cloud_run_env.yaml <<EOF
GEMINI_API_KEY: "$GEMINI_API_KEY"
FIREBASE_CREDENTIALS: "$FIREBASE_B64"
EOF

# 4. Deploy
echo "🚀 Deploying... (This may take a few minutes)"
gcloud run deploy $SERVICE_NAME \
    --source . \
    --platform managed \
    --region $REGION \
    --allow-unauthenticated \
    --env-vars-file cloud_run_env.yaml

# Cleanup
rm cloud_run_env.yaml

echo "✅ Deployment command finished."
