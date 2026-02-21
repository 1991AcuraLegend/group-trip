import { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  onClick?: () => void;
};

export function Card({ children, className = '', onClick, ...props }: Props) {
  return (
    <div
      onClick={onClick}
      className={[
        'glass border border-sand-200 rounded-xl shadow-sm bg-white overflow-hidden transition-all duration-200',
        onClick ? 'cursor-pointer hover:shadow-md' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </div>
  );
}
