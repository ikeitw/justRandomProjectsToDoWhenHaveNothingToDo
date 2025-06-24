import sys
import sqlite3
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QPushButton, QTextEdit, QLineEdit, QLabel, QHBoxLayout, QMessageBox
)

DB_NAME = "students.db"
def init_db():
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute('''
        CREATE TABLE IF NOT EXISTS students (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            fio TEXT NOT NULL,
            subj1 INTEGER NOT NULL,
            subj2 INTEGER NOT NULL,
            subj3 INTEGER NOT NULL
        )
    ''')
    conn.commit()
    conn.close()
def add_student(fio, s1, s2, s3):
    conn = sqlite3.connect(DB_NAME)
    cur = conn.cursor()
    cur.execute("INSERT INTO students (fio, subj1, subj2, subj3) VALUES (?, ?, ?, ?)", (fio, s1, s2, s3))
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
        self.setWindowTitle("Студенты — SQLite")
        self.setGeometry(100, 100, 550, 500)
        self.layout = QVBoxLayout()
        init_db()
        form_layout = QHBoxLayout()
        self.fio_input = QLineEdit()
        self.s1_input = QLineEdit()
        self.s2_input = QLineEdit()
        self.s3_input = QLineEdit()
        form_layout.addWidget(QLabel("ФИО:"))
        form_layout.addWidget(self.fio_input)
        form_layout.addWidget(QLabel("Оценки:"))
        form_layout.addWidget(self.s1_input)
        form_layout.addWidget(self.s2_input)
        form_layout.addWidget(self.s3_input)
        self.layout.addLayout(form_layout)
        self.btn_add = QPushButton("Добавить ученика")
        self.btn_remove = QPushButton("Отчислить с наим. баллом")
        self.btn_show = QPushButton("Показать базу")
        self.btn_add.clicked.connect(self.handle_add)
        self.btn_remove.clicked.connect(self.handle_remove)
        self.btn_show.clicked.connect(self.handle_show)
        self.layout.addWidget(self.btn_add)
        self.layout.addWidget(self.btn_remove)
        self.layout.addWidget(self.btn_show)
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        self.layout.addWidget(self.output)
        self.setLayout(self.layout)
    def handle_add(self):
        fio = self.fio_input.text()
        try:
            s1 = int(self.s1_input.text())
            s2 = int(self.s2_input.text())
            s3 = int(self.s3_input.text())
            if not fio.strip():
                raise ValueError
            add_student(fio, s1, s2, s3)
            QMessageBox.information(self, "Успех", "Ученик добавлен.")
            self.clear_inputs()
        except:
            QMessageBox.warning(self, "Ошибка", "Введите корректные данные!")
    def handle_remove(self):
        remove_lowest_student()
        QMessageBox.information(self, "Готово", "Самый слабый ученик отчислен.")
    def handle_show(self):
        rows = fetch_all_students()
        if not rows:
            self.output.setText("База данных пуста.")
        else:
            result = "ФИО\t\tОценки\n"
            for row in rows:
                result += f"{row[0]}\t{row[1]}, {row[2]}, {row[3]}\n"
            self.output.setText(result)
    def clear_inputs(self):
        self.fio_input.clear()
        self.s1_input.clear()
        self.s2_input.clear()
        self.s3_input.clear()
if __name__ == '__main__':
    app = QApplication(sys.argv)
    win = App()
    win.show()
    sys.exit(app.exec_())
