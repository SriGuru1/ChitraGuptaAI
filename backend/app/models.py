from datetime import datetime
from typing import Optional, List

from sqlmodel import Field, Relationship, SQLModel


class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    hashed_password: str
    role: str = Field(default="teacher")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    tests: list["Test"] = Relationship(back_populates="teacher")


class Test(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    name: str
    description: Optional[str] = None
    teacher_id: int = Field(foreign_key="user.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    teacher: "User" = Relationship(back_populates="tests")
    questions: list["Question"] = Relationship(back_populates="test")


class Question(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    prompt: str
    model_answer_text: str
    test_id: int = Field(foreign_key="test.id")
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    test: "Test" = Relationship(back_populates="questions")
    submissions: list["Submission"] = Relationship(back_populates="question")


class Submission(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    question_id: int = Field(foreign_key="question.id")
    student_id: Optional[int] = Field(default=None, foreign_key="user.id")
    student_name: str
    student_answer_text: str
    similarity_score: float
    created_at: datetime = Field(default_factory=datetime.utcnow, nullable=False)

    question: "Question" = Relationship(back_populates="submissions")
    student: Optional["User"] = Relationship()

