"use client";

import * as React from "react";
import { AlertCircle, ExternalLink, Trash2, Upload, type LucideIcon } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";

/*
 * Form building blocks (NSC Design System): labels above fields, red asterisk
 * for required, error under the field, computed values read-only with a dashed
 * border, and a sticky Annuler / Enregistrer footer.
 */

interface FormSectionProps {
  title: React.ReactNode;
  description?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}

// One titled block of fields; the title column sits on the left from xl up, above the fields below that.
function FormSection({ title, description, children, className }: FormSectionProps) {
  return (
    <section
      className={cn(
        "grid gap-5 border-b border-border px-6 py-6 last-of-type:border-b-0 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10",
        className
      )}
    >
      <div className="space-y-1">
        <h2 className="text-[15px] font-semibold text-foreground">{title}</h2>
        {description && <p className="text-[13px] leading-[19px] text-muted-foreground">{description}</p>}
      </div>
      <div className="grid content-start gap-5 sm:grid-cols-2">{children}</div>
    </section>
  );
}

function FieldError({ children }: { children: React.ReactNode }) {
  return (
    <p role="alert" className="flex items-center gap-1.5 text-xs text-destructive-text">
      <AlertCircle aria-hidden className="h-3.5 w-3.5 shrink-0" />
      {children}
    </p>
  );
}

interface FieldProps {
  label: React.ReactNode;
  htmlFor?: string;
  required?: boolean;
  hint?: React.ReactNode;
  error?: React.ReactNode;
  /** Span both columns of the section grid. */
  full?: boolean;
  className?: string;
  children: React.ReactNode;
}

function Field({ label, htmlFor, required, hint, error, full, className, children }: FieldProps) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-2", full && "sm:col-span-2", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {required && (
          <span aria-hidden className="ml-0.5 text-destructive">
            *
          </span>
        )}
      </Label>
      {children}
      {error ? <FieldError>{error}</FieldError> : hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

interface InputAdornmentProps {
  icon: LucideIcon;
  children: React.ReactNode;
}

// Leading icon for an input; give the input `pl-9`.
function InputWithIcon({ icon: Icon, children }: InputAdornmentProps) {
  return (
    <div className="relative">
      <Icon aria-hidden className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-600" />
      {children}
    </div>
  );
}

interface UnitInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  unit: string;
  invalid?: boolean;
}

// Number + unit ("jours", "heures") in one control.
const UnitInput = React.forwardRef<HTMLInputElement, UnitInputProps>(({ unit, invalid, className, disabled, ...props }, ref) => (
  <div
    className={cn(
      "flex h-9 items-center overflow-hidden rounded-md border bg-card transition-colors focus-within:border-foreground focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
      invalid ? "border-destructive" : "border-input hover:border-ink-400",
      disabled && "cursor-not-allowed bg-background",
      className
    )}
  >
    <input
      ref={ref}
      disabled={disabled}
      aria-invalid={invalid || undefined}
      className="h-full min-w-0 flex-1 bg-transparent px-3 text-sm tabular-nums text-foreground outline-none placeholder:text-ink-600 disabled:cursor-not-allowed disabled:text-ink-500"
      {...props}
    />
    <span className="flex h-full items-center border-l border-border bg-muted px-3 text-[13px] text-muted-foreground">{unit}</span>
  </div>
));
UnitInput.displayName = "UnitInput";

// "2026-09-17" (or any date string) → "17/09/2026".
function formatDateFr(value?: string | Date | null) {
  if (!value) return "";
  if (typeof value === "string") {
    const match = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[3]}/${match[2]}/${match[1]}`;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? ""
    : date.toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

interface ComputedValueProps {
  icon?: LucideIcon;
  tag?: string;
  placeholder?: string;
  children?: React.ReactNode;
  className?: string;
}

// Read-only value filled in by the app (computed date, auto-selected station…).
function ComputedValue({ icon: Icon, tag = "Calculé", placeholder = "—", children, className }: ComputedValueProps) {
  const empty = children === undefined || children === null || children === "" || children === false;
  return (
    <div
      className={cn(
        "flex h-9 items-center gap-2 rounded-md border border-dashed border-input bg-background px-3 text-sm tabular-nums",
        className
      )}
    >
      {Icon && <Icon aria-hidden className="h-4 w-4 shrink-0 text-ink-600" />}
      <span className={cn("min-w-0 flex-1 truncate", empty ? "text-ink-500" : "text-ink-800")}>
        {empty ? placeholder : children}
      </span>
      {tag && <span className="hidden shrink-0 text-[11px] font-semibold uppercase tracking-[0.04em] text-ink-600 xl:inline">{tag}</span>}
    </div>
  );
}

function formatFileSize(bytes?: number) {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} Ko`;
  return `${(bytes / (1024 * 1024)).toFixed(1).replace(".", ",")} Mo`;
}

interface FileDropzoneProps {
  id: string;
  file?: File | null;
  accept?: string;
  disabled?: boolean;
  invalid?: boolean;
  hint?: string;
  /** Receives the input change event, or `{ target: { files } }` on drop. */
  onFileChange: (event: { target: { files: FileList | null } }) => void;
  onRemove?: () => void;
  /** Link to the document already stored, shown on edit pages until a new file is picked. */
  currentFileHref?: string;
  /** Lets the user drop the stored document without replacing it. */
  onRemoveCurrent?: () => void;
}

function FileDropzone({
  id,
  file,
  accept = "application/pdf",
  disabled,
  invalid,
  hint = "PDF uniquement",
  onFileChange,
  onRemove,
  currentFileHref,
  onRemoveCurrent,
}: FileDropzoneProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [dragging, setDragging] = React.useState(false);

  const input = (
    <input
      ref={inputRef}
      id={id}
      name={id}
      type="file"
      accept={accept}
      className="sr-only"
      onChange={onFileChange}
      disabled={disabled}
    />
  );

  const fileRow = (name: React.ReactNode, detail: React.ReactNode, extra?: React.ReactNode) => (
    <div
      className={cn(
        "flex items-center gap-3 rounded-md border bg-card px-3 py-2.5",
        invalid ? "border-destructive" : "border-border"
      )}
    >
      <span className="flex h-9 w-[30px] shrink-0 items-center justify-center rounded-[5px] border border-destructive-border bg-destructive-subtle text-[9px] font-bold text-destructive-text">
        PDF
      </span>
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="truncate text-[13.5px] font-medium text-foreground">{name}</span>
        <span className="text-xs tabular-nums text-muted-foreground">{detail}</span>
      </span>
      {extra}
      <Button type="button" variant="outline" size="sm" onClick={() => inputRef.current?.click()} disabled={disabled}>
        Remplacer
      </Button>
      {input}
    </div>
  );

  if (file) {
    return fileRow(
      file.name,
      `${formatFileSize(file.size)} · prêt à téléverser`,
      onRemove && (
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRemove}
          disabled={disabled}
          aria-label="Retirer le fichier"
          className="h-[30px] w-[30px] text-destructive-text hover:border-destructive-border hover:bg-destructive-subtle"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      )
    );
  }

  if (currentFileHref) {
    return fileRow(
      "Document actuel",
      "Déjà enregistré",
      <>
        <Button asChild variant="ghost" size="sm">
          <a href={currentFileHref} target="_blank" rel="noopener noreferrer">
            <ExternalLink className="h-3.5 w-3.5" />
            Voir
          </a>
        </Button>
        {onRemoveCurrent && (
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRemoveCurrent}
            disabled={disabled}
            aria-label="Retirer le document actuel"
            className="order-last h-[30px] w-[30px] text-destructive-text hover:border-destructive-border hover:bg-destructive-subtle"
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        )}
      </>
    );
  }

  return (
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        if (!disabled) setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        if (!disabled && event.dataTransfer.files?.length) onFileChange({ target: { files: event.dataTransfer.files } });
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-1.5 rounded-lg border-[1.5px] border-dashed px-6 py-6 text-center transition-colors focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        dragging
          ? "border-foreground bg-primary-subtle"
          : invalid
            ? "border-destructive bg-destructive-subtle/40"
            : "border-ink-400 bg-ink-50 hover:border-ink-600",
        disabled && "pointer-events-none opacity-60"
      )}
    >
      <Upload aria-hidden className="h-5 w-5 text-ink-700" strokeWidth={1.9} />
      <span className="text-[13.5px] font-medium text-foreground">
        {dragging ? "Déposez pour téléverser" : "Glissez le justificatif ici ou cliquez pour parcourir"}
      </span>
      <span className="text-xs text-muted-foreground">{hint}</span>
      {input}
    </label>
  );
}

interface FormActionsProps {
  children: React.ReactNode;
  className?: string;
  showRequiredNote?: boolean;
}

// Sticky footer inside the form card; stays reachable on long forms.
function FormActions({ children, className, showRequiredNote = true }: FormActionsProps) {
  return (
    <div
      className={cn(
        "sticky bottom-0 z-10 flex flex-col-reverse gap-2 rounded-b-lg border-t border-border bg-card/95 px-6 py-4 backdrop-blur sm:flex-row sm:items-center sm:justify-end",
        className
      )}
    >
      {showRequiredNote && (
        <p className="text-xs text-muted-foreground sm:mr-auto">
          Les champs marqués d'un <span className="text-destructive">*</span> sont obligatoires.
        </p>
      )}
      {children}
    </div>
  );
}

// Loading placeholder shaped like a form page.
function FormSkeleton() {
  return (
    <div role="status" aria-label="Chargement" className="mx-auto w-full max-w-5xl space-y-6 p-6 lg:p-8">
      <div className="space-y-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-7 w-64" />
      </div>
      <div className="rounded-lg border border-border bg-card shadow-xs">
        {[0, 1].map((section) => (
          <div key={section} className="grid gap-5 border-b border-border px-6 py-6 last:border-0 xl:grid-cols-[220px_minmax(0,1fr)] xl:gap-10">
            <div className="space-y-2">
              <Skeleton className="h-3.5 w-24" />
              <Skeleton className="h-2.5 w-40" />
            </div>
            <div className="grid gap-5 sm:grid-cols-2">
              {[0, 1, 2, 3].map((field) => (
                <div key={field} className="space-y-2">
                  <Skeleton className="h-2.5 w-20" />
                  <Skeleton className="h-9 w-full rounded-md" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

interface EmployeeIdentityProps {
  firstName?: string;
  lastName?: string;
  matricule?: string;
  meta?: React.ReactNode;
  size?: "sm" | "md" | "lg";
  /** Blue avatar with yellow initials for the selected or viewed person. */
  highlighted?: boolean;
  className?: string;
}

function initialsOf(firstName?: string, lastName?: string) {
  return `${firstName?.[0] ?? ""}${lastName?.[0] ?? ""}`.toUpperCase() || "?";
}

// Avatar initials + name + matricule, used in pickers, tables and detail headers.
function EmployeeIdentity({ firstName, lastName, matricule, meta, size = "md", highlighted, className }: EmployeeIdentityProps) {
  const avatar = { sm: "h-7 w-7 text-[11px]", md: "h-8 w-8 text-xs", lg: "h-12 w-12 text-base" }[size];
  const name = { sm: "text-[13.5px]", md: "text-[13.5px]", lg: "text-lg" }[size];
  return (
    <span className={cn("flex min-w-0 items-center gap-2.5 text-left", className)}>
      <span
        aria-hidden
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full font-semibold",
          avatar,
          highlighted ? "bg-info text-primary" : "bg-ink-250 text-ink-800"
        )}
      >
        {initialsOf(firstName, lastName)}
      </span>
      <span className="flex min-w-0 flex-col">
        <span className={cn("truncate font-medium text-foreground", name, size === "lg" && "font-semibold")}>
          {firstName} {lastName}
        </span>
        <span className="truncate text-xs tabular-nums text-muted-foreground">
          {[matricule, meta].filter(Boolean).join(" · ")}
        </span>
      </span>
    </span>
  );
}

export {
  FormSection,
  Field,
  FieldError,
  InputWithIcon,
  UnitInput,
  ComputedValue,
  FileDropzone,
  FormActions,
  FormSkeleton,
  EmployeeIdentity,
  formatDateFr,
  formatFileSize,
};
