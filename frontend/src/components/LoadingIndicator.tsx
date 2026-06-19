"use client";

export default function LoadingIndicator() {
  return (
    <div className="loading-indicator" role="status" aria-live="polite">
      <div className="loading-spinner" />
    </div>
  );
}
