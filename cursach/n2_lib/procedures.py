from datetime import date
from sqlalchemy.orm import Session
from models import *

# -------------------------
# 🔐 РЕГИСТРАЦИЯ И ВХОД
# -------------------------

def register_user(session: Session, login: str, password: str, role: str, full_name=None, ticket_number=None, birth_date=None, phone=None, education=None):
    if session.query(User).filter_by(login=login).first():
        return False, "Логин уже используется"
    user = User(login=login, password=password, role=role)
    session.add(user)
    session.flush()

    if role == "reader":
        if session.query(Reader).filter_by(ticket_number=ticket_number).first():
            return False, "Билет уже зарегистрирован"
        reader = Reader(
            full_name=full_name,
            ticket_number=ticket_number,
            birth_date=birth_date,
            phone=phone,
            education=education,
            user_id=user.id
        )
        session.add(reader)

    session.commit()
    return True, "Успешно зарегистрирован"

def login_user(session: Session, login: str, password: str):
    return session.query(User).filter_by(login=login, password=password).first()

# -------------------------
# 📚 КНИГИ (CRUD)
# -------------------------

def create_book(session: Session, title, author, year, code, date_received, quantity, rating):
    book = Book(title=title, author=author, publish_year=year, code=code, date_received=date_received, quantity=quantity, rating=rating)
    session.add(book)
    session.commit()

def list_books(session: Session):
    return session.query(Book).all()

def update_book(session: Session, book_id, **kwargs):
    book = session.query(Book).get(book_id)
    for key, value in kwargs.items():
        setattr(book, key, value)
    session.commit()

def delete_book(session: Session, book_id):
    book = session.query(Book).get(book_id)
    session.delete(book)
    session.commit()

# -------------------------
# 🧑 ЧИТАТЕЛИ
# -------------------------

def list_readers(session: Session):
    return session.query(Reader).all()

def update_reader(session: Session, reader_id, **kwargs):
    reader = session.query(Reader).get(reader_id)
    for key, value in kwargs.items():
        setattr(reader, key, value)
    session.commit()

def delete_reader(session: Session, reader_id):
    reader = session.query(Reader).get(reader_id)
    session.delete(reader)
    session.delete(reader.user)
    session.commit()

# -------------------------
# 🏛️ ЗАЛЫ
# -------------------------

def create_hall(session: Session, name, specialization, seats_total):
    hall = Hall(name=name, specialization=specialization, seats_total=seats_total)
    session.add(hall)
    session.commit()

def list_halls(session: Session):
    return session.query(Hall).all()

def delete_hall(session: Session, hall_id):
    hall = session.query(Hall).get(hall_id)
    session.delete(hall)
    session.commit()

# -------------------------
# 🔁 ВЫДАЧА И ВОЗВРАТ
# -------------------------

def issue_book(session: Session, reader_id, book_id, issue_date):
    book = session.query(Book).get(book_id)
    if book.quantity <= 0:
        return False, "Нет доступных экземпляров"
    borrowing = Borrowing(reader_id=reader_id, book_id=book_id, issue_date=issue_date)
    book.quantity -= 1
    session.add(borrowing)
    session.commit()
    return True, "Книга выдана"

def return_book(session: Session, borrowing_id, return_date):
    borrowing = session.query(Borrowing).get(borrowing_id)
    if borrowing.return_date:
        return False, "Уже возвращена"
    borrowing.return_date = return_date
    borrowing.book.quantity += 1
    session.commit()
    return True, "Книга возвращена"

def get_reader_borrowings(session: Session, reader_id):
    return session.query(Borrowing).filter_by(reader_id=reader_id).all()

# -------------------------
# 🪑 ПОСАДКА В ЗАЛ
# -------------------------

def assign_reader_to_hall(session: Session, reader_id, hall_id):
    reader = session.query(Reader).get(reader_id)
    reader.hall_id = hall_id
    session.commit()

def remove_reader_from_hall(session: Session, reader_id):
    reader = session.query(Reader).get(reader_id)
    reader.hall_id = None
    session.commit()

# -------------------------
# 📊 ОТЧЕТЫ
# -------------------------

def free_seats_in_halls(session: Session):
    halls = session.query(Hall).all()
    result = []
    for h in halls:
        occupied = len(h.readers)
        result.append((h.name, h.seats_total - occupied))
    return result

def books_by_author_in_hall(session: Session, author: str, hall_id: int):
    readers = session.query(Reader).filter_by(hall_id=hall_id).all()
    reader_ids = [r.id for r in readers]
    borrowings = session.query(Borrowing).join(Book).filter(
        Borrowing.reader_id.in_(reader_ids),
        Book.author == author
    ).all()
    return borrowings

def readers_with_unique_books(session: Session):
    one_copy_books = session.query(Book).filter_by(quantity=0).all()
    book_ids = [b.id for b in one_copy_books]
    borrowings = session.query(Borrowing).filter(
        Borrowing.book_id.in_(book_ids),
        Borrowing.return_date == None
    ).all()
    return borrowings

def top_rated_books(session: Session):
    return session.query(Book).order_by(Book.rating.desc()).limit(10).all()
