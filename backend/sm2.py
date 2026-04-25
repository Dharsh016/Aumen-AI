from __future__ import annotations

from datetime import datetime, timedelta


def calculate_next_review(
    score: int,
    repetition: int,
    interval: int,
    easiness_factor: float,
) -> dict:
    if score < 0 or score > 5:
        raise ValueError("score must be between 0 and 5")

    next_easiness_factor = easiness_factor

    # Scores 0-2: always reset regardless of repetition count
    if score <= 2:
        next_repetition = 0
        next_interval = 1
        next_easiness_factor = max(1.3, easiness_factor - 0.2)

    # Passing scores on a brand new word (never reviewed before)
    elif repetition == 0:
        next_repetition = 1
        next_interval = 1

    # Passing scores on second review
    elif repetition == 1:
        next_repetition = 2
        next_interval = 6

    # Established word — now score determines interval growth
    elif score == 3:
        next_repetition = repetition + 1
        next_interval = max(1, int(interval * easiness_factor * 0.9))

    elif score == 4:
        next_repetition = repetition + 1
        next_interval = max(1, int(interval * easiness_factor))

    elif score == 5:
        next_repetition = repetition + 1
        next_interval = max(1, int(interval * easiness_factor * 1.3))
        next_easiness_factor = min(2.5, easiness_factor + 0.1)

    else:
        next_repetition = repetition + 1
        next_interval = interval

    next_review = datetime.now() + timedelta(days=next_interval)

    return {
        "next_review": next_review,
        "interval": int(next_interval),
        "easiness_factor": float(next_easiness_factor),
        "repetition": int(next_repetition),
    }