# Profile RAG

Multi-user document Q&A. Users register, upload PDFs and ask questions answered **only** from
their own documents, with page-level sources.

- **backend/**: FastAPI + PostgreSQL (pgvector) + Alembic. Auth (JWT), PDF ingestion, retrieval, chat.
- **frontend/**: React + Vite + Tailwind web app. Talks only to the API.

```
React (5173) ──HTTP──> FastAPI (8000) ──> PostgreSQL + pgvector
                             ├── fastembed (BAAI/bge-small-en-v1.5, 384-dim, runs locally)
                             └── Groq LLM (answers)
```

## Project structure

```
profile-rag/
├── docker-compose.yml        Postgres + pgvector for local development
├── backend/
│   ├── .env.example          backend settings template (copy to backend/.env)
│   ├── requirements.txt
│   ├── alembic.ini, alembic/ database migrations
│   ├── uploads/              uploaded PDFs, one folder per user (created automatically, git-ignored)
│   └── app/
│       ├── main.py           FastAPI app, CORS, rate limiter, routers
│       ├── api/              routes (auth, documents, chat, sessions, health) and dependencies
│       ├── core/             settings, JWT/password security, rate limits
│       ├── db/, models/      SQLAlchemy engine and tables
│       ├── schemas/          request/response models
│       └── services/         PDF parsing, chunking, embeddings, ingestion, retrieval, LLM, chat
└── frontend/
    ├── .env.example          frontend settings template (copy to frontend/.env)
    ├── package.json, vite.config.js, index.html
    └── src/
        ├── api/              axios client (token + 401 handling) and endpoint calls
        ├── context/          auth state, toast notifications
        ├── hooks/            documents (with status polling), sessions, chat, theme
        ├── pages/            Login, Register, Home
        └── components/       sidebar, upload, lists, chat window, messages, sources
```

## Prerequisites

- Python 3.11+
- Node.js 20.19+
- PostgreSQL 16 with the **pgvector** extension: either Docker Desktop (uses `docker-compose.yml`)
  or a local PostgreSQL install with pgvector added
- A Groq API key: https://console.groq.com/keys

## Setup (once)

```bash
# 1. Backend config: copy the template, then fill in GROQ_API_KEY and JWT_SECRET_KEY
cp backend/.env.example backend/.env
python -c "import secrets; print(secrets.token_hex(32))"   # paste the output as JWT_SECRET_KEY
# In backend/.env set CORS_ORIGINS=http://localhost:5173

# 2. Backend virtual environment and dependencies
cd backend
python -m venv .venv
.venv\Scripts\activate            # Windows (macOS/Linux: source .venv/bin/activate)
pip install -r requirements.txt
cd ..

# 3. Database (Docker option). --env-file makes Compose use the POSTGRES_* values from backend/.env
docker compose --env-file backend/.env up -d
#    Using a local PostgreSQL instead? Skip this step and point DATABASE_URL at it.

# 4. Create the tables (venv activated)
cd backend
alembic upgrade head
cd ..

# 5. Frontend config and dependencies
cp frontend/.env.example frontend/.env
cd frontend
npm install
cd ..
```

`DATABASE_URL` must match the database you use. With Docker it is
`postgresql+psycopg://<POSTGRES_USER>:<POSTGRES_PASSWORD>@localhost:<POSTGRES_PORT>/<POSTGRES_DB>`.

## Run (each time)

```bash
# Terminal 1: API (http://localhost:8000/docs)
docker compose --env-file backend/.env up -d      # only if you use the Docker database
cd backend
.venv\Scripts\activate
uvicorn app.main:app --reload

# Terminal 2: web app (http://localhost:5173)
cd frontend
npm run dev
```

The first API start downloads the embedding model (~130 MB), which takes a minute. After that it starts in seconds.

## Configuration

### backend/.env

All backend settings are read from `backend/.env` (template: `backend/.env.example`).

| Setting | Meaning |
|---|---|
| `POSTGRES_USER`, `POSTGRES_PASSWORD`, `POSTGRES_DB`, `POSTGRES_PORT` | used only by `docker compose` to create the database container |
| `DATABASE_URL` | Postgres connection used by the API and Alembic |
| `JWT_SECRET_KEY` | random string, 32+ characters (the API refuses to start without one) |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | login lifetime (default 60) |
| `GROQ_API_KEY`, `GROQ_MODEL` | LLM used for answers |
| `EMBEDDING_MODEL` | fastembed model; changing it requires a new migration (vector size is 384) |
| `UPLOAD_DIR` | where PDFs are stored; relative paths are inside `backend/` (default `backend/uploads`) |
| `MAX_UPLOAD_MB`, `CHUNK_SIZE`, `CHUNK_OVERLAP`, `TOP_K` | ingestion and retrieval tuning |
| `RATE_LIMIT_LOGIN`, `RATE_LIMIT_CHAT` | e.g. `5/minute` |
| `CORS_ORIGINS` | comma-separated origins allowed to call the API, e.g. `http://localhost:5173` |
| `LOG_LEVEL` | e.g. `INFO` |

### frontend/.env

| Setting | Meaning |
|---|---|
| `VITE_API_URL` | API base URL including `/api/v1`, e.g. `http://localhost:8000/api/v1` |
| `VITE_MAX_UPLOAD_MB` | upload limit shown in the UI; keep it equal to the backend's `MAX_UPLOAD_MB` |

Vite reads `.env` only at start-up: restart `npm run dev` after changing it.

## Where data is stored

- **PDF files**: `backend/uploads/<user_id>/<document_id>.pdf`. Rejected uploads (not a PDF, too large,
  scanned or encrypted) are never saved.
- **Database**: document metadata (`documents`), extracted text with embeddings (`chunks`), users,
  chat sessions and messages. Answers are generated from `chunks`, not from the PDF files.
- Deleting a document in the app removes its row, its chunks and its PDF file. Past chat answers keep
  their sources, because each message stores a copy of the cited passages.

## Frontend

React 19 + Vite + React Router + axios + Tailwind CSS v4 + lucide-react + react-markdown, plain JavaScript.

| What | Command (from `frontend/`) |
|---|---|
| Install dependencies | `npm install` |
| Dev server with hot reload | `npm run dev` |
| Production build (to `frontend/dist/`) | `npm run build` |
| Preview the production build | `npm run preview` |

Features: sign in / sign up, PDF upload with drag and drop and progress, live document status,
chat with markdown answers and collapsible sources, chat history, search in one or all documents,
dark mode (follows the system until toggled), and a mobile drawer layout.

## Useful commands

| What | Command |
|---|---|
| Stop the Docker database (keeps data) | `docker compose --env-file backend/.env down` |
| Delete the Docker database and all data | `docker compose --env-file backend/.env down -v` |
| Open a SQL shell (Docker) | `docker exec -it profile-rag-db psql -U <POSTGRES_USER> -d <POSTGRES_DB>` |
| New migration after changing models | `cd backend && alembic revision --autogenerate -m "describe change"` |
| Apply migrations | `cd backend && alembic upgrade head` |
| Undo the last migration | `cd backend && alembic downgrade -1` |
| Health check | `curl http://localhost:8000/health` |

## API

Interactive docs are at http://localhost:8000/docs. Click **Authorize** and paste an access token from `/auth/login`.

| Method | Path | Notes |
|---|---|---|
| GET | `/health` | DB check |
| POST | `/api/v1/auth/register` | `{email, password}` (password 8+ characters) |
| POST | `/api/v1/auth/login` | returns `access_token` (60 min). Rate limited to 5/min per IP |
| GET | `/api/v1/auth/me` | current user |
| POST | `/api/v1/documents` | multipart `file` (PDF, max 10 MB). Returns 202 with `status: processing` |
| GET | `/api/v1/documents` | `?limit=&offset=`; each item has its `status` (processing / ready / failed) |
| DELETE | `/api/v1/documents/{id}` | removes the document, its chunks and the file (409 while processing) |
| POST | `/api/v1/chat` | `{question, session_id?, document_id?}`. Rate limited to 20/min per user |
| GET | `/api/v1/sessions` | your chats, most recent first |
| GET | `/api/v1/sessions/{id}/messages` | history with sources |
| DELETE | `/api/v1/sessions/{id}` | delete a chat |

Every query is filtered by the logged-in user's id, so users never see each other's documents, chunks or chats.

## Troubleshooting

| Symptom | Fix |
|---|---|
| Browser console shows a CORS error | add the frontend origin to `CORS_ORIGINS` in `backend/.env` and restart the API |
| "Cannot reach the server" in the app | the API is not running, or `VITE_API_URL` is wrong |
| API fails at start-up with `JWT_SECRET_KEY` error | set a random value of 32+ characters |
| `alembic upgrade` fails on `CREATE EXTENSION vector` | the database has no pgvector; use the Docker image or install pgvector |

## Notes

- Scanned (image-only), password-protected, empty and corrupt PDFs are rejected at upload with a clear message (OCR is not supported).
- Ingestion runs in the API process. If the API restarts mid-ingestion, that document is marked `failed`; upload it again.
- Rate limits are kept in memory, so they reset when the API restarts and apply per API process.
