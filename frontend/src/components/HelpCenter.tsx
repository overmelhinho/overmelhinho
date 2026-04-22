import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Sparkles, 
  Lightbulb, 
  PlayCircle, 
  CheckCircle2,
  AlertCircle,
  BookOpen
} from 'lucide-react';

interface HelpContent {
  title: string;
  description: string;
  steps: string[];
  tip?: string;
  warning?: string;
}

const HELP_REGISTRY: Record<string, HelpContent> = {
  '/dashboard': {
    title: 'Painel de Controle',
    description: 'Aqui você visualiza um resumo em tempo real da performance do seu portal.',
    steps: [
      'Acompanhe o crescimento de novos clientes e leads.',
      'Verifique os indicadores financeiros rápidos (KPIs).',
      'Identifique gargalos na operação logo no início do dia.'
    ],
    tip: 'Os dados são atualizados em tempo real conforme as assinaturas e leads entram no sistema.'
  },
  '/clientes': {
    title: 'Gestão de Clientes',
    description: 'Esta é o coração do portal, onde você gerencia as empresas cadastradas.',
    steps: [
      'Use o botão "+ Novo" para cadastrar uma nova empresa.',
      'Apenas clientes com status "Ativo" e plano "Pagante" aparecem com destaque no site.',
      'Mantenha as informações de contato (WhatsApp) sempre atualizadas.'
    ],
    tip: 'Empresas sem logotipo ou descrição completa tendem a converter menos cliques.'
  },
  '/leads-kanban': {
    title: 'Funil de Vendas (Leads)',
    description: 'Gerencie potenciais clientes interessados nos portal.',
    steps: [
      'Arraste os cards entre as colunas conforme o progresso da negociação.',
      'Não deixe leads parados na coluna "Novo" por mais de 24 horas.',
      'Ao fechar negócio, converta o lead em um Cliente real.'
    ],
    warning: 'Leads não respondidos esfriam rápido. A velocidade de contato é o segredo.'
  },
  '/auditoria': {
    title: 'Fila de Conferência',
    description: 'Garanta a qualidade dos dados antes que eles fiquem disponíveis para o público.',
    steps: [
      'Compare os dados atuais com as informações sugeridas pela IA.',
      'Verifique se fotos e telefones estão corretos.',
      'Aprove ou Rejeite as alterações para manter a base limpa.'
    ],
    tip: 'A IA ajuda a encontrar erros grotescos de digitação, economizando tempo de revisão.'
  },
  '/financeiro': {
    title: 'Gestão Financeira',
    description: 'Controle de faturas, faturamentos e inadimplência.',
    steps: [
      'Acompanhe os recebimentos pendentes e vencidos.',
      'Gere segundas vias de faturas para clientes.',
      'Verifique a sincronização com o sistema de billing (Tiny).'
    ],
    warning: 'Faturas atrasadas acima de 15 dias devem ser monitoradas para possível suspensão do serviço.'
  },
  '/campanhas': {
    title: 'Campanhas e Anúncios',
    description: 'Gerencie os banners e espaços publicitários vendidos.',
    steps: [
      'Defina as datas de início e fim da veiculação.',
      'Suba as artes nos formatos Desktop e Mobile para garantir a performance.',
      'Vincule a campanha ao cliente correto para garantir o faturamento.'
    ],
    tip: 'Campanhas com URL de destino (link) geram muito mais cliques que imagens estáticas.'
  },
  '/orcamentos': {
    title: 'Orçamentos Inteligentes',
    description: 'Acompanhe as solicitações de cotação feitas pelos usuários do site.',
    steps: [
      'Analise a intenção de compra capturada pela IA.',
      'Distribua as oportunidades para as empresas parceiras.',
      'Monitore o status de atendimento de cada orçamento.'
    ]
  },
  '/radar-oportunidades': {
    title: 'Radar de Oportunidades',
    description: 'Visualize onde estão as melhores chances de fechamento baseadas no comportamento do site.',
    steps: [
      'Analise os bairros e categorias com maior demanda.',
      'Identifique lacunas de mercado para oferecer a novos clientes.',
      'Foque seus esforços de venda nas "zonas quentes" mapeadas.'
    ],
    tip: 'Empresas em categorias saturadas precisam de pacotes de destaque para converter.'
  },
  '/radar-prospeccao': {
    title: 'Radar de Prospecção (Google)',
    description: 'Encontre empresas que ainda não estão no portal diretamente via Google Maps.',
    steps: [
      'Filtre por cidade e segmento para encontrar potenciais clientes.',
      'Verifique se a empresa já possui site ou se precisa da nossa solução.',
      'Inicie o contato diretamente com as informações encontradas pela IA.'
    ],
    tip: 'Empresas com "Poucas Estrelas" no Google são excelentes leads para nossa consultoria de presença digital.'
  },
  '/relatorios': {
    title: 'Relatórios e Inteligência',
    description: 'Dados consolidados sobre faturamento, tráfego e conversão.',
    steps: [
      'Extraia relatórios mensais para prestar contas aos anunciantes.',
      'Acompanhe o ROI de cada categoria do portal.',
      'Identifique tendências de busca sazonal.'
    ],
    warning: 'Relatórios podem demorar alguns segundos para processar grandes volumes de dados históricos.'
  },
  '/tickets': {
    title: 'Central de Suporte (Tickets)',
    description: 'Gerencie dúvidas, problemas técnicos e solicitações dos clientes.',
    steps: [
      'Responda tickets pendentes por ordem de prioridade.',
      'Mantenha o cliente informado sobre o progresso da solicitação.',
      'Encerre tickets apenas após a confirmação de resolução.'
    ],
    tip: 'Muitos problemas recorrentes podem ser evitados enviando o link da documentação ao cliente.'
  },
  '/usuarios': {
    title: 'Gestão de Usuários',
    description: 'Controle quem tem acesso ao painel administrativo e quais são suas permissões.',
    steps: [
      'Cadastre novos membros da equipe.',
      'Atribua funções (Roles) específicas para limitar o acesso.',
      'Monitore o último acesso de cada usuário.'
    ]
  },
  '/configuracoes': {
    title: 'Configurações do Sistema',
    description: 'Ajustes globais do portal, integrações e parâmetros da IA.',
    steps: [
      'Gerencie as chaves de API e tokens de integração.',
      'Ajuste os valores padrão de comissão e planos.',
      'Configure as regras de visibilidade automática.'
    ]
  },
  '/minha-conta': {
    title: 'Minha Conta',
    description: 'Gerencie seu perfil pessoal, altere sua senha e preferências de notificação.',
    steps: [
      'Mantenha seu e-mail e telefone de contato sempre atualizados.',
      'Altere sua senha periodicamente para maior segurança.',
      'Personalize como você deseja receber alertas do sistema.'
    ]
  }
};

const DEFAULT_HELP: HelpContent = {
  title: 'Central de Ajuda',
  description: 'Bem-vindo ao painel administrativo. Navegue pelos módulos para ver orientações específicas.',
  steps: [
    'Utilize o menu lateral para alternar entre as ferramentas.',
    'Se tiver dúvidas em uma tela específica, clique neste botão novamente.',
    'Mantenha seu portal atualizado para garantir a melhor experiência aos usuários.'
  ]
};

interface HelpCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function HelpCenter({ isOpen, onClose }: HelpCenterProps) {
  const location = useLocation();
  const navigate = useNavigate();
  
  // Encontra o conteúdo de ajuda baseado na rota atual
  const currentPath = location.pathname;
  const content = HELP_REGISTRY[currentPath] || 
                  Object.entries(HELP_REGISTRY).find(([key]) => currentPath.startsWith(key))?.[1] || 
                  DEFAULT_HELP;

  return (
    <>
      {/* Drawer Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div key="help-center-portal">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[10000]"
            />
            
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-sm bg-white shadow-[-20px_0_60px_-15px_rgba(0,0,0,0.1)] z-[10001] flex flex-col border-l border-gray-100"
            >
              {/* Header */}
              <div className="p-6 border-b border-gray-50 flex items-center justify-between bg-gray-50/50">
                <div className="flex items-center gap-3">
                  <div className="bg-[#B70F0A]/10 p-2.5 rounded-xl">
                    <HelpCircle className="text-[#B70F0A]" size={22} />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-gray-900 tracking-tight">Ajuda Inteligente</h2>
                    <p className="text-[10px] uppercase font-bold text-gray-400 tracking-widest">Contexto Atual</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-200/50 rounded-full transition-colors text-gray-400 hover:text-gray-600"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
                
                {/* Intro Section */}
                <div className="space-y-3">
                  <h3 className="text-2xl font-black text-gray-900 tracking-tighter leading-tight">
                    {content.title}
                  </h3>
                  <p className="text-gray-500 font-medium leading-relaxed">
                    {content.description}
                  </p>
                </div>

                {/* Steps Section */}
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-[#B70F0A]">
                    <PlayCircle size={16} />
                    <span className="text-xs font-black uppercase tracking-widest">O que fazer aqui?</span>
                  </div>
                  <div className="space-y-3">
                    {content.steps.map((step, i) => (
                      <div key={i} className="flex gap-3 group">
                        <div className="mt-1">
                          <CheckCircle2 size={16} className="text-green-500" />
                        </div>
                        <p className="text-sm font-semibold text-gray-700 leading-snug group-hover:text-gray-900 transition-colors">
                          {step}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Tip Section (if exists) */}
                {content.tip && (
                  <div className="bg-blue-50/50 border border-blue-100 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-blue-600">
                      <Lightbulb size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Dica de Ouro</span>
                    </div>
                    <p className="text-sm font-semibold text-blue-900/80 leading-relaxed">
                      {content.tip}
                    </p>
                  </div>
                )}

                {/* Warning Section (if exists) */}
                {content.warning && (
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 space-y-2">
                    <div className="flex items-center gap-2 text-amber-600">
                      <AlertCircle size={16} />
                      <span className="text-[10px] font-black uppercase tracking-widest">Importante</span>
                    </div>
                    <p className="text-sm font-semibold text-amber-900/80 leading-relaxed">
                      {content.warning}
                    </p>
                  </div>
                )}

                {/* Resource Hub Placeholder */}
                <div className="pt-8 border-t border-gray-100">
                  <div className="flex items-center gap-2 mb-4 text-gray-400">
                    <BookOpen size={16} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Central de Conhecimento</span>
                  </div>
                  <button 
                    onClick={() => {
                      navigate('/documentacao');
                      onClose();
                    }}
                    className="w-full text-left p-4 rounded-xl border border-gray-100 hover:border-[#B70F0A]/20 hover:bg-gray-50 transition-all flex items-center justify-between group"
                  >
                    <span className="text-sm font-bold text-gray-600 group-hover:text-[#B70F0A]">Ver documentação completa</span>
                    <Sparkles size={16} className="text-gray-300 group-hover:text-[#B70F0A]" />
                  </button>
                </div>

              </div>

              {/* Footer */}
              <div className="p-6 bg-gray-50 border-t border-gray-100">
                <p className="text-[10px] text-center text-gray-400 font-bold uppercase tracking-tight">
                  Suporte O Vermelhinho v1.0
                </p>
              </div>

            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
