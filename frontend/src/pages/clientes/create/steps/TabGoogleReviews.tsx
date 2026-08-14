import { useState, useEffect } from "react";
import { useFormikContext } from "formik";
import { Plus, Star, RefreshCw, CheckCircle2, AlertCircle, Search, MapPin, X, User } from "lucide-react";
import axios from "@/services/api";
import toast from "react-hot-toast";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function TabGoogleReviews() {
    const { values, setFieldValue, handleChange } = useFormikContext<any>();
    const [reviews, setReviews] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const [lookingUp, setLookingUp] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

    // Estado para o Modal Manual
    const [isManualModalOpen, setIsManualModalOpen] = useState(false);
    const [manualReview, setManualReview] = useState({
        author_name: "",
        rating: 5,
        text: "",
        author_photo_url: ""
    });

    const placeId = values.google_place_id;
    const isCreateMode = !values.id;

    const getReviewId = (r: any) => {
        if (r.google_review_id) return String(r.google_review_id);
        const author = r.author_name || "anon";
        const time = r.time || "0";
        const slug = author.toLowerCase().replace(/[^a-z0-9]+/g, '');
        return `${values.id || 'new'}_${time}_${slug}`;
    };

    // Sincroniza seleção visual com os dados do Formik
    useEffect(() => {
        const currentReviews = values.reviews || [];
        if (Array.isArray(currentReviews)) {
            const ids = new Set<string>();
            currentReviews.forEach((r: any) => {
                const rid = getReviewId(r);
                if (rid) ids.add(rid);
            });
            setSelectedIds(ids);

            // Se o Formik tem dados e a tela está vazia (ex: ao voltar na aba), mostra os salvos
            if (reviews.length === 0 && currentReviews.length > 0) {
                setReviews([...currentReviews]);
            }
        }
    }, [values.reviews, values.id]);

    const handleLookup = async () => {
        if (!values.nome_fantasia || !values.cidade) {
            toast.error("Preencha Nome e Cidade para buscar no Google.");
            return;
        }
        setLookingUp(true);
        try {
            const query = `${values.nome_fantasia} ${values.cidade}`;
            const { data } = await axios.get("/v1/clientes/google-lookup", { params: { query } });
            if (data.success && data.details) {
                setFieldValue("google_place_id", data.details.place_id);
                toast.success("Place ID encontrado!");
            } else {
                toast.error("Não encontramos este local.");
            }
        } catch (err) {
            toast.error("Erro na busca do Google.");
        } finally {
            setLookingUp(false);
        }
    };

    const fetchReviews = async () => {
        if (!placeId) {
            toast.error("Configure o Google Place ID primeiro.");
            return;
        }
        setLoading(true);
        try {
            let endpoint = `/v1/clientes/${values.id}/google-reviews`;
            let params: any = {
                place_id: placeId,
                nome: values.nome_fantasia,
                cidade: values.cidade
            };

            if (isCreateMode) {
                endpoint = `/v1/clientes/google-reviews-lookup`;
            }

            const { data } = await axios.get(endpoint, { params });
            if (data.success) {
                setReviews(data.reviews || []);
                if ((data.reviews || []).length === 0) {
                    toast.error("Nenhum comentário encontrado para este local.");
                }
            } else {
                toast.error(data.message || "Erro ao carregar comentários.");
            }
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Erro ao buscar reviews do Google.");
        } finally {
            setLoading(false);
        }
    };

    const toggleSelection = (r: any) => {
        const id = getReviewId(r);
        if (!id) return;

        const next = new Set(selectedIds);
        let currentList = [...(values.reviews || [])];

        if (next.has(id)) {
            next.delete(id);
            currentList = currentList.filter((x: any) => getReviewId(x) !== id);
        } else {
            next.add(id);
            currentList.push({
                ...r,
                google_review_id: id,
                author_photo_url: r.author_photo_url || r.profile_photo_url || null
            });
        }
        setFieldValue("reviews", currentList);
    };

    const handleAddManual = () => {
        if (!manualReview.author_name) {
            toast.error("Preencha o nome do autor.");
            return;
        }

        const newReview = {
            ...manualReview,
            relative_time_description: "Inserido manualmente",
            time: Date.now() / 1000
        };

        setReviews([newReview, ...reviews]);
        toggleSelection(newReview);
        toast.success("Depoimento adicionado!");
        setIsManualModalOpen(false);
        setManualReview({ author_name: "", rating: 5, text: "", author_photo_url: "" });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 bg-gray-50 p-4 rounded-xl border">
                <div className="flex-1">
                    <label className="text-sm font-medium text-gray-600 mb-1 flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#B70F0A]" /> Google Place ID
                    </label>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            name="google_place_id"
                            placeholder="Chave única (ex: ChIJ...)"
                            value={values.google_place_id || ""}
                            onChange={handleChange}
                            className="border rounded-md px-3 py-2 w-full focus:ring-2 focus:ring-[#B70F0A] bg-white text-sm"
                        />
                        <button
                            type="button"
                            onClick={handleLookup}
                            disabled={lookingUp}
                            className="p-2 border rounded-md bg-white hover:bg-gray-100 text-[#B70F0A]"
                            title="Buscar ID no Maps"
                        >
                            <Search className={`w-4 h-4 ${lookingUp ? "animate-spin" : ""}`} />
                        </button>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={fetchReviews}
                    disabled={!placeId || loading}
                    className="inline-flex items-center justify-center gap-2 px-6 py-2 bg-white border rounded-md hover:bg-gray-100 disabled:opacity-50 text-sm font-medium h-[40px]"
                >
                    <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                    {loading ? "Buscando..." : "Carregar Comentários"}
                </button>
            </div>

            <div className="flex items-center justify-between w-full">
                <div>
                    <h3 className="text-lg font-semibold text-[#B70F0A] flex items-center gap-2">
                        <Star className="w-5 h-5" /> Comentários Disponíveis
                    </h3>
                    <p className="text-sm text-gray-500">
                        Selecione ou adicione depoimentos de alta qualidade.
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsManualModalOpen(true)}
                    className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium bg-green-50 text-green-700 border border-green-200 rounded-lg hover:bg-green-100 transition-colors"
                >
                    <Plus className="w-4 h-4" /> Adicionar Manualmente
                </button>
            </div>

            {!placeId && (
                <div className="p-10 border-2 border-dashed rounded-xl text-center space-y-3">
                    <AlertCircle className="w-10 h-10 text-gray-400 mx-auto" />
                    <p className="text-gray-600 font-medium">Place ID não configurado.</p>
                </div>
            )}

            {placeId && reviews.length === 0 && !loading && (
                <div className="p-10 border rounded-xl text-center text-gray-500 text-sm italic">
                    Nenhum comentário carregado. Clique em "Carregar Comentários".
                </div>
            )}

            {reviews.length > 0 && (
                <div className="grid grid-cols-1 gap-4">
                    {[...reviews]
                        .sort((a, b) => Number(b.rating || 0) - Number(a.rating || 0))
                        .map((r, idx) => {
                            const id = getReviewId(r);
                            const isSelected = selectedIds.has(id);
                            const photoUrl = r.author_photo_url || r.profile_photo_url || "";
                            const rating = Number(r.rating || 0);

                            return (
                                <div
                                    key={id}
                                    onClick={() => toggleSelection(r)}
                                    className={`p-4 border rounded-xl cursor-pointer transition-all flex gap-4 ${isSelected ? "border-green-500 bg-green-50 shadow-sm" : "hover:border-gray-400 bg-white"
                                        }`}
                                >
                                    <div className="relative flex-shrink-0">
                                        {photoUrl ? (
                                            <img
                                                src={photoUrl}
                                                alt={r.author_name}
                                                className="w-12 h-12 rounded-full border shadow-sm object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full border bg-gray-100 flex items-center justify-center text-gray-400 font-bold">
                                                {r.author_name?.charAt(0)}
                                            </div>
                                        )}
                                        {isSelected && (
                                            <CheckCircle2 className="w-5 h-5 text-green-600 absolute -top-1 -right-1 bg-white rounded-full" />
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex items-center justify-between">
                                            <span className="font-semibold text-sm">{r.author_name}</span>
                                            <span className="text-xs text-gray-400">
                                                {r.relative_time_description}
                                            </span>
                                        </div>
                                        <div className="flex gap-0.5 my-1">
                                            {[...Array(5)].map((_, i) => (
                                                <Star
                                                    key={i}
                                                    className={`w-3 h-3 ${i < rating ? "text-yellow-400 fill-yellow-400" : "text-gray-300"
                                                        }`}
                                                />
                                            ))}
                                        </div>
                                        <p className="text-sm text-gray-700 line-clamp-3 italic">
                                            "{r.text}"
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                </div>
            )}

            <Dialog open={isManualModalOpen} onOpenChange={setIsManualModalOpen}>
                <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold text-[#B70F0A] flex items-center gap-2">
                            <Plus className="w-6 h-6" /> Novo Depoimento
                        </DialogTitle>
                    </DialogHeader>

                    <div className="space-y-5 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Nome do Autor</label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="text"
                                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#B70F0A]/20 focus:border-[#B70F0A] outline-none transition-all"
                                    placeholder="Ex: João Silva"
                                    value={manualReview.author_name}
                                    onChange={(e) => setManualReview({ ...manualReview, author_name: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Avaliação</label>
                            <div className="flex gap-2">
                                {[1, 2, 3, 4, 5].map((s) => (
                                    <button
                                        key={s}
                                        type="button"
                                        onClick={() => setManualReview({ ...manualReview, rating: s })}
                                        className="transition-transform active:scale-95"
                                    >
                                        <Star
                                            className={`w-8 h-8 ${s <= manualReview.rating ? "text-yellow-400 fill-yellow-400" : "text-slate-200"}`}
                                        />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">Depoimento</label>
                            <textarea
                                rows={4}
                                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#B70F0A]/20 focus:border-[#B70F0A] outline-none transition-all resize-none text-sm"
                                placeholder="Escreva aqui o comentário do cliente..."
                                value={manualReview.text}
                                onChange={(e) => setManualReview({ ...manualReview, text: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-semibold text-slate-700">URL da Foto (opcional)</label>
                            <input
                                type="text"
                                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-[#B70F0A]/20 focus:border-[#B70F0A] outline-none transition-all text-xs"
                                placeholder="https://link-da-imagem.com/foto.jpg"
                                value={manualReview.author_photo_url}
                                onChange={(e) => setManualReview({ ...manualReview, author_photo_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-3">
                        <Button
                            variant="ghost"
                            onClick={() => setIsManualModalOpen(false)}
                            className="rounded-xl"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleAddManual}
                            className="bg-[#B70F0A] hover:bg-[#8e0c08] text-white rounded-xl px-8"
                        >
                            Adicionar Depoimento
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
