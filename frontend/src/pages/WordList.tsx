import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

import { deleteWord, getAllWords, Word } from "../api/client";

function formatNextReview(value?: string | null): string {
  if (!value) {
    return "Not scheduled yet";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Not scheduled yet";
  }

  const today = new Date();
  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  if (isToday) {
    return "Due today!";
  }

  return `Next review: ${date.toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  })}`;
}

function difficultyMeta(value?: number): { label: string; className: string } {
  if (typeof value !== "number") {
    return { label: "Medium difficulty", className: "difficulty-medium" };
  }

  if (value > 0.6) {
    return { label: "High difficulty", className: "difficulty-hard" };
  }

  if (value >= 0.4) {
    return { label: "Medium difficulty", className: "difficulty-medium" };
  }

  return { label: "Low difficulty", className: "difficulty-easy" };
}

export default function WordList() {
  const [allWords, setAllWords] = useState<Word[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [languageFilter, setLanguageFilter] = useState("All");
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const words = await getAllWords();
        setAllWords(words);
      } catch {
        setError("Failed to load your vocabulary.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, []);

  const languages = useMemo(() => {
    const unique = Array.from(new Set(allWords.map((word) => word.language))).filter(Boolean);
    return ["All", ...unique.sort((a, b) => a.localeCompare(b))];
  }, [allWords]);

  const filteredWords = useMemo(() => {
    return allWords.filter((word) => {
      const matchesSearch = word.word.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesLanguage = languageFilter === "All" || word.language === languageFilter;
      return matchesSearch && matchesLanguage;
    });
  }, [allWords, languageFilter, searchTerm]);

  const handleDelete = async (wordId: number) => {
    const confirmed = window.confirm("Are you sure? This cannot be undone");
    if (!confirmed) {
      return;
    }

    try {
      await deleteWord(wordId);
      setAllWords((prev) => prev.filter((word) => word.id !== wordId));
      setToast("Word deleted successfully");
      setTimeout(() => setToast(null), 2500);
    } catch {
      setError("Failed to delete word.");
    }
  };

  if (loading) {
    return <section className="page-shell">Loading vocabulary...</section>;
  }

  if (error) {
    return (
      <section className="page-shell">
        <p className="inline-error">{error}</p>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header">
        <h1 className="page-title">My Vocabulary</h1>
        <p className="page-subtitle">All words in your training collection</p>
      </div>

      <div className="ui-card filter-bar">
        <input
          className="ui-input"
          type="text"
          value={searchTerm}
          onChange={(event) => setSearchTerm(event.target.value)}
          placeholder="Search words..."
        />
        <select
          className="ui-input"
          value={languageFilter}
          onChange={(event) => setLanguageFilter(event.target.value)}
        >
          {languages.map((language) => (
            <option key={language} value={language}>
              {language}
            </option>
          ))}
        </select>
      </div>

      {toast && <div className="success-banner">{toast}</div>}

      {filteredWords.length === 0 ? (
        <div className="ui-card empty-state">
          <div className="empty-icon">📚</div>
          <h3>No words yet</h3>
          <p>Add your first word to start learning</p>
          <Link to="/add" className="btn-primary">
            Add Your First Word
          </Link>
        </div>
      ) : (
        <div className="words-grid">
          {filteredWords.map((word) => {
            const difficulty = difficultyMeta(word.predicted_difficulty);
            const hasAi = Boolean(word.ai_enrichment);

            return (
              <article key={word.id} className="word-card">
                <div className="word-card-top">
                  <h3>{word.word}</h3>
                  <span className="language-badge">{word.language}</span>
                </div>

                <p className="word-definition">{word.definition}</p>
                <p className={formatNextReview(word.next_review) === "Due today!" ? "due-today" : "ui-muted"}>
                  {formatNextReview(word.next_review)}
                </p>

                <p className="difficulty-row">
                  <span className={`difficulty-dot ${difficulty.className}`} />
                  {difficulty.label}
                </p>

                {hasAi && <span className="ai-badge">🧠 AI Enhanced</span>}

                <button className="btn-danger" type="button" onClick={() => void handleDelete(word.id)}>
                  Delete
                </button>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
