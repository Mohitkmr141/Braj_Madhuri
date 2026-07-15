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
