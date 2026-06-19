from sqlalchemy.orm import Session

from models import Task


class TaskService:
    """Service layer for Task CRUD operations."""

    @staticmethod
    def create_task(db: Session, title: str, description: str = "") -> Task:
        """Create a new task with defaults (completed=False, auto-generated created_at)."""
        task = Task(title=title, description=description)
        db.add(task)
        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def get_task(db: Session, task_id: int) -> Task | None:
        """Retrieve a task by ID, or None if not found."""
        return db.query(Task).filter(Task.id == task_id).first()

    @staticmethod
    def get_all_tasks(
        db: Session, search: str | None = None, status: str | None = None
    ) -> list[Task]:
        """
        Retrieve all tasks with optional filtering.

        - search: case-insensitive substring match on title
        - status: 'all' (no filter), 'active' (completed=False), 'inactive' (completed=True)
        - Results ordered by created_at descending (newest first)
        """
        query = db.query(Task)

        if search:
            query = query.filter(Task.title.ilike(f"%{search}%"))

        if status and status != "all":
            if status == "active":
                query = query.filter(Task.completed == False)
            elif status == "inactive":
                query = query.filter(Task.completed == True)

        query = query.order_by(Task.created_at.desc())
        return query.all()

    @staticmethod
    def update_task(
        db: Session,
        task_id: int,
        title: str | None = None,
        description: str | None = None,
        completed: bool | None = None,
    ) -> Task | None:
        """
        Partially update a task. Only fields that are not None are updated.
        Returns the updated task or None if not found.
        """
        task = db.query(Task).filter(Task.id == task_id).first()
        if task is None:
            return None

        if title is not None:
            task.title = title
        if description is not None:
            task.description = description
        if completed is not None:
            task.completed = completed

        db.commit()
        db.refresh(task)
        return task

    @staticmethod
    def delete_task(db: Session, task_id: int) -> bool:
        """Delete a task by ID. Returns True if deleted, False if not found."""
        task = db.query(Task).filter(Task.id == task_id).first()
        if task is None:
            return False

        db.delete(task)
        db.commit()
        return True
