import * as React from "react";
import { cn } from "@/lib/utils";

export type CardProps = React.HTMLAttributes<HTMLDivElement>;

const BaseCard = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn(
      "rounded-none border border-[var(--border)] bg-[var(--card)] p-6 shadow-[0_20px_45px_rgba(3,7,18,0.15)]",
      className,
    )}
    {...props}
  />
));
BaseCard.displayName = "Card";

const Header = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("pb-4 px-2", className)} {...props} />
));
Header.displayName = "CardHeader";

const Title = React.forwardRef<HTMLHeadingElement, React.HTMLAttributes<HTMLHeadingElement>>(
  ({ className, ...props }, ref) => (
    <h3 ref={ref} className={cn("text-lg font-semibold", className)} {...props} />
  ),
);
Title.displayName = "CardTitle";

const Content = React.forwardRef<HTMLDivElement, CardProps>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("space-y-4 px-2", className)} {...props} />
));
Content.displayName = "CardContent";

export const Card = BaseCard;
export const CardHeader = Header;
export const CardTitle = Title;
export const CardContent = Content;
