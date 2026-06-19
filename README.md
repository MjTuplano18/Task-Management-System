# Task Management System

A fullstack Task Management Application that allows users to create, manage, and search tasks. Built with a **Next.js** (React) frontend and a **Python/FastAPI** backend with SQLite persistent storage.

Users can perform full CRUD operations on tasks, search tasks by title, and filter by completion status.

## Prerequisites

| Tool | Version |
|------|---------|
| Python | 3.10 or higher |
| Node.js | 18 or higher |
| npm | Included with Node.js |

No external database server is required — SQLite is used for persistence and the database file is created automatically on first run.

## Backend Setup

```bash
cd backend
pip install -r requirements.txt
```

### Backend Dependencies

Listed in `backend/requirements.txt`:

- **fastapi** — Web framework for building the REST API
- **uvicorn** — ASGI server to run the FastAPI application
- **sqlalchemy** — ORM for database operations
- **pydantic** — Data validation and serialization

### Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.

## Frontend Setup

```bash
cd frontend
npm install
```

### Frontend Dependencies

Listed in `frontend/package.json`:

- **next** (16.x) — React framework with server-side rendering
- **react** (19.x) — UI component library
- **react-dom** (19.x) — React DOM renderer

Dev dependencies: TypeScript, ESLint, and type definitions for React/Node.

### Environment Configuration

Create a `.env.local` file in the `frontend/` directory (optional — defaults to `http://localhost:8000`):

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Start the Frontend Server

```bash
cd frontend
npm run dev
```

The frontend will be available at `http://localhost:3000`.

## Database

The application uses **SQLite** for persistent data storage.

- The database file is automatically created at `backend/tasks.db` on first server startup.
- No manual setup or migration is required — tables are created automatically.
- Data persists across application restarts.

## API Documentation

Base URL: `http://localhost:8000`

All responses use a consistent JSON structure:
- **Success:** `{ "data": ... }`
- **Error:** `{ "error": { "message": "..." } }`

### Endpoints

#### Create a Task

```
POST /api/tasks
```

**Request Body:**

```json
{
  "title": "My Task",
  "description": "Optional description"
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | Yes | 1–200 characters, cannot be whitespace-only |
| description | string | No | 0–1000 characters, defaults to `""` |

**Response (201 Created):**

```json
{
  "data": {
    "id": 1,
    "title": "My Task",
    "description": "Optional description",
    "completed": false,
    "created_at": "2025-01-01T12:00:00"
  }
}
```

---

#### List All Tasks

```
GET /api/tasks
```

**Query Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| search | string (optional) | Case-insensitive title substring match (max 200 chars) |
| status | string (optional) | Filter by completion status: `all`, `active`, or `inactive` |

**Response (200 OK):**

```json
{
  "data": [
    {
      "id": 1,
      "title": "My Task",
      "description": "Optional description",
      "completed": false,
      "created_at": "2025-01-01T12:00:00"
    }
  ]
}
```

---

#### Get a Single Task

```
GET /api/tasks/{id}
```

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "title": "My Task",
    "description": "Optional description",
    "completed": false,
    "created_at": "2025-01-01T12:00:00"
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": {
    "message": "Task not found"
  }
}
```

---

#### Update a Task

```
PUT /api/tasks/{id}
```

**Request Body (all fields optional):**

```json
{
  "title": "Updated Title",
  "description": "Updated description",
  "completed": true
}
```

| Field | Type | Required | Constraints |
|-------|------|----------|-------------|
| title | string | No | 1–200 characters, cannot be whitespace-only |
| description | string | No | 0–1000 characters |
| completed | boolean | No | `true` or `false` |

**Response (200 OK):**

```json
{
  "data": {
    "id": 1,
    "title": "Updated Title",
    "description": "Updated description",
    "completed": true,
    "created_at": "2025-01-01T12:00:00"
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": {
    "message": "Task not found"
  }
}
```

---

#### Delete a Task

```
DELETE /api/tasks/{id}
```

**Response (200 OK):**

```json
{
  "data": {
    "message": "Task deleted successfully"
  }
}
```

**Response (404 Not Found):**

```json
{
  "error": {
    "message": "Task not found"
  }
}
```

---

### Error Responses

All error responses follow this format:

```json
{
  "error": {
    "message": "Descriptive error message"
  }
}
```

| Status Code | Meaning |
|-------------|---------|
| 400 | Validation error (empty title, field length exceeded, invalid filter value, malformed JSON) |
| 404 | Resource not found |
| 500 | Internal server error |

## Project Structure

```
Task Management System/
├── README.md
├── backend/
│   ├── main.py              # FastAPI app entry point, middleware, exception handlers
│   ├── router.py            # API route definitions
│   ├── service.py           # Business logic layer
│   ├── models.py            # SQLAlchemy database models
│   ├── schemas.py           # Pydantic request/response schemas
│   ├── database.py          # Database engine and session configuration
│   ├── requirements.txt     # Python dependencies
│   └── tasks.db             # SQLite database (auto-created)
└── frontend/
    ├── package.json         # Node.js dependencies and scripts
    ├── next.config.ts       # Next.js configuration
    ├── tsconfig.json        # TypeScript configuration
    └── src/
        ├── app/
        │   ├── layout.tsx   # Root layout
        │   ├── page.tsx     # Main task management page
        │   └── globals.css  # Global styles
        ├── api/
        │   └── tasks.ts     # API client for backend communication
        ├── components/
        │   ├── TaskForm.tsx        # Task creation/editing form
        │   ├── TaskList.tsx        # Task list container
        │   ├── TaskItem.tsx        # Individual task display
        │   ├── SearchBar.tsx       # Search input component
        │   ├── FilterControls.tsx  # Status filter buttons
        │   ├── ErrorDisplay.tsx    # Error message component
        │   └── LoadingIndicator.tsx # Loading spinner
        └── types/
            └── task.ts      # TypeScript type definitions
```
