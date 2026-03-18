import api from "./client";

export type Test = {
  id: number;
  name: string;
  description?: string | null;
  created_at: string;
};

export type Question = {
  id: number;
  prompt: string;
  model_answer_text: string;
  created_at: string;
};

export type ScoreResponse = {
  similarity_score: number;
  normalized_score: number;
  model_answer: string;
  student_answer: string;
};

export type Submission = {
  id: number;
  question_id: number;
  student_id: number | null;
  student_name: string;
  student_answer_text: string;
  similarity_score: number;
  created_at: string;
};

export const fetchTests = async (): Promise<Test[]> => {
  const { data } = await api.get("/tests");
  return data;
};

export const createTest = async (payload: {
  name: string;
  description?: string;
}): Promise<Test> => {
  const { data } = await api.post("/tests", payload);
  return data;
};

export const fetchQuestions = async (testId: number): Promise<Question[]> => {
  const { data } = await api.get(`/tests/${testId}/questions`);
  return data;
};

export const createQuestion = async (
  testId: number,
  payload: {
    prompt: string;
    model_answer_text?: string;
    model_answer_image?: File;
  },
): Promise<Question> => {
  const formData = new FormData();
  formData.append("prompt", payload.prompt);
  if (payload.model_answer_text) {
    formData.append("model_answer_text", payload.model_answer_text);
  }
  if (payload.model_answer_image) {
    formData.append("model_answer_image", payload.model_answer_image);
  }
  const { data } = await api.post(`/tests/${testId}/questions`, formData);
  return data;
};

export const gradeSubmission = async (
  questionId: number,
  payload: {
    student_name: string;
    student_answer_text?: string;
    student_answer_image?: File;
  },
): Promise<ScoreResponse> => {
  const formData = new FormData();
  formData.append("student_name", payload.student_name);
  if (payload.student_answer_text) {
    formData.append("student_answer_text", payload.student_answer_text);
  }
  if (payload.student_answer_image) {
    formData.append("student_answer_image", payload.student_answer_image);
  }
  const { data } = await api.post(`/grading/questions/${questionId}/score`, formData);
  return data;
};

export const studentSubmit = async (
  questionId: number,
  payload: {
    student_answer_text?: string;
    student_answer_image?: File;
  },
): Promise<ScoreResponse> => {
  const formData = new FormData();
  if (payload.student_answer_text) {
    formData.append("student_answer_text", payload.student_answer_text);
  }
  if (payload.student_answer_image) {
    formData.append("student_answer_image", payload.student_answer_image);
  }
  const { data } = await api.post(`/grading/submit/${questionId}`, formData);
  return data;
};

export const fetchMySubmissions = async (): Promise<Submission[]> => {
  const { data } = await api.get("/grading/my-submissions");
  return data;
};


