"use client";

import { useState, FormEvent } from "react";
import { Task } from "../types/task";
import { createTask } from "../api/tasks";

interface TaskFormProps {
  onTaskCreated: (task: Task) => void;
}

interface ValidationErrors {
  title?: string;
  description?: string;
}

export default function TaskForm({ onTaskCreated }: TaskFormProps) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [errors, setErrors] = useState<ValidationErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  function validate(): ValidationErrors {
    const newErrors: ValidationErrors = {};
    if (!title.trim()) {
      newErrors.title = "Title is required";
    } else if (title.length > 200) {
      newErrors.title = "Title must be 200 characters or less";
    }
    if (description.length > 1000) {
      newErrors.description = "Description must be 1000 characters or less";
    }
    return newErrors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setApiError(null);

    const validationErrors = validate();
    setErrors(validationErrors);
    if (Object.keys(validationErrors).length > 0) return;

    setSubmitting(true);
    try {
      const newTask = await createTask(title.trim(), description.trim());
      onTaskCreated(newTask);
      setTitle("");
      setDescription("");
      setErrors({});
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Failed to create task";
      setApiError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="task-form" aria-label="Create task">
      <div className="form-group">
        <label htmlFor="task-title">Title</label>
        <input
          id="task-title"
          type="text"
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (errors.title) setErrors((prev) => ({ ...prev, title: undefined }));
          }}
          placeholder="What needs to be done?"
          aria-required="true"
          aria-invalid={!!errors.title}
          disabled={submitting}
        />
        {errors.title && (
          <span className="form-error" role="alert">{errors.title}</span>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="task-description">Description</label>
        <textarea
          id="task-description"
          value={description}
          onChange={(e) => {
            setDescription(e.target.value);
            if (errors.description) setErrors((prev) => ({ ...prev, description: undefined }));
          }}
          placeholder="Add details (optional)"
          aria-invalid={!!errors.description}
          disabled={submitting}
        />
        {errors.description && (
          <span className="form-error" role="alert">{errors.description}</span>
        )}
      </div>

      {apiError && (
        <div className="form-api-error" role="alert">{apiError}</div>
      )}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Adding..." : "Add Task"}
      </button>
    </form>
  );
}
