"use client";

import { useState, FormEvent } from "react";
import { Task } from "@/types/task";
import ConfirmDialog from "./ConfirmDialog";

interface TaskItemProps {
  task: Task;
  onToggle: (id: number, completed: boolean) => void;
  onEdit: (id: number, title: string, description: string) => void;
  onDelete: (id: number) => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
}

export default function TaskItem({ task, onToggle, onEdit, onDelete }: TaskItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [editTitle, setEditTitle] = useState(task.title);
  const [editDescription, setEditDescription] = useState(task.description);
  const [errors, setErrors] = useState<ValidationErrors>({});

  function validate(): ValidationErrors {
    const newErrors: ValidationErrors = {};
    if (!editTitle.trim()) {
      newErrors.title = "Title is required";
    } else if (editTitle.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }
    if (editDescription.length > 1000) {
      newErrors.description = "Description must be 1000 characters or less";
    }
    return newErrors;
  }

  function handleEditClick() {
    setEditTitle(task.title);
    setEditDescription(task.description);
    setErrors({});
    setIsEditing(true);
  }

  function handleCancelEdit() {
    setIsEditing(false);
    setErrors({});
  }

  function handleSaveEdit(e: FormEvent) {
    e.preventDefault();
    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;
    onEdit(task.id, editTitle.trim(), editDescription.trim());
    setIsEditing(false);
    setErrors({});
  }

  function handleDelete() {
    setShowConfirm(true);
  }

  function confirmDelete() {
    setShowConfirm(false);
    onDelete(task.id);
  }

  function cancelDelete() {
    setShowConfirm(false);
  }

  function handleToggle() {
    onToggle(task.id, !task.completed);
  }

  if (isEditing) {
    return (
      <li className="task-item task-item-editing" data-testid={`task-item-${task.id}`}>
        <form onSubmit={handleSaveEdit} aria-label="Edit task">
          <div className="form-group">
            <label htmlFor={`edit-title-${task.id}`}>Title</label>
            <input
              id={`edit-title-${task.id}`}
              type="text"
              value={editTitle}
              onChange={(e) => {
                setEditTitle(e.target.value);
                if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
              }}
              aria-required="true"
              aria-invalid={!!errors.title}
            />
            {errors.title && (
              <span className="form-error" role="alert">{errors.title}</span>
            )}
          </div>

          <div className="form-group">
            <label htmlFor={`edit-desc-${task.id}`}>Description</label>
            <textarea
              id={`edit-desc-${task.id}`}
              value={editDescription}
              onChange={(e) => {
                setEditDescription(e.target.value);
                if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
              }}
              aria-invalid={!!errors.description}
            />
            {errors.description && (
              <span className="form-error" role="alert">{errors.description}</span>
            )}
          </div>

          <div className="task-item-actions">
            <button type="submit" className="btn btn-sm btn-primary" style={{ width: 'auto' }}>Save</button>
            <button type="button" className="btn btn-ghost" onClick={handleCancelEdit}>Cancel</button>
          </div>
        </form>
      </li>
    );
  }

  return (
    <li className={`task-item ${task.completed ? "task-item-completed" : ""}`} data-testid={`task-item-${task.id}`}>
      <div className="task-item-content">
        <label className="custom-checkbox">
          <input
            type="checkbox"
            checked={task.completed}
            onChange={handleToggle}
            aria-label={`Mark "${task.title}" as ${task.completed ? "incomplete" : "complete"}`}
          />
          <span className="checkmark" />
        </label>
        <div className="task-item-details">
          <span className="task-item-title">{task.title}</span>
          {task.description && (
            <span className="task-item-description">{task.description}</span>
          )}
        </div>
      </div>
      <div className="task-item-actions">
        <button className="btn btn-ghost" onClick={handleEditClick} aria-label={`Edit "${task.title}"`}>
          Edit
        </button>
        <button className="btn btn-ghost-danger" onClick={handleDelete} aria-label={`Delete "${task.title}"`}>
          Delete
        </button>
      </div>

      {showConfirm && (
        <ConfirmDialog
          message={`Delete "${task.title}"? This cannot be undone.`}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />
      )}
    </li>
  );
}
