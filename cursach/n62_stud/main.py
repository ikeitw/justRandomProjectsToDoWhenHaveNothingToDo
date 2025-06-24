import streamlit as st
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base, StudyFormEnum
import procedures
import configparser

# Подключение к базе
config = configparser.ConfigParser()
config.read('database.ini')
db = config['postgresql']
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Инициализация триггеров
with engine.connect() as conn:
    conn.execute(text("""
    CREATE OR REPLACE FUNCTION delete_grades_on_student_delete()
    RETURNS TRIGGER AS $$ 
    BEGIN
        DELETE FROM grade_journal WHERE student_id = OLD.id;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_delete_grades_student
    AFTER DELETE ON students
    FOR EACH ROW
    EXECUTE FUNCTION delete_grades_on_student_delete();

    CREATE OR REPLACE FUNCTION delete_grades_on_discipline_delete()
    RETURNS TRIGGER AS $$ 
    BEGIN
        DELETE FROM grade_journal WHERE curriculum_id = OLD.id;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_delete_grades_discipline
    AFTER DELETE ON curriculum
    FOR EACH ROW
    EXECUTE FUNCTION delete_grades_on_discipline_delete();
    """))

# Streamlit интерфейс
st.set_page_config(page_title="Учёт студентов", layout="wide")
st.title("📊 Учёт успеваемости студентов")

menu = st.sidebar.selectbox("Выберите действие", [
    "1️⃣ Посчитать студентов по форме обучения",
    "2️⃣ Информация о дисциплине",
    "3️⃣ Добавить студента",
    "4️⃣ Добавить дисциплину",
    "5️⃣ Добавить / Изменить оценку"
])

output_lines = []
procedures.print = lambda text: output_lines.append(text)

# Опции
if menu == "1️⃣ Посчитать студентов по форме обучения":
    form = st.selectbox("Форма обучения", ["дневная", "вечерняя", "заочная"])
    if st.button("Посчитать"):
        output_lines.clear()
        form_enum = StudyFormEnum[form]
        procedures.count_students_by_form(session, form_enum)
        st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "2️⃣ Информация о дисциплине":
    name = st.text_input("Название дисциплины")
    if st.button("Показать"):
        output_lines.clear()
        procedures.get_discipline_info(session, name)
        st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "3️⃣ Добавить студента":
    with st.form("add_student"):
        last = st.text_input("Фамилия")
        first = st.text_input("Имя")
        patr = st.text_input("Отчество")
        year = st.number_input("Год поступления", min_value=2000, step=1)
        form = st.selectbox("Форма обучения", ["дневная", "вечерняя", "заочная"])
        group = st.text_input("Группа")
        submit = st.form_submit_button("Добавить")
        if submit:
            output_lines.clear()
            try:
                form_enum = StudyFormEnum[form]
                procedures.add_student(session, last, first, patr, year, form_enum, group)
                st.text_area("Результат", "\n".join(output_lines), height=100)
            except KeyError:
                st.error("Ошибка: неверная форма обучения")

elif menu == "4️⃣ Добавить дисциплину":
    with st.form("add_discipline"):
        spec = st.text_input("Специальность")
        disc = st.text_input("Дисциплина")
        sem = st.number_input("Семестр", min_value=1)
        hours = st.number_input("Часов", min_value=1)
        assess = st.selectbox("Форма отчетности", ["Экзамен", "Зачет"])
        submit = st.form_submit_button("Добавить")
        if submit:
            output_lines.clear()
            procedures.add_curriculum(session, spec, disc, sem, hours, assess)
            st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "5️⃣ Добавить / Изменить оценку":
    with st.form("grade"):
        year = st.number_input("Год", min_value=2020)
        sem = st.number_input("Семестр", min_value=1)
        student_id = st.number_input("ID студента", min_value=1)
        curriculum_id = st.number_input("ID дисциплины", min_value=1)
        grade = st.number_input("Оценка (2-5)", min_value=2, max_value=5)
        submit = st.form_submit_button("Сохранить")
        if submit:
            output_lines.clear()
            procedures.add_or_update_grade(session, year, sem, student_id, curriculum_id, grade)
            st.text_area("Результат", "\n".join(output_lines), height=100)
