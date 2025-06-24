# 📊 Учёт успеваемости студентов (Python + PostgreSQL + SQLAlchemy)

## Описание
Система для учёта студентов, дисциплин и их успеваемости.

## 🚀 Запуск проекта

### 1. Установить зависимости
```bash
pip install -r requirements.txt
```

### 2. Создать базу данных PostgreSQL
```bash
psql -U postgres
CREATE DATABASE studentsdb;
\q
```

### 3. Настроить подключение
Откройте `database.ini` и укажите свои параметры PostgreSQL:
```ini
[postgresql]
host=localhost
database=studentsdb
user=postgres
password=ВАШ_ПАРОЛЬ
```

### 4. Заполнить БД тестовыми данными
```bash
python db.py
```

### 5. Запустить графическое приложение
```bash
streamlit run main.py
```

---

## Структура проекта
| Файл            | Назначение                            |
|-----------------|----------------------------------------|
| `models.py`     | Модели базы данных                    |
| `procedures.py` | Операции и функции для работы с БД    |
| `db.py`         | Заполнение тестовыми данными          |
| `main.py`       | Меню и взаимодействие с пользователем |
| `database.ini`  | Параметры подключения PostgreSQL      |
| `requirements.txt` | Зависимости проекта                 |
