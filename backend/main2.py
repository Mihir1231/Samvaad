from fastapi import FastAPI, Request, HTTPException
import requests

API_KEY = "mysecretapikey123"  # secure this!

CHROMA_URL = "http://0.0.0.0:9000"  # local chroma server

app = FastAPI()

# Middleware to check API key
@app.middleware("http")
async def check_api_key(request: Request, call_next):
    key = request.headers.get("x-api-key")
    if key != API_KEY:
        raise HTTPException(status_code=403, detail="Forbidden: Invalid API Key")
    response = await call_next(request)
    return response

# Example: Proxy to Chroma's list collections
@app.get("/collections")
def list_collections():
    r = requests.get(f"{CHROMA_URL}/api/v1/collections")
    return r.json()