import { useMemo, useState } from "react";
import type { FormEvent } from "react";

import {
  createQuestion,
  createTest,
  fetchQuestions,
  fetchTests,
} from "../api/tests";
import type { Question, Test } from "../api/tests";
import { useQuery, useQueryClient } from "@tanstack/react-query";

type Props = {
  onQuestionSelect: (question: Question | null) => void;
};

export default function TestBuilder({ onQuestionSelect }: Props) {
  const queryClient = useQueryClient();
  const { data: tests } = useQuery({
    queryKey: ["tests"],
    queryFn: fetchTests,
  });

  const [selectedTest, setSelectedTest] = useState<number>();

  const { data: questions } = useQuery({
    queryKey: ["questions", selectedTest],
    queryFn: () => (selectedTest ? fetchQuestions(selectedTest) : Promise.resolve([])),
    enabled: Boolean(selectedTest),
  });

  const [testForm, setTestForm] = useState({ name: "", description: "" });
  const [questionForm, setQuestionForm] = useState({
    prompt: "",
    model_answer_text: "",
    model_answer_image: null as File | null,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const currentTestName = useMemo(
    () => tests?.find((test: Test) => test.id === selectedTest)?.name ?? "",
    [tests, selectedTest],
  );

  const handleTestSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    try {
      await createTest(testForm);
      await queryClient.invalidateQueries({ queryKey: ["tests"] });
      setTestForm({ name: "", description: "" });
      setMessage("Test created!");
    } finally {
      setLoading(false);
    }
  };

  const handleQuestionSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedTest) return;
    setLoading(true);
    try {
      await createQuestion(selectedTest, {
        prompt: questionForm.prompt,
        model_answer_text: questionForm.model_answer_text || undefined,
        model_answer_image: questionForm.model_answer_image ?? undefined,
      });
      await queryClient.invalidateQueries({ queryKey: ["questions", selectedTest] });
      setQuestionForm({ prompt: "", model_answer_text: "", model_answer_image: null });
      setMessage("Question saved and OCR processed!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <section className="panel" style={{ marginBottom: '2rem' }}>
        <h3>Create New Test</h3>
        <form onSubmit={handleTestSubmit} style={{ marginTop: '1.5rem' }}>
          <label>
            Name
            <input
              value={testForm.name}
              onChange={(e) => setTestForm((prev) => ({ ...prev, name: e.target.value }))}
              required
              placeholder="Midterm Examination"
            />
          </label>
          <label>
            Description
            <textarea
              value={testForm.description}
              onChange={(e) =>
                setTestForm((prev) => ({ ...prev, description: e.target.value }))
              }
              rows={2}
              placeholder="Optional test description..."
            />
          </label>
          <button className="submit-btn" disabled={loading} type="submit">
            {loading ? "Saving..." : "Create Test"}
          </button>
        </form>
      </section>

      <section className="panel" style={{ marginBottom: '2rem' }}>
        <h3>Your Tests</h3>
        <div className="test-list" style={{ marginTop: '1.5rem' }}>
          {tests?.map((test: Test) => (
            <button
              key={test.id}
              className={`test-item ${selectedTest === test.id ? "active" : ""}`}
              onClick={() => {
                setSelectedTest(test.id);
                onQuestionSelect(null);
              }}
            >
              <h4>{test.name}</h4>
              <p>{new Date(test.created_at).toLocaleDateString()}</p>
            </button>
          ))}
          {!tests?.length && <p className="text-muted">No tests created yet.</p>}
        </div>
      </section>

      {selectedTest && (
        <section className="panel">
          <h3>Questions for {currentTestName}</h3>
          <form 
            onSubmit={handleQuestionSubmit} 
            style={{ marginTop: '1.5rem', paddingBottom: '2rem', borderBottom: '1px solid var(--border-card)' }}
          >
            <label>
              Question Prompt
              <textarea
                value={questionForm.prompt}
                onChange={(e) =>
                  setQuestionForm((prev) => ({ ...prev, prompt: e.target.value }))
                }
                required
                rows={3}
                placeholder="What is the capital of France?"
              />
            </label>
            <label>
              Model Answer
              <textarea
                value={questionForm.model_answer_text}
                onChange={(e) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    model_answer_text: e.target.value,
                  }))
                }
                rows={4}
                placeholder="Type or paste the ideal answer..."
              />
            </label>
            <label>
              Or Upload Key
              <input
                type="file"
                accept="image/*"
                onChange={(e) =>
                  setQuestionForm((prev) => ({
                    ...prev,
                    model_answer_image: e.target.files?.[0] ?? null,
                  }))
                }
              />
            </label>
            <button className="submit-btn" disabled={loading} type="submit">
              {loading ? "Processing OCR..." : "Add Question"}
            </button>
          </form>

          <div className="test-list" style={{ marginTop: '2rem' }}>
            {questions?.map((question: Question) => (
              <div
                key={question.id}
                onClick={() => onQuestionSelect(question)}
                className="test-item"
                style={{ cursor: 'pointer' }}
              >
                <h4>{question.prompt}</h4>
                <p style={{ maxHeight: '40px', overflow: 'hidden' }}>{question.model_answer_text}</p>
              </div>
            ))}
          </div>
        </section>
      )}
      {message && <p className="status-tag status-success" style={{ marginTop: '1rem' }}>{message}</p>}
    </>
  );
}

