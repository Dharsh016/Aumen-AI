import React, { useEffect, useMemo, useState } from "react";
import {
  BrowserRouter,
  Link,
  NavLink,
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import { getHistory, HistoryEntry } from "./api/client";
import "./App.css";
import AddWord from "./pages/AddWord";
import History from "./pages/History";
import ReviewSession from "./pages/ReviewSession";
import Schedule from "./pages/Schedule";
import WordList from "./pages/WordList";

type AppStats = {
  wordsLearned: number;
  totalReviews: number;
  streak: number;
  totalXp: number;
};

function OpeningPage({ stats }: { stats: AppStats }) {
  return (
    <div className="landing-shell">
      <section className="landing-hero">
        <div className="landing-mark" aria-hidden="true">
          <span className="mark-core">L</span>
        </div>
        <div className="landing-logo">LexiCore AI</div>
        <h1 className="landing-title">LexiCore</h1>
        <p className="landing-tagline">
          AI-Powered Vocabulary Training — Learn Smarter, Remember Longer
        </p>
        <div className="landing-cta-row">
          <Link to="/add" className="btn-primary btn-large">
            Start Learning →
          </Link>
          <Link to="/review" className="btn-outline btn-large">
            Review Today
          </Link>
        </div>
      </section>

      <section className="landing-features">
        <article className="feature-card">
          <div className="feature-icon">🧠</div>
          <h3>Spaced Repetition</h3>
          <p>SM-2 algorithm schedules every review at the perfect retention moment.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">🤖</div>
          <h3>AI Enrichment</h3>
          <p>Groq AI generates mnemonics, examples and etymology instantly.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">📊</div>
          <h3>Progress Analytics</h3>
          <p>Track retention trends, sessions, and momentum with visual charts.</p>
        </article>
        <article className="feature-card">
          <div className="feature-icon">🎯</div>
          <h3>Difficulty Prediction</h3>
          <p>ML model predicts which words you will struggle with before review.</p>
        </article>
      </section>

      <section className="landing-stats">
        <div className="stat-item">
          <span className="stat-number">{stats.wordsLearned}</span>
          <span className="stat-label">Words Learned</span>
        </div>
        <div className="stat-divider">|</div>
        <div className="stat-item">
          <span className="stat-number">{stats.totalReviews}</span>
          <span className="stat-label">Total Reviews</span>
        </div>
        <div className="stat-divider">|</div>
        <div className="stat-item">
          <span className="stat-number">{stats.streak}</span>
          <span className="stat-label">Day Streak</span>
        </div>
      </section>
    </div>
  );
}

function Navbar({ stats }: { stats: AppStats }) {
  return (
    <nav className="app-nav">
      <Link to="/" className="app-brand">
        <span className="brand-icon">📚</span>
        <span className="brand-text">LexiCore</span>
      </Link>

      <div className="app-nav-links">
        <NavLink
          to="/add"
          className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
        >
          Add Word
        </NavLink>
        <NavLink
          to="/review"
          className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
        >
          Review Today
        </NavLink>
        <NavLink
          to="/history"
          className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
        >
          History
        </NavLink>
        <NavLink
          to="/schedule"
          className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
        >
          Schedule
        </NavLink>
        <NavLink
          to="/words"
          className={({ isActive }) => `app-nav-link ${isActive ? "active" : ""}`}
        >
          My Words
        </NavLink>
      </div>

      <div className="app-nav-stats">
        <span>🔥 {stats.streak}</span>
        <span className="xp-divider">|</span>
        <span>XP: {stats.totalXp}</span>
      </div>
    </nav>
  );
}

function AppLayout({ stats }: { stats: AppStats }) {
  const location = useLocation();
  const isLanding = location.pathname === "/";

  return (
    <div className="app-shell">
      {!isLanding && <Navbar stats={stats} />}
      <main className={isLanding ? "main-landing" : "main-app"}>
        <Routes>
          <Route path="/" element={<OpeningPage stats={stats} />} />
          <Route path="/add" element={<AddWord />} />
          <Route path="/review" element={<ReviewSession />} />
          <Route path="/history" element={<History />} />
          <Route path="/schedule" element={<Schedule />} />
          <Route path="/words" element={<WordList />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function App() {
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const response = await getHistory();
        const entries = Array.isArray(response)
          ? response
          : (response as { history: HistoryEntry[] }).history || [];
        setHistoryEntries(entries);
      } catch {
        setHistoryEntries([]);
      }
    };
    void loadStats();
  }, []);

  const appStats = useMemo<AppStats>(() => {
    const wordsLearned = historyEntries.length;
    const totalReviews = historyEntries.reduce(
      (sum, entry) => sum + entry.total_reviews,
      0
    );
    const streak = historyEntries.reduce(
      (max, entry) => Math.max(max, entry.streak),
      0
    );
    const totalXp = Math.round(
      historyEntries.reduce(
        (sum, entry) => sum + entry.average_score * entry.total_reviews * 10,
        0
      )
    );
    return { wordsLearned, totalReviews, streak, totalXp };
  }, [historyEntries]);

  return (
    <BrowserRouter>
      <AppLayout stats={appStats} />
    </BrowserRouter>
  );
}

export default App;
