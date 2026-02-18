import { useFormikContext } from "formik";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import Select from "react-select";
import { MapPin, Loader2, Plus, Trash2, CheckCircle2 } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

type Cidade = {
  id: number;
  nome: string;
  uf?: string | null;
};

type Option = {
  value: number;
  label: string;
};

export default function TabCidadesAtendidas() {
  const { values, setFieldValue } = useFormikContext<any>();

  const selectedIds: number[] = Array.isArray(values.cidades_atendidas)
    ? values.cidades_atendidas
    : [];

  const cidadeEnderecoNome: string = (values?.cidade || "").trim();
  const cidadeEnderecoUF: string = (values?.estado || "").trim();

  const [search, setSearch] = useState("");
  const [chipsExpanded, setChipsExpanded] = useState(false);

  // Ref do Select para manter foco após ações (UX premium)
  const selectRef = useRef<any>(null);

  // Debounce leve para reduzir chamadas durante digitação
  const debounceRef = useRef<number | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    if (debounceRef.current) window.clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 250);
    return () => {
      if (debounceRef.current) window.clearTimeout(debounceRef.current);
    };
  }, [search]);

  const focusSelect = () => {
    try {
      selectRef.current?.focus?.();
    } catch {
      // noop
    }
  };

  /**
   * 1) Busca por texto (q) - lista sugerida para selecionar
   */
  const {
    data: cidadesBusca = [],
    isLoading: isLoadingBusca,
    isError: isErrorBusca,
  } = useQuery({
    queryKey: ["cidades", "q", debouncedSearch],
    queryFn: async () => {
      try {
        const { data } = await api.get("/v1/cidades", {
          params: debouncedSearch ? { q: debouncedSearch } : undefined,
        });

        const arr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        return arr as Cidade[];
      } catch {
        return [] as Cidade[];
      }
    },
  });

  /**
   * 2) Hidratar labels das selecionadas via ids=1,2,3
   *    (para chips sempre com nome correto)
   */
  const { data: cidadesSelecionadas = [], isLoading: isLoadingSelected } = useQuery({
    queryKey: ["cidades", "ids", selectedIds.join(",")],
    enabled: selectedIds.length > 0,
    queryFn: async () => {
      try {
        const { data } = await api.get("/v1/cidades", {
          params: { ids: selectedIds.join(",") },
        });

        const arr = Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data)
          ? data
          : [];
        return arr as Cidade[];
      } catch {
        return [] as Cidade[];
      }
    },
  });

  const optionsBusca: Option[] = useMemo(() => {
    return (cidadesBusca || []).map((c) => ({
      value: c.id,
      label: c.uf ? `${c.nome} - ${c.uf}` : c.nome,
    }));
  }, [cidadesBusca]);

  const selectedOptionsMap = useMemo(() => {
    const map = new Map<number, Option>();
    (cidadesSelecionadas || []).forEach((c) => {
      map.set(c.id, {
        value: c.id,
        label: c.uf ? `${c.nome} - ${c.uf}` : c.nome,
      });
    });
    return map;
  }, [cidadesSelecionadas]);

  // Chips externos sempre com label real quando possível
  const chipItems: Option[] = useMemo(() => {
    return selectedIds.map((id) => selectedOptionsMap.get(id) ?? { value: id, label: `Cidade ID ${id}` });
  }, [selectedIds, selectedOptionsMap]);

  const selectedCount = selectedIds.length;
  const visibleChips = chipsExpanded ? chipItems : chipItems.slice(0, 8);
  const hiddenCount = chipItems.length > 8 ? chipItems.length - 8 : 0;

  const setSelectedIds = (ids: number[]) => {
    const unique = Array.from(new Set(ids))
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n));
    setFieldValue("cidades_atendidas", unique);
  };

  const handleClear = () => {
    if (selectedCount === 0) return;
    const ok = window.confirm("Limpar todas as cidades selecionadas?");
    if (!ok) return;
    setSelectedIds([]);
    setChipsExpanded(false);
    toast.success("Seleção de cidades limpa.");
    focusSelect();
  };

  const handleSelectResults = () => {
    if (!optionsBusca.length) {
      toast.error("Nenhum resultado para selecionar.");
      focusSelect();
      return;
    }
    const idsToAdd = optionsBusca.map((o) => o.value);
    const merged = Array.from(new Set([...selectedIds, ...idsToAdd]));
    setSelectedIds(merged);
    toast.success(`Adicionadas ${idsToAdd.length} cidades do resultado.`);
    focusSelect();
  };

  const removeCidade = (id: number) => {
    setSelectedIds(selectedIds.filter((x) => x !== id));
    focusSelect();
  };

  // Sugestão: adicionar cidade do endereço (quando RS)
  const showEnderecoSuggestion =
    cidadeEnderecoNome.length > 0 &&
    cidadeEnderecoUF.length > 0 &&
    cidadeEnderecoUF.toUpperCase() === "RS";

  const handleAddCidadeEndereco = async () => {
    if (!showEnderecoSuggestion) return;

    try {
      const { data } = await api.get("/v1/cidades", {
        params: { q: cidadeEnderecoNome },
      });

      const arr: Cidade[] = Array.isArray(data?.data)
        ? data.data
        : Array.isArray(data)
        ? data
        : [];

      const uf = cidadeEnderecoUF.toUpperCase();

      const exact = arr.find(
        (c) =>
          (c.nome || "").toLowerCase() === cidadeEnderecoNome.toLowerCase() &&
          (c.uf || "").toUpperCase() === uf
      );

      const fallback = arr.find((c) => (c.uf || "").toUpperCase() === uf);

      const chosen = exact || fallback;

      if (!chosen) {
        toast.error("Não encontrei a cidade do endereço na lista.");
        focusSelect();
        return;
      }

      if (selectedIds.includes(chosen.id)) {
        toast("A cidade do endereço já está selecionada.");
        focusSelect();
        return;
      }

      setSelectedIds([...selectedIds, chosen.id]);
      toast.success(`Adicionada: ${chosen.nome} - ${chosen.uf ?? uf}`);
      focusSelect();
    } catch {
      toast.error("Erro ao buscar a cidade do endereço.");
      focusSelect();
    }
  };

  /**
   * ✅ UX FECHADO (sem duplicar UI):
   * - Select continua CONTROLADO com as selecionadas (para não perder seleção)
   * - Mas não renderiza valores dentro do input (controlShouldRenderValue=false)
   */
  const selectValue: Option[] = chipItems;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-1">
        <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
          <MapPin className="w-5 h-5 text-[#B70F0A]" /> Cidades Atendidas
        </h3>
        <p className="text-sm text-gray-600">
          Selecione as cidades onde este cliente atende/entrega/presta serviço.
        </p>
      </div>

      {/* Status + Ações */}
      <div className="flex flex-col gap-3">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-2">
          <div className="text-sm text-gray-700">
            <span className="font-semibold">Selecionadas:</span> {selectedCount}
            {isLoadingSelected && selectedCount > 0 ? (
              <span className="ml-2 inline-flex items-center gap-1 text-gray-500">
                <Loader2 className="w-4 h-4 animate-spin" /> carregando nomes...
              </span>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleSelectResults}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition"
              disabled={isLoadingBusca || optionsBusca.length === 0}
              title="Seleciona todas as cidades do resultado atual"
            >
              <CheckCircle2 className="w-4 h-4" />
              Selecionar resultados
            </button>

            <button
              type="button"
              onClick={handleClear}
              className="inline-flex items-center gap-2 px-3 py-2 text-sm border rounded-md hover:bg-gray-50 transition"
              disabled={selectedCount === 0}
              title="Remove todas as cidades selecionadas"
            >
              <Trash2 className="w-4 h-4" />
              Limpar
            </button>

            {showEnderecoSuggestion ? (
              <button
                type="button"
                onClick={handleAddCidadeEndereco}
                className="inline-flex items-center gap-2 px-3 py-2 text-sm bg-[#B70F0A] text-white rounded-md hover:bg-[#a00d08] transition"
                title="Adiciona a cidade informada na aba Endereço"
              >
                <Plus className="w-4 h-4" />
                Adicionar cidade do endereço
              </button>
            ) : null}
          </div>
        </div>

        {showEnderecoSuggestion ? (
          <div className="text-xs text-gray-500">
            Sugestão: cidade do endereço detectada como{" "}
            <span className="font-semibold">
              {cidadeEnderecoNome} - {cidadeEnderecoUF.toUpperCase()}
            </span>
            .
          </div>
        ) : null}
      </div>

      {/* Chips externos (estado atual) */}
      {selectedCount > 0 ? (
        <div className="rounded-xl border bg-white p-3">
          <div className="flex flex-wrap gap-2">
            {visibleChips.map((opt) => (
              <span
                key={opt.value}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm border bg-gray-50"
              >
                {opt.label}
                <button
                  type="button"
                  onClick={() => removeCidade(opt.value)}
                  className="text-gray-500 hover:text-gray-900 transition"
                  aria-label={`Remover ${opt.label}`}
                  title="Remover"
                >
                  ×
                </button>
              </span>
            ))}

            {!chipsExpanded && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setChipsExpanded(true)}
                className="px-3 py-1.5 rounded-full text-sm border bg-white hover:bg-gray-50 transition"
                title="Mostrar todas as cidades selecionadas"
              >
                +{hiddenCount} cidades
              </button>
            ) : null}

            {chipsExpanded && hiddenCount > 0 ? (
              <button
                type="button"
                onClick={() => setChipsExpanded(false)}
                className="px-3 py-1.5 rounded-full text-sm border bg-white hover:bg-gray-50 transition"
                title="Recolher lista"
              >
                Recolher
              </button>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="text-sm text-gray-500">
          Nenhuma cidade selecionada ainda. Use a busca abaixo para adicionar.
        </div>
      )}

      {/* Select (somente busca + menu, sem duplicar valores no input) */}
      <div className="space-y-2 mt-2">
        <Select
          ref={selectRef}
          isMulti
          name="cidades_atendidas"
          options={optionsBusca}
          value={selectValue} // ✅ mantém estado interno para multiseleção correta
          onInputChange={(val) => setSearch(val)}
          onChange={(sel) =>
            setSelectedIds(Array.isArray(sel) ? sel.map((s: any) => s.value) : [])
          }
          className="w-full text-sm"
          classNamePrefix="react-select"
          placeholder="Digite para buscar cidades (ex: Caxias do Sul)..."
          noOptionsMessage={() => {
            if (isLoadingBusca) return "Carregando...";
            if (debouncedSearch) return `Nenhuma cidade encontrada para “${debouncedSearch}”`;
            return "Digite para buscar cidades";
          }}
          isLoading={isLoadingBusca}
          menuPlacement="auto"
          closeMenuOnSelect={false}
          // ✅ não mostrar seleção dentro do input (evita duplicação com chips externos)
          controlShouldRenderValue={false}
          // ✅ manter itens selecionados visíveis no menu
          hideSelectedOptions={false}
        />

        <div className="text-xs text-gray-500">
          Você pode selecionar quantas cidades quiser. Use “Selecionar resultados” para acelerar.
        </div>

        {isErrorBusca ? (
          <div className="text-xs text-red-600">
            Erro ao carregar cidades. Verifique a API /v1/cidades.
          </div>
        ) : null}

        {isLoadingBusca ? (
          <div className="flex items-center gap-2 text-gray-500 text-sm">
            <Loader2 className="animate-spin w-4 h-4" /> Buscando cidades...
          </div>
        ) : null}
      </div>
    </div>
  );
}
