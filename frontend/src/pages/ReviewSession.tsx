import React, { useEffect, useMemo, useState } from "react";
import { AxiosError } from "axios";

import { Word, getDueWords, getHint, submitReview } from "../api/client";

type EnrichmentData = {
  mnemonic?: string;
};

type ScoreButton = {
  score: number;
  label: string;
};

type ScoredResult = {
  score: number;
  nextReview: string;
};

const SCORE_BUTTONS: ScoreButton[] = [
  { score: 0, label: "Complete blackout" },
  { score: 1, label: "Incorrect, recalled after seeing answer" },
  { score: 2, label: "Incorrect, but felt familiar" },
  { score: 3, label: "Correct with effort" },
  { score: 4, label: "Correct with minor hesitation" },
  { score: 5, label: "Perfect" },
];

function parseEnrichment(raw: string | null): EnrichmentData | null {
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw) as EnrichmentData;
  } catch {
    return null;
  }
}

function buildLocalMnemonic(word: string, definition: string): string {
  const match = definition.match(/[A-Za-z]{4,}/g) ?? [];
  const keyword = match[0]?.toLowerCase() ?? "meaning";
  return `Associate '${word}' with '${keyword}' and picture one personal moment where it naturally fits.`;
}

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function ReviewSession() {
  const [dueWords, setDueWords] = useState<Word[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [revealed, setRevealed] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);
  const [sessionScores, setSessionScores] = useState<number[]>([]);
  const [xpEarned, setXpEarned] = useState(0);
  const [scoredResult, setScoredResult] = useState<ScoredResult | null>(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [submittingScore, setSubmittingScore] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const loadDueWords = async () => {
      setLoadingSession(true);
      setErrorMessage(null);

      try {
        const words = await getDueWords();
        setDueWords(words);
      } catch {
        setErrorMessage("Failed to load due words.");
      } finally {
        setLoadingSession(false);
      }
    };

    void loadDueWords();
  }, []);

  const totalDue = dueWords.length;
  const currentWord = dueWords[currentIndex] ?? null;
  const completedCount = currentIndex;

  const progressValue = useMemo(() => {
    if (totalDue === 0) {
      return 0;
    }
    return Math.min((completedCount / totalDue) * 100, 100);
  }, [completedCount, totalDue]);

  const enrichment = parseEnrichment(currentWord?.ai_enrichment ?? null);
  const mnemonicText = (() => {
    const raw = enrichment?.mnemonic?.trim();
    if (!raw || raw === "Try creating a personal association with this word.") {
      return buildLocalMnemonic(currentWord?.word ?? "word", currentWord?.definition ?? "");
    }
    return raw;
  })();

  const handleReveal = () => {
    setRevealed(true);
  };

  const handleGetHint = async () => {
    if (!currentWord || loadingHint) {
      return;
    }

    setLoadingHint(true);
    setErrorMessage(null);

    try {
      const result = await getHint(currentWord.id);
      setHintText(result.hint);
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 404) {
        setErrorMessage("Word not found for hint generation.");
      } else {
        setErrorMessage("Failed to get AI hint.");
      }
    } finally {
      setLoadingHint(false);
    }
  };

  const handleScore = async (score: number) => {
    if (!currentWord || submittingScore || scoredResult) {
      return;
    }

    setSubmittingScore(true);
    setErrorMessage(null);

    try {
      const review = await submitReview(currentWord.id, score);
      setScoredResult({ score: review.score, nextReview: review.next_review });
      setSessionScores((prev) => [...prev, review.score]);
      setXpEarned((prev) => prev + review.score * 10);
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.status === 422) {
        setErrorMessage("Score must be between 0 and 5.");
      } else if (error instanceof AxiosError && error.response?.status === 404) {
        setErrorMessage("Word not found.");
      } else {
        setErrorMessage("Failed to submit score.");
      }
    } finally {
      setSubmittingScore(false);
    }
  };

  const handleNextWord = () => {
    setCurrentIndex((prev) => prev + 1);
    setRevealed(false);
    setHintText(null);
    setScoredResult(null);
    setErrorMessage(null);
  };

  if (loadingSession) {
    return <section className="page-shell">Loading review session...</section>;
  }

  if (errorMessage && totalDue === 0) {
    return (
      <section className="page-shell">
        <p className="inline-error">{errorMessage}</p>
      </section>
    );
  }

  if (totalDue === 0) {
    return (
      <section className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Review Session</h1>
          <p className="page-subtitle">No words are due right now.</p>
        </div>
      </section>
    );
  }

  if (!currentWord) {
    const averageScore =
      sessionScores.length > 0
        ? sessionScores.reduce((total, value) => total + value, 0) / sessionScores.length
        : 0;

    return (
      <section className="page-shell">
        <div className="page-header">
          <h1 className="page-title">Session Summary</h1>
          <p className="page-subtitle">Great work. Here is your review performance snapshot.</p>
        </div>
        <div className="ui-card">
          <p>
            Reviewed words: <strong>{sessionScores.length}</strong>
          </p>
          <p>
            Average score: <strong>{averageScore.toFixed(2)}</strong>
          </p>
          <p>
            XP earned: <strong>{xpEarned}</strong>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Review Session</h1>
        <p className="page-subtitle">Focus mode: one word at a time, scored with SM-2 recall quality.</p>
      </div>

      <div className="review-progress-wrap">
        <div className="ui-muted">
          Progress: {Math.min(currentIndex + 1, totalDue)} / {totalDue}
        </div>
        <div className="progress-track" aria-hidden="true">
          <div className="progress-fill" style={{ width: `${progressValue}%` }} />
        </div>
      </div>

      <article className="ui-card review-card">
        <p className="ui-muted">Current Word</p>
        <h2 className="review-word">{currentWord.word}</h2>

        {!revealed && (
          <div className="review-actions-row">
            <button className="btn-outline" type="button" onClick={handleGetHint} disabled={loadingHint}>
              {loadingHint ? "Fetching Hint..." : "Get AI Hint"}
            </button>
            <button className="btn-primary" type="button" onClick={handleReveal}>
              Reveal Definition
            </button>
          </div>
        )}

        {hintText && !revealed && (
          <div className="hint-box">
            <h3>AI Hint</h3>
            <p>{hintText}</p>
          </div>
        )}

        {revealed && (
          <div className="reveal-section">
            <h3>Definition</h3>
            <p>{currentWord.definition}</p>

            <h3>Mnemonic Hint</h3>
            <p>{mnemonicText}</p>
          </div>
        )}

        {revealed && (
          <div className="score-section">
            <h3>Score Your Recall</h3>
            <div className="score-grid">
              {SCORE_BUTTONS.map((item) => (
                <button
                  key={item.score}
                  className="score-button"
                  type="button"
                  onClick={() => {
                    void handleScore(item.score);
                  }}
                  disabled={submittingScore || Boolean(scoredResult)}
                >
                  <span className="score-number">{item.score}</span>
                  <span className="score-label">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {scoredResult && (
          <div className="result-box">
            <p>
              Recorded score: <strong>{scoredResult.score}</strong>
            </p>
            <p>
              Next review: <strong>{formatDateTime(scoredResult.nextReview)}</strong>
            </p>
            <button className="btn-primary" type="button" onClick={handleNextWord}>
              {currentIndex + 1 >= totalDue ? "Finish Session" : "Next Word"}
            </button>
          </div>
        )}

        {errorMessage && <p className="inline-error">{errorMessage}</p>}
      </article>
    </section>
  );
}
