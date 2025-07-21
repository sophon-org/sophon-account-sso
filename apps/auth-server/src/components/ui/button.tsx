import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary';
  children: ReactNode;
}

export const Button = ({
  variant = 'primary',
  children,
  className = '',
  ...props
}: ButtonProps) => {
  const gradientStyle = {
    background:
      'var(--Gradients-Aurora, linear-gradient(72deg, var(--Colour-Sophon-Blue-100, #EBF4FF) 12%, var(--Colour-Sophon-Blue-200, #CCE4FF) 72.12%))',
  };

  const baseButtonClasses = `
    w-full py-[10px] h-13 text-lg font-medium cursor-pointer
    text-[#122B5C] rounded-[144px] disabled:opacity-50 disabled:cursor-not-allowed
    ${className}
  `.trim();

  if (variant === 'secondary') {
    return (
      <div
        className="rounded-[144px] p-[2px] flex items-center justify-center"
        style={gradientStyle}
      >
        <button {...props} className={`${baseButtonClasses} bg-white`}>
          {children}
        </button>
      </div>
    );
  }

  return (
    <button {...props} className={baseButtonClasses} style={gradientStyle}>
      {children}
    </button>
  );
};
