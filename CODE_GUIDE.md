# Code Navigation Guide — Interview Prep

This guide helps you quickly navigate the codebase and explain each file's purpose when the interviewer asks you to walk through the code.

---

## Project Structure at a Glance

```
Task Management System/
├── backend/                  ← Python FastAPI server
│   ├── main.py              ← App entry point, middleware, error handlers
│   ├── router.py            ← API endpoint definitions (the URLs)
│   ├── service.py           ← Business logic (CRUD operations)
│   ├── models.py            ← Database table definition (SQLAlchemy)
│   ├── schemas.py           ← Input/output validation (Pydantic)
│   ├── database.py          ← Database connection setup
│   └── requirements.txt     ← Python dependencies
│
├── frontend/                 ← Next.js React app
│   └── src/
│       ├── app/
│       │   ├── page.tsx     ← Main page (composes everything, manages state)
│       │   ├── layout.tsx   ← Root layout (font, metadata)
│       │   └── globals.css  ← All styles
│       ├── components/
│       │   ├── TaskForm.tsx       ← Create task form
│       │   ├── TaskItem.tsx       ← Single task (checkbox, edit, delete)
│       │   ├── TaskList.tsx       ← Renders list of TaskItems
│       │   ├── SearchBar.tsx      ← Search input
│       │   ├── FilterControls.tsx ← All/Active/Inactive tabs
│       │   ├── ErrorDisplay.tsx   ← Error message banner
│       │   ├── LoadingIndicator.tsx ← Spinner
│       │   └── ConfirmDialog.tsx  ← Delete confirmation modal
│       ├── api/
│       │   └── tasks.ts     ← API client (fetch/create/update/delete)
│       └── types/
│           └── task.ts      ← TypeScript interface for Task
```

---

# PART 1: FRONTEND DEVELOPMENT

## Where to show: React Fundamentals

---

### Component Structure → `frontend/src/components/`

**What to explain:** "I separated the UI into reusable, single-responsibility components."

| Component | File | Responsibility |
|-----------|------|---------------|
| TaskForm | `TaskForm.tsx` | Handles task creation with form inputs and validation |
| TaskItem | `TaskItem.tsx` | Displays one task with toggle, inline edit, and delete |
| TaskList | `TaskList.tsx` | Renders an array of TaskItems, handles empty state |
| SearchBar | `SearchBar.tsx` | Controlled input that emits search text on each keystroke |
| FilterControls | `FilterControls.tsx` | Button group for status filtering |
| ErrorDisplay | `ErrorDisplay.tsx` | Shows errors with dismiss/retry actions |
| LoadingIndicator | `LoadingIndicator.tsx` | Spinner shown during API calls |
| ConfirmDialog | `ConfirmDialog.tsx` | Modal for delete confirmation |

**Key point:** Each component does ONE thing. They receive data via props and communicate back to the parent via callback functions.

---

### State Management → `frontend/src/app/page.tsx`

**What to explain:** "All application state lives in the main page component using React's `useState` hook. I use `useEffect` to trigger side effects like data fetching."

```typescript
// These are the state variables I manage:
const [tasks, setTasks] = useState<Task[]>([]);         // Task data from API
const [searchText, setSearchText] = useState("");        // What user typed in search
const [selectedFilter, setSelectedFilter] = useState("all"); // Which tab is active
const [loading, setLoading] = useState(true);            // Show spinner?
const [error, setError] = useState<string | null>(null); // Error message
const [currentPage, setCurrentPage] = useState(1);       // Pagination
```

**How useEffect works here:**
```typescript
// This runs whenever searchText or selectedFilter changes
useEffect(() => {
  loadTasks(searchText, selectedFilter);
}, [searchText, selectedFilter, loadTasks]);
```

"When the user types in search or clicks a filter tab, React detects the state change, re-runs this effect, and fetches fresh data from the API."

---

### Event Handling → `TaskForm.tsx`, `TaskItem.tsx`

**What to explain:** "I handle user interactions through event handlers attached to form submissions, button clicks, and input changes."

**In TaskForm (form submission):**
```typescript
async function handleSubmit(e: FormEvent) {
  e.preventDefault();          // Prevent page reload
  // Validate → Call API → Update parent state → Clear form
}
```

**In TaskItem (checkbox toggle):**
```typescript
function handleToggle() {
  onToggle(task.id, !task.completed);  // Calls parent's handler
}
```

**In SearchBar (keystroke):**
```typescript
const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  setSearchText(value);  // Update local state
  onSearch(value);       // Notify parent to refetch
};
```

---

### List Rendering → `TaskList.tsx`

**What to explain:** "I use `.map()` to render a list of components, with each item keyed by a unique database ID."

```typescript
<ul className="task-list" role="list">
  {tasks.map((task) => (
    <TaskItem
      key={task.id}      // ← React needs this to track which items changed
      task={task}
      onToggle={onToggle}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  ))}
</ul>
```

**Why `key={task.id}`?** React uses keys to efficiently update only the DOM elements that actually changed, rather than re-rendering the entire list.

---

# PART 2: BACKEND DEVELOPMENT

## Where to show: RESTful API Design, Request Handling, Business Logic

---

### RESTful API Design → `backend/router.py`

**What to explain:** "I designed the API following REST conventions — resources are nouns (`/tasks`), actions are HTTP methods."

```python
router = APIRouter(prefix="/api/tasks")

@router.post("", status_code=201)       # CREATE a task
@router.get("")                          # READ all tasks (with search/filter)
@router.get("/{task_id}")                # READ one task
@router.put("/{task_id}")                # UPDATE a task
@router.delete("/{task_id}")             # DELETE a task
```

**Key design choices:**
- `POST` returns `201 Created` (not 200) because a new resource was created
- `GET /api/tasks` accepts optional query params: `?search=buy&status=active`
- Invalid `status` value returns `400 Bad Request` with a descriptive message
- Consistent response format: always `{"data": ...}` or `{"error": {"message": "..."}}`

---

### Handling Requests → `backend/router.py` + `schemas.py`

**What to explain:** "FastAPI automatically validates incoming requests using Pydantic schemas before my code even runs."

**In `schemas.py`:**
```python
class TaskCreate(BaseModel):
    title: str = Field(..., min_length=1, max_length=200)
    description: str = Field(default="", max_length=1000)

    @field_validator("title")
    def title_not_whitespace(cls, v):
        if not v.strip():
            raise ValueError("Title cannot be empty or whitespace only")
        return v
```

"If someone sends `{"title": ""}` or `{"title": "   "}`, Pydantic rejects it before it reaches the service layer. The global error handler catches the validation error and returns a clean 400 response."

**In `router.py` — how a request flows:**
```python
@router.post("", status_code=201)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    # 1. FastAPI parses JSON body into TaskCreate (auto-validates)
    # 2. Depends(get_db) injects a database session
    # 3. We call the service layer to do the actual work
    task = TaskService.create_task(db, title=task_data.title, description=task_data.description)
    # 4. Convert ORM object to response schema and return
    return {"data": TaskResponse.model_validate(task).model_dump(mode="json")}
```

---

### Business Logic → `backend/service.py`

**What to explain:** "Business logic is separated from the HTTP layer. The service doesn't know about HTTP status codes — it just works with data."

```python
class TaskService:
    @staticmethod
    def get_all_tasks(db, search=None, status=None):
        query = db.query(Task)

        # Apply search filter (case-insensitive)
        if search:
            query = query.filter(Task.title.ilike(f"%{search}%"))

        # Apply status filter
        if status == "active":
            query = query.filter(Task.completed == False)
        elif status == "inactive":
            query = query.filter(Task.completed == True)

        # Always order newest first
        return query.order_by(Task.created_at.desc()).all()
```

"The `ilike` method does case-insensitive matching. If both search and status are provided, SQLAlchemy chains both `.filter()` calls — giving us the intersection (tasks matching BOTH criteria)."

**Partial updates:**
```python
def update_task(db, task_id, title=None, description=None, completed=None):
    task = db.query(Task).filter(Task.id == task_id).first()
    if task is None:
        return None  # Router converts this to a 404

    # Only update fields that were explicitly provided
    if title is not None:
        task.title = title
    if description is not None:
        task.description = description
    if completed is not None:
        task.completed = completed

    db.commit()
    return task
```

"This allows the frontend to send only the fields it wants to change. If you just toggle completion, it sends `{"completed": true}` — title and description stay unchanged."

---

### Global Error Handling → `backend/main.py`

**What to explain:** "I have global exception handlers that catch errors at any level and format them consistently."

```python
@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    # Pydantic validation failed → 400 with message
    return JSONResponse(status_code=400, content={"error": {"message": "..."}})

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    # Unexpected error → 500, log full details, return generic message
    logger.error("Unexpected error: %s", str(exc), exc_info=True)
    return JSONResponse(status_code=500, content={"error": {"message": "Internal server error"}})
```

"No matter what goes wrong, the client always gets a clean JSON response — never a raw Python traceback."

---

# PART 3: DATABASE DESIGN & DATA PERSISTENCE

## Where to show: Data Modeling, CRUD, Persistence

---

### Data Modeling → `backend/models.py`

**What to explain:** "I used SQLAlchemy ORM to define my data model. This maps a Python class to a database table."

```python
class Task(Base):
    __tablename__ = "tasks"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(String(1000), nullable=False, default="")
    completed = Column(Boolean, nullable=False, default=False)
    created_at = Column(DateTime, nullable=False, server_default=func.now())
```

**Column design decisions:**
| Column | Type | Why |
|--------|------|-----|
| `id` | Integer, auto-increment | Unique identifier, never reused |
| `title` | String(200) | Required, max 200 chars enforced at DB level |
| `description` | String(1000) | Optional (defaults to empty string) |
| `completed` | Boolean | Simple true/false toggle |
| `created_at` | DateTime | Auto-set by database on insert, used for ordering |

---

### Database Connection → `backend/database.py`

**What to explain:** "This file sets up the SQLite connection and session factory."

```python
DATABASE_URL = "sqlite:///./tasks.db"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
```

- **`check_same_thread=False`** — Required for SQLite with FastAPI because requests may come from different threads
- **`SessionLocal`** — Creates a new database session for each request (injected via `Depends(get_db)`)
- **`Base`** — All models inherit from this so SQLAlchemy can discover and create their tables

---

### CRUD Operations → `backend/service.py`

**What to explain:** "Each CRUD operation maps directly to a SQL command."

| Operation | Python (service.py) | SQL Equivalent |
|-----------|-------------------|----------------|
| Create | `db.add(task); db.commit()` | `INSERT INTO tasks (title, description) VALUES (...)` |
| Read All | `db.query(Task).all()` | `SELECT * FROM tasks` |
| Read One | `db.query(Task).filter(Task.id == id).first()` | `SELECT * FROM tasks WHERE id = ?` |
| Update | `task.title = "new"; db.commit()` | `UPDATE tasks SET title = "new" WHERE id = ?` |
| Delete | `db.delete(task); db.commit()` | `DELETE FROM tasks WHERE id = ?` |

---

### Data Persistence → `backend/main.py` (lifespan)

**What to explain:** "The database file (`tasks.db`) is created automatically on first startup and persists across restarts."

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    Base.metadata.create_all(bind=engine)  # Creates tables if they don't exist
    yield
```

"When the server starts, `create_all()` checks if the `tasks` table exists. If it doesn't, it creates it based on my model definition. If it already exists, it does nothing. Data is stored in `tasks.db` — a file on disk — so it survives server restarts."

---

## Quick Reference: "Show me where X happens"

| If interviewer asks... | Open this file | Go to this part |
|------------------------|---------------|-----------------|
| "How do you create a task?" | `router.py` → `create_task()` | Lines with `@router.post` |
| "How does validation work?" | `schemas.py` → `TaskCreate` | The `field_validator` decorator |
| "How do search and filter combine?" | `service.py` → `get_all_tasks()` | The chained `.filter()` calls |
| "How does the frontend call the API?" | `api/tasks.ts` | The `fetchTasks`, `createTask` functions |
| "How do you manage state?" | `app/page.tsx` | The `useState` declarations at the top |
| "How does the task list render?" | `TaskList.tsx` → `TaskItem.tsx` | The `.map()` and component props |
| "How do you handle errors?" | `main.py` | The `@app.exception_handler` decorators |
| "What's the database schema?" | `models.py` → `Task` class | The `Column` definitions |
| "How does data persist?" | `database.py` + `main.py` lifespan | SQLite file + `create_all()` |
| "How do components communicate?" | `page.tsx` | Props passed down, callbacks called up |
