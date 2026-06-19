"use client";

import { useState, useEffect, useCallback } from "react";
import { Task } from "../types/task";
import { fetchTasks, updateTask, deleteTask, ApiError } from "../api/tasks";
import TaskForm from "../components/TaskForm";
import SearchBar from "../components/SearchBar";
import FilterControls from "../components/FilterControls";
import TaskList from "../components/TaskList";
import ErrorDisplay from "../components/ErrorDisplay";
import LoadingIndicator from "../components/LoadingIndicator";

const TASKS_PER_PAGE = 5;

export default function TaskPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [searchText, setSearchText] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const loadTasks = useCallback(async (search: string, filter: string) => {
    setLoading(true);
    setError(null);
    setRetryAction(null);

    try {
      const data = await fetchTasks(
        search || undefined,
        filter !== "all" ? filter : undefined
      );
      setTasks(data);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to load tasks";
      setError(message);
      setRetryAction(() => () => loadTasks(search, filter));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTasks(searchText, selectedFilter);
  }, [searchText, selectedFilter, loadTasks]);

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchText, selectedFilter]);

  // Pagination logic
  const totalPages = Math.max(1, Math.ceil(tasks.length / TASKS_PER_PAGE));
  const paginatedTasks = tasks.slice(
    (currentPage - 1) * TASKS_PER_PAGE,
    currentPage * TASKS_PER_PAGE
  );

  function handleTaskCreated(task: Task) {
    setTasks((prev) => [task, ...prev]);
    setCurrentPage(1);
  }

  function handleSearch(text: string) {
    setSearchText(text);
  }

  function handleFilterChange(filter: string) {
    setSelectedFilter(filter);
  }

  function handleMutationError(err: unknown, retryFn: () => void) {
    if (err instanceof ApiError) {
      if (err.status === 400) {
        setError(err.message);
      } else if (err.status === 404) {
        setError("Task not found");
        loadTasks(searchText, selectedFilter);
      } else {
        setError("Something went wrong. Please try again.");
        setRetryAction(() => retryFn);
      }
    } else {
      setError("Something went wrong. Please try again.");
      setRetryAction(() => retryFn);
    }
  }

  async function handleToggle(id: number, completed: boolean) {
    setError(null);
    setRetryAction(null);

    try {
      const updated = await updateTask(id, { completed });
      setTasks((prev) =>
        prev.map((t) => (t.id === id ? { ...t, completed: updated.completed } : t))
      );
    } catch (err: unknown) {
      handleMutationError(err, () => handleToggle(id, completed));
    }
  }

  async function handleEdit(id: number, title: string, description: string) {
    setError(null);
    setRetryAction(null);

    try {
      const updated = await updateTask(id, { title, description });
      setTasks((prev) =>
        prev.map((t) =>
          t.id === id ? { ...t, title: updated.title, description: updated.description } : t
        )
      );
    } catch (err: unknown) {
      handleMutationError(err, () => handleEdit(id, title, description));
    }
  }

  async function handleDelete(id: number) {
    setError(null);
    setRetryAction(null);

    try {
      await deleteTask(id);
      setTasks((prev) => {
        const newTasks = prev.filter((t) => t.id !== id);
        // If current page is now empty, go back one page
        const newTotalPages = Math.max(1, Math.ceil(newTasks.length / TASKS_PER_PAGE));
        if (currentPage > newTotalPages) {
          setCurrentPage(newTotalPages);
        }
        return newTasks;
      });
    } catch (err: unknown) {
      handleMutationError(err, () => handleDelete(id));
    }
  }

  function handleDismissError() {
    setError(null);
    setRetryAction(null);
  }

  function handleRetry() {
    if (retryAction) {
      retryAction();
    }
  }

  return (
    <main className="app-container">
      <header className="app-header">
        <h1>Task Management</h1>
      </header>

      <div className="app-layout">
        {/* Left Panel - Add Task Form */}
        <aside className="panel-left">
          <div className="card">
            <h2 className="panel-title">Add New Task</h2>
            <TaskForm onTaskCreated={handleTaskCreated} />
          </div>
        </aside>

        {/* Right Panel - Search, Filters, Task List */}
        <section className="panel-right">
          <div className="toolbar">
            <SearchBar onSearch={handleSearch} />
            <FilterControls
              selectedFilter={selectedFilter}
              onFilterChange={handleFilterChange}
            />
          </div>

          {error && (
            <ErrorDisplay
              message={error}
              onDismiss={handleDismissError}
              onRetry={retryAction ? handleRetry : undefined}
            />
          )}

          {loading ? (
            <LoadingIndicator />
          ) : (
            <>
              <TaskList
                tasks={paginatedTasks}
                onToggle={handleToggle}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />

              {tasks.length > TASKS_PER_PAGE && (
                <div className="pagination">
                  <button
                    className="btn btn-ghost pagination-arrow"
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    aria-label="Previous page"
                  >
                    ←
                  </button>
                  <div className="pagination-numbers">
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <button
                        key={page}
                        className={`pagination-btn ${currentPage === page ? "pagination-btn-active" : ""}`}
                        onClick={() => setCurrentPage(page)}
                        aria-label={`Page ${page}`}
                        aria-current={currentPage === page ? "page" : undefined}
                      >
                        {page}
                      </button>
                    ))}
                  </div>
                  <button
                    className="btn btn-ghost pagination-arrow"
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    aria-label="Next page"
                  >
                    →
                  </button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </main>
  );
}
