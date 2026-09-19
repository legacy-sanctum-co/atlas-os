import { type InputHTMLAttributes, type ReactNode, useId } from "react";

import { cn } from "../cn";

interface FieldProps {
  label: string;
  hint?: string | undefined;
  error?: string | undefined;
  children: (props: { id: string; describedBy: string | undefined; invalid: boolean }) => ReactNode;
}

/** Label + control + hint/error with correct ARIA wiring. */
export function Field({ label, hint, error, children }: FieldProps) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;
  const describedBy = [errorId, hintId].filter(Boolean).join(" ") || undefined;

  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-label">
        {label}
      </label>
      {children({ id, describedBy, invalid: Boolean(error) })}
      {error ? (
        <p id={errorId} role="alert" className="text-xs text-signal-critical">
          {error}
        </p>
      ) : hint ? (
        <p id={hintId} className="text-xs text-ink-3">
          {hint}
        </p>
      ) : null}
    </div>
  );
}

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export function Input({ className, invalid, ...rest }: InputProps) {
  return (
    <input
      aria-invalid={invalid || undefined}
      className={cn(
        "h-11 w-full rounded-md border bg-obsidian-1 px-3 text-base text-ink-1 placeholder:text-ink-4",
        "border-line-2 transition-[border-color,box-shadow] duration-fast ease-precise",
        "hover:border-line-3 focus-visible:border-gold-2 focus-visible:shadow-focus",
        invalid && "border-signal-critical/60",
        className,
      )}
      {...rest}
    />
  );
}
