import React, { useEffect, useMemo, useState } from "react";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid } from "recharts";
import { getHistory, HistoryEntry } from "../api/client";

function getScoreClass(score: number): string {
  if (score < 2) return "score-red";
  if (score <= 3.5) return "score-yellow";
  return "score-green";
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function History() {
  const [historyData, setHistoryData] = useState<HistoryEntry[]>([]);
  const [insights, setInsights] = useState<string>("No AI insights available.");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await getHistory();
        setHistoryData(response.history ?? []);
        setInsights(response.insights || "No AI insights returned by the endpoint.");
      } catch {
        setError("Failed to load learning history.");
      } finally {
        setLoading(false);
      }
    };

    void fetchHistory();
  }, []);

  const sortedEntries = useMemo(() => {
    return [...historyData].sort((a, b) => {
      const timeA = new Date(a.last_reviewed).getTime();
      const timeB = new Date(b.last_reviewed).getTime();
      return timeA - timeB;
    });
  }, [historyData]);

  const chartData = useMemo(
    () =>
      sortedEntries.map((entry) => ({
        date: new Date(entry.last_reviewed).toLocaleDateString(),
        average_score: Number(entry.average_score.toFixed(2)),
        word: entry.word,
      })),
    [sortedEntries],
  );

  if (loading) {
    return <section className="page-shell">Loading history...</section>;
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
        <h1 className="page-title">Learning History</h1>
        <p className="page-subtitle">Track your consistency, score trends, and AI coaching insights.</p>
      </div>

      <div className="insights-box">
        <h2>AI Insights</h2>
        <p>{insights}</p>
      </div>

      <div className="ui-card table-wrap">
        <table className="history-table">
          <thead>
            <tr>
              <th>Word</th>
              <th>Total Reviews</th>
              <th>Average Score</th>
              <th>Last Reviewed</th>
              <th>Streak</th>
            </tr>
          </thead>
          <tbody>
            {historyData.length === 0 && (
              <tr>
                <td colSpan={5} className="empty-cell">
                  No history available yet.
                </td>
              </tr>
            )}
            {historyData.map((entry) => (
              <tr key={entry.word}>
                <td>{entry.word}</td>
                <td>{entry.total_reviews}</td>
                <td>
                  <span className={getScoreClass(entry.average_score)}>{entry.average_score.toFixed(2)}</span>
                </td>
                <td>{formatDate(entry.last_reviewed)}</td>
                <td>
                  🔥 {entry.streak}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="ui-card chart-card">
        <h2>Average Score Over Time</h2>
        <div className="chart-wrap">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 12, right: 16, left: 0, bottom: 8 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis domain={[0, 5]} stroke="#94a3b8" />
              <Tooltip
                contentStyle={{ background: "#1e293b", border: "1px solid #334155", color: "#f1f5f9" }}
                itemStyle={{ color: "#f1f5f9" }}
                labelStyle={{ color: "#cbd5e1" }}
              />
              <Line type="monotone" dataKey="average_score" stroke="#3b82f6" strokeWidth={2} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </section>
  );
}
