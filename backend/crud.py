from datetime import datetime, timedelta
import hashlib
import hmac
import os

from fastapi import HTTPException
from sqlalchemy import func, or_
from sqlalchemy.orm import Session

from backend.models import Review, User, Word
from backend.schemas import WordCreate
from backend.sm2 import calculate_next_review


ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "lexicore123"


def create_word(db: Session, word_data: WordCreate) -> Word:
	word = Word(**word_data.model_dump())
	db.add(word)
	db.commit()
	db.refresh(word)
	return word


def get_due_words(db: Session) -> list[dict]:
	def sm2_difficulty(interval: int, repetition: int, easiness_factor: float) -> float:
		# Higher value means harder. Built from SM-2 state only.
		ef = min(2.5, max(1.3, easiness_factor or 2.5))
		iv = max(1, interval or 1)
		rep = max(0, repetition or 0)

		ef_component = (2.5 - ef) / (2.5 - 1.3)
		rep_component = 1.0 - min(rep, 6) / 6.0
		interval_component = 1.0 - min(iv, 30) / 30.0

		score = (0.5 * ef_component) + (0.3 * rep_component) + (0.2 * interval_component)
		return max(0.0, min(1.0, float(score)))

	now = datetime.now()

	latest_review_date_subquery = (
		db.query(func.max(Review.review_date))
		.filter(Review.word_id == Word.id)
		.correlate(Word)
		.scalar_subquery()
	)

	due_latest_review_exists = (
		db.query(Review.id)
		.filter(
			Review.word_id == Word.id,
			# Only latest review state controls due status for a word.
			Review.review_date == latest_review_date_subquery,
			Review.next_review <= now,
		)
		.exists()
	)

	due_words = (
		db.query(Word)
		.filter(
			or_(
				~Word.reviews.any(),
				due_latest_review_exists,
			)
		)
		.order_by(Word.created_at.asc())
		.all()
	)

	result = []
	for word in due_words:
		latest_review = (
			db.query(Review)
			.filter(Review.word_id == word.id)
			.order_by(Review.id.desc())
			.first()
		)

		next_review = None
		predicted_difficulty = 0.5

		if latest_review:
			next_review = latest_review.next_review
			predicted_difficulty = sm2_difficulty(
				latest_review.interval or 1,
				latest_review.repetition or 0,
				latest_review.easiness_factor or 2.5,
			)

		result.append(
			{
				"id": word.id,
				"word": word.word,
				"definition": word.definition,
				"language": word.language,
				"created_at": word.created_at,
				"ai_enrichment": word.ai_enrichment,
				"streak": word.streak,
				"xp": word.xp,
				"next_review": next_review,
				"predicted_difficulty": predicted_difficulty,
			}
		)

	return result


def submit_review(db: Session, word_id: int, score: int) -> Review:
	word = db.get(Word, word_id)
	if word is None:
		raise HTTPException(status_code=404, detail="Word not found")

	latest_review = (
		db.query(Review)
		.filter(Review.word_id == word_id)
		.order_by(Review.review_date.desc())
		.first()
	)

	if latest_review is None:
		repetition = 0
		interval = 1
		easiness_factor = 2.5
	else:
		repetition = latest_review.repetition
		interval = latest_review.interval
		easiness_factor = latest_review.easiness_factor

	next_state = calculate_next_review(
		score=score,
		repetition=repetition,
		interval=interval,
		easiness_factor=easiness_factor,
	)

	review = Review(
		word_id=word_id,
		score=score,
		interval=next_state["interval"],
		easiness_factor=next_state["easiness_factor"],
		repetition=next_state["repetition"],
		next_review=next_state["next_review"],
	)
	db.add(review)

	xp_gain = max(0, score) * 10
	word.xp = (word.xp or 0) + xp_gain
	# Streak here means consecutive successful recalls for that word (score >= 3), not daily app login streak.
	word.streak = (word.streak or 0) + 1 if score >= 3 else 0

	db.commit()
	db.refresh(review)
	return review


def get_history(db: Session) -> list[dict]:
	results = []
	words = db.query(Word).all()

	for word in words:
		reviews = db.query(Review).filter(Review.word_id == word.id).all()
		if not reviews:
			continue

		total = len(reviews)
		avg_score = sum(r.score for r in reviews) / total
		last_reviewed = max(r.review_date for r in reviews)
		results.append(
			{
				"word": word.word,
				"language": word.language,
				"total_reviews": total,
				"average_score": round(avg_score, 2),
				"last_reviewed": last_reviewed,
				"streak": word.streak,
			}
		)

	return results


def delete_word(db: Session, word_id: int) -> None:
	word = db.get(Word, word_id)
	if word is None:
		raise HTTPException(status_code=404, detail="Word not found")

	db.delete(word)
	db.commit()


def get_all_words(db: Session) -> list[dict]:
	def sm2_difficulty(interval: int, repetition: int, easiness_factor: float) -> float:
		# Higher value means harder. Built from SM-2 state only.
		ef = min(2.5, max(1.3, easiness_factor or 2.5))
		iv = max(1, interval or 1)
		rep = max(0, repetition or 0)

		ef_component = (2.5 - ef) / (2.5 - 1.3)
		rep_component = 1.0 - min(rep, 6) / 6.0
		interval_component = 1.0 - min(iv, 30) / 30.0

		score = (0.5 * ef_component) + (0.3 * rep_component) + (0.2 * interval_component)
		return max(0.0, min(1.0, float(score)))

	words = db.query(Word).all()
	result = []

	for word in words:
		latest_review = (
			db.query(Review)
			.filter(Review.word_id == word.id)
			.order_by(Review.id.desc())
			.first()
		)

		next_review = None
		predicted_difficulty = 0.5

		if latest_review:
			next_review = latest_review.next_review
			predicted_difficulty = sm2_difficulty(
				latest_review.interval or 1,
				latest_review.repetition or 0,
				latest_review.easiness_factor or 2.5,
			)

		result.append(
			{
				"id": word.id,
				"word": word.word,
				"definition": word.definition,
				"language": word.language,
				"created_at": word.created_at,
				"ai_enrichment": word.ai_enrichment,
				"streak": word.streak,
				"xp": word.xp,
				"next_review": next_review,
				"predicted_difficulty": predicted_difficulty,
			}
		)

	return result


def get_hint_for_word(db: Session, word_id: int) -> str:
	from backend.ai_features import generate_hint

	word = db.query(Word).filter(Word.id == word_id).first()
	if not word:
		raise HTTPException(status_code=404, detail="Word not found")

	past_reviews = db.query(Review).filter(Review.word_id == word_id).all()
	past_scores = [r.score for r in past_reviews]

	hint_text = generate_hint(
		word=word.word,
		definition=word.definition,
		language=word.language,
		past_scores=past_scores,
	)
	return hint_text


def _normalize_email(email: str) -> str:
	return email.strip().lower()


def _hash_password(password: str, salt: bytes | None = None) -> str:
	if salt is None:
		salt = os.urandom(16)
	digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
	return f"{salt.hex()}${digest.hex()}"


def _verify_password(password: str, stored_hash: str) -> bool:
	try:
		salt_hex, digest_hex = stored_hash.split("$", 1)
		salt = bytes.fromhex(salt_hex)
	except ValueError:
		return False

	calculated = _hash_password(password, salt)
	return hmac.compare_digest(calculated, stored_hash)


def register_user(db: Session, name: str, email: str, password: str) -> User:
	normalized_email = _normalize_email(email)
	if normalized_email == ADMIN_EMAIL:
		raise HTTPException(status_code=409, detail="Email already registered")

	existing = db.query(User).filter(User.email == normalized_email).first()
	if existing is not None:
		raise HTTPException(status_code=409, detail="Email already registered")

	user = User(
		name=name.strip(),
		email=normalized_email,
		password_hash=_hash_password(password),
	)
	db.add(user)
	db.commit()
	db.refresh(user)
	return user


def is_admin_credentials(email: str | None, password: str | None) -> bool:
	if email is None or password is None:
		return False
	return _normalize_email(email) == ADMIN_EMAIL and password == ADMIN_PASSWORD


def login_user(db: Session, email: str, password: str) -> dict:
	normalized_email = _normalize_email(email)
	if is_admin_credentials(normalized_email, password):
		return {
			"id": 0,
			"name": "Admin",
			"email": ADMIN_EMAIL,
			"created_at": datetime.now(),
			"is_admin": True,
		}

	user = db.query(User).filter(User.email == normalized_email).first()
	if user is None or not _verify_password(password, user.password_hash):
		raise HTTPException(status_code=401, detail="Invalid email or password")

	return {
		"id": user.id,
		"name": user.name,
		"email": user.email,
		"created_at": user.created_at,
		"is_admin": False,
	}


def get_admin_analytics(db: Session) -> dict:
	now = datetime.now()
	last_7_days = now - timedelta(days=7)

	total_users = int(db.query(func.count(User.id)).scalar() or 0)
	total_words = int(db.query(func.count(Word.id)).scalar() or 0)
	total_reviews = int(db.query(func.count(Review.id)).scalar() or 0)
	average_score = float(db.query(func.avg(Review.score)).scalar() or 0.0)

	users_last_7_days = int(
		db.query(func.count(User.id))
		.filter(User.created_at >= last_7_days)
		.scalar()
		or 0
	)

	reviews_last_7_days_raw = (
		db.query(func.date(Review.review_date), func.count(Review.id))
		.filter(Review.review_date >= last_7_days)
		.group_by(func.date(Review.review_date))
		.order_by(func.date(Review.review_date).asc())
		.all()
	)
	reviews_last_7_days = [
		{"date": str(day), "count": int(count)}
		for day, count in reviews_last_7_days_raw
	]

	user_registrations_raw = (
		db.query(func.date(User.created_at), func.count(User.id))
		.group_by(func.date(User.created_at))
		.order_by(func.date(User.created_at).asc())
		.limit(14)
		.all()
	)
	user_registrations = [
		{"date": str(day), "count": int(count)}
		for day, count in user_registrations_raw
	]

	score_distribution_raw = (
		db.query(Review.score, func.count(Review.id))
		.group_by(Review.score)
		.order_by(Review.score.asc())
		.all()
	)
	score_map = {int(score): int(count) for score, count in score_distribution_raw}
	score_distribution = [
		{"score": score, "count": score_map.get(score, 0)}
		for score in range(0, 6)
	]

	recent_reviews_raw = (
		db.query(Word.word, Review.score, Review.review_date)
		.join(Review, Review.word_id == Word.id)
		.order_by(Review.review_date.desc())
		.limit(8)
		.all()
	)
	recent_reviews = [
		{
			"word": word,
			"score": int(score),
			"review_date": reviewed_at,
		}
		for word, score, reviewed_at in recent_reviews_raw
	]

	top_words_raw = (
		db.query(
			Word.word,
			func.avg(Review.score).label("avg_score"),
			func.count(Review.id).label("total_reviews"),
		)
		.join(Review, Review.word_id == Word.id)
		.group_by(Word.word)
		.order_by(func.count(Review.id).desc())
		.limit(6)
		.all()
	)
	top_words = [
		{
			"word": word,
			"average_score": round(float(avg_score), 2),
			"total_reviews": int(total_count),
		}
		for word, avg_score, total_count in top_words_raw
	]

	due_now = len(get_due_words(db))

	return {
		"generated_at": now,
		"total_users": total_users,
		"total_words": total_words,
		"total_reviews": total_reviews,
		"average_score": round(average_score, 2),
		"due_now": due_now,
		"users_last_7_days": users_last_7_days,
		"reviews_last_7_days": reviews_last_7_days,
		"user_registrations": user_registrations,
		"score_distribution": score_distribution,
		"recent_reviews": recent_reviews,
		"top_words": top_words,
	}
