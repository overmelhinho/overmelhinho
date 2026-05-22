import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "@/services/api";
import { format } from "date-fns";
import { 
    FileText, 
    Download, 
    Calendar,
    Briefcase,
    Mail,
    Phone,
    CheckCircle,
    XCircle,
    Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export default function JobReportsTab() {
    const [startDate, setStartDate] = useState(
        format(new Date(new Date().getFullYear(), new Date().getMonth(), 1), "yyyy-MM-dd")
    );
    const [endDate, setEndDate] = useState(format(new Date(), "yyyy-MM-dd"));
    const [selectedClient, setSelectedClient] = useState("");
    const [clients, setClients] = useState<{ id: number; nome_fantasia: string }[]>([]);
    const [resumeModal, setResumeModal] = useState<string | null>(null);

    useEffect(() => {
        axios.get("/v1/admin/reports/jobs/clients").then((res) => {
            setClients(res.data);
        }).catch(() => {});
    }, []);

    const openResume = async (candidateId: number) => {
        try {
            const { data } = await axios.get(`/v1/candidates/${candidateId}/resume`);
            setResumeModal(data.url);
        } catch {
            alert("Currículo não encontrado.");
        }
    };

    const { data: candidates, isLoading } = useQuery({
        queryKey: ["job-report", startDate, endDate, selectedClient],
        queryFn: async () => {
            const params = new URLSearchParams({ start_date: startDate, end_date: endDate });
            if (selectedClient) params.append("client_id", selectedClient);
            const resp = await axios.get(`/v1/admin/reports/jobs?${params.toString()}`);
            return resp.data;
        }
    });

    return (
        <div className="p-6 bg-[#F8F9FC] min-h-screen space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={14} className="text-gray-400" />
                        <Input 
                            type="date" 
                            className="border-none bg-transparent h-8 w-36 text-xs font-bold focus-visible:ring-0" 
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                        />
                    </div>
                    <div className="w-px h-6 bg-gray-100" />
                    <div className="flex items-center gap-2 px-3">
                        <Calendar size={14} className="text-gray-400" />
                        <Input 
                            type="date" 
                            className="border-none bg-transparent h-8 w-36 text-xs font-bold focus-visible:ring-0" 
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                        />
                    </div>
                    <div className="w-px h-6 bg-gray-100" />
                    <div className="flex items-center gap-2 px-3">
                        <Briefcase size={14} className="text-gray-400" />
                        <select 
                            className="border-none bg-transparent h-8 text-xs font-bold focus-visible:ring-0 outline-none text-gray-600"
                            value={selectedClient}
                            onChange={(e) => setSelectedClient(e.target.value)}
                        >
                            <option value="">Todos os Clientes</option>
                            {clients.map(c => (
                                <option key={c.id} value={c.id}>{c.nome_fantasia}</option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <Button variant="outline" className="rounded-xl bg-white border-gray-100 text-xs font-bold gap-2 shadow-sm">
                    <Download size={14} />
                    Exportar Candidatos
                </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between border-l-4 border-l-red-600">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Total de Leads</p>
                        <h3 className="text-3xl font-black text-gray-900 mt-1">{candidates?.length || 0}</h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-red-600" />
                        currículos recebidos
                    </div>
                </Card>
                
                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Novos no Período</p>
                        <h3 className="text-3xl font-black text-blue-600 mt-1">
                            {candidates?.filter((c: any) => c.status === 'New').length || 0}
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-blue-600" />
                        aguardando triagem
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Em Entrevista</p>
                        <h3 className="text-3xl font-black text-orange-600 mt-1">
                            {candidates?.filter((c: any) => c.status === 'Interview').length || 0}
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-orange-600" />
                        processo avançado
                    </div>
                </Card>

                <Card className="p-6 border-none shadow-sm rounded-3xl bg-white flex flex-col justify-between">
                    <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-gray-400">Contratados</p>
                        <h3 className="text-3xl font-black text-green-600 mt-1">
                            {candidates?.filter((c: any) => c.status === 'Hired').length || 0}
                        </h3>
                    </div>
                    <div className="mt-4 flex items-center gap-2 text-[10px] font-bold text-gray-400">
                        <span className="w-2 h-2 rounded-full bg-green-600" />
                        sucesso no recrutamento
                    </div>
                </Card>
            </div>

            <Card className="border-none shadow-sm rounded-3xl bg-white overflow-hidden">
                <div className="p-6 border-b border-gray-50 flex items-center gap-3 bg-gray-50/10">
                    <FileText size={18} className="text-red-600" />
                    <h3 className="text-sm font-black text-gray-900 uppercase tracking-tight">Fluxo de Talentos para Clientes</h3>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-gray-50/30 text-[10px] font-bold uppercase tracking-[0.15em] text-gray-400 border-b border-gray-50">
                                <th className="px-8 py-5">Candidato</th>
                                <th className="px-6 py-5">Vaga / Oportunidade</th>
                                <th className="px-6 py-5 text-center">Status</th>
                                <th className="px-6 py-5">Data de Envio</th>
                                <th className="px-6 py-5 text-right pr-8">Ação</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center">
                                        <div className="w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full animate-spin mx-auto" />
                                    </td>
                                </tr>
                            ) : candidates?.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="py-20 text-center text-gray-300 font-bold">
                                        Nenhum currículo encontrado no período.
                                    </td>
                                </tr>
                            ) : candidates?.map((candidate: any) => (
                                <tr key={candidate.id} className="hover:bg-gray-50/50 transition-colors">
                                    <td className="px-8 py-5">
                                        <div className="flex flex-col">
                                            <span className="text-sm font-bold text-gray-900">{candidate.name}</span>
                                            <div className="flex items-center gap-3 mt-1 text-[10px] font-bold text-gray-400">
                                                <span className="flex items-center gap-1"><Mail size={10} /> {candidate.email}</span>
                                                <span className="flex items-center gap-1"><Phone size={10} /> {candidate.phone}</span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5">
                                        <div className="flex items-center gap-2">
                                            <Briefcase size={14} className="text-gray-300" />
                                            <span className="text-xs font-bold text-gray-600">{candidate.job}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-5 text-center">
                                        <span className={cn(
                                            "inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                            candidate.status === 'New' ? "bg-blue-50 text-blue-600" :
                                            candidate.status === 'Interview' ? "bg-orange-50 text-orange-600" :
                                            candidate.status === 'Hired' ? "bg-green-50 text-green-600" :
                                            "bg-gray-100 text-gray-600"
                                        )}>
                                            {candidate.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-5 text-xs font-bold text-gray-500">
                                        {candidate.created_at}
                                    </td>
                                    <td className="px-6 py-5 text-right pr-8">
                                        <Button 
                                            variant="ghost" 
                                            onClick={() => openResume(candidate.id)}
                                            className="h-8 px-4 text-[10px] font-black uppercase tracking-widest text-red-600 hover:bg-red-50 rounded-lg"
                                        >
                                            Visualizar
                                        </Button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Modal de Currículo */}
            {resumeModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
                    <div className="relative h-[85vh] w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-2xl">
                        <div className="flex items-center justify-between border-b px-5 py-3">
                            <span className="font-semibold text-slate-700">Visualizador de Currículo</span>
                            <div className="flex gap-2">
                                <a
                                    href={resumeModal}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-200"
                                >
                                    Abrir em nova aba
                                </a>
                                <button
                                    onClick={() => setResumeModal(null)}
                                    className="rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                                >
                                    Fechar
                                </button>
                            </div>
                        </div>
                        <iframe src={resumeModal} className="h-full w-full" title="Currículo" />
                    </div>
                </div>
            )}
        </div>
    );
}
