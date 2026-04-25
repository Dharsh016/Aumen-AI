# LexiCore - AI Vocabulary Trainer

LexiCore is a full-stack spaced repetition vocabulary trainer built for interview-style evaluation.
It combines FastAPI, SQLite, React + TypeScript, and an auto-generated Python SDK.

## 1. Project Highlights

- Backend: FastAPI + SQLAlchemy + Alembic
- Database: SQLite (`lexicore.db`)
- Algorithm: SM-2 spaced repetition scheduling
- AI Features: Groq-based enrichment, hint generation, learning insights
- Frontend: React (TypeScript) with schedule, review, and history screens
- SDK: Auto-generated Python client in `srs_sdk/`

## 2. Repository Structure

```text
lexicore/
|-- backend/
|   |-- main.py                 # FastAPI routes
|   |-- crud.py                 # Business logic + DB operations
|   |-- models.py               # SQLAlchemy models
|   |-- schemas.py              # Pydantic schemas
|   |-- sm2.py                  # SM-2 scheduler logic
|   |-- ai_features.py          # AI enrichment/hint/insights
|   |-- database.py             # Engine + session setup
|   |-- alembic.ini
|   |-- alembic/
|   |   `-- versions/           # DB migration files
|   `-- tests/                  # Backend tests
|
|-- frontend/
|   |-- package.json
|   |-- public/
|   `-- src/
|       |-- App.tsx
|       |-- App.css
|       |-- index.css
|       |-- api/client.ts
|       `-- pages/
|           |-- AddWord.tsx
|           |-- ReviewSession.tsx
|           |-- History.tsx
|           |-- Schedule.tsx
|           `-- WordList.tsx
|
|-- srs_sdk/                    # OpenAPI-generated Python SDK
|-- conftest.py
|-- pytest.ini
|-- requirements.txt            # Root Python dependencies
|-- seed_data.sql
|-- setupdev.bat                # End-to-end setup script
|-- runapplication.bat          # Starts backend + frontend
`-- sdk_demo.py                 # SDK usage demo
```

## 3. Functional Pages (Frontend)

- `/` Opening page with branding and entry actions
- `/add` Add new word with language and definition
- `/review` Review due words and submit score (0 to 5) + AI hints on-demand
- `/history` Score history + AI insights paragraph
- `/schedule` Upcoming review buckets with ML-predicted difficulty labels
- `/words` Search/filter/delete words
- `/admin` Admin analytics dashboard (admin-only, requires header auth)

## 4. Backend API Endpoints

### Words and Reviews
### Words and Reviews
- `POST /words/` — Create word, trigger async Groq AI enrichment
- `GET /words/` — List all words
- `GET /words/due/` — Due words with ML-predicted difficulty
- `POST /words/{word_id}/review/` — Submit review (0-5), run SM-2, retrain ML predictor
- `GET /words/history/` — Aggregated stats + Groq-generated learning insights
- `GET /words/{word_id}/hint/` — AI-generated contextual hint (no definition revealed)
- `DELETE /words/{word_id}` — Delete word and cascade reviews

### Admin
- `GET /admin/analytics` — Real-time platform metrics (requires header-based auth)

## 5. AI Features

### AI Word Enrichment
- **When:** User creates a new word via `POST /words/`
- **How:** FastAPI BackgroundTask calls Groq llama-3.3-70b-versatile
- **Returns:** JSON with mnemonic, 2 example sentences, etymology, common mistakes
- **Storage:** Persisted in `words.ai_enrichment` column
- **Fallback:** Local keyword-based enrichment if Groq fails

### AI Hint Generation (Feature Focus)
- **When:** User clicks "Get AI Hint" during `GET /words/due/` review session
- **Endpoint:** `GET /words/{word_id}/hint/` (calls `backend/crud.py:get_hint_for_word()`)
- **Logic:**
  1. Fetches word definition and past review scores
  2. Analyzes performance: identifies struggles (score < 3), perfect recalls (score = 5), and average
  3. Sends detailed coaching context to Groq
  4. Returns clear 4-5 sentence paragraph explaining:
     - **Exactly what the user struggled with** (e.g., "You confused X with Y" or "Forgot usage context")
     - **What they got RIGHT** on successful attempts
     - **Memorable hint or association** for reinforcement
     - **Specific actionable advice** for next attempt
  5. Example: "You've struggled twice confusing 'quintessential' with 'essential', but nailed it once. The key: 'quintessential' = the PERFECT example of something... When you think of a movie scene where every tiny detail is EXACTLY right, that's quintessential. Next time, visualize that 'perfect scene' before answering."
- **Frontend:** ReviewSession.tsx displays full coaching paragraph inline with "Get AI Hint" button
- **Fallback:** Local hint builder uses word keywords + difficulty context if Groq unavailable

### ML Difficulty Predictor
- **Model:** scikit-learn LogisticRegression(max_iter=200)
- **Features:** [interval, repetition, easiness_factor]
- **Label:** 1 if score < 3 (struggled), 0 if score >= 3 (recalled)
- **Training:** Requires ≥5 reviews with both label classes; retrains after each review
- **Output:** Difficulty float 0.0-1.0 in `/words/due/` response
- **Frontend:** Schedule.tsx shows difficulty dots (red > 0.6, yellow 0.4-0.6, green < 0.4)

### Learning Insights
- **When:** User views `GET /words/history/`
- **How:** Top 10 history entries sent to Groq
- **Returns:** 3-4 sentence personalized coaching paragraph
- **Example:** "Your strongest languages are German and French with 4+ average scores. Focus on spacing out difficult words; you're struggling most with Spanish irregular verbs."

### Language Detection
- **When:** Word language field is empty or set to "auto"
- **How:** Uses langdetect library (zero API cost, instant)
- **Maps:** ISO codes to readable names (en→English, de→German, fr→French, etc.)
- **Fallback:** "Unknown" on LangDetectException

## 6. SM-2 Core Logic Summary

In `backend/sm2.py`:

- Scores `0-2`: reset to 1-day interval, reduce EF (min 1.3)
- Score `3`: moderate interval growth (`interval * EF * 0.9`)
- Score `4`: normal interval growth (`interval * EF`)
- Score `5`: aggressive growth (`interval * EF * 1.3`) + EF increase (max 2.5)

This logic is used in `backend/crud.py` during review submission and persisted in `reviews` table.

## 7. Admin Dashboard

### Features
The admin-only analytics dashboard provides real-time platform metrics refreshed every 5 seconds:

**KPI Cards (6 metrics):**
- Total registered users
- Words added across all users
- Total reviews submitted
- Average score (0-5) across all reviews
- Words due right now
- New user registrations in last 7 days

**Charts:**
- **Line Chart:** Reviews per day (last 7 days) — tracks platform engagement
- **Bar Chart:** Score distribution (0-5 count) — shows learning difficulty patterns

**Tables:**
- **Top Reviewed Words:** Rank by total reviews, show average score per word
- **Recent Reviews:** Last 8 reviews with word name, score (0-5), timestamp

### Access
Access to the admin analytics endpoint and dashboard is controlled by header-based credentials. Include the headers `x-admin-email` and `x-admin-password` with requests to `GET /admin/analytics`. See `backend/crud.py` for the default admin credentials used in development.

### Backend Implementation
- **Auth:** Header-based verification in `GET /admin/analytics`
  - Headers: `x-admin-email`, `x-admin-password`
  - Returns 403 HTTPException if credentials invalid
- **Metrics:** `backend/crud.py:get_admin_analytics()` computes 11 aggregated values from DB
- **Response Schema:** `AdminAnalyticsOut` in `backend/schemas.py`

### API Endpoint Details
```
GET /admin/analytics
Headers:
  x-admin-email: admin@example.com
  x-admin-password: lexicore123

Response: AdminAnalyticsOut {
  generated_at: datetime
  total_users: int
  total_words: int
  total_reviews: int
  average_score: float (0.0-5.0)
  due_now: int
  users_last_7_days: int
  reviews_last_7_days: [{date, count}, ...]
  user_registrations: [{date, count}, ...]
  score_distribution: [{score, count}, ...]
  recent_reviews: [{word, score, review_date}, ...]
  top_words: [{word, average_score, total_reviews}, ...]
}
```

## 8. Setup from Scratch (Windows)

### Prerequisites

- Python 3.10+
- Node.js 18+
- npm 9+

### Option A: One-command setup (recommended)

```bat
setupdev.bat
```

This script creates a root venv (`.venv`), installs Python dependencies, runs migrations, seeds DB, installs frontend packages, and installs the SDK.

### Option B: Manual setup

1. Create and activate venv:
```bat
python -m venv .venv
.venv\Scripts\activate
```

2. Install Python dependencies:
```bat
pip install -r requirements.txt
```

3. Run migrations:
```bat
alembic -c backend\alembic.ini upgrade head
```

4. Load seed data:
```bat
python -c "import sqlite3; conn=sqlite3.connect('lexicore.db'); f=open('seed_data.sql','r'); conn.executescript(f.read()); conn.commit(); conn.close()"
```

5. Install frontend dependencies:
```bat
cd frontend
npm install
cd ..
```

6. Install SDK locally:
```bat
cd srs_sdk
pip install -e .
cd ..
```

## Quick Start (for a new developer)

1. Clone the repository and open terminal in the project root.
2. Create and activate Python virtual environment:

```bat
python -m venv .venv
.venv\Scripts\activate
```

3. Install Python dependencies:

```bat
pip install -r requirements.txt
```

4. Install frontend dependencies:

```bat
cd frontend
npm install
cd ..
```

5. Start the full application (backend on port 8001, frontend on 3000):

```bat
runapplication.bat
```

Notes:
- The frontend reads the backend base URL from the environment variable `REACT_APP_API_BASE`. `runapplication.bat` sets this to `http://127.0.0.1:8001` and forces the frontend dev server to use `PORT=3000`.
- If port 3000 is occupied, the frontend may prompt to run on another port; stop any process using 3000 or set `PORT=3000` in your shell before `npm start`.
- A TypeScript helper declaration file `frontend/src/custom.d.ts` is included to avoid CSS module import errors.

If you prefer to run components separately, run the backend with `uvicorn backend.main:app --reload --port 8001` and then `npm start` inside `frontend` (the frontend will pick up `REACT_APP_API_BASE` if set in your environment).

## 9. Run the Application

### Option A: Batch runner
```bat
runapplication.bat
```

### Option B: Manual terminals

Terminal 1 (backend):
```bat
.venv\Scripts\activate
uvicorn backend.main:app --reload --port 8001
```

Terminal 2 (frontend):
```bat
cd frontend
npm start
```

## 10. Test Commands

Run backend tests:
```bat
pytest
```

Run frontend tests:
```bat
cd frontend
npm test
```

## 11. SDK Usage

Quick demo:
```bat
python sdk_demo.py
```

The generated client package is in `srs_sdk/`.

- Documentation: this README includes full setup-to-run flow
- Trick logic: SM-2 behavior implemented and persisted in reviews

## 13. Notes for Submission

- Keep only one local virtual environment (`.venv/`) to avoid duplication.
- Keep `srs_sdk/` because it is part of deliverables.
- Use root `requirements.txt` as single Python dependency source for setup.
