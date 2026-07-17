import React from "react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer style={{ 
      padding: '2.5rem', 
      textAlign: 'center', 
      background: 'var(--cream)', 
      borderTop: '1px solid rgba(201, 151, 42, 0.15)',
      marginTop: 'auto'
    }}>
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
        <a href="/return-and-refund-policy" style={{ color: 'var(--maroon)', textDecoration: 'none', fontWeight: '500', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Return & Refund Policy</a>
        <a href="/shipping-policy" style={{ color: 'var(--maroon)', textDecoration: 'none', fontWeight: '500', fontFamily: 'Inter, sans-serif', fontSize: '14px' }}>Shipping Policy</a>
      </div>
      <p style={{ 
        margin: 0, 
        fontSize: '0.95rem', 
        color: 'var(--text-muted)',
        letterSpacing: '0.5px',
        fontWeight: '500'
      }}>
        &copy; {currentYear} The Braj Madhuri. All rights reserved.
      </p>
    </footer>
  );
};

export default Footer;
