import AuthCard from "../components/AuthCard";

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="hero">
        <p className="eyebrow" style={{ marginTop: '0' }}>Intelligent Grading</p>
        <h1>Next-Gen Paper Evaluation</h1>
        <p>
          Empower educators with AI-driven grading. Using Google Vision OCR and 
          Transformer embeddings, we analyze handwriting and semantic meaning 
          to provide objective scores in seconds.
        </p>
      </div>
      <AuthCard />
    </div>
  );
}


