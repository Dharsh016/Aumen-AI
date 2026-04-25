from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class WordCreate(BaseModel):
	word: str
	definition: str
	language: str


class WordOut(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	word: str
	definition: str
	language: str
	created_at: datetime
	ai_enrichment: str | None = None
	streak: int
	xp: int
	next_review: datetime | None = None
	predicted_difficulty: float | None = None


class ReviewCreate(BaseModel):
	score: int = Field(ge=0, le=5)


class ReviewOut(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	word_id: int
	review_date: datetime
	score: int
	interval: int
	easiness_factor: float
	repetition: int
	next_review: datetime


class HistoryOut(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	word: str
	total_reviews: int
	average_score: float
	last_reviewed: datetime
	streak: int


class UserRegister(BaseModel):
	name: str = Field(min_length=2, max_length=100)
	email: str = Field(min_length=5, max_length=255)
	password: str = Field(min_length=6, max_length=128)


class UserLogin(BaseModel):
	email: str = Field(min_length=5, max_length=255)
	password: str = Field(min_length=6, max_length=128)


class AuthUserOut(BaseModel):
	model_config = ConfigDict(from_attributes=True)

	id: int
	name: str
	email: str
	created_at: datetime
	is_admin: bool = False


class AuthResponse(BaseModel):
	message: str
	user: AuthUserOut


class AdminMetricPoint(BaseModel):
	date: str
	count: int


class AdminScorePoint(BaseModel):
	score: int
	count: int


class AdminRecentReview(BaseModel):
	word: str
	score: int
	review_date: datetime


class AdminTopWord(BaseModel):
	word: str
	average_score: float
	total_reviews: int


class AdminAnalyticsOut(BaseModel):
	generated_at: datetime
	total_users: int
	total_words: int
	total_reviews: int
	average_score: float
	due_now: int
	users_last_7_days: int
	reviews_last_7_days: list[AdminMetricPoint]
	user_registrations: list[AdminMetricPoint]
	score_distribution: list[AdminScorePoint]
	recent_reviews: list[AdminRecentReview]
	top_words: list[AdminTopWord]
