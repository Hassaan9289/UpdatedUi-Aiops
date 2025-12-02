import { format, formatDistanceToNow } from "date-fns";

export const formatDate = (value: string, pattern = "MMM d, HH:mm") =>
  format(new Date(value), pattern);

export const fromNow = (value: string) =>
  formatDistanceToNow(new Date(value), { addSuffix: true });

export const formatPercent = (value: number, digits = 0) =>
  `${(value * 100).toFixed(digits)}%`;

export const trendColor = (delta: number) =>
  delta > 0 ? "text-emerald-400" : "text-rose-400";
