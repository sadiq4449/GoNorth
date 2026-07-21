import os
import json
import requests
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

app = FastAPI()

# Enable CORS so your frontend page can communicate with the backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class RecommendRequest(BaseModel):
    destination: str
    nights: int
    budget: int

@app.post("/api/recommend")
def recommend_package(data: RecommendRequest):
    api_key = os.getenv("NVIDIA_API_KEY")
    if not api_key or api_key == "nvapi-your-key-here":
        raise HTTPException(
            status_code=500, 
            detail="NVIDIA_API_KEY environment variable is not set. Please set your actual NVIDIA API key."
        )

    invoke_url = "https://integrate.api.nvidia.com/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Accept": "application/json"
    }

    # Construct the recommendation prompt
    prompt = f"""Select the best stay and vehicle package for a traveler going to {data.destination} for {data.nights} nights with a total budget of PKR {data.budget}.

Options:
Stays:
- 'hostel': Skardu Backpackers Hostel (PKR 4,000/night, max capacity 6)
- 'resort': Shangrila Resort Skardu (PKR 25,000/night, max capacity 4)
- 'palace': Khaplu Palace Heritage Hotel (PKR 35,000/night, max capacity 3)

Rides:
- 'alto': Suzuki Alto (PKR 4,500/day)
- 'corolla': Toyota Corolla GLI (PKR 7,000/day)
- 'cabin': Toyota HiAce Grand Cabin (PKR 12,000/day)
- 'prado': Toyota Prado TX 4x4 (PKR 15,000/day)

Respond ONLY with a JSON object in this format (no extra text, no markdown codeblocks):
{{"stay": "stay_id", "ride": "ride_id", "reason": "1-sentence explanation"}}"""

    payload = {
        "model": "minimaxai/minimax-m3",
        "messages": [{"role": "user", "content": prompt}],
        "max_tokens": 1024,
        "temperature": 0.1,
        "stream": False,
    }

    try:
        response = requests.post(invoke_url, headers=headers, json=payload)
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"NVIDIA API error: {response.text}")
        
        response_json = response.json()
        ai_response = response_json["choices"][0]["message"]["content"]
        
        # Clean markdown formatting if present
        clean_json = ai_response.replace("```json", "").replace("```", "").strip()
        return json.loads(clean_json)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate recommendation: {str(e)}")
