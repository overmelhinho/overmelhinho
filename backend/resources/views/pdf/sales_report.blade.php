<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Relatório de Vendas - O Vermelhinho</title>
    <style>
        body { font-family: 'Helvetica', sans-serif; font-size: 10px; color: #333; }
        .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #C00000; padding-bottom: 10px; }
        .header h1 { color: #C00000; margin: 0; font-size: 18px; text-transform: uppercase; }
        .summary { margin-bottom: 20px; background: #f9f9f9; padding: 15px; border-radius: 8px; }
        .summary table { width: 100%; }
        .summary-title { font-weight: bold; color: #666; font-size: 8px; text-transform: uppercase; margin-bottom: 5px; }
        .summary-value { font-size: 16px; font-weight: bold; color: #111; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; }
        th { background: #f2f2f2; padding: 8px; text-align: left; border-bottom: 1px solid #ddd; font-weight: bold; text-transform: uppercase; font-size: 8px; }
        td { padding: 8px; border-bottom: 1px solid #eee; }
        .status { padding: 3px 6px; border-radius: 4px; font-weight: bold; font-size: 8px; text-transform: uppercase; }
        .status-paid { background: #dcfce7; color: #166534; }
        .status-pending { background: #ffedd5; color: #9a3412; }
        .footer { position: fixed; bottom: 0; width: 100%; text-align: right; font-size: 8px; color: #999; padding-top: 10px; border-top: 1px solid #eee; }
        .page-number:after { content: counter(page); }
    </style>
</head>
<body>
    <div class="header">
        <h1>Relatório Detalhado de Vendas</h1>
        <p>O Vermelhinho - Inteligência Comercial | Período: {{ $filters['month'] ?? '-' }}/{{ $filters['year'] ?? '-' }}</p>
    </div>

    <div class="summary">
        <table>
            <tr>
                <td>
                    <div class="summary-title">Volume de Vendas</div>
                    <div class="summary-value">{{ $summary['count'] }}</div>
                </td>
                <td>
                    <div class="summary-title">Faturamento Bruto</div>
                    <div class="summary-value">R$ {{ number_format($summary['total_amount'], 2, ',', '.') }}</div>
                </td>
                <td>
                    <div class="summary-title">Total Recebido</div>
                    <div class="summary-value" style="color: #166534;">R$ {{ number_format($summary['paid_amount'], 2, ',', '.') }}</div>
                </td>
                <td>
                    <div class="summary-title">A Receber</div>
                    <div class="summary-value" style="color: #9a3412;">R$ {{ number_format($summary['pending_amount'], 2, ',', '.') }}</div>
                </td>
            </tr>
        </table>
    </div>

    <table>
        <thead>
            <tr>
                <th>Autorização</th>
                <th>Cliente</th>
                <th>Plano</th>
                <th>Vendedor</th>
                <th>Valor</th>
                <th>Vencimento</th>
                <th>Status</th>
            </tr>
        </thead>
        <tbody>
            @foreach($data as $sale)
            <tr>
                <td style="font-weight: bold;">#{{ $sale['autorizacao_numero'] ?? '-' }}</td>
                <td>
                    <div style="font-weight: bold;">{{ $sale['cliente'] }}</div>
                    <div style="font-size: 8px; color: #888;">{{ strtoupper($sale['payment_method']) }}</div>
                </td>
                <td>{{ $sale['plano'] }}</td>
                <td>{{ $sale['vendedor'] }}</td>
                <td style="font-weight: bold;">R$ {{ number_format($sale['amount'], 2, ',', '.') }}</td>
                <td>{{ \Carbon\Carbon::parse($sale['due_date'])->format('d/m/Y') }}</td>
                <td>
                    <span class="status {{ $sale['status'] === 'paid' ? 'status-paid' : 'status-pending' }}">
                        {{ $sale['status'] === 'paid' ? 'Recebido' : 'Pendente' }}
                    </span>
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>

    <div class="footer">
        Gerado em {{ date('d/m/Y H:i:s') }} | Página <span class="page-number"></span>
    </div>
</body>
</html>
