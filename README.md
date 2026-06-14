# FloraRare — інтернет-магазин рослин

React (Vite) + Express.js + PostgreSQL (raw SQL, без ORM).

## Запуск

### 1. База даних

```bash
createdb flora_shop
cd backend
cp .env.example .env
# DATABASE_URL, SECRET_KEY, ORIGIN — див. .env.example
npm run db:init
```

Схема та тестові дані: [schema.sql](schema.sql). Пароль усіх тестових користувачів: `Test123!`

| Email | Роль |
|-------|------|
| director@flora.ua | Керівник |
| client@flora.ua | Клієнт |

### 2. Backend

```bash
cd backend
npm install
npm run dev
```

Порт за замовчуванням: `3001`

### 3. Frontend

```bash
cd frontend
npm install
npm run dev
```

`VITE_API_URL=http://localhost:3001` (опційно в `.env`)
