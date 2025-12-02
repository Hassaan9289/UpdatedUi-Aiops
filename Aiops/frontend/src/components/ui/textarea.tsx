'use client';

import { forwardRef } from "react";

export const Textarea = forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<"textarea">>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={className} {...props} />
  ),
);
