import React, { useEffect, useMemo, useState } from "react";
import { getAllWords, Word } from "../api/client";

type SchedulableWord = Word;

type GroupType = "today" | "tomorrow" | "future" | "notReviewed";

type GroupedItem = {
  dateKey: string;
  label: string;
  type: GroupType;
  words: SchedulableWord[];
};

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function dayDiffFromToday(date: Date): number {
  const today = startOfDay(new Date());
  const target = startOfDay(date);
  const msPerDay = 1000 * 60 * 60 * 24;
  return Math.round((target.getTime() - today.getTime()) / msPerDay);
}

function relativeDateLabel(date: Date): string {
  const diff = dayDiffFromToday(date);
  if (diff === 1) {
    return "Tomorrow";
  }
  return `In ${Math.max(diff, 2)} days`;
}

function formatHeading(date: Date, count: number): string {
  return `${relativeDateLabel(date)} (${count} ${count === 1 ? "word" : "words"})`;
}

function getDifficultyMeta(predictedDifficulty?: number | null): { color: string; label: string } {
  if (typeof predictedDifficulty !== "number") {
    return { color: "#eab308", label: "Medium" };
  }
  if (predictedDifficulty > 0.6) {
    return { color: "#ef4444", label: "Hard" };
  }
  if (predictedDifficulty >= 0.4) {
    return { color: "#f59e0b", label: "Medium" };
  }
  return { color: "#10b981", label: "Easy" };
}

export default function Schedule() {
  const [words, setWords] = useState<SchedulableWord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadWords = async () => {
      setLoading(true);
      setError(null);

      try {
        const list = await getAllWords();
        setWords(list);
      } catch {
        setError("Failed to fetch words for schedule.");
      } finally {
        setLoading(false);
      }
    };

    void loadWords();
  }, []);

  const grouped = useMemo(() => {
    const notReviewed: SchedulableWord[] = [];
    const today: SchedulableWord[] = [];
    const tomorrow: SchedulableWord[] = [];
    const map = new Map<string, SchedulableWord[]>();
    const todayStart = startOfDay(new Date());

    words.forEach((word) => {
      if (!word.next_review) {
        notReviewed.push(word);
        return;
      }

      const parsed = new Date(word.next_review);
      if (Number.isNaN(parsed.getTime())) {
        notReviewed.push(word);
        return;
      }

      const parsedStart = startOfDay(parsed);
      const diff = dayDiffFromToday(parsedStart);

      if (parsedStart.getTime() === todayStart.getTime() || diff < 0) {
        today.push(word);
        return;
      }

      if (diff === 1) {
        tomorrow.push(word);
        return;
      }

      const dateKey = parsedStart.toISOString();
      const existing = map.get(dateKey) ?? [];
      existing.push(word);
      map.set(dateKey, existing);
    });

    const items: GroupedItem[] = [];

    if (today.length > 0) {
      items.push({
        dateKey: "today",
        label: `Due Today (${today.length} ${today.length === 1 ? "word" : "words"})`,
        type: "today",
        words: today.sort((a, b) => a.word.localeCompare(b.word)),
      });
    }

    if (tomorrow.length > 0) {
      items.push({
        dateKey: "tomorrow",
        label: `Tomorrow (${tomorrow.length} ${tomorrow.length === 1 ? "word" : "words"})`,
        type: "tomorrow",
        words: tomorrow.sort((a, b) => a.word.localeCompare(b.word)),
      });
    }

    const upcoming: GroupedItem[] = Array.from(map.entries())
      .sort(([a], [b]) => new Date(a).getTime() - new Date(b).getTime())
      .map(([dateKey, groupedWords]) => {
        const date = new Date(dateKey);
        return {
          dateKey,
          label: formatHeading(date, groupedWords.length),
          type: "future",
          words: groupedWords.sort((a, b) => a.word.localeCompare(b.word)),
        };
      });

    items.push(...upcoming);

    if (notReviewed.length > 0) {
      items.push({
        dateKey: "not-reviewed",
        label: `Not yet reviewed (${notReviewed.length} ${notReviewed.length === 1 ? "word" : "words"})`,
        type: "notReviewed",
        words: notReviewed.sort((a, b) => a.word.localeCompare(b.word)),
      });
    }

    return items;
  }, [words]);

  if (loading) {
    return <section className="page-shell">Loading schedule...</section>;
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
        <h1 className="page-title">Upcoming Review Schedule</h1>
        <p className="page-subtitle">Your smart timeline of due and upcoming review tasks.</p>
      </div>

      {grouped.length === 0 ? (
        <div className="ui-card">
          <p>No upcoming reviews found.</p>
        </div>
      ) : (
        grouped.map((group) => (
          <article key={group.dateKey} className="ui-card schedule-group-card">
            <header className="schedule-group-header">{group.label}</header>

            <ul className="schedule-word-list">
              {group.words.map((word) => (
                <li key={word.id} className="schedule-word-item">
                  <span className="schedule-word-name">{word.word}</span>
                  <span className="difficulty-row">
                    <span
                      aria-label="difficulty-indicator"
                      title="Predicted difficulty"
                      className="difficulty-dot"
                      style={{ background: getDifficultyMeta(word.predicted_difficulty).color }}
                    />
                    {getDifficultyMeta(word.predicted_difficulty).label}
                  </span>
                </li>
              ))}
            </ul>
          </article>
        ))
      )}
    </section>
  );
}
