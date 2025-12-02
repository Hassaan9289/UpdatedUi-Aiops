'use client';

import * as React from "react";
import { cn } from "@/lib/utils";

export type SelectProps = React.SelectHTMLAttributes<HTMLSelectElement> & {
  onValueChange?: (value: string) => void;
};

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, onValueChange, ...props }, ref) => {
    const handleChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
      props.onChange?.(event);
      onValueChange?.(event.target.value);
    };
    return (
      <select
        ref={ref}
        className={cn(
          "h-10 rounded-none border border-white/10 bg-[var(--card)] px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
          className,
        )}
        onChange={handleChange}
        {...props}
      />
    );
  },
);
Select.displayName = "Select";

export const SelectTrigger = React.forwardRef<HTMLButtonElement, React.ButtonHTMLAttributes<HTMLButtonElement>>(
  ({ className, ...props }, ref) => (
    <button
      ref={ref}
      type="button"
      className={cn(
        "inline-flex h-10 items-center justify-between rounded-none border border-white/10 bg-[var(--card)] px-4 text-sm text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/60",
        className,
      )}
      {...props}
    />
  ),
);
SelectTrigger.displayName = "SelectTrigger";

export const SelectContent = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn("rounded-md border border-white/10 bg-[var(--card)] p-3 text-sm text-white", className)}
      {...props}
    />
  ),
);
SelectContent.displayName = "SelectContent";

export interface SelectItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value?: string;
}

export const SelectItem = React.forwardRef<HTMLDivElement, SelectItemProps>(({ className, value, ...props }, ref) => (
  <div ref={ref} className={cn("px-2 py-1", className)} data-value={value} {...props} />
));
SelectItem.displayName = "SelectItem";

export interface SelectValueProps extends React.HTMLAttributes<HTMLSpanElement> {
  placeholder?: string;
}

export const SelectValue = React.forwardRef<HTMLSpanElement, SelectValueProps>(({ className, placeholder, children, ...props }, ref) => (
  <span ref={ref} className={cn("text-sm", className)} {...props}>
    {children ?? placeholder}
  </span>
));

SelectValue.displayName = "SelectValue";
