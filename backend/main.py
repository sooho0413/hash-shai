import os
import json
import asyncio
from fastapi import FastAPI, HTTPException, Request
from fastapi.responses import StreamingResponse, FileResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
import google.generativeai as genai
import firebase_admin
from firebase_admin import credentials, firestore
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Configuration ---
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
FIREBASE_CREDENTIALS_JSON = os.getenv("FIREBASE_CREDENTIALS")

# Initialize Gemini
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)
    gemini_model = genai.GenerativeModel('gemini-1.5-flash-001')
else:
    print("WARNING: GEMINI_API_KEY not found in environment variables.")
    gemini_model = None

# Initialize Firebase
db = None
if FIREBASE_CREDENTIALS_JSON:
    try:
        if not firebase_admin._apps:
            # Check if it's a file path or direct JSON content
            if os.path.exists(FIREBASE_CREDENTIALS_JSON):
                cred = credentials.Certificate(FIREBASE_CREDENTIALS_JSON)
            else:
                # Try decoding Base64 first, if fail, assume raw JSON
                import base64
                import binascii
                try:
                    # Check if it looks like base64
                    decoded = base64.b64decode(FIREBASE_CREDENTIALS_JSON).decode('utf-8')
                    cred_dict = json.loads(decoded)
                    print("Firebase credentials loaded from Base64.")
                except (binascii.Error, UnicodeDecodeError, json.JSONDecodeError):
                    # Assume it's a raw JSON string
                    cred_dict = json.loads(FIREBASE_CREDENTIALS_JSON)
                    print("Firebase credentials loaded from JSON string.")
                
                cred = credentials.Certificate(cred_dict)
            
            firebase_admin.initialize_app(cred)
        
        db = firestore.client()
        print("Firebase initialized successfully.")
    except Exception as e:
        print(f"Error initializing Firebase: {e}")
else:
    print("WARNING: FIREBASE_CREDENTIALS not set. Persistence disabled.")

class ChatRequest(BaseModel):
    message: str
    userId: str = "guest"  # Added userId for persistence

@app.post("/chat")
@app.post("/api/chat")
async def chat(request: ChatRequest):
    if not gemini_model:
        raise HTTPException(status_code=503, detail="Gemini API Key not configured")
    
    # 1. Save User Message to Firestore (if DB active)
    if db:
        try:
            # Example structure: users/{userId}/messages
            doc_ref = db.collection("users").document(request.userId).collection("chats").document()
            doc_ref.set({
                "role": "user",
                "content": request.message,
                "timestamp": firestore.SERVER_TIMESTAMP
            })
        except Exception as e:
            print(f"Error saving user message to Firestore: {e}")

    try:
        # 2. Generate Response with Gemini
        response = gemini_model.generate_content(request.message, stream=True)

        async def stream_generator():
            full_text = ""
            for chunk in response:
                if chunk.text:
                    yield chunk.text
                    full_text += chunk.text
            
            # 3. Save AI Response to Firestore (after completion)
            if db:
                try:
                    ai_doc_ref = db.collection("users").document(request.userId).collection("chats").document()
                    ai_doc_ref.set({
                        "role": "assistant",
                        "content": full_text,
                        "timestamp": firestore.SERVER_TIMESTAMP
                    })
                except Exception as e:
                    print(f"Error saving AI message to Firestore: {e}")

        return StreamingResponse(stream_generator(), media_type="text/plain")

    except Exception as e:
        print(f"Error during generation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    # Cloud Run populates PORT env var
    port = int(os.environ.get("PORT", 8080))
    uvicorn.run("backend.main:app", host="0.0.0.0", port=port)

# --- Static File Serving (Must be last) ---
# Mount static assets (JS, CSS, Images)
app.mount("/assets", StaticFiles(directory="frontend/dist/assets"), name="assets")

# Catch-all route to serve index.html for client-side routing
@app.get("/{full_path:path}")
async def serve_spa(full_path: str):
    # API requests are already handled above, so anything else is frontend
    # Prevent conflict with API routes (though they are matched first usually)
    if full_path.startswith("api/") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
         raise HTTPException(status_code=404, detail="Not Found")
    
    # Check if a specific file exists (e.g., favicon.ico), otherwise serve index.html
    file_path = f"frontend/dist/{full_path}"
    if os.path.exists(file_path) and os.path.isfile(file_path):
        return FileResponse(file_path)
    
    return FileResponse("frontend/dist/index.html")
