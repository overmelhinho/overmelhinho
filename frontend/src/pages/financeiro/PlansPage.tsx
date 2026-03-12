import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import axios from "@/services/api";
import toast from "react-hot-toast";
import {
    Plus,
    Pencil,
    Trash2,
    CreditCard,
    Package,
    X,
    Save,
    AlertTriangle,
    RefreshCw
} from "lucide-react";

interface Plan {
    id: number;
    name: string;
    price: string | number;
    billing_cycle: 'mensal' | 'anual' | 'avulso';
    tiny_product_id: string | null;
}

export default function PlansPage() {
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
    const [formData, setFormData] = useState({
        name: "",
        billing_cycle: "mensal",
        tiny_product_id: ""
    });

    // Fetch Plans
    const { data: plans, isLoading } = useQuery<Plan[]>({
        queryKey: ["plans"],
        queryFn: async () => {
            const resp = await axios.get("/v1/plans");
            return resp.data;
        },
    });

    // Create/Update Mutation
    const saveMutation = useMutation({
        mutationFn: async (data: any) => {
            if (editingPlan) {
                return axios.put(`/v1/plans/${editingPlan.id}`, data);
            }
            return axios.post("/v1/plans", data);
        },
        onSuccess: () => {
            toast.success(editingPlan ? "Plano atualizado!" : "Plano criado!");
            queryClient.invalidateQueries({ queryKey: ["plans"] });
            closeModal();
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro ao salvar plano.");
        }
    });

    // Delete Mutation
    const deleteMutation = useMutation({
        mutationFn: async (id: number) => {
            return axios.delete(`/v1/plans/${id}`);
        },
        onSuccess: () => {
            toast.success("Plano removido!");
            queryClient.invalidateQueries({ queryKey: ["plans"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro ao remover.");
        }
    });

    // Sync Mutation
    const syncMutation = useMutation({
        mutationFn: async (id: number) => {
            return axios.post(`/v1/plans/${id}/sync`);
        },
        onSuccess: () => {
            toast.success("Sincronizado com Tiny!");
            queryClient.invalidateQueries({ queryKey: ["plans"] });
        },
        onError: (error: any) => {
            toast.error(error?.response?.data?.message || "Erro na sincronização.");
        }
    });

    const openModal = (plan?: Plan) => {
        if (plan) {
            setEditingPlan(plan);
            setFormData({
                name: plan.name,
                billing_cycle: plan.billing_cycle,
                tiny_product_id: plan.tiny_product_id || ""
            });
        } else {
            setEditingPlan(null);
            setFormData({
                name: "",
                billing_cycle: "mensal",
                tiny_product_id: ""
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingPlan(null);
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        saveMutation.mutate(formData);
    };

    const handleDelete = (id: number) => {
        if (window.confirm("Deseja realmente excluir este plano?")) {
            deleteMutation.mutate(id);
        }
    };

    const getCycleLabel = (cycle: string) => {
        switch (cycle) {
            case 'mensal': return 'Mensal';
            case 'anual': return 'Anual';
            case 'avulso': return 'Avulso / Único';
            default: return cycle;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto space-y-8">
            <div className="flex justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-50 text-[#B70F0A] rounded-xl">
                        <Package size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Planos e Serviços</h1>
                        <p className="text-gray-500">Gerencie os planos customizados integrados ao Tiny ERP.</p>
                    </div>
                </div>
                <button
                    onClick={() => openModal()}
                    className="flex items-center gap-2 px-5 py-2.5 bg-[#B70F0A] text-white rounded-xl hover:bg-[#8e0c08] transition-all font-semibold shadow-md hover:shadow-lg active:scale-95"
                >
                    <Plus size={20} />
                    Novo Plano
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {isLoading ? (
                    [1, 2, 3].map(i => (
                        <div key={i} className="h-48 bg-gray-100 rounded-2xl animate-pulse"></div>
                    ))
                ) : plans && plans.length > 0 ? (
                    plans.map((plan) => (
                        <div
                            key={plan.id}
                            className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow group"
                        >
                            <div className="p-6 space-y-4">
                                <div className="flex justify-between items-center">
                                    <div className="flex-1">
                                        <h3 className="text-xl font-bold text-gray-900 truncate" title={plan.name}>
                                            {plan.name}
                                        </h3>
                                        <div className="mt-1 flex gap-2">
                                            <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-red-50 text-red-700 rounded-md tracking-wider">
                                                {getCycleLabel(plan.billing_cycle)}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <p className="text-xs text-gray-400 flex items-center gap-1">
                                        <AlertTriangle size={12} /> Tiny ID:
                                        <span className="font-mono text-gray-600 font-medium">
                                            {plan.tiny_product_id || 'Não configurado'}
                                        </span>
                                    </p>
                                </div>

                                <div className="flex gap-2 pt-2 opacity-0 group-hover:opacity-100 transition-opacity flex-wrap">
                                    <button
                                        onClick={() => openModal(plan)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-gray-50 text-gray-600 rounded-xl hover:bg-gray-100 font-medium transition-colors min-w-[100px]"
                                    >
                                        <Pencil size={16} /> Editar
                                    </button>
                                    <button
                                        onClick={() => syncMutation.mutate(plan.id)}
                                        disabled={syncMutation.isPending}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 font-medium transition-colors min-w-[100px] disabled:opacity-50"
                                        title="Sincronizar com Tiny ERP"
                                    >
                                        <RefreshCw size={16} className={syncMutation.isPending ? "animate-spin" : ""} />
                                        {syncMutation.isPending ? "Sincronizando..." : "Sincronizar"}
                                    </button>
                                    <button
                                        onClick={() => handleDelete(plan.id)}
                                        className="flex-1 flex items-center justify-center gap-2 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 font-medium transition-colors min-w-[100px]"
                                    >
                                        <Trash2 size={16} /> Excluir
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-20 text-center bg-white rounded-2xl border border-dashed border-gray-300">
                        <div className="flex flex-col items-center gap-4 text-gray-400">
                            <CreditCard size={64} strokeWidth={1} />
                            <p className="text-lg">Nenhum plano cadastrado ainda.</p>
                            <button onClick={() => openModal()} className="text-[#B70F0A] font-bold hover:underline">
                                Comece criando o primeiro agora!
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal CRUD */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
                    <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-300">
                        <div className="bg-gradient-to-r from-[#B70F0A] to-[#8e0c08] p-8 text-white relative">
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-6 p-2 hover:bg-white/20 rounded-full transition-colors"
                            >
                                <X size={20} />
                            </button>
                            <h3 className="text-2xl font-bold">{editingPlan ? "Editar Plano" : "Novo Plano"}</h3>
                            <p className="text-red-100 text-sm opacity-80 mt-1">
                                Configure os detalhes do serviço para faturamento automático.
                            </p>
                        </div>

                        <form onSubmit={handleSubmit} className="p-8 space-y-6">
                            <div className="space-y-4">
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Nome do Plano/Serviço</label>
                                    <input
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                        placeholder="Ex: Banner Topo Home - Mensal"
                                        className="w-full rounded-2xl border-gray-200 focus:ring-[#B70F0A] focus:border-[#B70F0A] shadow-sm py-3 px-4 transition-all"
                                        required
                                    />
                                </div>

                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Ciclo de Cobrança</label>
                                        <select
                                            value={formData.billing_cycle}
                                            onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                                            className="w-full rounded-2xl border-gray-200 focus:ring-[#B70F0A] focus:border-[#B70F0A] shadow-sm py-3 px-4"
                                            required
                                        >
                                            <option value="mensal">Mensal</option>
                                            <option value="anual">Anual</option>
                                            <option value="avulso">Avulso / Único</option>
                                        </select>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">Tiny Product ID (SKU)</label>
                                    <input
                                        type="text"
                                        value={formData.tiny_product_id}
                                        onChange={(e) => setFormData({ ...formData, tiny_product_id: e.target.value })}
                                        placeholder="Código do produto no Tiny Erp"
                                        className="w-full rounded-2xl border-gray-200 focus:ring-[#B70F0A] focus:border-[#B70F0A] shadow-sm py-3 px-4 font-mono text-sm"
                                    />
                                    <p className="mt-1.5 text-xs text-gray-400">
                                        Obrigatório para sincronização fiscal correta no ERP.
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6">
                                <button
                                    type="button"
                                    onClick={closeModal}
                                    className="flex-1 px-6 py-4 bg-gray-50 text-gray-600 rounded-2xl hover:bg-gray-100 font-bold transition-all border border-gray-100"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saveMutation.isPending}
                                    className="flex-1 px-6 py-4 bg-[#B70F0A] text-white rounded-2xl hover:bg-[#8e0c08] font-bold transition-all shadow-lg hover:shadow-red-200/50 flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {saveMutation.isPending ? (
                                        "Salvando..."
                                    ) : (
                                        <><Save size={20} /> Salvar Plano</>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
