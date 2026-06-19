"use client";

interface FilterControlsProps {
  selectedFilter: string;
  onFilterChange: (filter: string) => void;
}

const filters = [
  { value: "all", label: "All" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
] as const;

export default function FilterControls({
  selectedFilter,
  onFilterChange,
}: FilterControlsProps) {
  return (
    <div className="filter-group" role="group" aria-label="Filter tasks by status">
      {filters.map((filter) => (
        <button
          key={filter.value}
          type="button"
          className={`filter-btn ${selectedFilter === filter.value ? "filter-btn-active" : ""}`}
          onClick={() => onFilterChange(filter.value)}
          aria-pressed={selectedFilter === filter.value}
        >
          {filter.label}
        </button>
      ))}
    </div>
  );
}
