from fastapi import (
    APIRouter,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlmodel import Session, select

from ..dependencies import get_current_teacher, get_current_user, get_db
from ..models import Question, Submission, Test, User
from ..schemas import ScoreResponse, SubmissionRead
from ..services.grading import GradingService
from ..services.ocr import OCRService

router = APIRouter(prefix="/grading", tags=["grading"])
ocr_service = OCRService()
grading_service = GradingService()


def _get_question(
    question_id: int, teacher: User, session: Session, ensure_owner: bool = True
) -> Question:
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
    if ensure_owner:
        test = session.get(Test, question.test_id)
        if not test or test.teacher_id != teacher.id:
            raise HTTPException(status_code=403, detail="Not authorized for question")
    return question


@router.post(
    "/questions/{question_id}/score", response_model=ScoreResponse, status_code=200
)
async def grade_submission(
    question_id: int,
    student_name: str = Form(...),
    student_answer_text: str | None = Form(None),
    student_answer_image: UploadFile | None = File(None),
    teacher: User = Depends(get_current_teacher),
    session: Session = Depends(get_db),
) -> ScoreResponse:
    question = _get_question(question_id, teacher, session)
    answer_text = student_answer_text
    if student_answer_image:
        answer_text = await ocr_service.extract_text(student_answer_image)
    if not answer_text:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Provide student answer text or upload an image",
        )
    submission = grading_service.grade(question, answer_text)
    submission.student_name = student_name
    
    # Try to find a registered student with this email (using student_name as email for simplicity or just name)
    # For now, let's just keep it as provided by teacher.
    
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return ScoreResponse(
        similarity_score=submission.similarity_score,
        normalized_score=round(submission.similarity_score * 100, 2),
        model_answer=question.model_answer_text,
        student_answer=answer_text,
    )


@router.post("/submit/{question_id}", response_model=ScoreResponse)
async def student_submit(
    question_id: int,
    student_answer_text: str | None = Form(None),
    student_answer_image: UploadFile | None = File(None),
    student: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> ScoreResponse:
    # Students can submit for any question (maybe add check if test is assigned? later)
    question = session.get(Question, question_id)
    if not question:
        raise HTTPException(status_code=404, detail="Question not found")
        
    answer_text = student_answer_text
    if student_answer_image:
        answer_text = await ocr_service.extract_text(student_answer_image)
    if not answer_text:
        raise HTTPException(status_code=400, detail="Answer text or image required")
        
    submission = grading_service.grade(question, answer_text)
    submission.student_name = student.email
    submission.student_id = student.id
    
    session.add(submission)
    session.commit()
    session.refresh(submission)
    return ScoreResponse(
        similarity_score=submission.similarity_score,
        normalized_score=round(submission.similarity_score * 100, 2),
        model_answer=question.model_answer_text,
        student_answer=answer_text,
    )


@router.get("/my-submissions", response_model=list[SubmissionRead])
def list_my_submissions(
    student: User = Depends(get_current_user),
    session: Session = Depends(get_db),
) -> list[Submission]:
    statement = select(Submission).where(Submission.student_id == student.id)
    return session.exec(statement).all()


@router.get("/questions/{question_id}/submissions", response_model=list[SubmissionRead])
def list_submissions(
    question_id: int,
    teacher: User = Depends(get_current_teacher),
    session: Session = Depends(get_db),
) -> list[Submission]:
    question = _get_question(question_id, teacher, session)
    return question.submissions


