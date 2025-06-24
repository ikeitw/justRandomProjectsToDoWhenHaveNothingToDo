
# 🎵 Система музыкального магазина

Информационная система для управления музыкантами, ансамблями, музыкальными произведениями и продажей компакт-дисков. Соответствует заданию о разработке системы с поддержкой функций, процедур и каскадных триггеров.

---

## 📦 Состав проекта

```plaintext
nd_mus_new/
├── backend/         # Node.js + Express + Sequelize (PostgreSQL)
├── frontend/        # Vue.js SPA
├── README.md        # эта инструкция
````

---

## 🚀 Быстрый старт

### 1. 🛠 Установка зависимостей

#### Backend

```bash
cd backend
npm install
```

#### Frontend

```bash
cd ../frontend
npm install
```

---

### 2. 🗃 Настройка PostgreSQL

1. Убедитесь, что PostgreSQL установлен и пользователь `postgres` с паролем `root` (или отредактируйте `.env`).
2. Создайте базу данных:

```sql
CREATE DATABASE music_db;
```

---

### 3. 🌱 Наполнение базы тестовыми данными

```bash
cd backend
node seed.js
```

Создаются таблицы, функции, триггеры и наполняется тестовыми музыкантами, ансамблями, произведениями, записями и исполнениями.

---

### 4. 🚀 Запуск серверов

#### Backend (порт 3000)

```bash
cd backend
node server.js
```

#### Frontend (порт 5173)

```bash
cd ../frontend
npm run dev
```

---

## 🌐 Интерфейс

* Просмотр и добавление ансамблей
* Просмотр, добавление и редактирование пластинок
* Просмотр лидеров продаж текущего года
* Возможность редактировать и удалять записи (полный CRUD)
* Интерфейс написан на Vue.js

---

## 🔧 .env файл (в папке `backend/`)

Создай `.env` или используй:

```
PGHOST=localhost
PGUSER=postgres
PGPASSWORD=root
PGDATABASE=music_db
PGPORT=5432
```

---

## 🧠 Запросы, реализованные в API

* `GET /api/ensembles`, `POST`, `PUT`, `DELETE` — CRUD для ансамблей
* `GET /api/records`, `POST`, `PUT`, `DELETE` — CRUD для пластинок
* `GET /api/functions/ensemble/:id/compositions-count` — кол-во произведений ансамбля
* `GET /api/functions/ensemble/:id/records` — все CD ансамбля
* `GET /api/functions/records/top-sales` — лидеры продаж по текущему году

---

## 👨‍💻 Технологии

* **Backend**: Node.js, Express, Sequelize, PostgreSQL
* **Frontend**: Vue.js, Axios
* **База данных**: PostgreSQL
