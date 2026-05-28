<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lead;
use Illuminate\Support\Facades\Cache;
use App\Services\ClientAiService;

class DashboardController extends Controller
{
    public function kpis(Request $request)
    {
        $now = now();
        $thirtyDaysAgo = now()->subDays(30);

        // 1. Leads & Conversão
        $leadsTotal = \App\Models\Lead::count();
        $leadsNew = \App\Models\Lead::where('status', 'novo')->count();
        $leadsConverted = \App\Models\Lead::where('status', 'convertido')->count();
        $conversionRate = $leadsTotal > 0 ? round(($leadsConverted / $leadsTotal) * 100, 1) : 0;

        // 2. Financeiro
        $activeClients = \App\Models\Cliente::where('status_assinatura', 'ativo')->count();
        // Receita Prévia do Mês Atual (Soma de faturas com vencimento neste mês, excluindo canceladas/inadimplentes se houver, ou apenas pegando paid + pending)
        $startOfMonth = now()->startOfMonth();
        $endOfMonth = now()->endOfMonth();
        
        $revenue = \App\Models\Invoice::whereIn('status', ['paid', 'pending'])
            ->whereBetween('due_date', [$startOfMonth, $endOfMonth])
            ->sum('amount');
        
        // 3. Renovações Próximas
        $upcomingRenewals = \App\Models\Renewal::where('status', 'pending')
            ->whereBetween('expiration_date', [$now, now()->addDays(30)])
            ->count();

        // 4. Operacional (Tickets)
        $ticketsOpen = \App\Models\Ticket::where('status', 'aberto')->count();
        $ticketsBySector = \App\Models\Ticket::select('setor', \DB::raw('count(*) as total'))
            ->where('status', 'aberto')
            ->groupBy('setor')
            ->get();

        // 5. Orçamentos (Novos)
        $quotesEmergency = \App\Models\Quote::where('urgency', 'emergencia')->where('status', 'new')->count();
        $quotesTotal = \App\Models\Quote::where('status', 'new')->count();

        return response()->json([
            'sales' => [
                'total_leads' => $leadsTotal,
                'new_leads' => $leadsNew,
                'conversion_rate' => $conversionRate,
                'quotes_total' => $quotesTotal,
                'quotes_emergency' => $quotesEmergency,
            ],
            'financial' => [
                'active_clients' => $activeClients,
                'mrr' => (float)$revenue,
                'upcoming_renewals' => $upcomingRenewals,
            ],
            'operational' => [
                'open_tickets' => $ticketsOpen,
                'tickets_by_sector' => $ticketsBySector,
            ],
            // Resumo para o gráfico de funil
            'funnel' => [
                ['name' => 'Leads', 'value' => $leadsTotal],
                ['name' => 'Orçamentos', 'value' => \App\Models\Quote::count()],
                ['name' => 'Clientes', 'value' => \App\Models\Cliente::count()],
            ]
        ]);
    }


public function test()
{
    return response()->json(['ok' => true, 'message' => 'Dashboard funcionando']);
}

    public function dailyQuote(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['error' => 'Não autorizado'], 401);
        }

        // Recupera a primeira role do usuário (ex: Administrador, Operador Geral, etc.)
        $role = $user->roles()->first()?->name ?? ($user->getRoleNames()->first() ?? 'Operador Geral');

        // Cria uma chave de cache contendo a role e a data atual do servidor (ex: 2026-05-28)
        $cacheKey = 'daily_quote_' . md5($role) . '_' . date('Y-m-d');

        // Busca do Cache ou gera um novo usando a OpenAI
        $quote = Cache::remember($cacheKey, now()->endOfDay(), function () use ($role) {
            $aiService = app(ClientAiService::class);
            return $aiService->generateDailyQuote($role);
        });

        // Se por qualquer motivo a geração falhar, usamos um fallback robusto baseado no dia do ano
        if (!$quote || !isset($quote['text'])) {
            $quote = $this->getFallbackQuote();
        }

        return response()->json($quote);
    }

    /**
     * Retorna uma frase motivacional padrão baseada no dia do ano.
     */
    private function getFallbackQuote(): array
    {
        $fallbacks = [
            ['text' => "Acredite na força que há em você. Seu potencial é ilimitado e você está no comando do seu próprio sucesso hoje.", 'category' => "empoderamento"],
            ['text' => "A perfeição é um mito. O seu progresso real e a sua dedicação diária são o que verdadeiramente importam.", 'category' => "equilibrio"],
            ['text' => "Você é mais forte do que imagina. Abrace suas qualidades únicas e faça do dia de hoje um passo em direção aos seus sonhos.", 'category' => "autoestima"],
            ['text' => "Cuidar de si mesma não é egoísmo, é necessidade. Reserve alguns minutos hoje para respirar fundo e recarregar suas energias.", 'category' => "bem-estar"],
            ['text' => "Não diminua suas conquistas. Cada pequeno passo que você deu até aqui exigiu coragem e determinação. Orgulhe-se!", 'category' => "autoestima"],
            ['text' => "Você não precisa dar conta de tudo o tempo todo. Priorize o que é essencial hoje e faça o seu melhor com tranquilidade.", 'category' => "foco"],
            ['text' => "Liderança não é sobre ser perfeita, mas sobre inspirar outros através da sua autenticidade e dedicação diária.", 'category' => "empoderamento"],
            ['text' => "Os desafios de hoje são apenas as ferramentas que constroem a sua versão mais forte e resiliente de amanhã.", 'category' => "resiliencia"],
            ['text' => "Seja sua maior fã. A autoconfiança é o acessório mais poderoso que você pode vestir hoje.", 'category' => "autoestima"],
            ['text' => "Sua mente é um espaço sagrado. Alimente-a com pensamentos de progresso, aceitação e carinho por si mesma.", 'category' => "bem-estar"],
            ['text' => "Que o seu foco de hoje seja a sua própria evolução. Você está competindo apenas com quem você era ontem.", 'category' => "foco"],
            ['text' => "Você tem a capacidade de transformar qualquer obstáculo em oportunidade. Confie no seu talento e siga firme.", 'category' => "resiliencia"],
            ['text' => "Ser produtiva também significa saber quando parar e respirar. A sua paz mental é a base do seu sucesso.", 'category' => "equilibrio"],
            ['text' => "Nunca duvide do impacto da sua voz e das suas ideias. O mundo precisa da sua perspectiva única.", 'category' => "empoderamento"],
            ['text' => "O sucesso é construído com consistência, não com pressa. Dê o seu melhor hoje e confie no processo.", 'category' => "foco"],
        ];

        $dayOfYear = date('z'); // 0 a 365
        $index = $dayOfYear % count($fallbacks);

        return $fallbacks[$index];
    }
}
