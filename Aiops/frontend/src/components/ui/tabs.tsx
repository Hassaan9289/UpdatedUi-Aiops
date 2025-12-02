'use client';

import { createContext, forwardRef, useCallback, useContext, useEffect, useMemo, useState } from "react";

type TabsContextValue = {
  value: string;
  onValueChange: (value: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export const Tabs = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div"> & { value?: string; defaultValue?: string; onValueChange?: (value: string) => void }>(
  ({ value: controlledValue, defaultValue, onValueChange, children, ...props }, ref) => {
    const [stateValue, setStateValue] = useState(controlledValue ?? defaultValue ?? "");
    useEffect(() => {
      if (controlledValue !== undefined) {
        setStateValue(controlledValue);
      }
    }, [controlledValue]);
    const changeValue = useCallback(
      (next: string) => {
        if (controlledValue === undefined) {
          setStateValue(next);
        }
        onValueChange?.(next);
      },
      [controlledValue, onValueChange],
    );
    const context = useMemo(() => ({ value: controlledValue ?? stateValue, onValueChange: changeValue }), [controlledValue, stateValue, changeValue]);
    return (
      <TabsContext.Provider value={context}>
        <div ref={ref} {...props}>
          {children}
        </div>
      </TabsContext.Provider>
    );
  },
);

export const TabsList = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div">>(({ children, ...props }, ref) => (
  <div ref={ref} role="tablist" {...props}>
    {children}
  </div>
));

export const TabsTrigger = forwardRef<HTMLButtonElement, React.ComponentPropsWithoutRef<"button"> & { value: string }>(({ value, children, ...props }, ref) => {
  const context = useContext(TabsContext);
  if (!context) {
    return <button ref={ref} type="button" {...props}>{children}</button>;
  }
  const isActive = context.value === value;
  return (
    <button
      type="button"
      ref={ref}
      aria-selected={isActive}
      role="tab"
      onClick={() => context.onValueChange(value)}
      {...props}
    >
      {children}
    </button>
  );
});

export const TabsContent = forwardRef<HTMLDivElement, React.ComponentPropsWithoutRef<"div"> & { value: string }>(({ value, children, ...props }, ref) => {
  const context = useContext(TabsContext);
  if (!context || context.value !== value) {
    return null;
  }
  return (
    <div ref={ref} role="tabpanel" {...props}>
      {children}
    </div>
  );
});
