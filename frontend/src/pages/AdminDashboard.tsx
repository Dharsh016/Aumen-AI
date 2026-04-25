import React, { useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { AdminAnalytics, getAdminAnalytics } from "../api/client";

function formatDateTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString();
}

export default function AdminDashboard() {
  const [analytics, setAnalytics] = useState<AdminAnalytics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;

    const loadAnalytics = async () => {
      if (mounted) {
        setError(null);
      }

      try {
        const response = await getAdminAnalytics();
        if (mounted) {
          setAnalytics(response);
        }
      } catch {
        if (mounted) {
          setError("Failed to load admin analytics.");
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadAnalytics();
    const intervalId = window.setInterval(() => {
      void loadAnalytics();
    }, 5000);

    return () => {
      mounted = false;
      window.clearInterval(intervalId);
    };
  }, []);

  const metricCards = useMemo(() => {
    if (!analytics) {
      return [];
    }

    return [
      { label: "Registered Users", value: analytics.total_users },
      { label: "Words Added", value: analytics.total_words },
      { label: "Total Reviews", value: analytics.total_reviews },
      { label: "Average Score", value: analytics.average_score.toFixed(2) },
      { label: "Due Right Now", value: analytics.due_now },
      { label: "New Users (7d)", value: analytics.users_last_7_days },
    ];
  }, [analytics]);

  if (loading) {
    return <section className="page-shell">Loading admin dashboard...</section>;
  }

  if (error) {
    return (
      <section className="page-shell">
        <p className="inline-error">{error}</p>
      </section>
    );
  }

  if (!analytics) {
    return (
      <section className="page-shell">
        <p className="inline-error">No analytics data available.</p>
      </section>
    );
  }

  return (
    <section className="page-shell">
      <div className="page-header admin-header-row">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Simple real-time analytics (refreshes every 5 seconds).</p>
        </div>
        <span className="admin-generated-at">Updated: {formatDateTime(analytics.generated_at)}</span>
      </div>

      <div className="admin-metrics-grid">
        {metricCards.map((item) => (
          <article key={item.label} className="ui-card admin-metric-card">
            <p className="admin-metric-label">{item.label}</p>
            <h3 className="admin-metric-value">{item.value}</h3>
          </article>
        ))}
      </div>

      <div className="admin-charts-grid">
        <article className="ui-card">
          <h2 className="admin-card-title">Reviews in Last 7 Days</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={analytics.reviews_last_7_days}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="date" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#cbd5e1" }}
                />
                <Line type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="ui-card">
          <h2 className="admin-card-title">Score Distribution</h2>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={analytics.score_distribution}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis dataKey="score" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" allowDecimals={false} />
                <Tooltip
                  contentStyle={{ background: "#1e293b", border: "1px solid #334155" }}
                  itemStyle={{ color: "#e2e8f0" }}
                  labelStyle={{ color: "#cbd5e1" }}
                />
                <Bar dataKey="count" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </article>
      </div>

      <div className="admin-tables-grid">
        <article className="ui-card table-wrap">
          <h2 className="admin-card-title">Top Reviewed Words</h2>
          <table className="history-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Total Reviews</th>
                <th>Average Score</th>
              </tr>
            </thead>
            <tbody>
              {analytics.top_words.map((item) => (
                <tr key={item.word}>
                  <td>{item.word}</td>
                  <td>{item.total_reviews}</td>
                  <td>{item.average_score.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>

        <article className="ui-card table-wrap">
          <h2 className="admin-card-title">Recent Reviews</h2>
          <table className="history-table">
            <thead>
              <tr>
                <th>Word</th>
                <th>Score</th>
                <th>Reviewed At</th>
              </tr>
            </thead>
            <tbody>
              {analytics.recent_reviews.map((item) => (
                <tr key={`${item.word}-${item.review_date}`}>
                  <td>{item.word}</td>
                  <td>{item.score}</td>
                  <td>{formatDateTime(item.review_date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </article>
      </div>
    </section>
  );
}
