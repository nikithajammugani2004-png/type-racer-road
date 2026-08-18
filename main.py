import random
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel, Field
from english_words import get_english_words_set

app = FastAPI(title="Road TypeRacer")

# Load word set
RAW_WORDS = get_english_words_set(['web2'], lower=True, alpha=True)

# Filter out very obscure or single/double letter noise to keep only meaningful words
MEANINGFUL_WORDS = [
    w for w in RAW_WORDS 
    if len(w) >= 3 and w.isascii()
]

# Separate into clean pools by difficulty
WORD_POOLS = {
    "easy": [w for w in MEANINGFUL_WORDS if 3 <= len(w) <= 5],
    "medium": [w for w in MEANINGFUL_WORDS if 6 <= len(w) <= 8],
    "hard": [w for w in MEANINGFUL_WORDS if 9 <= len(w) <= 12]
}

LEADERBOARD = []

class ScoreSubmission(BaseModel):
    player_name: str = Field(..., min_length=1, max_length=20)
    score: int = Field(..., ge=0)
    accuracy: int = Field(..., ge=0, le=100)

@app.get("/api/words")
def get_words(difficulty: str = "easy", count: int = 40):
    pool = WORD_POOLS.get(difficulty.lower(), WORD_POOLS["easy"])
    selected = random.sample(pool, min(count, len(pool)))
    return {"words": selected}

@app.post("/api/leaderboard")
def submit_score(submission: ScoreSubmission):
    entry = {
        "player_name": submission.player_name,
        "score": submission.score,
        "accuracy": submission.accuracy
    }
    LEADERBOARD.append(entry)
    LEADERBOARD.sort(key=lambda x: x["score"], reverse=True)
    del LEADERBOARD[10:]
    return {"status": "success", "leaderboard": LEADERBOARD}

@app.get("/api/leaderboard")
def get_leaderboard():
    return {"leaderboard": LEADERBOARD}

app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
def read_root():
    return FileResponse("static/index.html")