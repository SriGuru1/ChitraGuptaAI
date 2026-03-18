import { useState } from "react";

import GradingPanel from "../components/GradingPanel";
import TestBuilder from "../components/TestBuilder";
import type { Question } from "../api/tests";
import { useAuth } from "../context/AuthContext";

export default function TeacherPage() {
  const [selection, setSelection] = useState<Question | null>(null);
  const { logout, user } = useAuth();

  return (
    <div className="dashboard">
      <header className="topbar">
        <div>
          <p className="eyebrow">Teacher Workspace</p>
          <h1>{user?.email.split('@')[0]}'s Control Center</h1>
        </div>
        <button className="logout-btn" onClick={logout}>Logout</button>
      </header>
      <main>
        <div className="sidebar-panel">
          <TestBuilder onQuestionSelect={setSelection} />
        </div>
        <GradingPanel question={selection} />
      </main>
    </div>
  );
}

