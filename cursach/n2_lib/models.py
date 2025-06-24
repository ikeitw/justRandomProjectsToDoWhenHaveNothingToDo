from sqlalchemy import Column, Integer, String, Date, ForeignKey
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# Пользователь с ролью: admin (библиотекарь) или reader (читатель)
class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True)
    login = Column(String, unique=True, nullable=False)
    password = Column(String, nullable=False)
    role = Column(String, nullable=False)

    reader = relationship("Reader", uselist=False, back_populates="user")

# Зал библиотеки
class Hall(Base):
    __tablename__ = 'halls'
    id = Column(Integer, primary_key=True)
    name = Column(String, unique=True, nullable=False)
    specialization = Column(String, nullable=False)
    seats_total = Column(Integer, nullable=False)

    readers = relationship("Reader", back_populates="hall")

# Читатель
class Reader(Base):
    __tablename__ = 'readers'
    id = Column(Integer, primary_key=True)
    full_name = Column(String, nullable=False)
    ticket_number = Column(String, unique=True, nullable=False)
    birth_date = Column(Date)
    phone = Column(String)
    education = Column(String)

    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    hall_id = Column(Integer, ForeignKey('halls.id'))

    user = relationship("User", back_populates="reader")
    hall = relationship("Hall", back_populates="readers")
    borrowings = relationship("Borrowing", back_populates="reader")

# Книга
class Book(Base):
    __tablename__ = 'books'
    id = Column(Integer, primary_key=True)
    title = Column(String, nullable=False)
    author = Column(String, nullable=False)
    publish_year = Column(Integer)
    code = Column(String, unique=True, nullable=False)  # шифр книги
    date_received = Column(Date)
    quantity = Column(Integer, nullable=False)
    rating = Column(Integer, default=0)

    borrowings = relationship("Borrowing", back_populates="book")

# Выдача книги читателю
class Borrowing(Base):
    __tablename__ = 'borrowings'
    id = Column(Integer, primary_key=True)
    reader_id = Column(Integer, ForeignKey('readers.id'), nullable=False)
    book_id = Column(Integer, ForeignKey('books.id'), nullable=False)
    issue_date = Column(Date, nullable=False)
    return_date = Column(Date, nullable=True)

    reader = relationship("Reader", back_populates="borrowings")
    book = relationship("Book", back_populates="borrowings")
