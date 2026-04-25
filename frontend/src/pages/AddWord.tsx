import React, { FormEvent, useMemo, useState } from "react";
import { AxiosError } from "axios";

import { addWord } from "../api/client";

type LanguageOption = {
  label: string;
  value: string;
};

type EnrichmentData = {
  mnemonic?: string;
  example_sentences?: string[];
  etymology?: string;
  common_mistakes?: string;
};

const LANGUAGE_OPTIONS: LanguageOption[] = [
  { label: "English", value: "English" },
  { label: "German", value: "German" },
  { label: "French", value: "French" },
  { label: "Spanish", value: "Spanish" },
  { label: "Italian", value: "Italian" },
  { label: "Portuguese", value: "Portuguese" },
  { label: "Japanese", value: "Japanese" },
  { label: "Chinese", value: "Chinese" },
  { label: "Korean", value: "Korean" },
  { label: "Russian", value: "Russian" },
  { label: "Arabic", value: "Arabic" },
  { label: "Hindi", value: "Hindi" },
  { label: "Turkish", value: "Turkish" },
  { label: "Dutch", value: "Dutch" },
  { label: "Swedish", value: "Swedish" },
  { label: "Polish", value: "Polish" },
  { label: "Greek", value: "Greek" },
  { label: "Hebrew", value: "Hebrew" },
  { label: "Thai", value: "Thai" },
  { label: "Vietnamese", value: "Vietnamese" },
];

function parseEnrichment(raw: string | null): EnrichmentData | null {
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as EnrichmentData;
    return parsed;
  } catch {
    return null;
  }
}

export default function AddWord() {
  const [word, setWord] = useState("");
  const [definition, setDefinition] = useState("");
  const [language, setLanguage] = useState("English");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [aiEnrichmentRaw, setAiEnrichmentRaw] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState({
    word: "",
    definition: "",
    language: "",
  });

  const enrichment = useMemo(() => parseEnrichment(aiEnrichmentRaw), [aiEnrichmentRaw]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage(null);

    const nextErrors = {
      word: word.trim() ? "" : "Please enter a word",
      definition: definition.trim() ? "" : "Please enter a definition",
      language: language ? "" : "Please select a language",
    };

    setFieldErrors(nextErrors);

    if (nextErrors.word || nextErrors.definition || nextErrors.language) {
      return;
    }

    setIsSubmitting(true);

    try {
      const created = await addWord(word.trim(), definition.trim(), language);
      setAiEnrichmentRaw(created.ai_enrichment);
      setSuccessMessage("✓ Word added successfully! AI enrichment is being generated...");
      setWord("");
      setDefinition("");
      setLanguage("English");
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (error: unknown) {
      if (error instanceof AxiosError && error.response?.data?.detail) {
        const detail = error.response.data.detail;
        setErrorMessage(typeof detail === "string" ? detail : "Failed to add word.");
      } else {
        setErrorMessage("Failed to add word. Please try again.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="page-shell">
      <div className="page-header">
        <h1 className="page-title">Add Vocabulary Word</h1>
        <p className="page-subtitle">Build your personal lexicon with AI-enhanced memory cues.</p>
      </div>

      <form className="ui-card" onSubmit={handleSubmit}>
        {successMessage && <div className="success-banner">{successMessage}</div>}

        <label className="ui-label" htmlFor="word-input">
          Word
        </label>
        <input
          id="word-input"
          className="ui-input"
          type="text"
          value={word}
          onChange={(event) => {
            setWord(event.target.value);
            setFieldErrors((prev) => ({ ...prev, word: "" }));
          }}
          placeholder="Enter a word"
          disabled={isSubmitting}
        />
        {fieldErrors.word && <p className="inline-error">{fieldErrors.word}</p>}

        <label className="ui-label" htmlFor="definition-input">
          Definition
        </label>
        <textarea
          id="definition-input"
          className="ui-input"
          value={definition}
          onChange={(event) => {
            setDefinition(event.target.value);
            setFieldErrors((prev) => ({ ...prev, definition: "" }));
          }}
          placeholder="Enter a concise definition"
          rows={4}
          disabled={isSubmitting}
        />
        {fieldErrors.definition && <p className="inline-error">{fieldErrors.definition}</p>}

        <label className="ui-label" htmlFor="language-select">
          Language
        </label>
        <select
          id="language-select"
          className="ui-input"
          value={language}
          onChange={(event) => {
            setLanguage(event.target.value);
            setFieldErrors((prev) => ({ ...prev, language: "" }));
          }}
          disabled={isSubmitting}
        >
          {LANGUAGE_OPTIONS.map((option) => (
            <option key={option.label} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {fieldErrors.language && <p className="inline-error">{fieldErrors.language}</p>}

        <div className="addword-actions">
          <button className="btn-primary" type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Adding..." : "Add Word"}
          </button>
          <button
            className="btn-outline"
            type="button"
            onClick={() => {
              setWord("");
              setDefinition("");
              setLanguage("English");
              setFieldErrors({ word: "", definition: "", language: "" });
              setErrorMessage(null);
            }}
          >
            Add Another Word
          </button>
        </div>

        {isSubmitting && <p className="ui-muted">Generating AI enrichment...</p>}
        {errorMessage && <p className="inline-error">{errorMessage}</p>}
      </form>

      {enrichment && (
        <article className="ui-card enrichment-card">
          <h2 className="enrichment-title">🧠 AI Enrichment</h2>
          <p>
            <strong>Mnemonic:</strong> {enrichment.mnemonic || "No mnemonic available."}
          </p>
          <p>
            <strong>Example Sentences:</strong>
          </p>
          {enrichment.example_sentences && enrichment.example_sentences.length > 0 ? (
            <div className="sentence-list">
              {enrichment.example_sentences.map((sentence, index) => (
                <p key={`${sentence}-${index}`}>{sentence}</p>
              ))}
            </div>
          ) : (
            <p>No examples available.</p>
          )}
          <p>
            <strong>Etymology:</strong> {enrichment.etymology || "No etymology available."}
          </p>
          <p>
            <strong>Common Mistakes:</strong> {enrichment.common_mistakes || "No common mistakes available."}
          </p>
        </article>
      )}
    </section>
  );
}
