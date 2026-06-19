"use client";

interface ErrorDisplayProps {
  message: string;
  onDismiss: () => void;
  onRetry?: () => void;
}

export default function ErrorDisplay({ message, onDismiss, onRetry }: ErrorDisplayProps) {
  return (
    <div className="error-display" role="alert">
      <p className="error-message">{message}</p>
      <div className="error-actions">
        <button onClick={onDismiss} className="btn btn-sm btn-ghost">
          Dismiss
        </button>
        {onRetry && (
          <button onClick={onRetry} className="btn btn-sm btn-primary" style={{ width: 'auto' }}>
            Retry
          </button>
        )}
      </div>
    </div>
  );
}
