from models import *
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

# 1) Подсчитать количество студентов указанной формы обучения
def count_students_by_form(session: Session, form):
    try:
        count = session.query(Student).filter_by(study_form=form).count()
        print(f"Количество студентов ({form.value}): {count}")
    except Exception as e:
        print(f"Ошибка: {e}")

# 2) Получить количество часов и форму отчетности по дисциплине
def get_discipline_info(session: Session, discipline_name):
    discipline = session.query(Curriculum).filter_by(discipline_name=discipline_name).first()
    if discipline:
        print(f"Дисциплина: {discipline.discipline_name} — Часов: {discipline.hours} — Форма отчетности: {discipline.assessment_type}")
    else:
        print("Дисциплина не найдена.")

# 3) Добавить нового студента (с обработкой дубликатов по номеру и имени)
def add_student(session: Session, last_name, first_name, patronymic, admission_year, study_form, group_name):
    try:
        # Проверка дубликатов по ФИО и году поступления
        exists = session.query(Student).filter_by(
            last_name=last_name,
            first_name=first_name,
            patronymic=patronymic,
            admission_year=admission_year
        ).first()
        if exists:
            print("Ошибка: студент с такими данными уже зарегистрирован.")
            return
        student = Student(
            last_name=last_name,
            first_name=first_name,
            patronymic=patronymic,
            admission_year=admission_year,
            study_form=study_form,
            group_name=group_name
        )
        session.add(student)
        session.commit()
        print("Студент успешно добавлен.")
    except IntegrityError:
        session.rollback()
        print("Ошибка добавления студента.")
    except Exception as e:
        session.rollback()
        print(f"Ошибка: {e}")

# 4) Добавить новую дисциплину
def add_curriculum(session: Session, specialty_name, discipline_name, semester, hours, assessment_type):
    try:
        # Проверка дубликата дисциплины в том же семестре и специальности
        exists = session.query(Curriculum).filter_by(
            specialty_name=specialty_name,
            discipline_name=discipline_name,
            semester=semester
        ).first()
        if exists:
            print("Ошибка: такая дисциплина уже существует в учебном плане.")
            return
        discipline = Curriculum(
            specialty_name=specialty_name,
            discipline_name=discipline_name,
            semester=semester,
            hours=hours,
            assessment_type=assessment_type
        )
        session.add(discipline)
        session.commit()
        print("Дисциплина успешно добавлена.")
    except IntegrityError:
        session.rollback()
        print("Ошибка добавления дисциплины.")
    except Exception as e:
        session.rollback()
        print(f"Ошибка: {e}")

# 5) Добавить или изменить оценку студента (с проверкой дубликатов)
def add_or_update_grade(session: Session, year, semester, student_id, curriculum_id, grade):
    try:
        record = session.query(GradeJournal).filter_by(
            year=year,
            semester=semester,
            student_id=student_id,
            curriculum_id=curriculum_id
        ).first()
        if record:
            record.grade = grade
            print("Оценка обновлена.")
        else:
            new_grade = GradeJournal(
                year=year,
                semester=semester,
                student_id=student_id,
                curriculum_id=curriculum_id,
                grade=grade
            )
            session.add(new_grade)
            print("Оценка добавлена.")
        session.commit()
    except IntegrityError:
        session.rollback()
        print("Ошибка записи оценки.")
    except Exception as e:
        session.rollback()
        print(f"Ошибка: {e}")
