from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import BackgroundTasks, Depends, FastAPI, HTTPException, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from backend import ai_features, crud, models, schemas
from backend.database import engine, get_db

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
	logger.info("Starting LexiCore application")
	try:
		models.Base.metadata.create_all(bind=engine)
		logger.info("Database tables created successfully")
	except Exception as e:
		logger.error(f"Failed to create database tables: {e}")
		raise
	yield
	logger.info("Shutting down LexiCore application")


app = FastAPI(lifespan=lifespan)

app.add_middleware(
	CORSMiddleware,
	allow_origins=["*"],
	allow_credentials=True,
	allow_methods=["*"],
	allow_headers=["*"],
)


@app.get("/health", tags=["health"])
def health_check():
	"""Simple health check endpoint to verify backend is running"""
	return {"status": "healthy", "service": "LexiCore"}


@app.post("/auth/register", response_model=schemas.AuthResponse, tags=["auth"])
def register_user(payload: schemas.UserRegister, db: Session = Depends(get_db)):
	try:
		user = crud.register_user(
			db=db,
			name=payload.name,
			email=payload.email,
			password=payload.password,
		)
		logger.info(f"User registered successfully: {payload.email}")
		return {"message": "Registration successful", "user": user}
	except HTTPException as e:
		logger.warning(f"Registration failed for {payload.email}: {e.detail}")
		raise
	except Exception as e:
		logger.error(f"Unexpected error during registration: {type(e).__name__}: {str(e)}")
		raise HTTPException(status_code=500, detail="Registration failed")


@app.post("/auth/login", response_model=schemas.AuthResponse, tags=["auth"])
def login_user(payload: schemas.UserLogin, db: Session = Depends(get_db)):
	try:
		user = crud.login_user(db=db, email=payload.email, password=payload.password)
		logger.info(f"User logged in successfully: {payload.email}")
		return {"message": "Login successful", "user": user}
	except HTTPException as e:
		logger.warning(f"Login failed for {payload.email}: {e.detail}")
		raise
	except Exception as e:
		logger.error(f"Unexpected error during login: {type(e).__name__}: {str(e)}")
		raise HTTPException(status_code=500, detail="Login failed")


@app.get("/admin/analytics", response_model=schemas.AdminAnalyticsOut, tags=["admin"])
def get_admin_analytics(
    x_admin_email: str | None = Header(default=None),
    x_admin_password: str | None = Header(default=None),
    db: Session = Depends(get_db),
):
    if not crud.is_admin_credentials(x_admin_email, x_admin_password):
        raise HTTPException(status_code=403, detail="Admin access required")

    return crud.get_admin_analytics(db)


@app.post("/words/", response_model=schemas.WordOut, tags=["words"])
def create_word(
    word_data: schemas.WordCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
):
    word = crud.create_word(db, word_data)
    background_tasks.add_task(ai_features.enrich_word_async, word.id)
    return word


@app.get("/words/", tags=["words"])
def get_all_words(db: Session = Depends(get_db)):
    from backend.crud import get_all_words as fetch_all

    return fetch_all(db)


@app.get("/words/due/", response_model=list[schemas.WordOut], tags=["words"])
def get_due_words(db: Session = Depends(get_db)):
    return crud.get_due_words(db)


@app.post(
    "/words/{word_id}/review/",
    response_model=schemas.ReviewOut,
    tags=["words"],
)
def submit_review(
    word_id: int,
    review_data: schemas.ReviewCreate,
    db: Session = Depends(get_db),
):
    if review_data.score < 0 or review_data.score > 5:
        raise HTTPException(status_code=422, detail="score must be between 0 and 5")

    return crud.submit_review(db, word_id, review_data.score)


@app.get("/words/history/", tags=["words"])
def get_history(db: Session = Depends(get_db)):
	from backend.ai_features import generate_insights
	from backend.crud import get_history as fetch_history

	history_list = fetch_history(db)

	try:
		insights = generate_insights(history_list)
	except Exception as e:
		logger.error(f"generate_insights error: {type(e).__name__}: {str(e)}")
		insights = "Keep reviewing consistently — spaced repetition works best with daily practice."

	return {"history": history_list, "insights": insights}


@app.delete("/words/{word_id}", tags=["words"])
def delete_word(word_id: int, db: Session = Depends(get_db)):
    crud.delete_word(db, word_id)
    return {"detail": "Word deleted"}


@app.get("/words/{word_id}/hint/", tags=["words"])
def get_word_hint(word_id: int, db: Session = Depends(get_db)):
    from backend.crud import get_hint_for_word

    hint = get_hint_for_word(db, word_id)
    return {"hint": hint}
