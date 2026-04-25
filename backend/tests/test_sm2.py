from backend.sm2 import calculate_next_review
from datetime import date, timedelta

def test_score_5_increases_interval_sharply():
    result = calculate_next_review(5, 2, 6, 2.5)
    assert result["interval"] > 6
    assert result["easiness_factor"] >= 2.5

def test_score_0_resets_to_day_1():
    result = calculate_next_review(0, 5, 20, 2.5)
    assert result["interval"] == 1
    assert result["repetition"] == 0

def test_score_3_slight_increase():
    result = calculate_next_review(3, 2, 6, 2.5)
    assert result["interval"] >= 6

def test_easiness_factor_minimum():
    result = calculate_next_review(0, 3, 5, 1.4)
    assert result["easiness_factor"] >= 1.3

def test_next_review_is_future():
    result = calculate_next_review(4, 1, 1, 2.5)
    assert result["next_review"].date() > date.today()