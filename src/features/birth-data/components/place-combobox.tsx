"use client";

import { LoaderCircle, MapPin, RefreshCw } from "lucide-react";
import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";

import { Button } from "@/components/ui";
import { cn } from "@/lib/cn";
import { searchPlacesAction } from "@/features/places/actions";
import { PLACES_ATTRIBUTION } from "@/features/places/attribution";
import { MIN_QUERY_LENGTH } from "@/features/places/search";
import type { PlaceSummary } from "@/features/places/types";

const DEBOUNCE_MS = 200;

function formatCoordinate(value: number, positive: string, negative: string) {
  return `${Math.abs(value).toLocaleString("pt-BR", { maximumFractionDigits: 4 })}° ${value < 0 ? negative : positive}`;
}

export function formatCoordinates({
  latitude,
  longitude,
}: PlaceSummary["coordinates"]) {
  return `${formatCoordinate(latitude, "N", "S")}, ${formatCoordinate(longitude, "L", "O")}`;
}

/**
 * Busca e seleção explícita de cidade (padrão combobox WAI-ARIA).
 * Nunca seleciona sozinho, mesmo com um único resultado.
 */
export function PlaceCombobox({
  value,
  onChange,
  error,
}: {
  value: PlaceSummary | null;
  onChange: (place: PlaceSummary | null) => void;
  error?: string;
}) {
  const id = useId();
  const listboxId = `${id}-listbox`;
  const inputRef = useRef<HTMLInputElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const requestId = useRef(0);

  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PlaceSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);

  useEffect(
    () => () => {
      if (timer.current) clearTimeout(timer.current);
    },
    [],
  );

  function onQueryChange(next: string) {
    setQuery(next);
    setActive(-1);
    if (timer.current) clearTimeout(timer.current);
    if (next.trim().length < MIN_QUERY_LENGTH) {
      requestId.current++;
      setResults([]);
      setTotal(0);
      setLoading(false);
      setOpen(false);
      return;
    }
    setLoading(true);
    timer.current = setTimeout(async () => {
      const current = ++requestId.current;
      const response = await searchPlacesAction(next);
      if (current !== requestId.current) return; // resposta antiga
      setResults(response.results);
      setTotal(response.total);
      setLoading(false);
      setOpen(true);
    }, DEBOUNCE_MS);
  }

  function select(place: PlaceSummary) {
    onChange(place);
    setOpen(false);
    setQuery("");
    setResults([]);
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "ArrowDown" && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i + 1) % results.length);
    } else if (event.key === "ArrowUp" && results.length) {
      event.preventDefault();
      setOpen(true);
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (event.key === "Enter" && open && active >= 0) {
      event.preventDefault();
      select(results[active]);
    } else if (event.key === "Escape") {
      setOpen(false);
    }
  }

  const errorId = `${id}-error`;
  const hintId = `${id}-hint`;

  if (value) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-3 rounded-2xl bg-accent-soft py-2 pr-2 pl-1.5 shadow-[0_0_0_1px_#ff7a3355]">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-accent">
            <MapPin aria-hidden className="size-4" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-[0.6rem] tracking-[0.16em] text-fg-subtle uppercase">
              Cidade de nascimento
            </p>
            <p
              className="truncate font-medium text-fg"
              data-testid="selected-place"
            >
              {value.label}
            </p>
            <p className="text-xs break-words text-fg-muted">
              {formatCoordinates(value.coordinates)} ·{" "}
              {value.timeZone ?? "fuso indefinido"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              onChange(null);
              requestAnimationFrame(() => inputRef.current?.focus());
            }}
          >
            <RefreshCw aria-hidden className="size-3.5" />
            Trocar
          </Button>
        </div>
        {error && (
          <p id={errorId} className="px-1 text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  }

  const showList = open && query.trim().length >= MIN_QUERY_LENGTH && !loading;

  return (
    <div className="relative space-y-2">
      <div
        className={cn(
          "flex items-center gap-3 rounded-2xl bg-bg-deep/70 py-1.5 pr-4 pl-1.5 shadow-[0_0_0_1px_var(--color-line)] transition-shadow duration-300 focus-within:shadow-[0_0_0_1px_var(--color-accent),0_0_0_4px_#ff7a331f]",
          error && "shadow-[0_0_0_1px_var(--color-danger)]",
        )}
      >
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface-raised text-accent">
          {loading ? (
            <LoaderCircle aria-hidden className="size-4 animate-spin" />
          ) : (
            <MapPin aria-hidden className="size-4" />
          )}
        </span>
        <div className="min-w-0 flex-1">
          <label
            htmlFor={`${id}-input`}
            className="block font-mono text-[0.6rem] tracking-[0.16em] text-fg-subtle uppercase"
          >
            Cidade de nascimento
          </label>
          <input
            ref={inputRef}
            id={`${id}-input`}
            type="text"
            role="combobox"
            autoComplete="off"
            spellCheck={false}
            placeholder="Digite o nome da cidade"
            className="h-9 w-full bg-transparent text-base text-fg placeholder:text-fg-subtle/70 focus:outline-none"
            value={query}
            onChange={(e) => onQueryChange(e.target.value)}
            onKeyDown={onKeyDown}
            onBlur={() => setOpen(false)}
            onFocus={() => results.length && setOpen(true)}
            aria-expanded={showList}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={
              showList && active >= 0 ? `${id}-option-${active}` : undefined
            }
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : hintId}
          />
        </div>
      </div>

      {showList && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Cidades encontradas"
          className="absolute inset-x-0 top-[3.75rem] z-30 max-h-80 overflow-y-auto rounded-2xl bg-surface-raised p-1.5 shadow-[inset_0_1px_0_#ffffff14,0_0_0_1px_var(--color-line),0_24px_48px_-12px_#000]"
        >
          {results.length === 0 ? (
            <li
              role="option"
              aria-selected={false}
              aria-disabled
              className="px-3 py-3 text-sm text-fg-muted"
            >
              Nenhuma cidade encontrada. Confira a grafia ou busque a cidade
              grande mais próxima.
            </li>
          ) : (
            results.map((place, i) => (
              <li
                key={place.id}
                id={`${id}-option-${i}`}
                role="option"
                aria-selected={i === active}
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => select(place)}
                className={cn(
                  "cursor-pointer rounded-xl px-3 py-2.5 transition-colors",
                  i === active
                    ? "bg-surface-bright"
                    : "hover:bg-surface-bright/60",
                )}
              >
                <span className="block text-sm font-medium text-fg">
                  {place.name}
                </span>
                <span className="block text-xs text-fg-muted">
                  {[place.region, place.countryName].filter(Boolean).join(", ")}
                  {place.regionCode && ` (${place.regionCode})`}
                </span>
              </li>
            ))
          )}
          {total > results.length && (
            <li
              role="presentation"
              className="px-3 pt-2 pb-1 text-[0.7rem] text-fg-subtle"
            >
              Mostrando {results.length} de {total}. Digite mais letras para
              refinar.
            </li>
          )}
        </ul>
      )}

      {error ? (
        <p id={errorId} className="px-1 text-xs text-danger">
          {error}
        </p>
      ) : (
        <p id={hintId} className="px-1 text-xs text-fg-subtle">
          Escolha a cidade na lista — homônimas aparecem com o estado ou país.
        </p>
      )}
      <p className="px-1 text-[0.65rem] text-fg-subtle/80">
        {PLACES_ATTRIBUTION}
      </p>
    </div>
  );
}
