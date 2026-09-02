# Локальний запуск

## Що потрібно

- Python 3.12
- Node.js 22 та npm
- PostgreSQL 17 (SQL-дамп створено у PostgreSQL 17.2)

## 1. База даних

Основний дамп зі структурою та тестовими даними: `database/database.sql`.
Відновлюйте його у нову порожню базу — міграції та окреме наповнення даними після цього не потрібні.
`database/database.dump` — той самий знімок в альтернативному форматі; для звичайного запуску достатньо SQL-файлу.

Із кореня проєкту:

```powershell
createdb -h localhost -p 5432 -U postgres -W -T template0 -E UTF8 traffic_test
psql -h localhost -p 5432 -U postgres -W -d traffic_test -v ON_ERROR_STOP=1 -f .\database\database.sql
```

`template0` — стандартний чистий шаблон PostgreSQL. Якщо `createdb` або `psql` не знайдено, додайте папку `bin` PostgreSQL до `PATH` або запустіть утиліти повним шляхом, наприклад `C:\Program Files\PostgreSQL\17\bin\psql.exe`.

## 2. Backend

Конфіг зберігається у `backend/.env`, шаблон — `backend/.env.example`.
Скопіюйте шаблон у `.env` та вкажіть доступи до створеної БД. `JWT__SECRET_KEY` може бути будь-яким довгим випадковим рядком для локального запуску.

Backend потрібно запускати саме з папки `backend`, тому що звідти читається `.env`:

```powershell
cd backend
Copy-Item .env.example .env
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
python __main__.py
```

Для macOS/Linux замініть `Copy-Item` на `cp`, `py -3.12` на `python3.12`, а команду активації — на `source .venv/bin/activate`.

API буде доступне на `http://localhost:8000`, документація — на `http://localhost:8000/docs`.

## 3. Frontend

Адреса API задається у `frontend/.env`, шаблон — `frontend/.env.example`. Значення має містити `/api` наприкінці адреси.

У новому терміналі:

```powershell
cd frontend
Copy-Item .env.example .env
npm ci
npm run dev
```

На macOS/Linux замініть `Copy-Item` на `cp`.

Відкрийте `http://localhost:5173/login`, увійдіть під локальним тестовим обліковим записом `owner` / `owner` та перейдіть на `http://localhost:5173/traffic`.

Після зміни frontend-конфігу перезапустіть Vite. Для локального запуску використовуйте `localhost` і для frontend, і для backend: авторизація працює через cookie, тому не варто змішувати `localhost` та `127.0.0.1`.
