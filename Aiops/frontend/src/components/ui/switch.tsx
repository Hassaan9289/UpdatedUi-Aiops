'use client';

import { forwardRef } from "react";

export interface SwitchProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onCheckedChange?: (checked: boolean) => void;
}

export const Switch = forwardRef<HTMLInputElement, SwitchProps>(({ className, onCheckedChange, ...props }, ref) => {
  const handleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    props.onChange?.(event);
    onCheckedChange?.(event.target.checked);
  };
  return (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className={className}
      onChange={handleChange}
      {...props}
    />
  );
});
