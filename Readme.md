# Cash Flow Dashboard — Financial Management Web Service

A full-stack web application designed for cash flow tracking, operational financial accounting, and transaction lifecycle management.

## 🛠 Tech Stack

* **Frontend:** React, TypeScript, Vite, Tailwind CSS
* **Backend:** Python 3.12, Django, Django REST Framework (DRF)
* **Database:** PostgreSQL
* **Dependency Management:** Poetry (Backend), npm (Frontend)
* **Containerization:** Docker, Docker Compose

---

## 🚀 Key Features

* **Transaction Accounting:** Full CRUD operations for financial records and cash movements.
* **Dynamic Reference Books:** Complete CRUD lifecycle management for Transaction Statuses, Types, Categories, and Subcategories.
* **Cascading Business Logic & Integrity:**
  * Strict parent-child bindings (e.g., the *Marketing* category is exclusively available under the *Expense* operation type; *VPS* is restricted to the *Infrastructure* category).
  * Dual-layer dynamic filtering and validation on both the client (React state machines) and the server (DRF Serializers).
* **Multi-Parameter Filtering & Search:** Advanced search filtering across date ranges, transaction types, statuses, categories, and subcategories simultaneously.

---

## 📁 Repository Structure

```text
.
├── backend/                  # Django Application (Core API)
│   ├── api/                  # Business logic domain
│   │   ├── fixtures/         # Initial seeding data (initial_data.json)
│   │   ├── migrations/
│   │   ├── admin.py
│   │   ├── apps.py
│   │   ├── filters.py        # Custom API transaction filters
│   │   ├── models.py         # ORM models (Transactions, References)
│   │   ├── serializers.py    # Request validation & serialization (DRF)
│   │   ├── tests.py
│   │   └── views.py          # ViewSets and API routing handlers
│   ├── config/               # Project configuration root
│   │   ├── settings.py       # Core settings module
│   │   └── urls.py           # Root URL dispatching
│   ├── Dockerfile
│   └── manage.py
├── frontend/                 # React Application (SPA)
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── App.tsx           # Main application shell (cascading forms & data tables)
│   │   ├── api.ts            # Typed HTTP client for Django REST API
│   │   ├── index.css
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── index.html
│   ├── nginx.conf            # Reverse proxy & static assets server
│   ├── package-lock.json
│   ├── package.json
│   ├── postcss.config.js
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker-compose.yml        # Multi-container orchestration
├── poetry.lock
└── pyproject.toml            # Poetry backend dependencies

⚠️ Note: When running via docker-compose, ensure DB_HOST is set to db (the database service name within the Docker internal bridge network). For standalone local development, switch this value to localhost.

💻 Quick Start (Docker Compose)

The fastest way to spin up the entire application stack in an isolated, production-like environment.
1. Clone the repository
```
git clone https://github.com/Sartc00l/fisrt-it-company-backend
cd fisrt-it-company-backend
```

2. Configure Environment Variables

Create a root .env configuration file:

```
cat << 'EOF' > .env
# Django Settings
SECRET_KEY=django-insecure-local-dev-super-secret-key-2026
DEBUG=True
DJANGO_ALLOWED_HOSTS=localhost,127.0.0.1,web
CORS_ALLOWED_ORIGINS=http://localhost:5173,[http://127.0.0.1:5173](http://127.0.0.1:5173),http://localhost:3000

# PostgreSQL Settings
DB_NAME=dds_db
DB_USER=dds_user
DB_PASSWORD=dds_pass
DB_HOST=db
DB_PORT=5432
EOF
```

3. Build & Run

Run the orchestration command in the root folder. It provisions the PostgreSQL instance, runs migrations, seeds initial data from fixtures, and launches both backend and frontend containers:

`docker compose up -d --build`

4. Verification & Endpoints

Once initialized, services are available at:

    Frontend Client: http://localhost:3000

    Backend API / Swagger UI: http://localhost:8000/api/

🛠 Local Development (Bare Metal)

Manual setup guide without Docker for debugging or local profiling.
Backend (Django)

    1. Ensure Poetry is installed.

    2. Install dependencies:
    ```
    cd backend
    poetry install
    ```
    3. Activate the environment and execute database migrations:
    ```
    poetry shell
    python manage.py migrate
    ```
    4. Seed initial fixtures:
    `python manage.py loaddata api/fixtures/initial_data.json`
    5. Start development server:
    `python manage.py runserver`
Frontend (React)
    1. Navigate to the frontend directory:
    `cd frontend`
    2. Install dependencies:
    `npm install`
    3. Start Vite dev server:
    `npm run dev`

🔒 Data Validation & Business Constraints

    Mandatory Input Fields: Amount, Type, Category, and Subcategory undergo rigorous validation both client-side (blocking illegal submission states) and server-side (serializers.ValidationError), returning structured error payloads.

    Relational Integrity Enforcement: Submitting a Category that does not belong to the selected Type via raw API payload is immediately rejected by the backend. This guarantees zero orphaned relations and absolute data consistency in PostgreSQL.
