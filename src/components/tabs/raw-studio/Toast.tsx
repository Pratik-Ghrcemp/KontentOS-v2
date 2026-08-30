import React from 'react';

interface ToastProps {
  message: string | null;
}

export function Toast({ message }: ToastProps) {
  if (!message) return null;

  return (
    <div 
      className="animate-fade-in" 
      style={{ 
        position: 'absolute', 
        top: '20px', 
        left: '50%', 
        transform: 'translateX(-50%)', 
        background: 'var(--accent-primary)', 
        color: 'white', 
        padding: '10px 20px', 
        borderRadius: '30px', 
        zIndex: 100, 
        boxShadow: '0 4px 12px rgba(0,0,0,0.3)', 
        fontWeight: 500, 
        fontSize: '0.9rem' 
      }}
    >
      {message}
    </div>
  );
}
