import React from 'react';
import { clsx } from 'clsx';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  title?: string;
  subtitle?: string;
  headerAction?: React.ReactNode;
  padding?: boolean;
}

const Card: React.FC<CardProps> = ({
  children,
  className,
  title,
  subtitle,
  headerAction,
  padding = true,
}) => {
  return (
    <div className={clsx('bg-white rounded-lg shadow-md overflow-hidden', className)}>
      {(title || subtitle || headerAction) && (
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && <p className="text-sm text-gray-600 mt-1">{subtitle}</p>}
          </div>
          {headerAction && <div>{headerAction}</div>}
        </div>
      )}
      <div className={clsx(padding && 'p-6')}>{children}</div>
    </div>
  );
};

export default Card;
