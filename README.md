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

## Тестове завдання: стовпці «Цена fact-max» та «Минус»

### Розрахунок (backend)

Нові показники рахуються разом з іншими метриками рядка у `backend/app/utils/orders.py` (`calculate_price_indicators`):

- **Цена fact** — Спенд / Апруви. Якщо апрувів немає, значення не визначене (`null`, у таблиці — «—»).
- **Цена max** — Сред. чек $ × KPI-відсоток оффера. За замовчуванням KPI дорівнює 25%, але для частини офферів він інший (`TRAFFIC_OFFERS_ADDITIONAL_DATA`, у таблиці такі офери позначені міткою 📉) — тому розрахунок використовує вже наявний у коді `offer_kpi_percentage`, а не фіксовані 25%.
- **Минус** — (Max − Fact) × Апруви, якщо Fact перевищує Max, інакше 0. Якщо апрувів немає, але є спенд — у мінус потрапляє вся витрачена сума.

### Відображення (frontend)

- `frontend/src/pages/Traffic/PriceFactMax/PriceFactMax.tsx` — індикатор: зліва фактична ціна, справа максимальна; риска на шкалі — позиція max, кольорова точка — позиція fact відносно max (зелена — до 80%, жовта — 80–99.99%, червона — від 100%).
- «Минус» показує перевитрату червоним, інакше 0.
- У рядку «Итого»: fact — сумарний спенд / сумарні апруви; max — середньозважена за апрувами max-ціна рядків (KPI-відсотки офферів різні); минус — сума мінусів рядків.

### Тести

```powershell
cd backend
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements-dev.txt
python -m pytest tests
```
