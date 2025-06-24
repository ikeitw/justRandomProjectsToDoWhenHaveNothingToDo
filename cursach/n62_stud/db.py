from sqlalchemy.orm import sessionmaker
from models import Base, Student, Curriculum, GradeJournal, StudyFormEnum
from sqlalchemy import create_engine
import configparser
from datetime import date

# Чтение конфигурации
config = configparser.ConfigParser()
config.read('database.ini')
db = config['postgresql']

# Подключение к БД
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Session = sessionmaker(bind=engine)
session = Session()

# Очистка и пересоздание БД
Base.metadata.drop_all(engine)
Base.metadata.create_all(engine)

# Добавление студентов (разные формы обучения)
students = [
    Student(last_name="Иванов", first_name="Иван", patronymic="Иванович", admission_year=2020, study_form=StudyFormEnum.дневная, group_name="Группа 101"),
    Student(last_name="Петров", first_name="Петр", patronymic="Петрович", admission_year=2020, study_form=StudyFormEnum.вечерняя, group_name="Группа 102"),
    Student(last_name="Сидоров", first_name="Сидор", patronymic="Сидорович", admission_year=2021, study_form=StudyFormEnum.заочная, group_name="Группа 103"),
    Student(last_name="Смирнов", first_name="Сергей", patronymic="Сергеевич", admission_year=2022, study_form=StudyFormEnum.дневная, group_name="Группа 104"),
    Student(last_name="Кузнецов", first_name="Кузьма", patronymic="Кузьмич", admission_year=2021, study_form=StudyFormEnum.вечерняя, group_name="Группа 105")
]
session.add_all(students)
session.commit()

# Добавление учебного плана (разные дисциплины)
curriculums = [
    Curriculum(specialty_name="Информатика", discipline_name="Программирование", semester=1, hours=100, assessment_type="Экзамен"),
    Curriculum(specialty_name="Информатика", discipline_name="Математика", semester=1, hours=120, assessment_type="Экзамен"),
    Curriculum(specialty_name="Экономика", discipline_name="Экономическая теория", semester=1, hours=80, assessment_type="Зачет"),
    Curriculum(specialty_name="Юриспруденция", discipline_name="Правоведение", semester=2, hours=90, assessment_type="Экзамен")
]
session.add_all(curriculums)
session.commit()

# Добавление оценок (разные студенты, дисциплины и семестры)
grades = [
    GradeJournal(year=2023, semester=1, student_id=students[0].id, curriculum_id=curriculums[0].id, grade=5),
    GradeJournal(year=2023, semester=1, student_id=students[1].id, curriculum_id=curriculums[1].id, grade=4),
    GradeJournal(year=2023, semester=1, student_id=students[2].id, curriculum_id=curriculums[2].id, grade=3),
    GradeJournal(year=2023, semester=2, student_id=students[3].id, curriculum_id=curriculums[3].id, grade=4),
    GradeJournal(year=2023, semester=2, student_id=students[4].id, curriculum_id=curriculums[0].id, grade=2),
    GradeJournal(year=2023, semester=2, student_id=students[0].id, curriculum_id=curriculums[2].id, grade=5),
    GradeJournal(year=2023, semester=2, student_id=students[1].id, curriculum_id=curriculums[3].id, grade=3)
]
session.add_all(grades)
session.commit()

print("✅ База данных успешно заполнена данными.")
