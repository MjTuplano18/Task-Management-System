from fastapi import APIRouter, Depends
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session

from database import SessionLocal
from schemas import TaskCreate, TaskUpdate, TaskResponse
from service import TaskService

router = APIRouter(prefix="/api/tasks")


def get_db():
    """Dependency that provides a database session and ensures it's closed after use."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post("", status_code=201)
def create_task(task_data: TaskCreate, db: Session = Depends(get_db)):
    """Create a new task. Returns 201 with the created task."""
    task = TaskService.create_task(db, title=task_data.title, description=task_data.description)
    task_response = TaskResponse.model_validate(task)
    return {"data": task_response.model_dump(mode="json")}


@router.get("")
def get_tasks(
    search: str | None = None,
    status: str | None = None,
    db: Session = Depends(get_db),
):
    """
    List all tasks with optional search and status filter.
    - search: case-insensitive title substring match
    - status: one of 'all', 'active', 'inactive' (defaults to 'all')
    Returns 400 if status is not a valid value.
    """
    valid_statuses = {"all", "active", "inactive"}
    if status is not None and status not in valid_statuses:
        return JSONResponse(
            status_code=400,
            content={"error": {"message": f"Invalid status filter '{status}'. Must be one of: all, active, inactive"}},
        )

    tasks = TaskService.get_all_tasks(db, search=search, status=status)
    tasks_response = [TaskResponse.model_validate(t).model_dump(mode="json") for t in tasks]
    return {"data": tasks_response}


@router.get("/{task_id}")
def get_task(task_id: int, db: Session = Depends(get_db)):
    """Get a single task by ID. Returns 404 if not found."""
    task = TaskService.get_task(db, task_id)
    if task is None:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Task not found"}},
        )
    task_response = TaskResponse.model_validate(task)
    return {"data": task_response.model_dump(mode="json")}


@router.put("/{task_id}")
def update_task(task_id: int, task_data: TaskUpdate, db: Session = Depends(get_db)):
    """Update a task by ID. Returns 404 if not found, 400 for validation errors."""
    task = TaskService.update_task(
        db,
        task_id=task_id,
        title=task_data.title,
        description=task_data.description,
        completed=task_data.completed,
    )
    if task is None:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Task not found"}},
        )
    task_response = TaskResponse.model_validate(task)
    return {"data": task_response.model_dump(mode="json")}


@router.delete("/{task_id}")
def delete_task(task_id: int, db: Session = Depends(get_db)):
    """Delete a task by ID. Returns 404 if not found."""
    deleted = TaskService.delete_task(db, task_id)
    if not deleted:
        return JSONResponse(
            status_code=404,
            content={"error": {"message": "Task not found"}},
        )
    return {"data": {"message": "Task deleted successfully"}}
