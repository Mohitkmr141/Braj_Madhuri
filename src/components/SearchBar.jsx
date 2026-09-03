"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import "./SearchBar.css";
import { useProducts } from "../context/ProductsContext.jsx";
import { getEffectivePrice, isProductOutOfStock, formatCurrency } from "../utils/productHelpers.js";

// Build a rich searchable list from the DB products
function buildSearchIndex(dbProducts) {
  return dbProducts.map(product => {
    const title = product.title || product.folderName || "";
    const subheading = product.subheading || "";
    const description = product.description || "";
    const categoryTitle = product.categoryTitle || "";
    const subcategoryTitle = product.subcategory?.title || "";
    const colors = Array.isArray(product.colors) ? product.colors.join(" ") : "";
    const size = product.size || "";
    const outOfStock = isProductOutOfStock(product);

    const searchTarget = [
      title,
      subheading,
      description,
      categoryTitle,
      subcategoryTitle,
      colors,
      size,
    ].join(" ").toLowerCase();

    return {
      id: product.id,
      folder: product.folderName,
      title,
      subheading,
      description,
      categoryTitle,
      subcategoryTitle,
      price: getEffectivePrice(product),
      imageUrl: product.imageUrl || (Array.isArray(product.images) && product.images[0]) || "",
      isBestseller: Boolean(product.isBestseller),
      isOutOfStock: outOfStock,
      searchTarget,
    };
  });
}

function highlight(text, query) {
  if (!query || !text) return text;
  const tokens = query.trim().split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return text;

  const escapedTokens = tokens.map(t => t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"));
  const regex = new RegExp(`(${escapedTokens.join("|")})`, "gi");
  const parts = String(text).split(regex);

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

  const { categories } = useProducts();

  // Build search index when categories are available
  useEffect(() => {
    if (categories && categories.length > 0) {
      const flatProducts = categories.flatMap(c => 
        (c.products || []).map(p => ({
          ...p,
          categoryTitle: c.title,
          categoryDesc: c.description,
          sizes: c.sizes && c.sizes.length > 0 ? c.sizes : null
        }))
      );
      setSearchIndex(buildSearchIndex(flatProducts));
    }
  }, [categories]);

  const search = useCallback((q) => {
    const trimmed = q.trim().toLowerCase();
    if (!trimmed || trimmed.length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const tokens = trimmed.split(/\s+/).filter(Boolean);

    const scoredMatches = searchIndex
      .map(item => {
        let score = 0;
        const titleLower = item.title.toLowerCase();
        const catLower = item.categoryTitle.toLowerCase();
        const subcatLower = item.subcategoryTitle.toLowerCase();
        const descLower = item.description.toLowerCase();
        const subheadLower = item.subheading.toLowerCase();

        // Exact full phrase matches
        if (titleLower.includes(trimmed)) score += 100;
        if (catLower.includes(trimmed) || subcatLower.includes(trimmed)) score += 60;
        if (subheadLower.includes(trimmed)) score += 40;
        if (descLower.includes(trimmed)) score += 20;

        // Token matches
        const allTokensMatch = tokens.every(t => item.searchTarget.includes(t));
        if (!allTokensMatch && score === 0) return null;

        tokens.forEach(t => {
          if (titleLower.includes(t)) score += 25;
          if (catLower.includes(t) || subcatLower.includes(t)) score += 15;
          if (subheadLower.includes(t)) score += 10;
          if (descLower.includes(t)) score += 5;
        });

        // Boost in-stock and bestsellers slightly
        if (!item.isOutOfStock) score += 10;
        if (item.isBestseller) score += 5;

        return { item, score };
      })
      .filter(Boolean)
      .sort((a, b) => b.score - a.score)
      .map(entry => entry.item)
      .slice(0, 8);

    setResults(scoredMatches);
    setIsOpen(scoredMatches.length > 0);
    setActiveIndex(-1);
  }, [searchIndex]);

  // When a suggestion chip is clicked from the parent, update query + trigger search
  useEffect(() => {
    if (initialQuery) {
      setQuery(initialQuery);
      if (searchIndex.length > 0) {
        search(initialQuery);
      }
      inputRef.current?.focus();
    }
  }, [initialQuery, searchIndex, search]);

  const handleChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    search(val);
  };

  const goToResult = (result) => {
    if (!result) return;
    router.push(`/shop?search=${encodeURIComponent(result.title)}&product=${encodeURIComponent(result.id)}`);
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
    document.addEventListener("touchstart", handleClickOutside, { passive: true });
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
    };
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
          placeholder="Search agarbatti, mala, poshak, chandan…"
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
              onClick={() => goToResult(result)}
              onMouseEnter={() => setActiveIndex(i)}
            >
              <div className="search-result-thumb">
                {result.imageUrl ? (
                  <Image
                    src={result.imageUrl}
                    alt={result.title}
                    width={48}
                    height={48}
                    className="search-result-img"
                    style={{ objectFit: "cover" }}
                  />
                ) : (
                  <span className="search-result-icon" aria-hidden="true">🪷</span>
                )}
              </div>

              <div className="search-result-text">
                <div className="search-result-header">
                  <span className="search-result-title">
                    {highlight(result.title, query)}
                  </span>
                  {result.isBestseller && (
                    <span className="search-result-bestseller-tag">
                      🔥 Bestseller
                    </span>
                  )}
                </div>

                <div className="search-result-meta">
                  {result.categoryTitle && (
                    <span className="search-result-cat">
                      {result.categoryTitle}
                      {result.subcategoryTitle ? ` › ${result.subcategoryTitle}` : ""}
                    </span>
                  )}
                  {result.subheading && (
                    <span className="search-result-desc">
                      {highlight(result.subheading.slice(0, 55), query)}
                    </span>
                  )}
                </div>
              </div>

              <div className="search-result-pricing">
                {result.isOutOfStock ? (
                  <span className="search-result-soldout">Sold Out</span>
                ) : result.price ? (
                  <span className="search-result-price">
                    {formatCurrency(result.price)}
                  </span>
                ) : null}
              </div>
            </li>
          ))}
          <li className="search-result-footer">
            <button
              type="button"
              className="search-view-all"
              onClick={() => {
                if (query.trim()) {
                  router.push(`/shop?search=${encodeURIComponent(query.trim())}`);
                } else {
                  router.push("/shop");
                }
                setQuery("");
                setIsOpen(false);
                onClose?.();
              }}
            >
              View all results for &ldquo;<strong>{query.trim()}</strong>&rdquo; →
            </button>
          </li>
        </ul>
      )}

      {query.trim().length >= 2 && results.length === 0 && (
        <div className="search-no-results" role="status">
          <p className="search-no-results__title">No products found for &ldquo;<strong>{query}</strong>&rdquo;</p>
          <p className="search-no-results__hint">Try checking for spelling errors, using simpler keywords, or browse all devotional collections.</p>
          <button
            type="button"
            className="search-no-results__btn"
            onClick={() => {
              router.push("/shop");
              setQuery("");
              setIsOpen(false);
              onClose?.();
            }}
          >
            Explore All Collections →
          </button>
        </div>
      )}
    </div>
  );
}
