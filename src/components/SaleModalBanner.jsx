"use client";

import React, { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import "./SaleModalBanner.css";

export default function SaleModalBanner() {
  const [settings, setSettings] = useState(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  useEffect(() => {
    let isMounted = true;
    let timer = null;

    // Check if already dismissed in session before firing network request
    let isDismissed = false;
    try {
      isDismissed = sessionStorage.getItem("bm_sale_modal_dismissed") === "true";
    } catch (e) {
      // sessionStorage may be unavailable
    }
    if (isDismissed) return;

    const fetchSettings = async () => {
      try {
        const res = await fetch("/api/settings");
        if (!isMounted) return;
        if (res.ok) {
          const data = await res.json();
          if (!isMounted) return;
          if (data.settings && data.settings.isSaleActive && data.settings.saleBannerUrl) {
            setSettings(data.settings);
            
            // Delay slightly for smooth display
            timer = setTimeout(() => {
              if (isMounted) setIsOpen(true);
            }, 600);
          }
        }
      } catch (err) {
        if (isMounted) console.error("Failed to load sale modal settings:", err);
      }
    };

    fetchSettings();

    return () => {
      isMounted = false;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    try {
      sessionStorage.setItem("bm_sale_modal_dismissed", "true");
    } catch (e) {
      console.error(e);
    }
  };

  if (!isOpen || !settings?.saleBannerUrl) return null;

  return (
    <div className="sale-modal-overlay" onClick={handleClose}>
      <div 
        className="sale-modal-container" 
        onClick={(e) => e.stopPropagation()}
      >
        <button 
          type="button" 
          className="sale-modal-close-btn" 
          onClick={handleClose}
          aria-label="Close sale banner"
        >
          &times;
        </button>

        <div className="sale-modal-image-wrap">
          <Image 
            src={settings.saleBannerUrl} 
            alt={settings.saleTitle || "Special Sale"} 
            className="sale-modal-img"
            width={800}
            height={800}
            style={{ width: "100%", height: "auto", maxHeight: "70vh", objectFit: "contain" }}
          />
        </div>

        <div className="sale-modal-actions">
          <Link 
            href="/shop" 
            className="sale-modal-shop-btn"
            onClick={handleClose}
          >
            Shop Special Sale Now →
          </Link>
        </div>
      </div>
    </div>
  );
}
