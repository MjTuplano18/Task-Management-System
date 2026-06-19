# Task Management App — Architecture & Data Flow Documentation

## Overview

This is a fullstack Task Management application demonstrating how a React frontend communicates with a Python backend API to perform CRUD operations on task items stored in a database.

**Tech Stack:**
- **Frontend:** Next.js (React 19, TypeScript)
- **Backend:** Python FastAPI
- **Database:** SQLite via SQLAlchemy ORM
- **Communication:** RESTful JSON API over HTTP

---

## Architecture Diagram

```
┌─────────────────────────────────┐        HTTP (JSON)        ┌──────────────────────────────┐
│         FRONTEND                │  ◄──────────────────────►  │          BACKEND             │
│   Next.js / React (Port 3000)  │                            │   FastAPI (Port 8000)        │
│                                 │                            │                              │
│  ┌─────────────┐               │    GET /api/tasks          │  ┌────────────────┐          │
│  │  TaskPage   │ ──── API ─────┼──► POST /api/tasks ──────► │  │  Router Layer  │          │
│  │  (state)    │    Client     │    PUT /api/tasks/:id       │  │  (router.py)   │          │
│  └─────────────┘               │    DELETE /api/tasks/:id    │  └───────┬────────┘          │
│       │                        │                            │          │                    │
│  ┌────┴─────┐                  │                            │  ┌───────▼────────┐          │
│  │Components │                  │                            │  │ Service Layer  │          │
│  │TaskForm   │                  │                            │  │ (service.py)   │          │
│  │TaskList   │                  │                            │  └───────┬────────┘          │
│  │TaskItem   │                  │                            │          │                    │
│  │SearchBar  │                  │                            │  ┌───────▼────────┐          │
│  │Filters    │                  │                            │  │  Data Layer    │          │
│  └───────────┘                  │                            │  │ (models.py)    │          │
│                                 │                            │  └───────┬────────┘          │
└─────────────────────────────────┘                            │          │                    │
                                                               │  ┌───────▼────────┐          │
                                                               │  │   SQLite DB    │          │
                                                               │  │  (tasks.db)    │          │
                                                               │  └────────────────┘          │
                                                               └──────────────────────────────┘
```

---

## How the Frontend Interacts with the Backend

### The API Client Layer (`frontend/src/api/tasks.ts`)

The frontend never talks directly to the database. Instead, it uses an **API client** that sends HTTP requests to the backend:

```typescript
// Every function calls the backend REST API
fetchTasks(search?, status?)  →  GET    /api/tasks?search=...&status=...
createTask(title, description) →  POST   /api/tasks
updateTask(id, updates)        →  PUT    /api/tasks/{id}
deleteTask(id)                 →  DELETE  /api/tasks/{id}
```

Key features of the API client:
- **10-second timeout** using AbortController — if the backend doesn't respond, it shows a connection error
- **Error parsing** — reads the error message from the JSON response body
- **Typed errors** — throws an `ApiError` with status code so the UI can react differently to 400 vs 404 vs 500

### Data Flow Example: Creating a Task

1. User types a title and clicks "Add Task"
2. `TaskForm` component validates input (title not empty, within length limits)
3. `TaskForm` calls `createTask(title, description)` from the API client
4. API client sends `POST /api/tasks` with JSON body `{ "title": "...", "description": "..." }`
5. Backend **router** receives the request and validates via Pydantic schema
6. Backend **service** creates a new Task object and inserts it into SQLite
7. Backend returns `201 Created` with `{ "data": { "id": 1, "title": "...", ... } }`
8. Frontend receives the response, adds the new task to state, and the UI re-renders

### Data Flow Example: Search + Filter Combined

1. User types "buy" in the search bar and clicks "Inactive" filter
2. Frontend sends `GET /api/tasks?search=buy&status=inactive`
3. Backend builds a database query:
   - `WHERE title LIKE '%buy%'` (case-insensitive)
   - `AND completed = True` (inactive = completed tasks)
   - `ORDER BY created_at DESC`
4. Returns only tasks matching **both** criteria
5. Frontend displays the filtered list

---

## Backend Architecture (Layered Design)

### Layer 1: Router (`router.py`)
- Handles HTTP request/response
- Defines the 5 REST endpoints
- Uses FastAPI's dependency injection for database sessions
- Returns proper HTTP status codes (200, 201, 400, 404, 500)

### Layer 2: Service (`service.py`)
- Contains all business logic
- `TaskService` class with static CRUD methods
- Handles search filtering (case-insensitive with `ilike`)
- Handles status filtering (active = not completed, inactive = completed)
- Orders results by creation date (newest first)

### Layer 3: Data Model (`models.py`)
- SQLAlchemy ORM model mapping to the `tasks` table
- Fields: `id`, `title`, `description`, `completed`, `created_at`
- Database auto-creates on startup via `Base.metadata.create_all()`

### Validation Layer (`schemas.py`)
- Pydantic models validate all incoming data
- `TaskCreate`: title required (1-200 chars, not whitespace-only), description optional (max 1000 chars)
- `TaskUpdate`: all fields optional for partial updates
- Invalid input returns 400 before reaching the database

### Error Handling (`main.py`)
- Global exception handlers catch all errors
- Validation errors → 400 with descriptive message
- Not found → 404
- Unexpected errors → 500 with generic message (no internal details exposed)
- All errors follow format: `{ "error": { "message": "..." } }`

---

## Frontend Architecture (Component-Based)

### Component Hierarchy

```
TaskPage (main page — manages all state)
├── TaskForm (create new tasks)
├── SearchBar (real-time search input)
├── FilterControls (All / Active / Inactive tabs)
├── ErrorDisplay (error messages with dismiss/retry)
├── LoadingIndicator (spinner while fetching)
└── TaskList (renders task items)
    └── TaskItem (single task with checkbox, edit, delete)
        └── ConfirmDialog (delete confirmation modal)
```

### State Management

All state lives in the `TaskPage` component using React hooks:

| State | Purpose |
|-------|---------|
| `tasks` | Array of task objects from the API |
| `searchText` | Current search input value |
| `selectedFilter` | Current filter (all/active/inactive) |
| `loading` | Whether data is being fetched |
| `error` | Current error message (null if no error) |
| `retryAction` | Function to retry the last failed operation |
| `currentPage` | Current pagination page number |

### How state flows:
- `useEffect` triggers `loadTasks()` whenever `searchText` or `selectedFilter` changes
- CRUD operations update local state immediately on success
- On failure, previous state is preserved and an error message is shown

---

## Error Handling Strategy

### Frontend Error Handling

| Scenario | Behavior |
|----------|----------|
| Empty title submitted | Inline validation error (before API call) |
| Title > 200 chars | Inline validation error (before API call) |
| API returns 400 | Shows validation message from backend |
| API returns 404 | Shows "Task not found", refreshes list |
| API returns 500 | Shows generic error with Retry button |
| Network timeout (10s) | Shows "Server unreachable" with Retry |
| Failed toggle/edit/delete | Preserves previous state, shows error |

### Backend Error Handling

| Error Type | HTTP Code | Response |
|-----------|-----------|----------|
| Invalid input (empty title, too long) | 400 | `{"error": {"message": "title: Title cannot be empty..."}}` |
| Task not found | 404 | `{"error": {"message": "Task not found"}}` |
| Invalid filter value | 400 | `{"error": {"message": "Invalid status filter..."}}` |
| Database/server error | 500 | `{"error": {"message": "Internal server error"}}` |

No stack traces, file paths, or SQL queries are ever exposed to the client.

---

## Database Schema

```sql
CREATE TABLE tasks (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    title       VARCHAR(200) NOT NULL,
    description VARCHAR(1000) NOT NULL DEFAULT '',
    completed   BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
```

- `id` is auto-generated and immutable
- `created_at` is auto-set on creation
- Data persists across application restarts (SQLite file-based)

---

## API Endpoints Summary

| Method | Endpoint | Purpose | Success | Errors |
|--------|----------|---------|---------|--------|
| GET | `/api/tasks` | List tasks (with search/filter) | 200 | 400, 500 |
| POST | `/api/tasks` | Create a task | 201 | 400, 500 |
| GET | `/api/tasks/{id}` | Get single task | 200 | 404, 500 |
| PUT | `/api/tasks/{id}` | Update a task (partial) | 200 | 400, 404, 500 |
| DELETE | `/api/tasks/{id}` | Delete a task | 200 | 404, 500 |

---

## Key Design Decisions

1. **Separation of concerns** — Frontend handles UI/UX, backend handles data/logic, database handles persistence. Each layer has a single responsibility.

2. **Client-server decoupling** — Frontend and backend communicate only via REST API. They can be developed, tested, and deployed independently.

3. **Server-side filtering** — Search and filter logic runs on the backend (not client-side). This scales better with large datasets since only matching results are sent over the network.

4. **Optimistic error handling** — On mutation failure, the UI preserves previous state rather than showing stale/incorrect data.

5. **Consistent API contract** — Every response has either `{ "data": ... }` (success) or `{ "error": { "message": "..." } }` (failure). This makes frontend error handling predictable.

6. **Input validation at two levels** — Frontend validates before sending (fast user feedback), backend validates before saving (security/data integrity).
