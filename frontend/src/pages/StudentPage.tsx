import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";
import { fetchTests, fetchQuestions, studentSubmit, fetchMySubmissions } from "../api/tests";
import type { Test, Question, Submission } from "../api/tests";

export default function StudentPage() {
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [answerText, setAnswerText] = useState("");
  const [answerImage, setAnswerImage] = useState<File | null>(null);

  const { data: tests } = useQuery({ queryKey: ["tests"], queryFn: fetchTests });
  const { data: questions } = useQuery({
    queryKey: ["questions", selectedTest?.id],
    queryFn: () => selectedTest ? fetchQuestions(selectedTest.id) : Promise.resolve([]),
    enabled: !!selectedTest,
  });
  const { data: mySubmissions } = useQuery({ queryKey: ["my-submissions"], queryFn: fetchMySubmissions });

  const submitMutation = useMutation({
    mutationFn: (data: { questionId: number, text?: string, image?: File }) => 
      studentSubmit(data.questionId, { student_answer_text: data.text, student_answer_image: data.image }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my-submissions"] });
      setAnswerText("");
      setAnswerImage(null);
      alert("Submission successful!");
    }
  });

  const getSubmissionForQuestion = (qId: number) => 
    mySubmissions?.find((s: Submission) => s.question_id === qId);

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Student Portal</p>
          <h1>Welcome, {user?.email.split('@')[0]}</h1>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>

      <main>
        <div className="sidebar-panel">
          <section className="panel">
            <h3>Available Tests</h3>
            <div className="test-list">
              {tests?.map((test: Test) => (
                <button
                  key={test.id}
                  className={`test-item ${selectedTest?.id === test.id ? "active" : ""}`}
                  onClick={() => {
                    setSelectedTest(test);
                    setSelectedQuestion(null);
                  }}
                >
                  <h4>{test.name}</h4>
                  <p>{test.description || "No description"}</p>
                </button>
              ))}
            </div>
          </section>

          <section className="panel">
            <h3>Your Recent Grades</h3>
            <div className="test-list">
              {mySubmissions?.slice(0, 5).map((s: Submission) => (
                <div key={s.id} className="test-item">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>QID: {s.question_id}</span>
                    <span className="status-tag status-success">
                      {Math.round(s.similarity_score * 100)}%
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className="panel">
          {selectedTest ? (
            <>
              <h2>{selectedTest.name} - Questions</h2>
              <div className="question-grid" style={{ marginTop: '2rem' }}>
                {questions?.map((q: Question) => {
                  const submission = getSubmissionForQuestion(q.id);
                  return (
                    <article
                      key={q.id}
                      className={`question-card ${selectedQuestion?.id === q.id ? "active" : ""}`}
                      onClick={() => setSelectedQuestion(q)}
                    >
                      <p className="prompt">{q.prompt}</p>
                      {submission ? (
                        <div className="status-tag status-success" style={{ marginTop: '1rem' }}>
                          Graded: {Math.round(submission.similarity_score * 100)}%
                        </div>
                      ) : (
                        <div className="status-tag status-warning" style={{ marginTop: '1rem' }}>
                          Pending
                        </div>
                      )}
                    </article>
                  );
                })}
              </div>

              {selectedQuestion && (
                <div style={{ marginTop: '3rem', paddingTop: '2rem', borderTop: '1px solid var(--border-card)' }}>
                  <h3>Submit Answer for: {selectedQuestion.prompt}</h3>
                  <form 
                    style={{ marginTop: '1.5rem' }}
                    onSubmit={(e) => {
                      e.preventDefault();
                      submitMutation.mutate({ 
                        questionId: selectedQuestion.id, 
                        text: answerText, 
                        image: answerImage || undefined 
                      });
                    }}
                  >
                    <label>
                      Your Answer
                      <textarea 
                        rows={6} 
                        value={answerText}
                        onChange={(e) => setAnswerText(e.target.value)}
                        placeholder="Type your answer here..."
                      />
                    </label>
                    <label>
                      Or Upload Handwriting
                      <input 
                        type="file" 
                        accept="image/*"
                        onChange={(e) => setAnswerImage(e.target.files?.[0] || null)}
                      />
                    </label>
                    <button 
                      className="submit-btn" 
                      type="submit"
                      disabled={submitMutation.isPending || (!answerText && !answerImage)}
                    >
                      {submitMutation.isPending ? "Submitting..." : "Submit for AI Grading"}
                    </button>
                  </form>
                </div>
              )}
            </>
          ) : (
            <div style={{ textAlign: "center", padding: "4rem 0" }}>
              <p className="text-muted">Select a test from the sidebar to view questions and submit your answers.</p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}


