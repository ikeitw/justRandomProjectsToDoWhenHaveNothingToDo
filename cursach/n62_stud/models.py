from sqlalchemy import Column, Integer, String, Date, ForeignKey, Enum
from sqlalchemy.orm import declarative_base, relationship
import enum

Base = declarative_base()

# Формы обучения (для безопасности — Enum)
class StudyFormEnum(enum.Enum):
    дневная = "Дневная"
    вечерняя = "Вечерняя"
    заочная = "Заочная"

# Студенты
class Student(Base):
    __tablename__ = 'students'
    id = Column(Integer, primary_key=True)
    last_name = Column(String, nullable=False)
    first_name = Column(String, nullable=False)
    patronymic = Column(String)
    admission_year = Column(Integer, nullable=False)
    study_form = Column(Enum(StudyFormEnum), nullable=False)
    group_name = Column(String, nullable=False)

    grades = relationship("GradeJournal", back_populates="student", cascade="all, delete")

# Учебный план
class Curriculum(Base):
    __tablename__ = 'curriculum'
    id = Column(Integer, primary_key=True)
    specialty_name = Column(String, nullable=False)
    discipline_name = Column(String, nullable=False)
    semester = Column(Integer, nullable=False)
    hours = Column(Integer, nullable=False)
    assessment_type = Column(String, nullable=False)  # Экзамен/Зачет

    grades = relationship("GradeJournal", back_populates="discipline", cascade="all, delete")

# Журнал успеваемости
class GradeJournal(Base):
    __tablename__ = 'grade_journal'
    id = Column(Integer, primary_key=True)
    year = Column(Integer, nullable=False)
    semester = Column(Integer, nullable=False)
    student_id = Column(Integer, ForeignKey('students.id'))
    curriculum_id = Column(Integer, ForeignKey('curriculum.id'))
    grade = Column(Integer)  # 2-5

    student = relationship("Student", back_populates="grades")
    discipline = relationship("Curriculum", back_populates="grades")
