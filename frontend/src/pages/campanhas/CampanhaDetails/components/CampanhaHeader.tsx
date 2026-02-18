import { Link } from "react-router-dom";

type BadgeTone = "neutral" | "info" | "warn" | "danger" | "success";

function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: BadgeTone;
}) {
  const cls =
    tone === "danger"
      ? "border-red-200 bg-red-50 text-red-700"
      : tone === "warn"
      ? "border-yellow-200 bg-yellow-50 text-yellow-800"
      : tone === "success"
      ? "border-green-200 bg-green-50 text-green-700"
      : tone === "info"
      ? "border-blue-200 bg-blue-50 text-blue-700"
      : "border-gray-200 bg-white text-gray-700";

  return (
    <span
      className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ${cls}`}
    >
      {children}
    </span>
  );
}

export default function CampanhaHeader({
  campanhaId,
  nome,
  status,
  tipo,
  origem,
  data_inicio,
  data_fim,

  clienteNome,
  plano,
  placements,
  isGlobal,
  globalPlacements,

  onBack,
  onRenovar,
  onEncerrar,

  renovarPending,
  encerrarPending,

  statusLabelPt,
  origemLabelPt,
  badgeToneFromStatus,
  fmtDateOnly,
}: {
  campanhaId: number;
  nome: string;
  status?: string | null;
  tipo?: string | null;
  origem?: string | null;
  data_inicio?: string | null;
  data_fim?: string | null;

  clienteNome: string;
  plano?: any;
  placements?: any;
  isGlobal: boolean;
  globalPlacements: string[];

  onBack: () => void;
  onRenovar: () => void;
  onEncerrar: () => void;

  renovarPending?: boolean;
  encerrarPending?: boolean;

  statusLabelPt: (s?: string | null) => string;
  origemLabelPt: (s?: string | null) => string;
  badgeToneFromStatus: (s?: string | null) => BadgeTone;
  fmtDateOnly: (iso?: string | null) => string;
}) {
  return (
    <div className="mb-5 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="min-w-0">
        <div className="mb-1 text-sm text-gray-600">
          <Link to="/campanhas" className="hover:underline">
            Campanhas
          </Link>{" "}
          / #{campanhaId}
        </div>

        <h1 className="truncate text-2xl font-semibold text-gray-900">{nome}</h1>

        <div className="mt-2 flex flex-wrap items-center gap-2">
          <Badge tone={badgeToneFromStatus(status)}>{statusLabelPt(status)}</Badge>
          <Badge tone="info">{String(tipo || "—")}</Badge>
          {origem ? <Badge>{origemLabelPt(origem)}</Badge> : null}
          <Badge>Cliente: {clienteNome}</Badge>
          <Badge>
            Período: {fmtDateOnly(data_inicio)} → {fmtDateOnly(data_fim)}
          </Badge>
          {plano ? <Badge>Plano: {String(plano)}</Badge> : null}
        </div>

        {isGlobal ? (
          <div className="mt-3 rounded-xl border border-yellow-200 bg-yellow-50 p-3 text-sm text-yellow-800">
            <b>Placement global:</b> ignora cidade/segment/keyword, mas respeita
            elegibilidade, plano e rotação.
          </div>
        ) : null}

        {/* (Opcional) Preview rápido de placements globais */}
        {Array.isArray(placements) && placements.length ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {placements.map((p: any) => {
              const val = String(p);
              const isGlobalPlacement = globalPlacements.includes(val);
              return (
                <Badge key={val} tone={isGlobalPlacement ? "warn" : "neutral"}>
                  {val}
                </Badge>
              );
            })}
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <button
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50"
          onClick={onBack}
        >
          Voltar
        </button>

        <button
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-semibold text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          onClick={onRenovar}
          disabled={!!renovarPending}
        >
          Renovar
        </button>

        <button
          className="rounded-xl bg-[#B70F0A] px-4 py-2 text-sm font-semibold text-white hover:opacity-95 disabled:opacity-50"
          onClick={onEncerrar}
          disabled={!!encerrarPending}
        >
          Encerrar
        </button>
      </div>
    </div>
  );
}
