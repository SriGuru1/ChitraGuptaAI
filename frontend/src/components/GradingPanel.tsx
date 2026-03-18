import { useState } from "react";
import type { FormEvent } from "react";

import { gradeSubmission } from "../api/tests";
import type { Question, ScoreResponse } from "../api/tests";

type Props = {
  question: Question | null;
};

export default function GradingPanel({ question }: Props) {
  const [form, setForm] = useState({
    student_name: "",
    student_answer_text: "",
    student_answer_image: null as File | null,
  });
  const [result, setResult] = useState<ScoreResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  if (!question) {
    return (
      <section className="panel" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
        <p className="text-muted">Select a question from the sidebar to start grading.</p>
      </section>
    );
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const response = await gradeSubmission(question.id, {
        student_name: form.student_name,
        student_answer_text: form.student_answer_text || undefined,
        student_answer_image: form.student_answer_image ?? undefined,
      });
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to grade submission");
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="panel">
      <header style={{ marginBottom: '2rem' }}>
        <p className="eyebrow" style={{ marginBottom: '0.5rem' }}>Evaluation Phase</p>
        <h2>Grade Response</h2>
        <p className="text-muted" style={{ marginTop: '0.5rem' }}>Evaluating: {question.prompt}</p>
      </header>
      
      <form onSubmit={handleSubmit} style={{ borderBottom: result ? '1px solid var(--border-card)' : 'none', paddingBottom: result ? '2rem' : '0' }}>
        <label>
          Student Name
          <input
            value={form.student_name}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, student_name: e.target.value }))
            }
            required
            placeholder="Jane Doe"
          />
        </label>
        <label>
          Student Response
          <textarea
            value={form.student_answer_text}
            onChange={(e) =>
              setForm((prev) => ({ ...prev, student_answer_text: e.target.value }))
            }
            rows={6}
            placeholder="Paste student text answer or upload an image below..."
          />
        </label>
        <label>
          Or OCR from Image
          <input
            type="file"
            accept="image/*"
            onChange={(e) =>
              setForm((prev) => ({
                ...prev,
                student_answer_image: e.target.files?.[0] ?? null,
              }))
            }
          />
        </label>
        <button className="submit-btn" disabled={loading} type="submit">
          {loading ? "Processing OCR & Scoring..." : "Grade Now"}
        </button>
      </form>

      {error && <p className="error" style={{ marginTop: '1rem', color: '#f87171' }}>{error}</p>}

      {result && (
        <div style={{ marginTop: '2.5rem', animation: 'fadeIn 0.5s ease' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
            <div className="score-badge">
              {result.normalized_score}%
            </div>
            <div>
              <h3>AI Confidence Score</h3>
              <p className="text-muted">Similarity Match: {result.similarity_score.toFixed(4)}</p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginTop: '2rem' }}>
            <div className="panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: 'var(--primary)' }}>Model Key</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{result.model_answer}</p>
            </div>
            <div className="panel" style={{ background: 'rgba(255,255,255,0.02)', padding: '1.5rem' }}>
              <h4 style={{ marginBottom: '1rem', color: '#4ade80' }}>Student Work</h4>
              <p style={{ fontSize: '0.9rem', lineHeight: '1.5' }}>{result.student_answer}</p>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}

