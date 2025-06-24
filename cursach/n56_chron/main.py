import streamlit as st
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from models import Base
import procedures
from datetime import datetime
import configparser

# Чтение конфигурации
config = configparser.ConfigParser()
config.read('database.ini')
db = config['postgresql']
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# Инициализация триггеров (один раз)
with engine.connect() as conn:
    conn.execute(text("""
    CREATE OR REPLACE FUNCTION delete_ascents_on_mountain_delete()
    RETURNS TRIGGER AS $$ 
    BEGIN
        DELETE FROM ascents WHERE mountain_id = OLD.id;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_delete_ascents
    AFTER DELETE ON mountains
    FOR EACH ROW
    EXECUTE FUNCTION delete_ascents_on_mountain_delete();

    CREATE OR REPLACE FUNCTION delete_members_on_group_delete()
    RETURNS TRIGGER AS $$ 
    BEGIN
        DELETE FROM group_members WHERE group_id = OLD.id;
        RETURN OLD;
    END;
    $$ LANGUAGE plpgsql;

    CREATE TRIGGER trg_delete_members
    AFTER DELETE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION delete_members_on_group_delete();
    """))

# Интерфейс
st.set_page_config(page_title="Альпинистский клуб", layout="wide")
st.title("🏔️ Хроники восхождений альпинистского клуба")

menu = st.sidebar.selectbox("Выберите действие", [
    "1️⃣ Список групп по каждой горе",
    "2️⃣ Добавить вершину",
    "3️⃣ Изменить вершину (если нет восхождений)",
    "4️⃣ Альпинисты по датам",
    "5️⃣ Добавить альпиниста в группу",
    "6️⃣ Отчёт по восхождениям альпинистов",
    "7️⃣ Восхождения по интервалу",
    "8️⃣ Новая группа восхождения",
    "9️⃣ Сколько альпинистов было на горе"
])

output_lines = []
procedures.print = lambda text: output_lines.append(text)

# Меню выбора действий
if menu == "1️⃣ Список групп по каждой горе":
    output_lines.clear()
    procedures.list_groups_per_mountain(session)
    st.text_area("Результат", "\n".join(output_lines), height=500)

elif menu == "2️⃣ Добавить вершину":
    with st.form("add_mountain"):
        name = st.text_input("Название вершины")
        height = st.number_input("Высота (м)", min_value=1)
        country = st.text_input("Страна")
        region = st.text_input("Регион (необязательно)")
        submitted = st.form_submit_button("Добавить")
        if submitted:
            output_lines.clear()
            procedures.add_new_mountain(session, name, height, country, region)
            st.success("Вершина добавлена")
            st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "3️⃣ Изменить вершину (если нет восхождений)":
    with st.form("update_mountain"):
        mountain_id = st.number_input("ID вершины", min_value=1)
        name = st.text_input("Новое название")
        height = st.number_input("Новая высота")
        country = st.text_input("Новая страна")
        region = st.text_input("Новый регион")
        submitted = st.form_submit_button("Обновить")
        if submitted:
            output_lines.clear()
            procedures.update_mountain(session, mountain_id, name, height, country, region)
            st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "4️⃣ Альпинисты по датам":
    start = st.date_input("Дата начала")
    end = st.date_input("Дата окончания")
    if st.button("Показать"):
        output_lines.clear()
        procedures.list_alpinists_by_date(session, start, end)
        st.text_area("Результат", "\n".join(output_lines), height=300)

elif menu == "5️⃣ Добавить альпиниста в группу":
    with st.form("add_climber"):
        gid = st.number_input("ID группы", min_value=1)
        name = st.text_input("Имя альпиниста")
        address = st.text_input("Адрес")
        submitted = st.form_submit_button("Добавить")
        if submitted:
            output_lines.clear()
            procedures.add_alpinist_to_group(session, gid, name, address)
            st.success("Альпинист добавлен в группу")
            st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "6️⃣ Отчёт по восхождениям альпинистов":
    output_lines.clear()
    procedures.alpinist_ascent_report(session)
    st.text_area("Результат", "\n".join(output_lines), height=500)

elif menu == "7️⃣ Восхождения по интервалу":
    start = st.date_input("Дата начала восхождений")
    end = st.date_input("Дата окончания восхождений")
    if st.button("Показать восхождения"):
        output_lines.clear()
        procedures.list_ascents_in_period(session, start, end)
        st.text_area("Результат", "\n".join(output_lines), height=300)

elif menu == "8️⃣ Новая группа восхождения":
    with st.form("new_group_ascent"):
        group_name = st.text_input("Название группы")
        mountain_id = st.number_input("ID вершины", min_value=1)
        start_date = st.date_input("Дата начала")
        end_date = st.date_input("Дата окончания")
        submitted = st.form_submit_button("Добавить")
        if submitted:
            output_lines.clear()
            procedures.add_new_ascent(session, group_name, mountain_id, start_date, end_date)
            st.success("Группа и восхождение добавлены")
            st.text_area("Результат", "\n".join(output_lines), height=100)

elif menu == "9️⃣ Сколько альпинистов было на горе":
    output_lines.clear()
    procedures.alpinist_count_per_mountain(session)
    st.text_area("Результат", "\n".join(output_lines), height=300)
