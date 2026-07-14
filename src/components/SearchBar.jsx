"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import "./SearchBar.css";

// Build a flat searchable list from the DB products
function buildSearchIndex(dbProducts) {
  return dbProducts.map(product => ({
    id: product.id,
    folder: product.folderName,
    title: product.title || product.folderName,
    description: product.description || product.categoryDesc || "",
    price: product.price,
  }));
}

function highlight(text, query) {
  if (!query) return text;
  const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")})`, "gi");
  const parts = text.split(regex);
  return parts.map((part, i) =>
    regex.test(part) ? <mark key={i}>{part}</mark> : part
  );
}

export default function SearchBar({ onClose, initialQuery = "" }) {
  const router = useRouter();
  const [searchIndex, setSearchIndex] = useState([]);
  const [query, setQuery] = useState(initialQuery);
  const [results, setResults] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Fetch search index data on mount
  useEffect(() => {
    fetch('/api/products')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.categories) {
          const flatProducts = data.categories.flatMap(c => 
            c.products.map(p => ({
              ...p,
              categoryTitle: c.title,
              categoryDesc: c.description,
              sizes: c.sizes && c.sizes.length > 0 ? c.sizes : null
            }))
          );
          setSearchIndex(buildSearchIndex(flatProducts));
        }
      })
      .catch(console.error);
  }, []);

  // When a suggestion chip is clicked from the parent, update query + trigger search
  useEffect(() => {
    if (initialQuery && searchIndex.length > 0) {
      // Use a tiny delay so the search function has been defined
      const t = setTimeout(() => {
        setQuery(initialQuery);
        const trimmed = initialQuery.trim().toLowerCase();
        if (trimmed.length >= 2) {
          const matched = searchIndex.filter(
            (item) =>
              item.title.toLowerCase().includes(trimmed) ||
              item.description.toLowerCase().includes(trimmed)
          ).slice(0, 8);
          setResults(matched);
          setIsOpen(matched.length > 0);
          setActiveIndex(-1);
        }
        inputRef.current?.focus();
      }, 0);
      return () => clearTimeout(t);
    }
  }, [initialQuery, searchIndex]);

  const search = useCallback((q) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const matched = searchIndex.filter(
      (item) =>
        item.title.toLowerCase().includes(trimmed) ||
        item.description.toLowerCase().includes(trimmed)
    ).slice(0, 8); // max 8 results

    setResults(matched);
    setIsOpen(matched.length > 0);
    setActiveIndex(-1);
  }, [searchIndex]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const goToResult = (result) => {
    router.push(`/shop?search=${encodeURIComponent(result.title)}`);
    setQuery("");
    setResults([]);
    setIsOpen(false);
    onClose?.();
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (activeIndex >= 0 && results[activeIndex]) {
      goToResult(results[activeIndex]);
    } else if (query.trim()) {
      router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
      setQuery("");
      setResults([]);
      setIsOpen(false);
      onClose?.();
    }
  };

  const handleKeyDown = (e) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Escape") {
      setIsOpen(false);
      setQuery("");
      onClose?.();
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Auto-focus on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="search-bar-wrapper" ref={containerRef} role="search">
      <form className="search-form" onSubmit={handleSubmit} autoComplete="off">
        <span className="search-icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
        <input
          ref={inputRef}
          id="search-input"
          type="search"
          role="combobox"
          className="search-input"
          placeholder="Search agarbatti, mala, poshak…"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          aria-label="Search products"
          aria-autocomplete="list"
          aria-controls="search-results"
          aria-expanded={isOpen}
          spellCheck={false}
        />
        {query && (
          <button
            type="button"
            className="search-clear"
            aria-label="Clear search"
            onClick={() => {
              setQuery("");
              setResults([]);
              setIsOpen(false);
              inputRef.current?.focus();
            }}
          >
            ×
          </button>
        )}
        <button type="submit" className="search-submit-btn" aria-label="Search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <span>Search</span>
        </button>
      </form>

      {isOpen && results.length > 0 && (
        <ul
          id="search-results"
          className="search-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {results.map((result, i) => (
            <li
              key={result.id}
              role="option"
              aria-selected={i === activeIndex}
              className={`search-result-item${i === activeIndex ? " search-result-item--active" : ""}`}
              onMouseDown={() => goToResult(result)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <span className="search-result-icon" aria-hidden="true">🪷</span>
              <span className="search-result-text">
                <span className="search-result-title">
                  {highlight(result.title, query.trim())}
                </span>
                {result.description && (
                  <span className="search-result-desc">
                    {highlight(result.description.slice(0, 60), query.trim())}
                    {result.description.length > 60 ? "…" : ""}
                  </span>
                )}
              </span>
              {result.price && (
                <span className="search-result-price">
                  ₹{result.price}
                </span>
              )}
            </li>
          ))}
          <li className="search-result-footer">
            <button
              type="button"
              className="search-view-all"
              onMouseDown={() => {
                router.push("/shop");
                setQuery("");
                setIsOpen(false);
                onClose?.();
              }}
            >
              View all products →
            </button>
          </li>
        </ul>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <div className="search-no-results" role="status">
          No products found for &ldquo;<strong>{query}</strong>&rdquo;
        </div>
      )}
    </div>
  );
}
