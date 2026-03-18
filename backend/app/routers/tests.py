from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlmodel import Session, select

from ..dependencies import get_current_teacher, get_db
from ..models import Question, Test, User
from ..schemas import QuestionRead, TestCreate, TestRead
from ..services.ocr import OCRService

router = APIRouter(prefix="/tests", tags=["tests"])
ocr_service = OCRService()


@router.get("/", response_model=list[TestRead])
def list_tests(
    teacher: User = Depends(get_current_teacher), session: Session = Depends(get_db)
) -> list[Test]:
    statement = select(Test).where(Test.teacher_id == teacher.id)
    return session.exec(statement).all()


@router.post("/", response_model=TestRead)
def create_test(
    test_in: TestCreate,
    teacher: User = Depends(get_current_teacher),
    session: Session = Depends(get_db),
) -> Test:
    test = Test(name=test_in.name, description=test_in.description, teacher_id=teacher.id)
    session.add(test)
    session.commit()
    session.refresh(test)
    return test


@router.post("/{test_id}/questions", response_model=QuestionRead)
async def create_question(
    test_id: int,
    prompt: str = Form(...),
    model_answer_text: str | None = Form(None),
    model_answer_image: UploadFile | None = File(None),
    teacher: User = Depends(get_current_teacher),
    session: Session = Depends(get_db),
) -> Question:
    test = session.exec(
        select(Test).where(Test.id == test_id, Test.teacher_id == teacher.id)
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    answer_text = model_answer_text
    if model_answer_image:
        answer_text = await ocr_service.extract_text(model_answer_image)
    if not answer_text:
        raise HTTPException(
            status_code=400, detail="Provide model answer text or upload an image"
        )
    question = Question(prompt=prompt, model_answer_text=answer_text, test_id=test.id)
    session.add(question)
    session.commit()
    session.refresh(question)
    return question


@router.get("/{test_id}/questions", response_model=list[QuestionRead])
def list_questions(
    test_id: int,
    teacher: User = Depends(get_current_teacher),
    session: Session = Depends(get_db),
) -> list[Question]:
    test = session.exec(
        select(Test).where(Test.id == test_id, Test.teacher_id == teacher.id)
    ).first()
    if not test:
        raise HTTPException(status_code=404, detail="Test not found")
    statement = select(Question).where(Question.test_id == test.id)
    return session.exec(statement).all()

