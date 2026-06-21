# Task Management System

A fullstack Task Management application built with **Next.js** (React/TypeScript) for the frontend and **Python FastAPI** for the backend, using **SQLite** for data persistence.

## Features

- **Create Task** — Add tasks with a title and optional description
- **Mark Complete/Incomplete** — Toggle task completion status
- **Edit Task** — Inline editing of task title and description
- **Delete Task** — Remove tasks with a confirmation dialog
- **Search** — Real-time case-insensitive search by task title
- **Filter** — Filter by All, Active, or Inactive (completed) tasks
- **Combined Search + Filter** — Both work together (intersection of results)
- **Pagination** — Numbered page navigation when task list grows

---

## Prerequisites

Make sure you have the following installed:

| Tool | Version | Download |
|------|---------|----------|
| **Python** | 3.10 or higher | [python.org](https://www.python.org/downloads/) |
| **Node.js** | 18 or higher | [nodejs.org](https://nodejs.org/) |
| **npm** | Comes with Node.js | — |

---

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/MjTuplano18/Task-Management-System.git
cd Task-Management-System
```

### 2. Set Up the Backend

```bash
cd backend
pip install -r requirements.txt
```

### 3. Start the Backend Server

```bash
cd backend
uvicorn main:app --reload --port 8000
```

The API will be running at **http://localhost:8000**

> The SQLite database (`tasks.db`) is created automatically on first startup. No manual database setup is needed.

### 4. Set Up the Frontend (in a new terminal)

```bash
cd frontend
npm install
```

### 5. Start the Frontend Server

```bash
cd frontend
npm run dev
```

The app will be running at **http://localhost:3000**

### 6. Open the App

Open your browser and go to **http://localhost:3000**

---

## Project Structure

```
Task-Management-System/
├── backend/                    # Python FastAPI server
│   ├── main.py                # App entry point, CORS, error handlers
│   ├── router.py              # REST API endpoint definitions
│   ├── service.py             # Business logic (CRUD operations)
│   ├── models.py              # SQLAlchemy database model
│   ├── schemas.py             # Pydantic validation schemas
│   ├── database.py            # Database connection configuration
│   └── requirements.txt       # Python dependencies
│
├── frontend/                   # Next.js React application
│   └── src/
│       ├── app/
│       │   ├── page.tsx       # Main page (state management, layout)
│       │   ├── layout.tsx     # Root layout
│       │   └── globals.css    # All styles
│       ├── components/
│       │   ├── TaskForm.tsx         # Task creation form
│       │   ├── TaskItem.tsx         # Individual task display
│       │   ├── TaskList.tsx         # Task list container
│       │   ├── SearchBar.tsx        # Search input
│       │   ├── FilterControls.tsx   # Status filter tabs
│       │   ├── ErrorDisplay.tsx     # Error message component
│       │   ├── LoadingIndicator.tsx # Loading spinner
│       │   └── ConfirmDialog.tsx    # Delete confirmation modal
│       ├── api/
│       │   └── tasks.ts       # API client (HTTP requests)
│       └── types/
│           └── task.ts        # TypeScript type definitions
│
├── DOCUMENTATION.md           # Architecture & data flow docs
├── CODE_GUIDE.md              # Code navigation guide
└── README.md                  # This file
```

---

## API Endpoints

Base URL: `http://localhost:8000`

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/tasks` | List all tasks (supports `?search=` and `?status=` query params) |
| `POST` | `/api/tasks` | Create a new task |
| `GET` | `/api/tasks/{id}` | Get a single task |
| `PUT` | `/api/tasks/{id}` | Update a task (partial updates supported) |
| `DELETE` | `/api/tasks/{id}` | Delete a task |

### Query Parameters for GET /api/tasks

| Parameter | Type | Description |
|-----------|------|-------------|
| `search` | string (optional) | Case-insensitive title substring match |
| `status` | string (optional) | `all`, `active`, or `inactive` |

### Request/Response Format

**Create Task:**
```json
POST /api/tasks
Body: { "title": "Buy groceries", "description": "Milk, eggs, bread" }
Response: { "data": { "id": 1, "title": "Buy groceries", "description": "Milk, eggs, bread", "completed": false, "created_at": "2025-01-01T12:00:00" } }
```

**Update Task:**
```json
PUT /api/tasks/1
Body: { "completed": true }
Response: { "data": { "id": 1, "title": "Buy groceries", "description": "Milk, eggs, bread", "completed": true, "created_at": "2025-01-01T12:00:00" } }
```

**Error Response:**
```json
{ "error": { "message": "Title cannot be empty or whitespace only" } }
```

---

## Dependencies

### Backend (Python)
- **fastapi** — Web framework for the REST API
- **uvicorn** — ASGI server to run FastAPI
- **sqlalchemy** — ORM for database operations
- **pydantic** — Data validation and serialization

### Frontend (Node.js)
- **next** — React framework
- **react** / **react-dom** — UI library
- **typescript** — Type safety

---

## Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend | Next.js + React + TypeScript | User interface and interaction |
| Backend | Python + FastAPI | REST API and business logic |
| Database | SQLite + SQLAlchemy | Data persistence |
| Communication | HTTP/JSON | Frontend ↔ Backend |
