import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BookOpen, 
  Users, 
  Target, 
  BarChart3, 
  Ticket, 
  Settings, 
  ShieldCheck, 
  LayoutDashboard,
  Search,
  MessageSquare,
  Sparkles,
  X,
  CheckCircle2
} from 'lucide-react';

const DOC_SECTIONS = [
  {
    title: 'Dashboard',
    icon: LayoutDashboard,
    description: 'Visão geral do portal com métricas em tempo real e KPIs financeiros.',
    color: 'blue'
  },
  {
    title: 'Gestão de Clientes',
    icon: Users,
    description: 'Cadastro e gerenciamento de empresas, planos e visibilidade no portal.',
    color: 'red'
  },
  {
    title: 'Radar de Oportunidades',
    icon: Target,
    description: 'Mapeamento de demanda e identificação de nichos lucrativos.',
    color: 'orange'
  },
  {
    title: 'Radar de Prospecção',
    icon: Search,
    description: 'Ferramenta de busca inteligente via Google Maps para captação de novos clientes.',
    color: 'green'
  },
  {
    title: 'Suporte e Tickets',
    icon: Ticket,
    description: 'Central de atendimento para suporte técnico e comercial.',
    color: 'purple'
  },
  {
    title: 'Relatórios e BI',
    icon: BarChart3,
    description: 'Análise detalhada de tráfego, conversão e faturamento por categoria.',
    color: 'indigo'
  },
  {
    title: 'Auditoria e IA',
    icon: ShieldCheck,
    description: 'Sistema de conferência assistida por IA para garantir a qualidade dos dados.',
    color: 'emerald'
  },
  {
    title: 'Campanhas',
    icon: MessageSquare,
    description: 'Gestão de banners, espaços publicitários e campanhas de marketing.',
    color: 'pink'
  },
  {
    title: 'Configurações',
    icon: Settings,
    description: 'Parâmetros globais, permissões de usuários e integrações de API.',
    color: 'slate'
  }
];

export default function DocumentationPage() {
  const [selectedSection, setSelectedSection] = React.useState<typeof DOC_SECTIONS[0] | null>(null);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between border-b border-slate-200 pb-8">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <BookOpen className="text-[#B70F0A]" size={32} />
            Documentação do Sistema
          </h1>
          <p className="mt-2 text-slate-500 font-medium">
            Guia completo de utilização dos módulos do ecossistema O Vermelhinho.
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 text-amber-700 text-sm font-bold">
          <Sparkles size={16} />
          Suporte v1.0 (Interno)
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {DOC_SECTIONS.map((section, idx) => (
          <div 
            key={idx}
            className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm hover:shadow-md transition-all hover:-translate-y-1"
          >
            <div className={`inline-flex rounded-xl bg-${section.color}-50 p-3 text-${section.color}-600 group-hover:scale-110 transition-transform`}>
              <section.icon size={24} />
            </div>
            <h3 className="mt-4 text-lg font-bold text-slate-900">{section.title}</h3>
            <p className="mt-2 text-sm text-slate-500 leading-relaxed">
              {section.description}
            </p>
            <button 
              onClick={() => setSelectedSection(section)}
              className="mt-6 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-[#B70F0A] hover:opacity-80 transition-opacity"
            >
              Ver Detalhes →
            </button>
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-slate-900 p-8 text-white relative overflow-hidden">
        <div className="relative z-10">
          <h2 className="text-2xl font-bold">Precisa de ajuda adicional?</h2>
          <p className="mt-2 text-slate-400 max-w-lg">
            Nossa equipe de suporte técnico está disponível via ticket para resolver questões específicas ou bugs encontrados na plataforma.
          </p>
          <button className="mt-6 rounded-xl bg-white px-6 py-3 text-sm font-black text-slate-900 hover:bg-slate-100 transition-colors uppercase tracking-tight">
            Abrir Ticket de Suporte
          </button>
        </div>
        <BookOpen className="absolute -right-12 -bottom-12 h-64 w-64 text-slate-800 opacity-20 -rotate-12" />
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedSection && (
          <div className="fixed inset-0 z-[10002] flex items-center justify-center p-4 sm:p-6">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedSection(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="relative w-full max-w-2xl overflow-hidden rounded-3xl bg-white shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/50 p-6">
                <div className="flex items-center gap-3">
                  <div className={`rounded-xl bg-${selectedSection.color}-50 p-2 text-${selectedSection.color}-600`}>
                    <selectedSection.icon size={20} />
                  </div>
                  <h2 className="text-xl font-black text-slate-900">{selectedSection.title}</h2>
                </div>
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="rounded-full p-2 hover:bg-slate-200 transition-colors"
                >
                  <X size={20} className="text-slate-400" />
                </button>
              </div>
              <div className="p-8 space-y-6">
                <p className="text-lg text-slate-600 font-medium leading-relaxed">
                  {selectedSection.description}
                </p>
                <div className="space-y-4">
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">Guia de Uso</h4>
                  <div className="grid gap-3">
                    {[
                      'Inicie acessando o módulo através do menu lateral.',
                      'Utilize os filtros de busca para localizar registros específicos.',
                      'Clique nos registros para abrir a visualização detalhada ou edição.',
                      'Sempre salve suas alterações antes de sair da página.'
                    ].map((step, i) => (
                      <div key={i} className="flex gap-3 items-start">
                        <div className="mt-1 rounded-full bg-emerald-50 p-1 text-emerald-600">
                          <CheckCircle2 size={12} />
                        </div>
                        <p className="text-sm font-semibold text-slate-700">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              <div className="border-t border-slate-100 bg-slate-50 p-6 flex justify-end">
                <button 
                  onClick={() => setSelectedSection(null)}
                  className="rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 transition-colors uppercase tracking-tight"
                >
                  Entendi, fechar
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
