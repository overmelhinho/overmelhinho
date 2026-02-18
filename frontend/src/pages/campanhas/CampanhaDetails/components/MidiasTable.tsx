import { useMemo } from "react";

import MidiaRowActions from "@/pages/campanhas/CampanhaDetails/components/MidiaRowActions";
import type { ConfirmState } from "@/pages/campanhas/CampanhaDetails/components/ConfirmDialog";

import {
  fmtDate,
  badgeToneFromStatus,
  statusLabelPt,
} from "@/pages/campanhas/CampanhaDetails/utils/format";

import type { CampanhaMidia } from "@/hooks/useCampanhaMidias";

function Badge({
  children,
  tone = "neutral",
}: {
  children: any;
  tone?: "neutral" | "info" | "warn" | "danger" | "success";
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

export default function MidiasTable({
  campanhaId,
  midias,
  openConfirm,
  busyExternal,
}: {
  campanhaId: number;
  midias: CampanhaMidia[];
  openConfirm: (cfg: NonNullable<ConfirmState>) => Promise<void> | void;
  busyExternal: boolean;
}) {
  const grouped = useMemo(() => {
    const rows = Array.isArray(midias) ? midias : [];
    const m: Record<string, CampanhaMidia[]> = {};

    for (const r of rows) {
      const key = r.tipo || "midia";
      if (!m[key]) m[key] = [];
      m[key].push(r);
    }

    for (const k of Object.keys(m)) {
      m[k] = m[k].slice().sort((a, b) => b.versao - a.versao || b.id - a.id);
    }

    return m;
  }, [midias]);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([tipo, items]) => (
        <div key={tipo} className="rounded-2xl border border-gray-200 bg-white">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <div className="text-sm font-semibold text-gray-900">{tipo}</div>
            <div className="text-xs text-gray-500">{items.length} versões</div>
          </div>

          <div className="w-full overflow-x-auto">
            <table className="w-full min-w-[1050px] text-left text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                <tr>
                  <th className="px-4 py-3">ID</th>
                  <th className="px-4 py-3">Versão</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Desktop</th>
                  <th className="px-4 py-3">Mobile</th>
                  <th className="px-4 py-3">Criado</th>
                  <th className="px-4 py-3 text-right">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-gray-100">
                {items.map((m) => (
                  <tr key={m.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-900">
                      #{m.id}
                    </td>

                    <td className="px-4 py-3">{m.versao}</td>

                    <td className="px-4 py-3">
                      <Badge tone={badgeToneFromStatus(m.status)}>
                        {statusLabelPt(m.status)}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {m.desktop_url ? (
                        <a
                          href={m.desktop_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#B70F0A] underline"
                        >
                          abrir ↗
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {m.mobile_url ? (
                        <a
                          href={m.mobile_url}
                          target="_blank"
                          rel="noreferrer"
                          className="text-[#B70F0A] underline"
                        >
                          abrir ↗
                        </a>
                      ) : (
                        <span className="text-gray-500">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {fmtDate(m.created_at || null)}
                    </td>

                    <td className="px-4 py-3 text-right">
                      <MidiaRowActions
                        campanhaId={campanhaId}
                        m={m}
                        openConfirm={openConfirm}
                        busyExternal={busyExternal}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}
