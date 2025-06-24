# Хроники восхождений альпинистского клуба (Python + PostgreSQL + SQLAlchemy)

## 📦 Описание проекта
База данных для учета восхождений, альпинистов и гор в альпинистском клубе.

## 🚀 Быстрый старт

### 1. Установить зависимости
```bash
pip install -r requirements.txt
```

### 2. Создать базу данных PostgreSQL
```bash
psql -U postgres
CREATE DATABASE climbingclub;
\q
```

### 3. Настроить подключение
Откройте `database.ini` и укажите свои данные PostgreSQL:
```ini
[postgresql]
host=localhost
database=climbingclub
user=postgres
password=ВАШ_ПАРОЛЬ
```

### 4. Заполнить базу тестовыми данными
```bash
python db.py
```

### 5. Запустить графическое меню
```bash
streamlit run main.py
```

---

## ⚙ Структура проекта
| Файл            | Назначение                             |
|-----------------|----------------------------------------|
| `models.py`     | Описание структуры базы данных         |
| `procedures.py` | Функции и процедуры для работы с БД    |
| `db.py`         | Заполнение БД тестовыми данными        |
| `main.py`       | Графическое приложение для работы с БД |
| `database.ini`  | Конфигурация подключения к PostgreSQL  |
| `requirements.txt` | Зависимости проекта                    |

