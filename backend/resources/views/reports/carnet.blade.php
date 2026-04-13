<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Carnê de Pagamento - O Vermelhinho</title>
    <style>
        body { font-family: sans-serif; font-size: 12px; color: #333; margin: 0; padding: 0; }
        .container { padding: 30px; }
        .header { border-bottom: 2px solid #B70F0A; padding-bottom: 10px; margin-bottom: 20px; }
        .header table { width: 100%; }
        .header h1 { color: #B70F0A; margin: 0; font-size: 24px; }
        .client-info { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 30px; }
        .client-info h2 { margin-top: 0; font-size: 14px; color: #666; text-transform: uppercase; letter-spacing: 1px; }
        
        table.installments { width: 100%; border-collapse: collapse; margin-top: 20px; }
        table.installments th { background: #B70F0A; color: white; text-align: left; padding: 10px; text-transform: uppercase; font-size: 10px; }
        table.installments td { padding: 12px 10px; border-bottom: 1px solid #eee; }
        
        .badge { display: inline-block; padding: 3px 8px; border-radius: 4px; font-size: 10px; font-weight: bold; background: #eee; }
        
        .footer { position: fixed; bottom: 30px; left: 0; right: 0; text-align: center; font-size: 10px; color: #aaa; }
        
        .payment-link { color: #B70F0A; text-decoration: none; font-weight: bold; }
        
        .summary-box { float: right; width: 250px; background: #f4f4f4; padding: 15px; border-radius: 10px; margin-top: 30px; }
        .summary-item { display: flex; justify-content: space-between; margin-bottom: 5px; }
        .summary-total { font-size: 18px; font-weight: bold; color: #B70F0A; border-top: 1px solid #ccc; padding-top: 5px; }

        .page-break { page-break-after: always; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <table>
                <tr>
                    <td>
                        <h1>O VERMELHINHO</h1>
                        <p style="margin: 5px 0 0 0; color: #666;">Cronograma de Pagamentos</p>
                    </td>
                    <td style="text-align: right; color: #999;">
                        Gerado em: {{ $generatedAt }}
                    </td>
                </tr>
            </table>
        </div>

        <div class="client-info">
            <h2>Dados do Cliente</h2>
            <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">{{ $client->razao_social ?: $client->nome_fantasia }}</div>
            <div>CNPJ/CPF: {{ $client->cpf_cnpj }}</div>
            <div>E-mail: {{ $client->contatos()->first()->email_principal ?? 'N/A' }}</div>
        </div>

        <p>Prezado cliente, segue abaixo o detalhamento das parcelas referentes ao seu plano. Você pode acessar cada boleto/pix clicando no link correspondente na coluna "Acesso".</p>

        <table class="installments">
            <thead>
                <tr>
                    <th>Parc.</th>
                    <th>Referência</th>
                    <th>Vencimento</th>
                    <th>Valor</th>
                    <th>Método</th>
                    <th>Acesso</th>
                </tr>
            </thead>
            <tbody>
                @php
                    $firstInvoice = $invoices->first();
                    $groupId = $firstInvoice->group_id ?? '';
                    $autorizacao = null;
                    if (str_starts_with($groupId, 'autorizacao-')) {
                        $authId = str_replace('autorizacao-', '', $groupId);
                        $autorizacao = \App\Models\Autorizacao::find($authId);
                    }
                @endphp

                @foreach($invoices as $invoice)
                <tr>
                    <td style="font-weight: bold;">{{ $invoice->parcel_number }}/{{ $invoice->total_parcels }}</td>
                    <td>
                        @if($autorizacao)
                            Autorização #{{ $autorizacao->numero }}
                        @else
                            {{ $invoice->plan->name ?? 'Serviço Avulso' }}
                        @endif
                    </td>
                    <td>{{ \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') }}</td>
                    <td style="font-weight: bold;">R$ {{ number_format($invoice->amount, 2, ',', '.') }}</td>
                    <td><span class="badge">{{ strtoupper($invoice->payment_method) }}</span></td>
                    <td>
                        @if($invoice->payment_url)
                            <a href="{{ $invoice->payment_url }}" class="payment-link">ABRIR COBRANÇA</a>
                        @else
                            <span style="color: #ccc; font-style: italic;">Não gerado</span>
                        @endif
                    </td>
                </tr>
                @endforeach
            </tbody>
        </table>

        <div style="clear: both;"></div>

        <div class="summary-box">
            <div style="font-size: 10px; color: #999; text-transform: uppercase;">Resumo do Parcelamento</div>
            <div style="font-size: 14px; margin: 10px 0;">
                {{ $installmentsCount }} parcelas de R$ {{ number_format($invoices->first()->amount, 2, ',', '.') }}
            </div>
            <div class="summary-total">
                TOTAL: R$ {{ number_format($totalAmount, 2, ',', '.') }}
            </div>
        </div>

        <div class="footer">
            O Vermelhinho - Plataforma de Gestão Automática<br>
            Este documento é apenas um informativo de cobrança. Os pagamentos devem ser efetuados através dos links oficiais do Tiny ERP.
        </div>
    </div>
</body>
</html>
