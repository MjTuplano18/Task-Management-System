"use client";

import { useState } from "react";

interface SearchBarProps {
  onSearch: (text: string) => void;
}

export default function SearchBar({ onSearch }: SearchBarProps) {
  const [searchText, setSearchText] = useState("");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchText(value);
    onSearch(value);
  };

  return (
    <div className="search-wrapper">
      <span className="search-icon">⌕</span>
      <input
        type="text"
        className="search-input"
        value={searchText}
        onChange={handleChange}
        placeholder="Search tasks..."
        aria-label="Search tasks"
      />
    </div>
  );
}
