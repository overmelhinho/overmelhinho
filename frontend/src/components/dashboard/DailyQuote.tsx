import { useState, useEffect } from "react";
import { Sparkles, X, Heart, Sun, Coffee } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

type User = {
  name: string;
  [key: string]: any;
};

type DailyQuoteProps = {
  user?: User | null;
};

const quotes = [
  { text: "Acredite na força que há em você. Seu potencial é ilimitado e você está no comando do seu próprio sucesso hoje.", category: "empoderamento" },
  { text: "A perfeição é um mito. O seu progresso real e a sua dedicação diária são o que verdadeiramente importam.", category: "equilibrio" },
  { text: "Você é mais forte do que imagina. Abrace suas qualidades únicas e faça do dia de hoje um passo em direção aos seus sonhos.", category: "autoestima" },
  { text: "Cuidar de si mesma não é egoísmo, é necessidade. Reserve alguns minutos hoje para respirar fundo e recarregar suas energias.", category: "bem-estar" },
  { text: "Não diminua suas conquistas. Cada pequeno passo que você deu até aqui exigiu coragem e determinação. Orgulhe-se!", category: "autoestima" },
  { text: "Você não precisa dar conta de tudo o tempo todo. Priorize o que é essencial hoje e faça o seu melhor com tranquilidade.", category: "foco" },
  { text: "Liderança não é sobre ser perfeita, mas sobre inspirar outros através da sua autenticidade e dedicação diária.", category: "empoderamento" },
  { text: "Os desafios de hoje são apenas as ferramentas que constroem a sua versão mais forte e resiliente de amãnhã.", category: "resiliencia" },
  { text: "Seja sua maior fã. A autoconfiança é o acessório mais poderoso que você pode vestir hoje.", category: "autoestima" },
  { text: "Sua mente é um espaço sagrado. Alimente-a com pensamentos de progresso, aceitação e carinho por si mesma.", category: "bem-estar" },
  { text: "Que o seu foco de hoje seja a sua própria evolução. Você está competindo apenas com quem você era ontem.", category: "foco" },
  { text: "Você tem a capacidade de transformar qualquer obstáculo em oportunidade. Confie no seu talento e siga firme.", category: "resiliencia" },
  { text: "Ser produtiva também significa saber quando parar e respirar. A sua paz mental é a base do seu sucesso.", category: "equilibrio" },
  { text: "Nunca duvide do impacto da sua voz e das suas ideias. O mundo precisa da sua perspectiva única.", category: "empoderamento" },
  { text: "O sucesso é construído com consistência, não com pressa. Dê o seu melhor hoje e confie no processo.", category: "foco" },
  { text: "Sua resiliência é inspiradora. Continue trilhando seu caminho com a cabeça erguida e o coração cheio de determinação.", category: "resiliencia" },
  { text: "Você é a arquiteta da sua própria felicidade. Que o seu dia seja repleto de realizações e momentos de bem-estar.", category: "bem-estar" },
  { text: "A gentileza com você mesma é o melhor ponto de partida para qualquer tarefa difícil. Trate-se com carinho hoje.", category: "equilibrio" },
  { text: "Você é capaz de realizar coisas incríveis quando confia na sua intuição e no seu preparo profissional.", category: "autoestima" },
  { text: "Defina suas prioridades, proteja sua energia e lembre-se de respirar fundo diante dos momentos de maior correria.", category: "foco" },
  { text: "Grandes mentes não seguem caminhos prontos, elas criam novas trilhas. Confie na sua criatividade hoje!", category: "empoderamento" },
  { text: "O equilíbrio perfeito não existe, mas a busca por dias mais leves e produtivos é um excelente caminho.", category: "equilibrio" },
  { text: "Que a sua dedicação de hoje seja acompanhada de orgulho por tudo o que você já construiu até aqui.", category: "autoestima" },
  { text: "Nenhuma barreira é grande o suficiente quando você se lembra da força que carrega no peito. Tenha um dia incrível!", category: "resiliencia" },
  { text: "Aproveite o dia de hoje para focar no que você pode controlar. Faça o seu trabalho com amor, calma e determinação.", category: "foco" },
  { text: "Você brilha mais quando é fiel à sua essência. Tenha orgulho de quem você é e do trabalho que realiza.", category: "autoestima" },
  { text: "Uma mente calma é a melhor ferramenta para resolver qualquer desafio complexo. Respire e confie no seu conhecimento.", category: "equilibrio" },
  { text: "Seu esforço e sua inteligência são os motores que te movem em direção ao topo. Acredite na sua competência.", category: "empoderamento" },
  { text: "Lembre-se de beber água, alongar-se e dar pequenos intervalos para descansar a mente. Seu corpo agradece!", category: "bem-estar" },
  { text: "Você é merecedora de todo o sucesso e de toda a paz que constrói com as suas próprias mãos todos os dias.", category: "autoestima" },
  { text: "Feche o ciclo de hoje orgulhando-se de cada desafio que superou. Você é extraordinária!", category: "resiliencia" }
];

export default function DailyQuote({ user: propUser }: DailyQuoteProps) {
  const { user: authUser } = useAuth();
  const user = propUser || authUser;
  const [isVisible, setIsVisible] = useState(false);
  const [currentQuote, setCurrentQuote] = useState<{ text: string; category: string } | null>(null);
  
  const todayStr = new Date().toDateString();
  const storageKey = `daily_quote_dismissed_${todayStr}`;

  useEffect(() => {
    // Verifica se já foi fechada hoje
    const isDismissed = localStorage.getItem(storageKey);
    if (!isDismissed) {
      setIsVisible(true);
    }

    // Seleciona a frase baseada no dia do mês (1 a 31)
    const day = new Date().getDate();
    const quoteIndex = (day - 1) % quotes.length;
    setCurrentQuote(quotes[quoteIndex]);
  }, [storageKey]);

  const handleDismiss = () => {
    localStorage.setItem(storageKey, "true");
    setIsVisible(false);
  };

  const getGreeting = () => {
    const hr = new Date().getHours();
    if (hr < 12) return "Bom dia";
    if (hr < 18) return "Boa tarde";
    return "Boa noite";
  };

  if (!isVisible || !currentQuote) return null;

  // Seleção de ícones baseados na categoria
  const renderIcon = () => {
    switch (currentQuote.category) {
      case "empoderamento":
        return <Sparkles className="h-6 w-6 text-pink-500" />;
      case "equilibrio":
        return <Coffee className="h-6 w-6 text-amber-500" />;
      case "bem-estar":
        return <Sun className="h-6 w-6 text-orange-500" />;
      default:
        return <Heart className="h-6 w-6 text-rose-500" />;
    }
  };

  return (
    <div className="relative overflow-hidden mb-6 rounded-3xl border border-rose-100 bg-gradient-to-r from-rose-50/60 via-pink-50/40 to-amber-50/50 p-6 shadow-sm backdrop-blur-sm transition-all hover:shadow-md md:p-8">
      {/* Botão de Fechar */}
      <button 
        onClick={handleDismiss}
        className="absolute top-4 right-4 rounded-full p-1 text-gray-400 hover:bg-white/80 hover:text-gray-600 transition"
        aria-label="Fechar mensagem"
      >
        <X size={16} />
      </button>

      <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-6">
        {/* Ícone com fundo circular */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-rose-100/50">
          {renderIcon()}
        </div>

        {/* Conteúdo */}
        <div className="flex-1 space-y-1 pr-6">
          <p className="text-[11px] font-bold uppercase tracking-widest text-rose-500">
            Inspiração do dia
          </p>
          <h4 className="text-sm font-extrabold text-gray-900">
            {getGreeting()}, {user?.name || "usuária"}!
          </h4>
          <p className="text-sm italic leading-relaxed text-gray-600">
            "{currentQuote.text}"
          </p>
        </div>
      </div>

      {/* Detalhe de fundo com brilho sutil */}
      <div className="pointer-events-none absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-pink-300/10 blur-2xl" />
    </div>
  );
}
