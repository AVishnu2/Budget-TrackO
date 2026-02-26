import React from 'react';
import { cn } from '../../utils/helper';

export const Progress = ({ value, variant = "default", className }) => {
  return (
    <div className="relative w-full h-2 bg-gray-100 rounded-full overflow-hidden">
      <div
        className={cn(
          "h-full transition-all duration-300 ease-in-out rounded-full",
          variant === "danger" ? "bg-red-500" : "bg-primary",
          className
        )}
        style={{ width: `${Math.min(value, 100)}%` }}
      />
    </div>
  );
};