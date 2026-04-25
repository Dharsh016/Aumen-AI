import axios from "axios";

// Force default backend API base to the development backend on port 8001.
// This ensures the frontend always points to the correct local backend
// even if an older environment value is present in a running shell.
const API_BASE = "http://127.0.0.1:8001";

const api = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
  headers: {
    "Content-Type": "application/json",
  },
});

export interface Word {
  id: number;
  word: string;
  definition: string;
  language: string;
  created_at?: string;
  ai_enrichment: string | null;
  streak: number;
  xp: number;
  next_review?: string | null;
  predicted_difficulty?: number;
}

export interface Review {
  score: number;
  interval: number;
  next_review: string;
}

export interface HistoryEntry {
  word: string;
  language: string;
  total_reviews: number;
  average_score: number;
  last_reviewed: string;
  streak: number;
}

export interface HistoryResponse {
  history: HistoryEntry[];
  insights: string;
}

export interface HintResponse {
  hint: string;
}

export interface AdminMetricPoint {
  date: string;
  count: number;
}

export interface AdminScorePoint {
  score: number;
  count: number;
}

export interface AdminRecentReview {
  word: string;
  score: number;
  review_date: string;
}

export interface AdminTopWord {
  word: string;
  average_score: number;
  total_reviews: number;
}

export interface AdminAnalytics {
  generated_at: string;
  total_users: number;
  total_words: number;
  total_reviews: number;
  average_score: number;
  due_now: number;
  users_last_7_days: number;
  reviews_last_7_days: AdminMetricPoint[];
  user_registrations: AdminMetricPoint[];
  score_distribution: AdminScorePoint[];
  recent_reviews: AdminRecentReview[];
  top_words: AdminTopWord[];
}

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  created_at: string;
  is_admin: boolean;
}

export interface AuthResponse {
  message: string;
  user: AuthUser;
}

const ADMIN_EMAIL = "admin@example.com";
const ADMIN_PASSWORD = "lexicore123";

export async function addWord(
  word: string,
  definition: string,
  language: string
): Promise<Word> {
  const response = await api.post<Word>("/words/", {
    word,
    definition,
    language,
  });
  return response.data;
}

export async function getDueWords(): Promise<Word[]> {
  const response = await api.get<Word[]>("/words/due/");
  return response.data;
}

export async function submitReview(wordId: number, score: number): Promise<Review> {
  const response = await api.post<Review>(`/words/${wordId}/review/`, { score });
  return response.data;
}

export const getHistory = async (): Promise<HistoryResponse> => {
  const response = await axios.get(`${API_BASE}/words/history/`);
  return response.data;
};

export async function getAllWords(): Promise<Word[]> {
  const response = await api.get<Word[]>("/words/");
  return response.data;
}

export async function deleteWord(wordId: number): Promise<void> {
  await api.delete(`/words/${wordId}`);
}

export async function getHint(wordId: number): Promise<HintResponse> {
  const response = await api.get<HintResponse>(`/words/${wordId}/hint/`);
  return response.data;
}

export async function getAdminAnalytics(): Promise<AdminAnalytics> {
  const response = await api.get<AdminAnalytics>("/admin/analytics", {
    headers: {
      "X-Admin-Email": ADMIN_EMAIL,
      "X-Admin-Password": ADMIN_PASSWORD,
    },
  });
  return response.data;
}

export async function registerUser(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/register", {
    name,
    email,
    password,
  });
  return response.data;
}

export async function loginUser(
  email: string,
  password: string
): Promise<AuthResponse> {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
}
