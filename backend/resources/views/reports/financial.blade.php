<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>Relatório Executivo - O Vermelhinho</title>
    <style>
        body { font-family: 'Arial', 'Helvetica', sans-serif; color: #333; line-height: 1.4; }
        .header { text-align: center; border-bottom: 3px solid #B70F0A; padding-bottom: 10px; margin-bottom: 25px; }
        .header h1 { color: #B70F0A; margin: 0; text-transform: uppercase; letter-spacing: 2px; }
        .header p { margin: 5px 0; color: #666; font-size: 14px; }
        
        .summary-box { width: 100%; border-collapse: separate; border-spacing: 10px; margin-bottom: 20px; }
        .summary-box td { padding: 20px; background: #fff5f5; border: 1px solid #ffebeb; text-align: center; border-radius: 10px; }
        .summary-box .label { font-size: 11px; color: #9B1C1C; display: block; margin-bottom: 8px; font-weight: bold; text-transform: uppercase; }
        .summary-box .value { font-size: 24px; font-weight: bold; color: #B70F0A; }
        
        .section-title { font-size: 16px; font-weight: bold; color: #fff; background: #B70F0A; padding: 8px 15px; margin: 25px 0 15px 0; border-radius: 4px; }
        
        table.details { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
        table.details th { background: #f8f9fa; color: #4b5563; padding: 12px 10px; text-align: left; border-bottom: 2px solid #e5e7eb; font-size: 11px; text-transform: uppercase; }
        table.details td { border-bottom: 1px solid #f3f4f6; padding: 10px; font-size: 12px; }
        
        .status-badge { padding: 3px 8px; border-radius: 12px; font-size: 10px; font-weight: bold; text-transform: uppercase; }
        .status-paid { background: #def7ec; color: #03543f; }
        .status-pending { background: #fdf6b2; color: #723b10; }
        .status-overdue { background: #fde8e8; color: #9b1c1c; }
        
        .footer { position: fixed; bottom: -30px; left: 0; right: 0; height: 30px; text-align: center; font-size: 10px; color: #9ca3af; border-top: 1px solid #e5e7eb; padding-top: 10px; }
        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="header">
        <h1>O Vermelhinho</h1>
        <p>Relatório Executivo de Gestão Financeira • {{ date('d/m/Y H:i') }}</p>
    </div>

    <table class="summary-box">
        <tr>
            <td>
                <span class="label">MRR (Recorrência Mensal)</span>
                <span class="value">R$ {{ number_format($mrr, 2, ',', '.') }}</span>
            </td>
            <td>
                <span class="label">LTV (Lifetime Value)</span>
                <span class="value">R$ {{ number_format($ltv, 2, ',', '.') }}</span>
            </td>
            <td>
                <span class="label">Churn Rate (30 dias)</span>
                <span class="value">{{ number_format($churn, 1, ',', '.') }}%</span>
            </td>
        </tr>
    </table>

    <div class="section-title">Resumo de Receita por Status</div>
    <table class="details">
        <thead>
            <tr>
                <th>Categoria</th>
                <th>Quantidade</th>
                <th>Volume Total</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Faturas Pagas (Mês Atual)</td>
                <td>{{ $paidCount }}</td>
                <td style="font-weight: bold; color: #057a55;">R$ {{ number_format($mrr, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Faturas Pendentes (Aguardando)</td>
                <td>{{ $pendingCount }}</td>
                <td style="font-weight: bold; color: #92400e;">R$ {{ number_format($pendingTotal, 2, ',', '.') }}</td>
            </tr>
            <tr>
                <td>Em Atraso (Inadimplência)</td>
                <td>{{ $overdueCount }}</td>
                <td style="font-weight: bold; color: #b91c1c;">R$ {{ number_format($overdueTotal, 2, ',', '.') }}</td>
            </tr>
        </tbody>
    </table>

    <div class="section-title">Últimos 15 Recebimentos Confirmados</div>
    <table class="details">
        <thead>
            <tr>
                <th>Data Pagto</th>
                <th>Cliente</th>
                <th>Plano / Descrição</th>
                <th>Valor Liquido</th>
            </tr>
        </thead>
        <tbody>
            @foreach($recentPaid as $inv)
            <tr>
                <td>{{ $inv->action_date ? $inv->action_date->format('d/m/Y') : $inv->updated_at->format('d/m/Y') }}</td>
                <td>{{ $inv->client->nome_fantasia }}</td>
                <td>{{ $inv->plan->name ?? 'Avulso' }}</td>
                <td style="font-weight: bold;">R$ {{ number_format($inv->amount, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="page-break"></div>

    <div class="section-title">Alertas de Inadimplência (Atrasados)</div>
    <table class="details">
        <thead>
            <tr>
                <th>Vencimento</th>
                <th>Atraso</th>
                <th>Cliente</th>
                <th>Valor</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($overdueList as $inv)
            <tr>
                <td>{{ $inv->due_date->format('d/m/Y') }}</td>
                <td style="color: #b91c1c; font-weight: bold;">{{ now()->diffInDays($inv->due_date) }} dias</td>
                <td>{{ $inv->client->nome_fantasia }}</td>
                <td>R$ {{ number_format($inv->amount, 2, ',', '.') }}</td>
                <td><span class="status-badge status-overdue">Inadimplente</span></td>
            </tr>
            @endforeach
            @if($overdueList->isEmpty())
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px; color: #666;">Nenhuma fatura em atraso identificada.</td>
                </tr>
            @endif
        </tbody>
    </table>

    <div class="footer">
        Este relatório é de uso confidencial. Gerado automaticamente pelo sistema O Vermelhinho Admin v1.0.
    </div>
</body>
</html>
