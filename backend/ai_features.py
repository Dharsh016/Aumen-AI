from __future__ import annotations

import json
import os
import logging
import re
from dotenv import load_dotenv

try:
    from groq import Groq
except ImportError:
    Groq = None
from langdetect import detect, LangDetectException
from sklearn.linear_model import LogisticRegression

load_dotenv()

logger = logging.getLogger(__name__)

# ─── Groq Client Setup ────────────────────────────────────────────────────────

client = Groq(api_key=os.getenv("GROQ_API_KEY")) if Groq is not None else None
MODEL = "llama-3.3-70b-versatile"  # free, fast, high quality

STOPWORDS = {
    "that", "this", "with", "from", "into", "when", "where", "while", "about", "your",
    "their", "there", "which", "would", "could", "should", "being", "means", "meaning",
    "through", "between", "under", "after", "before", "often", "used", "using", "something",
}


def _chat(prompt: str, max_tokens: int = 500) -> str:
    """Internal helper — sends a prompt to Groq and returns the text response."""
    if client is None:
        logger.error("Groq client not initialized: groq package is not installed or GROQ_API_KEY is not set")
        raise RuntimeError("groq package is not installed or GROQ_API_KEY is missing")

    try:
        response = client.chat.completions.create(
            model=MODEL,
            max_tokens=max_tokens,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.7,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logger.error(f"Groq API error in _chat: {type(e).__name__}: {str(e)}")
        raise


def _extract_keywords(text: str, limit: int = 3) -> list[str]:
    words = re.findall(r"[A-Za-z]{4,}", text.lower())
    filtered = [w for w in words if w not in STOPWORDS]
    unique: list[str] = []
    for word in filtered:
        if word not in unique:
            unique.append(word)
        if len(unique) >= limit:
            break
    return unique


def _parse_llm_json(raw: str) -> dict:
    cleaned = raw.strip()
    if cleaned.startswith("```"):
        cleaned = re.sub(r"^```(?:json)?\s*", "", cleaned)
        cleaned = re.sub(r"\s*```$", "", cleaned)

    try:
        return json.loads(cleaned)
    except json.JSONDecodeError:
        start = cleaned.find("{")
        end = cleaned.rfind("}")
        if start != -1 and end != -1 and end > start:
            return json.loads(cleaned[start : end + 1])
        raise


def _build_local_enrichment(word: str, definition: str, language: str) -> dict:
    keywords = _extract_keywords(definition, limit=2)
    primary = keywords[0] if keywords else "core idea"
    secondary = keywords[1] if len(keywords) > 1 else "clear context"

    mnemonic = (
        f"Link '{word}' with '{primary}': imagine a vivid scene where this idea appears clearly."
    )

    sentence_one = f"During a short conversation, '{word}' appeared in a {primary}-focused context."
    sentence_two = f"I wrote one note using '{word}' so I can recall it from {secondary} next time."

    return {
        "mnemonic": mnemonic,
        "example_sentences": [sentence_one, sentence_two],
        "etymology": f"Detailed etymology is unavailable locally, but this {language} term is best remembered by usage context.",
        "common_mistakes": "Learners often recognize the word but forget exact usage; practice with one personal sentence.",
    }


def _build_local_hint(word: str, definition: str, avg_score: float) -> str:
    keywords = _extract_keywords(definition, limit=2)
    primary = keywords[0] if keywords else "main idea"
    effort_line = (
        "Slow down and picture the situation before answering."
        if avg_score < 3
        else "Trust your first recall and map it to the right situation."
    )
    return (
        f"Think of a moment where '{word}' naturally fits around '{primary}' without saying the definition directly. "
        f"{effort_line}"
    )


# ─── Feature 1: Word Enrichment ───────────────────────────────────────────────

def enrich_word(word: str, definition: str, language: str) -> str:
    """
    Called when a new word is added.
    Asks Llama3 to generate a mnemonic, example sentences,
    etymology, and common mistakes.
    Returns a JSON string stored in the words.ai_enrichment column.
    """
    prompt = f"""You are a language learning assistant.
Given the word "{word}" in {language}, meaning: "{definition}"

Respond ONLY with a valid JSON object, no markdown, no explanation, just JSON:
{{
  "mnemonic": "a creative memory trick to remember this word",
  "example_sentences": [
    "first natural example sentence using the word",
    "second natural example sentence using the word"
  ],
  "etymology": "brief origin and history of the word in one sentence",
  "common_mistakes": "one common mistake learners make with this word"
}}"""

    try:
        raw = _chat(prompt, max_tokens=400)
        # LLM output sometimes includes extra text/markdown; parse defensively.
        parsed = _parse_llm_json(raw)
        return json.dumps(parsed)
    except (json.JSONDecodeError, Exception) as e:
        logger.warning(f"enrich_word failed for '{word}': {e}")
        fallback = _build_local_enrichment(word, definition, language)
        return json.dumps(fallback)


def enrich_word_async(word_id: int) -> None:
    """Background hook used by the API route; no-op if persistence layer is unavailable."""
    try:
        from backend.database import SessionLocal
        from backend.models import Word
    except Exception:
        return

    db = SessionLocal()
    try:
        word = db.get(Word, word_id)
        if word is None:
            return

        word.ai_enrichment = enrich_word(word.word, word.definition, word.language)
        db.commit()
    except Exception as e:
        logger.warning(f"enrich_word_async failed for word_id={word_id}: {e}")
    finally:
        db.close()


# ─── Feature 2: AI Hint Generator ────────────────────────────────────────────

def generate_hint(word: str, definition: str, language: str, past_scores: list[int]) -> str:
    """
    Called on-demand when user clicks 'Give me a hint' during review.
    Provides a detailed coaching paragraph analyzing the word's performance,
    what the user struggled with, and where they excelled.
    """
    if not past_scores:
        # No history - provide basic hint
        prompt = f"""You are a language learning coach.
Word: "{word}" ({language})
Definition: "{definition}"

Provide a clear 3-sentence coaching hint about this word:
1. A memorable association or image to recall the meaning
2. How to use it naturally in conversation
3. One common mistake to avoid
Do NOT reveal the definition directly."""
        
        try:
            return _chat(prompt, max_tokens=150)
        except Exception as e:
            logger.warning(f"generate_hint failed for '{word}': {e}")
            return _build_local_hint(word, definition, 3.0)
    
    # Analyze performance pattern
    avg_score = round(sum(past_scores) / len(past_scores), 1)
    total_attempts = len(past_scores)
    perfect_recalls = sum(1 for s in past_scores if s >= 5)
    struggles = sum(1 for s in past_scores if s < 3)
    
    performance_analysis = []
    if struggles > 0:
        performance_analysis.append(f"You've struggled {struggles} out of {total_attempts} times (score < 3)")
    if perfect_recalls > 0:
        performance_analysis.append(f"But you nailed it {perfect_recalls} times with perfect recall")
    
    performance_text = ". ".join(performance_analysis) if performance_analysis else f"Your average is {avg_score}/5 across {total_attempts} attempts"

    prompt = f"""You are a language learning coach analyzing a learner's performance on a specific word.

Word: "{word}" ({language})
Definition: "{definition}"
Performance: {performance_text}
Average Score: {avg_score}/5

Write a detailed 4-5 sentence coaching paragraph that:
1. Clearly identifies EXACTLY what the learner struggled with (e.g., "You confused this with X" or "You forgot the usage context")
2. Highlights what they got RIGHT on successful attempts
3. Provides a memorable hint or association to reinforce recall
4. Gives specific advice for next time
5. Be encouraging but honest about weak areas

Focus on CLARITY and SPECIFICITY. Make it personal and actionable."""

    try:
        return _chat(prompt, max_tokens=250)
    except Exception as e:
        logger.warning(f"generate_hint failed for '{word}': {e}")
        return _build_local_hint(word, definition, avg_score)


# ─── Feature 3: Learning Insights ────────────────────────────────────────────

def generate_insights(history_data: list[dict]) -> str:
    """
    Called inside GET /words/history/.
    Takes the user's aggregated review history and asks Llama3
    to narrate patterns, strengths, and recommendations.
    Returns a plain text paragraph shown at the top of the history page.
    """
    if not history_data:
        return "Start reviewing words to get personalized learning insights."

    # Send only top 10 entries to stay within token limits
    trimmed = history_data[:10]
    summary = []
    for entry in trimmed:
        summary.append({
            "word": entry.get("word"),
            "total_reviews": entry.get("total_reviews"),
            "average_score": round(entry.get("average_score", 0), 2),
            "streak": entry.get("streak", 0),
        })

    summary_json = json.dumps(summary, indent=2)
    prompt = f"""You are an intelligent language learning coach.
Here is a learner's vocabulary review data:
{summary_json}

Write 3-4 sentences of personalized insights about:
- Their strongest and weakest words
- Any visible patterns in their performance
- A specific, encouraging recommendation for what to focus on next

Be specific, warm, and motivating. Use plain text only, no bullet points."""

    try:
        result = _chat(prompt, max_tokens=200)
        return result
    except Exception as e:
        logger.warning(f"generate_insights failed: {e}")
        return "Keep reviewing consistently — spaced repetition works best with daily practice."


# ─── Feature 4: Auto Language Detection ──────────────────────────────────────

def detect_language(text: str) -> str:
    """
    Called when user leaves the language field blank.
    Uses the langdetect library locally — zero API cost.
    Maps detected language codes to readable names.
    """
    lang_map = {
        "en": "English", "de": "German", "fr": "French",
        "es": "Spanish", "it": "Italian", "pt": "Portuguese",
        "ja": "Japanese", "zh-cn": "Chinese", "ko": "Korean",
        "ru": "Russian", "ar": "Arabic", "hi": "Hindi",
    }
    try:
        code = detect(text)
        return lang_map.get(code, code.capitalize())
    except LangDetectException:
        return "Unknown"


# ─── Feature 5: Difficulty Predictor (ML) ────────────────────────────────────

class DifficultyPredictor:
    """
    Trains a logistic regression model on the user's own review history.

    Features used:
      - interval: how many days since last review was scheduled
      - repetition: how many times the word has been reviewed
      - easiness_factor: SM-2 difficulty coefficient

    Label:
      - 1 if score < 3 (user struggled)
      - 0 if score >= 3 (user recalled correctly)

    Predicts probability (0.0 to 1.0) of struggling with a word.
    Used by the frontend to show red/yellow/green difficulty indicators.
    Retrained after every review submission with the latest full dataset.
    Requires at least 5 reviews with both pass and fail examples to train.
    """

    def __init__(self):
        self.model: LogisticRegression | None = None
        self.trained = False

    def train(self, reviews: list) -> None:
        if len(reviews) < 5:
            return

        X = [
            [r.interval or 1, r.repetition or 0, r.easiness_factor or 2.5]
            for r in reviews
        ]
        y = [1 if r.score < 3 else 0 for r in reviews]

        # Cannot train if all labels are the same class
        if len(set(y)) < 2:
            return

        self.model = LogisticRegression(max_iter=200)
        self.model.fit(X, y)
        self.trained = True
        logger.info(f"DifficultyPredictor trained on {len(reviews)} reviews.")

    def predict(self, interval: int, repetition: int, easiness_factor: float) -> float:
        if not self.trained or self.model is None:
            return 0.5  # neutral — not enough data yet
        prob = self.model.predict_proba([[interval, repetition, easiness_factor]])
        return round(float(prob[0][1]), 3)


# Single shared instance — imported by main.py and crud.py
predictor = DifficultyPredictor()