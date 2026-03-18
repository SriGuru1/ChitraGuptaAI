from ..models import Question, Submission
from .embeddings import EmbeddingService


class GradingService:
    """Compute similarity scores between model and student answers."""

    def __init__(self) -> None:
        self._embedder = EmbeddingService()

    def grade(self, question: Question, student_answer_text: str) -> Submission:
        model_embedding = self._embedder.embed(question.model_answer_text)
        student_embedding = self._embedder.embed(student_answer_text)
        similarity = self._embedder.cosine_similarity(model_embedding, student_embedding)
        normalized = max(0.0, min(similarity, 1.0))
        return Submission(
            question_id=question.id,
            student_name="Unknown",
            student_answer_text=student_answer_text,
            similarity_score=normalized,
        )


