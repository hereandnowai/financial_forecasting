import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

const Input: React.FC<InputProps> = ({ label, id, error, className = '', ...props }) => {
  return (
    <div className="w-full">
      {label && <label htmlFor={id} className="block text-sm font-medium text-[var(--color-text-secondary)] mb-1">{label}</label>}
      <input
        id={id}
        className={`w-full px-4 py-2.5 bg-[var(--color-background-input)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-border-focus)] focus:border-[var(--color-border-focus)] outline-none transition-colors duration-150 shadow-sm ${error ? 'border-red-500 focus:ring-red-500' : ''} ${className}`}
        {...props}
      />
      {error && <p className="mt-1 text-xs text-red-500">{error}</p>}
    </div>
  );
};

export default Input;