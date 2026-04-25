from sqlalchemy import Column, DateTime, Float, ForeignKey, Integer, Text, func
from sqlalchemy.orm import relationship

from backend.database import Base


class Word(Base):
	__tablename__ = "words"

	id = Column(Integer, primary_key=True, autoincrement=True, index=True)
	word = Column(Text, nullable=False)
	definition = Column(Text, nullable=False)
	language = Column(Text, nullable=False)
	created_at = Column(DateTime, server_default=func.now(), nullable=False)
	ai_enrichment = Column(Text, nullable=True)
	streak = Column(Integer, nullable=False, server_default="0")
	xp = Column(Integer, nullable=False, server_default="0")

	reviews = relationship("Review", back_populates="word", cascade="all, delete-orphan")


class User(Base):
	__tablename__ = "users"

	id = Column(Integer, primary_key=True, autoincrement=True, index=True)
	name = Column(Text, nullable=False)
	email = Column(Text, nullable=False, unique=True, index=True)
	password_hash = Column(Text, nullable=False)
	created_at = Column(DateTime, server_default=func.now(), nullable=False)


class Review(Base):
	__tablename__ = "reviews"

	id = Column(Integer, primary_key=True, autoincrement=True, index=True)
	word_id = Column(Integer, ForeignKey("words.id", ondelete="CASCADE"), nullable=False)
	review_date = Column(DateTime, server_default=func.now(), nullable=False)
	score = Column(Integer, nullable=False)
	interval = Column(Integer, nullable=False)
	easiness_factor = Column(Float, nullable=False)
	repetition = Column(Integer, nullable=False)
	next_review = Column(DateTime, nullable=False)

	word = relationship("Word", back_populates="reviews")
