// /var/www/frontend/src/pages/campanhas/CampanhaCreate/components/ClienteSelector.tsx
import { useEffect, useMemo, useRef, useState } from "react";
import type { ClienteLiteOption } from "@/hooks/useClientesLite";

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

export default function ClienteSelector({
  value,
  search,
  setSearch,
  loading,
  options,
  onChange,
}: {
  value: string;
  search: string;
  setSearch: (v: string) => void;
  loading: boolean;
  options: ClienteLiteOption[];
  onChange: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // ✅ importante: não depender apenas de "options" para renderizar o selecionado,
  // porque ao buscar no backend a lista muda e pode não incluir o cliente selecionado.
  const selectedFromOptions = useMemo(
    () => options.find((c) => String(c.id) === String(value)),
    [options, value]
  );

  const selectedLabel = useMemo(() => {
    if (!value) return "";
    const c = selectedFromOptions;
    if (!c) return `Cliente #${value}`;
    return c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
  }, [selectedFromOptions, value]);

  useEffect(() => {
    function handleClickOutside(e: any) {
      if (!containerRef.current?.contains(e.target)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <label className="mb-2 block text-xs font-medium text-gray-600">
        Cliente <span className="text-[#B70F0A]">*</span>
      </label>

      <div className="rounded-3xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-3">
          <input
            className="w-full rounded-2xl border border-gray-200 px-3 py-2 text-sm shadow-sm outline-none focus:ring-4 focus:ring-gray-900/5"
            placeholder="Buscar cliente (nome, CNPJ, endereço, contato...)"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={(e) => {
              // ✅ evita “submit” do form pai (Enter) que causa refresh/atualização
              if (e.key === "Enter") {
                e.preventDefault();
                e.stopPropagation();
                setOpen(true);
              }
              // opcional: ESC fecha dropdown
              if (e.key === "Escape") {
                e.preventDefault();
                setOpen(false);
              }
            }}
          />

          {search.trim().length > 0 ? (
            <button
              type="button"
              className="shrink-0 rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
              onClick={() => {
                setSearch("");
                setOpen(false);
              }}
            >
              Limpar
            </button>
          ) : null}
        </div>

        {open ? (
          <div
            className="absolute left-0 right-0 z-30 mt-2 max-h-72 overflow-auto rounded-2xl border border-gray-200 bg-white shadow-xl animate-in fade-in duration-150"
            role="listbox"
          >
            {loading ? (
              <div className="p-4 space-y-3">
                <div className="h-4 w-3/4 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-gray-200" />
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200" />
              </div>
            ) : options.length === 0 ? (
              <div className="p-4 text-sm text-gray-500">Nenhum cliente encontrado.</div>
            ) : (
              options.map((c) => {
                const label = c.nome_fantasia || c.razao_social || `Cliente #${c.id}`;
                const isActive = String(c.id) === String(value);

                return (
                  <button
                    key={c.id}
                    type="button"
                    onMouseDown={(e) => {
                      // ✅ evita blur antes do click (melhor UX e evita side-effects)
                      e.preventDefault();
                    }}
                    onClick={() => {
                      onChange(String(c.id));

                      // ✅ limpa o campo para não disparar nova busca com o label
                      setSearch("");
                      setOpen(false);
                    }}
                    className={cx(
                      "w-full px-4 py-3 text-left text-sm transition",
                      isActive ? "bg-gray-50" : "hover:bg-gray-50"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="font-medium text-gray-900 truncate">{label}</div>
                        {c.cpf_cnpj ? <div className="text-xs text-gray-500">{c.cpf_cnpj}</div> : null}
                      </div>

                      {isActive ? (
                        <span className="shrink-0 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-1 text-[11px] font-semibold text-emerald-900">
                          Selecionado
                        </span>
                      ) : null}
                    </div>
                  </button>
                );
              })
            )}
          </div>
        ) : null}

        {selectedLabel ? (
          <div className="mt-4 rounded-2xl border border-gray-200 bg-gray-50 p-3 text-sm">
            <div className="text-xs text-gray-500">Selecionado</div>
            <div className="font-semibold text-gray-900">{selectedLabel}</div>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <button
                type="button"
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => setOpen(true)}
              >
                Trocar
              </button>

              <button
                type="button"
                className="rounded-2xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-800 hover:bg-gray-50"
                onClick={() => {
                  onChange("");
                  setSearch("");
                  setOpen(false);
                }}
              >
                Remover seleção
              </button>
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
