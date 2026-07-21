import { useAuth } from "@/contexts/AuthContext";
import { useState, useMemo } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import api from "@/services/api";
import toast from "react-hot-toast";
import { Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// ── Utilitário de força de senha ──────────────────────────────────────────────
function calcPasswordStrength(password: string): {
  score: number; // 0 a 4
  label: string;
  color: string;
  checks: { label: string; ok: boolean }[];
} {
  const checks = [
    { label: "Mínimo 8 caracteres", ok: password.length >= 8 },
    { label: "Letra maiúscula (A-Z)", ok: /[A-Z]/.test(password) },
    { label: "Número (0-9)", ok: /[0-9]/.test(password) },
    { label: "Caractere especial (!@#$...)", ok: /[^A-Za-z0-9]/.test(password) },
  ];
  const score = checks.filter((c) => c.ok).length;
  const labels = ["", "Fraca", "Razoável", "Boa", "Forte"];
  const colors = ["", "text-red-500", "text-orange-500", "text-yellow-600", "text-green-600"];
  return { score, label: labels[score] || "", color: colors[score] || "", checks };
}

function StrengthBar({ score }: { score: number }) {
  const barColors = ["bg-red-500", "bg-orange-400", "bg-yellow-400", "bg-green-500"];
  return (
    <div className="flex gap-1 mt-1">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className={cn(
            "h-1.5 flex-1 rounded-full transition-all duration-300",
            i < score ? barColors[score - 1] : "bg-gray-200"
          )}
        />
      ))}
    </div>
  );
}

export default function MinhaContaPage() {
  const { user, setUser } = useAuth();
  const [nome, setNome] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [loading, setLoading] = useState(false);

  // Visibilidade das senhas
  const [showAtual, setShowAtual] = useState(false);
  const [showNova, setShowNova] = useState(false);
  const [showConfirmar, setShowConfirmar] = useState(false);

  const strength = useMemo(() => calcPasswordStrength(novaSenha), [novaSenha]);
  const senhasCoincidentes = confirmarSenha === novaSenha;
  const senhaValida = novaSenha === "" || strength.score >= 3;
  const podeSalvarSenha =
    novaSenha === "" ||
    (senhaAtual !== "" && strength.score >= 3 && senhasCoincidentes);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!podeSalvarSenha) return;

    setLoading(true);
    try {
      const payload: Record<string, string> = {};
      if (nome !== user?.name) payload.name = nome;
      if (email !== user?.email) payload.email = email;
      if (novaSenha) {
        payload.current_password = senhaAtual;
        payload.password = novaSenha;
        payload.password_confirmation = confirmarSenha;
      }

      if (Object.keys(payload).length === 0) {
        toast("Nenhuma alteração detectada.");
        return;
      }

      const { data } = await api.patch("/v1/user", payload);
      if (setUser && data.user) setUser(data.user);

      toast.success("Dados atualizados com sucesso!");
      setSenhaAtual("");
      setNovaSenha("");
      setConfirmarSenha("");
    } catch (err: any) {
      const msg = err?.response?.data?.message || "Ocorreu um erro ao salvar. Tente novamente.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  }

  const InputField = ({
    id,
    label,
    type = "text",
    value,
    onChange,
    disabled = false,
    autoComplete,
    show,
    setShow,
  }: {
    id: string;
    label: string;
    type?: string;
    value: string;
    onChange: (v: string) => void;
    disabled?: boolean;
    autoComplete?: string;
    show?: boolean;
    setShow?: (v: boolean) => void;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-semibold text-gray-700 mb-1">
        {label}
      </label>
      <div className="relative">
        <input
          id={id}
          className="w-full px-3 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-red-400 border-gray-300 pr-10 text-sm"
          type={show !== undefined ? (show ? "text" : type) : type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled || loading}
          autoComplete={autoComplete}
        />
        {setShow && (
          <button
            type="button"
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setShow(!show)}
            tabIndex={-1}
          >
            {show ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        )}
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-xl mx-auto">
        <div className="bg-white rounded-2xl shadow-lg p-8">
          <h2 className="text-2xl font-bold text-red-700 mb-6">Minha Conta</h2>

          <form className="space-y-5" onSubmit={handleSubmit}>
            {/* Dados Pessoais */}
            <InputField
              id="nome"
              label="Nome"
              value={nome}
              onChange={setNome}
              autoComplete="name"
            />
            <InputField
              id="email"
              label="E-mail"
              type="email"
              value={email}
              onChange={setEmail}
              autoComplete="email"
            />

            <hr className="my-4" />

            {/* Seção de Senha */}
            <div>
              <p className="text-base font-bold text-gray-800 mb-1">Alterar senha</p>
              <p className="text-xs text-gray-500 mb-4">
                Preencha os campos abaixo apenas se desejar alterar sua senha atual.
              </p>

              <div className="space-y-4">
                <InputField
                  id="senha-atual"
                  label="Senha atual"
                  type="password"
                  value={senhaAtual}
                  onChange={setSenhaAtual}
                  autoComplete="current-password"
                  show={showAtual}
                  setShow={setShowAtual}
                />

                <div>
                  <InputField
                    id="nova-senha"
                    label="Nova senha"
                    type="password"
                    value={novaSenha}
                    onChange={setNovaSenha}
                    autoComplete="new-password"
                    show={showNova}
                    setShow={setShowNova}
                  />

                  {/* Medidor de força */}
                  {novaSenha.length > 0 && (
                    <div className="mt-2">
                      <StrengthBar score={strength.score} />
                      <p className={cn("text-xs font-semibold mt-1", strength.color)}>
                        {strength.score > 0 ? `Senha ${strength.label}` : ""}
                      </p>

                      <ul className="mt-2 space-y-1">
                        {strength.checks.map((check) => (
                          <li
                            key={check.label}
                            className={cn(
                              "flex items-center gap-1.5 text-xs",
                              check.ok ? "text-green-600" : "text-gray-400"
                            )}
                          >
                            {check.ok ? (
                              <CheckCircle2 size={12} />
                            ) : (
                              <XCircle size={12} />
                            )}
                            {check.label}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>

                <div>
                  <InputField
                    id="confirmar-senha"
                    label="Confirmar nova senha"
                    type="password"
                    value={confirmarSenha}
                    onChange={setConfirmarSenha}
                    autoComplete="new-password"
                    show={showConfirmar}
                    setShow={setShowConfirmar}
                  />
                  {confirmarSenha.length > 0 && !senhasCoincidentes && (
                    <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                      <XCircle size={12} /> As senhas não coincidem.
                    </p>
                  )}
                  {confirmarSenha.length > 0 && senhasCoincidentes && novaSenha.length > 0 && (
                    <p className="text-xs text-green-600 mt-1 flex items-center gap-1">
                      <CheckCircle2 size={12} /> As senhas coincidem.
                    </p>
                  )}
                </div>
              </div>
            </div>

            <button
              className={cn(
                "w-full py-2.5 rounded-lg font-bold text-white transition-all",
                !podeSalvarSenha
                  ? "bg-gray-300 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700"
              )}
              type="submit"
              disabled={loading || !podeSalvarSenha}
            >
              {loading ? "Salvando..." : "Salvar alterações"}
            </button>
          </form>
        </div>
      </div>
    </DashboardLayout>
  );
}
