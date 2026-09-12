"use client";

import * as React from "react";
import { Check, ChevronsUpDown, Search } from "lucide-react";

import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { EmployeeIdentity } from "@/components/ui/form-layout";

interface Person {
  _id: string;
  firstName?: string;
  lastName?: string;
  matricule?: string;
  poste?: string;
  stationName?: string;
}

interface EmployeeComboboxProps {
  id?: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  people: Person[];
  selected?: Person | null;
  onSelect: (person: Person) => void;
  /** Controlled search text; omit to let the list filter itself. */
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  loading?: boolean;
  placeholder?: string;
}

// Employee picker: search by name or matricule, rows show initials, name, matricule and poste.
function EmployeeCombobox({
  id,
  open,
  onOpenChange,
  people,
  selected,
  onSelect,
  searchValue,
  onSearchChange,
  disabled,
  invalid,
  loading,
  placeholder = "Rechercher un employé…",
}: EmployeeComboboxProps) {
  const searchProps = onSearchChange ? { value: searchValue, onValueChange: onSearchChange } : {};
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          id={id}
          type="button"
          role="combobox"
          aria-expanded={open}
          aria-invalid={invalid || undefined}
          disabled={disabled}
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-left text-sm transition-colors hover:border-ink-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60",
            invalid ? "border-destructive" : open ? "border-foreground" : "border-input"
          )}
        >
          {selected ? (
            <EmployeeIdentity
              firstName={selected.firstName}
              lastName={selected.lastName}
              matricule={selected.matricule}
              meta={selected.stationName || selected.poste}
              size="sm"
              highlighted
              className="flex-1"
            />
          ) : (
            <span className="flex flex-1 items-center gap-2 px-0.5 text-ink-600">
              <Search aria-hidden className="h-4 w-4" />
              {placeholder}
            </span>
          )}
          <ChevronsUpDown aria-hidden className="h-4 w-4 shrink-0 text-ink-600" />
        </button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[var(--radix-popover-trigger-width)] min-w-[320px] p-0">
        <Command>
          <CommandInput placeholder="Rechercher par nom ou matricule…" {...searchProps} />
          <CommandList>
            <CommandEmpty>{loading ? "Chargement du personnel…" : "Aucun employé trouvé."}</CommandEmpty>
            {people.map((person) => (
              <CommandItem
                key={person._id}
                data-employee-id={person._id}
                value={`${person.firstName} ${person.lastName} ${person.matricule}`}
                onSelect={() => onSelect(person)}
                className="gap-2"
              >
                <EmployeeIdentity
                  firstName={person.firstName}
                  lastName={person.lastName}
                  matricule={person.matricule}
                  meta={person.poste || "Poste non défini"}
                  size="sm"
                  className="flex-1"
                />
                {selected?._id === person._id && <Check aria-hidden className="h-4 w-4 shrink-0 text-foreground" />}
              </CommandItem>
            ))}
          </CommandList>
          <div className="border-t border-ink-150 px-3 py-2 text-xs tabular-nums text-muted-foreground">
            Recherche par nom ou matricule · {people.length} agent{people.length > 1 ? "s" : ""}
          </div>
        </Command>
      </PopoverContent>
    </Popover>
  );
}

export { EmployeeCombobox };
