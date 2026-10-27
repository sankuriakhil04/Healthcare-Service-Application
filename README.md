# CareConnect – Healthcare Service Application

CareConnect is a responsive Angular healthcare app with a separate Express REST API. It includes routed public pages, doctor and service directories, registration and JWT login, protected patient pages, appointment booking and cancellation, profile editing, medical records, a dashboard, and a contact form.

## Requirements

- Node.js 20 or newer and npm
- MySQL 8.0 or newer
- Two terminals

## Run locally

1. Start MySQL and use a MySQL account with permission to create the `careconnect` database.
2. In `backend`, copy `.env.example` to `.env` if you do not already have a `.env` file. Set `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, and `DB_PASSWORD` to match your MySQL setup. Replace the example `JWT_SECRET` with a private value of your own. Do not commit `.env`.
3. The backend creates the database and tables and seeds doctors and services on its first start.
4. In one terminal: `cd backend`, run `npm install`, then `npm run dev` (or `npm start`). The API is at `http://localhost:3000`.
5. In another terminal: `cd frontend`, run `npm install`, then `npm start`. Open `http://localhost:4200`.
6. Verify the backend at `http://localhost:3000/api/health`.
7. Create an account at `/register`, then log in. Appointments, dashboard, profile, and records require login.

## Project layout

```text
CareConnect/
├── frontend/   # Angular 19 standalone application
└── backend/    # Express 4 REST API
```

## API

Public endpoints: `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/doctors`, `GET /api/doctors/:id`, `GET /api/services`, `GET /api/services/:id`, `POST /api/contact`, and `GET /api/health`.

JWT-protected endpoints: `GET|POST /api/appointments`, `GET|PUT|DELETE /api/appointments/:id`, `GET|PUT /api/profile`, `GET /api/medical-records`, `GET /api/medical-records/:id`, and `GET /api/dashboard`. The Angular HTTP interceptor attaches the bearer token automatically.

## MySQL storage

The backend uses MySQL through the `mysql2` promise API. It creates the database named in `DB_NAME` (default `careconnect`), applies the idempotent schema in `backend/database/schema.sql`, and inserts starter doctors and services. Users, profiles, appointments, and contact messages persist in MySQL. Medical records are scoped to their patient and can be added to the `medical_records` table. Do not use this student project with real patient information or deploy it as a production medical system.

## GitHub

The repository ignores dependencies, generated Angular output, and `.env` files. Commit `.env.example`, never your actual `.env` or secrets. Install dependencies separately in each project folder; each has its own `package.json`.
