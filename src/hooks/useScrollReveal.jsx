"use client";

import { useEffect, useRef } from "react";

let sharedObserver = null;
const callbacks = new Map();

function getSharedObserver() {
  if (typeof window === "undefined") return null;
  if (!sharedObserver) {
    sharedObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const cb = callbacks.get(entry.target);
          if (cb) {
            cb();
            callbacks.delete(entry.target);
          } else {
            entry.target.classList.add("visible");
          }
          sharedObserver?.unobserve(entry.target);
        }
      });
    }, { threshold: 0.08 });
  }
  return sharedObserver;
}

/**
 * A highly optimized hook that uses a shared singleton IntersectionObserver
 * to add the ".visible" class to elements as they scroll into view.
 */
export function useScrollReveal(options = null, delayMs = 0) {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const prefersReducedMotion = typeof window !== 'undefined' && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReducedMotion || el.classList.contains("visible")) {
      el.classList.add("visible");
      return;
    }

    const observer = getSharedObserver();
    if (!observer) {
      el.classList.add("visible");
      return;
    }

    callbacks.set(el, () => {
      if (delayMs > 0) {
        setTimeout(() => el.classList.add("visible"), delayMs);
      } else {
        el.classList.add("visible");
      }
    });

    observer.observe(el);

    return () => {
      callbacks.delete(el);
      observer?.unobserve(el);
    };
  }, [delayMs]);

  return ref;
}
