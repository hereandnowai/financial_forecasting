import React from 'react';

// Define own props, specific to this Button component
type ButtonOwnProps<E extends React.ElementType> = {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  disabled?: boolean;
  as?: E;
};

type ButtonProps<E extends React.ElementType> = ButtonOwnProps<E> &
  Omit<React.ComponentPropsWithoutRef<E>, keyof ButtonOwnProps<E>>;

const Button = <E extends React.ElementType = 'button',>(
  props: ButtonProps<E>
) => {
  const {
    children,
    variant = 'primary',
    size = 'md',
    isLoading = false,
    leftIcon,
    rightIcon,
    className = '',
    as,
    disabled,
    ...rest
  } = props;

  const Component = as || 'button';

  const baseStyle = "font-semibold rounded-lg focus:outline-none focus:ring-2 focus:ring-offset-2 transition-all duration-150 ease-in-out inline-flex items-center justify-center";
  
  // Updated to use CSS variables
  const variantStyles = {
    primary: 'bg-[var(--color-button-primary-bg)] hover:bg-[var(--color-button-primary-hover-bg)] text-[var(--color-button-primary-text)] focus:ring-[var(--color-text-accent)] shadow-sm hover:shadow-md',
    secondary: 'bg-[var(--color-button-secondary-bg)] hover:bg-[var(--color-button-secondary-hover-bg)] text-[var(--color-button-secondary-text)] focus:ring-[var(--color-text-secondary)]',
    danger: 'bg-red-500 hover:bg-red-600 text-white focus:ring-red-400', // Danger style kept for now, can be themed later
    outline: 'bg-transparent hover:bg-[var(--color-button-outline-hover-bg)] border border-[var(--color-button-outline-border)] text-[var(--color-button-outline-text)] focus:ring-[var(--color-text-accent)]',
  };

  const sizeStyles = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-5 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const effectiveDisabled = isLoading || disabled;
  const disabledStyle = effectiveDisabled ? 'opacity-60 cursor-not-allowed' : '';

  const componentSpecificProps: Record<string, any> = {};

  if (Component === 'button') {
    componentSpecificProps.disabled = effectiveDisabled;
  }
  
  if (effectiveDisabled && Component !== 'button') {
    componentSpecificProps['aria-disabled'] = true;
    componentSpecificProps.tabIndex = -1;
    componentSpecificProps.onClick = (e: React.MouseEvent<HTMLElement>) => {
      e.preventDefault();
    };
  }

  return (
    <Component
      className={`${baseStyle} ${variantStyles[variant]} ${sizeStyles[size]} ${disabledStyle} ${className}`}
      {...rest}
      {...componentSpecificProps}
    >
      {isLoading && (
        <svg className="animate-spin -ml-1 mr-3 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {leftIcon && !isLoading && <span className="mr-2">{leftIcon}</span>}
      {children}
      {rightIcon && !isLoading && <span className="ml-2">{rightIcon}</span>}
    </Component>
  );
};

export default Button;