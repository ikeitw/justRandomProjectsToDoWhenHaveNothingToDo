import streamlit as st
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import configparser
import procedures
from models import Base
from datetime import date

# ────────────────────────────
# 📦 Настройка БД
# ────────────────────────────
config = configparser.ConfigParser()
config.read("database.ini")
db = config["postgresql"]
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Base.metadata.create_all(engine)
Session = sessionmaker(bind=engine)
session = Session()

# ────────────────────────────
# 🧠 Состояние сессии
# ────────────────────────────
if "user" not in st.session_state:
    st.session_state.user = None
if "role" not in st.session_state:
    st.session_state.role = None
if "register_mode" not in st.session_state:
    st.session_state.register_mode = None

# ────────────────────────────
# 🔐 Авторизация и регистрация
# ────────────────────────────

def login_screen():
    st.title("📚 Вход в библиотеку")
    login = st.text_input("Логин")
    password = st.text_input("Пароль", type="password")
    if st.button("Войти"):
        user = procedures.login_user(session, login, password)
        if user:
            st.session_state.user = user
            st.session_state.role = user.role
            st.success(f"Вход как {user.role}")
            st.rerun()
        else:
            st.error("Неверные данные")

    st.divider()
    st.markdown("Нет аккаунта?")
    col1, col2 = st.columns(2)
    if col1.button("Регистрация читателя"):
        st.session_state.register_mode = "reader"
    if col2.button("Регистрация библиотекаря"):
        st.session_state.register_mode = "admin"

def register_screen(role):
    st.title("📝 Регистрация " + ("читателя" if role == "reader" else "библиотекаря"))

    login = st.text_input("Логин")
    password = st.text_input("Пароль", type="password")

    full_name = ticket_number = birth_date = phone = education = None
    if role == "reader":
        full_name = st.text_input("ФИО")
        ticket_number = st.text_input("Номер чит. билета")
        birth_date = st.date_input("Дата рождения")
        phone = st.text_input("Телефон")
        education = st.text_input("Образование")

    if st.button("Зарегистрироваться"):
        ok, msg = procedures.register_user(session, login, password, role, full_name, ticket_number, birth_date, phone, education)
        if ok:
            st.success(msg)
            st.session_state.register_mode = None
        else:
            st.error(msg)

    if st.button("Назад"):
        st.session_state.register_mode = None

# ────────────────────────────
# 👤 Личный кабинет читателя
# ────────────────────────────

def reader_panel():
    st.title("📖 Мой кабинет")
    r = st.session_state.user.reader
    st.markdown(f"**ФИО:** {r.full_name}")
    st.markdown(f"**Билет:** {r.ticket_number}")
    st.markdown(f"**Зал:** {r.hall.name if r.hall else 'не закреплён'}")

    st.subheader("📗 Мои книги")
    for b in procedures.get_reader_borrowings(session, r.id):
        st.write(f"📘 {b.book.title} — Выдана: {b.issue_date}, Возврат: {b.return_date or 'не возвращена'}")

# ────────────────────────────
# 🧑‍🏫 Панель библиотекаря
# ────────────────────────────

def admin_panel():
    st.title("🛠 Панель библиотекаря")

    tab1, tab2, tab3, tab4 = st.tabs(["📚 Книги", "🧑 Читатели", "🏛️ Залы", "📊 Отчёты"])

    # КНИГИ
    with tab1:
        st.subheader("Все книги")
        for b in procedures.list_books(session):
            st.markdown(f"**[{b.id}]** {b.title} — {b.author} ({b.publish_year}) | Кол-во: {b.quantity} | Шифр: {b.code} | Рейтинг: {b.rating}")

        st.divider()
        st.subheader("➕ Добавить книгу")
        with st.form("add_book"):
            title = st.text_input("Название")
            author = st.text_input("Автор")
            year = st.number_input("Год издания", 1000, 2100, 2020)
            code = st.text_input("Шифр книги")
            date_recv = st.date_input("Дата поступления")
            quantity = st.number_input("Кол-во", 0, 1000, 1)
            rating = st.slider("Рейтинг", 0, 100, 50)
            if st.form_submit_button("Сохранить"):
                procedures.create_book(session, title, author, year, code, date_recv, quantity, rating)
                st.success("Книга добавлена")
                st.rerun()

    # ЧИТАТЕЛИ
    with tab2:
        st.subheader("Все читатели")
        for r in procedures.list_readers(session):
            st.markdown(f"**[{r.id}]** {r.full_name} — {r.ticket_number} — {r.hall.name if r.hall else 'Без зала'}")

        st.divider()
        st.subheader("📗 Выдать книгу")
        with st.form("issue_form"):
            reader_id = st.number_input("ID читателя", min_value=1)
            book_id = st.number_input("ID книги", min_value=1)
            issued = st.date_input("Дата выдачи", value=date.today())
            if st.form_submit_button("Выдать"):
                ok, msg = procedures.issue_book(session, reader_id, book_id, issued)
                if ok:
                    st.success(msg)
                else:
                    st.error(msg)

        st.subheader("📘 Принять возврат")
        with st.form("return_form"):
            borrow_id = st.number_input("ID выдачи", min_value=1)
            ret = st.date_input("Дата возврата", value=date.today())
            if st.form_submit_button("Принять"):
                ok, msg = procedures.return_book(session, borrow_id, ret)
                if ok:
                    st.success(msg)
                else:
                    st.error(msg)

        # ПОСАДИТЬ ЧИТАТЕЛЯ В ЗАЛ
        st.subheader("🪑 Посадить читателя в зал")
        with st.form("assign_form"):
            all_readers = procedures.list_readers(session)
            all_halls = procedures.list_halls(session)

            reader_options = {f"{r.full_name} ({r.ticket_number})": r.id for r in all_readers}
            hall_options = {f"{h.name} — {h.specialization}": h.id for h in all_halls}

            selected_reader = st.selectbox("Выберите читателя", list(reader_options.keys()))
            selected_hall = st.selectbox("Выберите зал", list(hall_options.keys()))

            if st.form_submit_button("Посадить"):
                procedures.assign_reader_to_hall(session, reader_options[selected_reader], hall_options[selected_hall])
                st.success(f"Читатель {selected_reader} посажен в {selected_hall}")
                st.rerun()

    # ЗАЛЫ
    with tab3:
        st.subheader("Все залы")
        for h in procedures.list_halls(session):
            occupied = len(h.readers)
            st.markdown(f"**[{h.id}]** {h.name} — {h.specialization} — мест: {h.seats_total}, занято: {occupied}")

        st.divider()
        st.subheader("➕ Добавить зал")
        with st.form("add_hall"):
            name = st.text_input("Название зала")
            spec = st.text_input("Специализация")
            seats = st.number_input("Кол-во мест", 1, 1000)
            if st.form_submit_button("Добавить"):
                procedures.create_hall(session, name, spec, seats)
                st.success("Зал добавлен")
                st.rerun()

    # ОТЧЕТЫ
    with tab4:
        st.subheader("📊 Свободные места по залам")
        for name, free in procedures.free_seats_in_halls(session):
            st.write(f"{name}: свободно {free} мест")

        st.subheader("📘 Читатели, взявшие книги в 1 экз.")
        for b in procedures.readers_with_unique_books(session):
            st.write(f"{b.reader.full_name} взял «{b.book.title}»")

        st.subheader("🌟 Топ 10 книг")
        for b in procedures.top_rated_books(session):
            st.write(f"{b.title} — рейтинг: {b.rating}")

# ────────────────────────────
# ▶️ Роутинг
# ────────────────────────────

if st.session_state.user:
    st.sidebar.success(f"Вы вошли как {st.session_state.role}")
    if st.sidebar.button("🚪 Выйти"):
        st.session_state.user = None
        st.session_state.role = None
        st.rerun()

    if st.session_state.role == "admin":
        admin_panel()
    else:
        reader_panel()
else:
    if st.session_state.register_mode:
        register_screen(st.session_state.register_mode)
    else:
        login_screen()
