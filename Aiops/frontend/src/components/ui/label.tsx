'use client';

import { forwardRef } from "react";

export const Label = forwardRef<HTMLLabelElement, React.ComponentPropsWithoutRef<"label">>(
  ({ className, ...props }, ref) => (
    <label ref={ref} className={className} {...props} />
  ),
);
