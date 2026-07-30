"use client";

import { useEffect, useRef } from "react";

/**
 * A hook that uses IntersectionObserver to add the ".visible" class
 * to an element when it scrolls into view, providing a smooth reveal animation.
 * 
 * @param {Object} options - IntersectionObserver options
 * @param {number} delayMs - Delay before adding the class (in milliseconds)
 * @returns {React.RefObject} - Ref to attach to the target element
 */
export function useScrollReveal(options = { threshold: 0.12 }, delayMs = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Check if user prefers reduced motion to skip animation
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion) {
      el.classList.add("visible");
      return;
    }

    // If the element already has the visible class, no need to observe
    if (el.classList.contains("visible")) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        if (delayMs > 0) {
          setTimeout(() => {
            el.classList.add("visible");
          }, delayMs);
        } else {
          el.classList.add("visible");
        }
        observer.unobserve(el);
      }
    }, options);

    observer.observe(el);

    return () => {
      observer.disconnect();
    };
  }, [options.threshold, options.root, options.rootMargin, delayMs]);

  return ref;
}
