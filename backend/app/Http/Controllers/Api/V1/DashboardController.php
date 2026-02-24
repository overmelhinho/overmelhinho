<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lead;

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
        $activeClients = \App\Models\Cliente::where('status_assinatura', 'active')->count();
        // Soma simples de planos para MRR (Exemplo)
        $mrr = \App\Models\Invoice::where('status', 'paid')
            ->whereBetween('created_at', [$thirtyDaysAgo, $now])
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
                'mrr' => (float)$mrr,
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



}
