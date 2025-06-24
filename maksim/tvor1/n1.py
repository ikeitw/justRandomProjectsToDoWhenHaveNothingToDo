import sys
import sqlite3
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton, QTextEdit
)

DB_NAME = "students.db"
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS students")
    cur.execute('''
        CREATE TABLE students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fio TEXT,
            subj1 INTEGER,
            subj2 INTEGER,
            subj3 INTEGER
        )
    ''')
    students = [
        ("Иванов И.И.", 4, 5, 3),
        ("Петров П.П.", 2, 3, 2),
        ("Сидоров С.С.", 5, 4, 5),
        ("Кузнецова А.А.", 3, 3, 4),
        ("Лебедев А.В.", 4, 2, 3),
        ("Макарова М.М.", 5, 5, 5),
    ]
    cur.executemany("INSERT INTO students (fio, subj1, subj2, subj3) VALUES (?, ?, ?, ?)", students)
    conn.commit()
    conn.close()
def remove_lowest_student():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT id, fio, subj1+subj2+subj3 AS total FROM students ORDER BY total ASC LIMIT 1")
    lowest = cur.fetchone()
    if lowest:
        cur.execute("DELETE FROM students WHERE id = ?", (lowest[0],))
    conn.commit()
    conn.close()
def fetch_all_students():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("SELECT fio, subj1, subj2, subj3 FROM students")
    rows = cur.fetchall()
    conn.close()
    return rows
class App(QWidget):
    def __init__(self):
        super().__init__()
        self.setWindowTitle("Учёт студентов")
        self.setGeometry(100, 100, 500, 400)
        self.layout = QVBoxLayout()
        self.text_area = QTextEdit()
        self.text_area.setReadOnly(True)
        self.btn_init = QPushButton("Создать и заполнить БД")
        self.btn_remove = QPushButton("Отчислить студента с наименьшим баллом")
        self.btn_print = QPushButton("Показать текущую базу")
        self.btn_init.clicked.connect(self.init_db)
        self.btn_remove.clicked.connect(self.remove_student)
        self.btn_print.clicked.connect(self.show_students)
        self.layout.addWidget(self.btn_init)
        self.layout.addWidget(self.btn_remove)
        self.layout.addWidget(self.btn_print)
        self.layout.addWidget(self.text_area)
        self.setLayout(self.layout)
    def init_db(self):
        init_db()
        self.text_area.setText("База данных создана и заполнена.")
    def remove_student(self):
        remove_lowest_student()
        self.text_area.setText("Студент с наименьшим баллом отчислен.")
    def show_students(self):
        rows = fetch_all_students()
        if not rows:
            self.text_area.setText("База пуста.")
        else:
            result = "ФИО\t\tОценки\n"
            for row in rows:
                result += f"{row[0]}\t{row[1]}, {row[2]}, {row[3]}\n"
            self.text_area.setText(result)
if __name__ == '__main__':
    app = QApplication(sys.argv)
    win = App()
    win.show()
    sys.exit(app.exec_())
