from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine, text
import configparser
from datetime import date, timedelta
from models import Base, Hall, Reader, Book, Borrowing, User

# Чтение конфигурации
config = configparser.ConfigParser()
config.read("database.ini")
db = config["postgresql"]

# Подключение к БД
engine = create_engine(f"postgresql://{db['user']}:{db['password']}@{db['host']}:5432/{db['database']}")
Session = sessionmaker(bind=engine)
session = Session()

# Чистим базу данных полностью
with engine.connect() as conn:
    conn.execute(text("DROP SCHEMA public CASCADE"))
    conn.execute(text("CREATE SCHEMA public"))

# Пересоздание всех таблиц
Base.metadata.create_all(engine)

# ──────────────────────────────────────────────
# Дальше как раньше: залы, пользователи, книги…
# ──────────────────────────────────────────────

# Добавление залов
halls = [
    Hall(name="Общий зал", specialization="Общая литература", seats_total=20),
    Hall(name="Физико-Математический", specialization="Физика и математика", seats_total=15),
    Hall(name="Исторический зал", specialization="История", seats_total=10),
]
session.add_all(halls)
session.commit()

# Добавление пользователей и читателей
users = [
    User(login="reader1", password="1234", role="reader"),
    User(login="reader2", password="1234", role="reader"),
    User(login="reader3", password="1234", role="reader"),
]
session.add_all(users)
session.flush()

readers = [
    Reader(full_name="Иванов Иван", ticket_number="A001", birth_date=date(1990, 5, 15), phone="123456", education="Высшее", hall_id=halls[0].id, user_id=users[0].id),
    Reader(full_name="Петров Петр", ticket_number="A002", birth_date=date(1985, 8, 20), phone="654321", education="Среднее", hall_id=halls[1].id, user_id=users[1].id),
    Reader(full_name="Сидоров Сидор", ticket_number="A003", birth_date=date(2000, 1, 10), phone="987654", education="Студент", hall_id=halls[2].id, user_id=users[2].id)
]
session.add_all(readers)
session.commit()

# Добавление книг
books = [
    Book(title="Физика 101", author="Ньютон И.", publish_year=2000, code="PH-001", date_received=date(2020, 1, 1), quantity=3, rating=5),
    Book(title="Математика для всех", author="Эйлер Л.", publish_year=1995, code="MT-001", date_received=date(2018, 5, 10), quantity=1, rating=4),
    Book(title="История древнего мира", author="Геродот", publish_year=1980, code="HI-001", date_received=date(2015, 3, 20), quantity=2, rating=3),
    Book(title="Книга жизни", author="Достоевский Ф.", publish_year=1870, code="LI-001", date_received=date(2012, 10, 30), quantity=1, rating=5),
    Book(title="Алгебра для начинающих", author="Гаусс К.", publish_year=2010, code="MT-002", date_received=date(2019, 9, 15), quantity=4, rating=4),
]
session.add_all(books)
session.commit()

# Выдачи
issuances = [
    Borrowing(book_id=books[0].id, reader_id=readers[0].id, issue_date=date.today() - timedelta(days=3)),
    Borrowing(book_id=books[1].id, reader_id=readers[1].id, issue_date=date.today() - timedelta(days=5)),
    Borrowing(book_id=books[3].id, reader_id=readers[2].id, issue_date=date.today() - timedelta(days=1))
]
books[0].quantity -= 1
books[1].quantity -= 1
books[3].quantity -= 1

# Создание администратора
admin = User(login="admin", password="admin123", role="admin")
session.add(admin)
session.commit()
print("✅ Администратор создан: логин=admin, пароль=admin123")


session.add_all(issuances)
session.commit()

print("✅ База успешно сброшена и заполнена тестовыми данными.")
