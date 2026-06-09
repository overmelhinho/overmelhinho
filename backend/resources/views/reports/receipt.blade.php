<!DOCTYPE html>
<html lang="pt-br">
<head>
    <meta charset="UTF-8">
    <title>Recibo Financeiro - O Vermelhinho</title>
    <style>
        @page { size: a5 landscape; margin: 0; }
        body { font-family: 'Helvetica', 'Arial', sans-serif; margin: 0; padding: 0; background: #fff; color: #333; }
        
        /* Container A5 Landscape (210mm x 148mm) */
        .receipt-container { 
            width: 194mm; 
            height: 132mm; 
            position: absolute;
            top: 8mm;
            left: 8mm;
        }

        table { width: 100%; border-collapse: collapse; margin-bottom: 5pt; }
        
        /* Cabeçalho superior */
        .header-main { border-bottom: 1.5pt solid #B70F0A; padding-bottom: 5pt; margin-bottom: 8pt; }
        .company-info { font-size: 7pt; line-height: 1.2; color: #666; }
        .company-name { color: #B70F0A; font-size: 11pt; font-weight: 900; text-transform: uppercase; }
        
        /* Grade de Valores (Modernização da Tabela do topo) */
        .data-grid { border: 0.5pt solid #eee; margin-bottom: 8pt; background: #fcfcfc; }
        .data-grid td { border: 0.5pt solid #eee; padding: 4pt; text-align: center; }
        .label-cell { font-size: 6pt; color: #888; text-transform: uppercase; font-weight: bold; padding-bottom: 1pt !important; }
        .value-cell { font-size: 9pt; font-weight: bold; color: #000; }

        /* Dados do Sacado */
        .client-section { margin-bottom: 8pt; border-left: 2pt solid #B70F0A; padding-left: 6pt; }
        .client-label { font-size: 6.5pt; color: #B70F0A; font-weight: bold; text-transform: uppercase; }
        .client-data { font-size: 8.5pt; font-weight: bold; line-height: 1.2; }
        .client-details { font-size: 7.5pt; color: #555; }

        /* Texto Legal / Extenso */
        .legal-text { font-size: 7pt; line-height: 1.3; text-align: justify; margin-bottom: 8pt; color: #444; }
        
        /* Rodapé com Assinaturas */
        .signature-area { margin-top: 15pt; }
        .sig-box { border-top: 0.5pt solid #000; font-size: 6.5pt; text-align: center; padding-top: 5pt; width: 45%; }
        .date-box { font-size: 6.5pt; text-align: center; padding-top: 5pt; width: 45%; }

        /* Canhoto Destacável (Bottom) */
        .canhoto { 
            position: absolute; 
            bottom: 0; 
            left: 0; 
            right: 0; 
            border-top: 1pt dashed #ccc; 
            padding-top: 10pt; 
            font-size: 7.5pt; 
        }

        .highlight { color: #B70F0A; font-weight: bold; }
    </style>
</head>
<body>
    <div class="receipt-container">
        <!-- Cabeçalho -->
        <div class="header-main">
            <table>
                <tr>
                    <td width="30%">
                        @if($logoBase64)
                            <img src="{{ $logoBase64 }}" style="width: 110pt; height: auto;">
                        @else
                            <div class="company-name">O Vermelhinho</div>
                            <div style="font-size: 6pt; font-weight: bold;">Negócios Digitais</div>
                        @endif
                    </td>
                    <td class="company-info" width="45%">
                        <strong>O VERMELHINHO NEGÓCIOS DIGITAIS LTDA</strong><br>
                        Farroupilha - RS | Fone: (54) 3268-0002<br>
                        CNPJ: 04.951.787/0001-28
                    </td>
                    <td align="right" style="font-size: 7pt; color: #999;">
                        <strong>DATA EMISSÃO</strong><br>
                        {{ \Carbon\Carbon::now()->format('d/m/Y') }}
                    </td>
                </tr>
            </table>
        </div>

        <!-- Grade Financeira -->
        <table class="data-grid">
            <tr>
                <td class="label-cell">Cód. Sistema</td>
                <td class="label-cell">Nº Fatura</td>
                <td class="label-cell">Nº Ordem / Parc.</td>
                <td class="label-cell">Valor R$</td>
                <td class="label-cell">Vencimento</td>
            </tr>
            <tr>
                <td class="value-cell">#{{ str_pad($invoice->id, 5, '0', STR_PAD_LEFT) }}</td>
                <td class="value-cell">@if($authNumero){{ $authNumero }}@else --- @endif</td>
                <td class="value-cell">{{ $invoice->parcel_number ?? '1' }}/{{ $invoice->total_parcels ?? '1' }}</td>
                <td class="value-cell" style="color: #B70F0A; font-size: 11pt;">{{ number_format($invoice->payable_amount ?? $invoice->amount, 2, ',', '.') }}</td>
                <td class="value-cell">{{ $invoice->due_date ? \Carbon\Carbon::parse($invoice->due_date)->format('d/m/Y') : '---' }}</td>
            </tr>
        </table>

        <!-- Dados do Cliente -->
        <div class="client-section">
            <div class="client-label">Sacado / Cliente</div>
            <div class="client-data">{{ $client->razao_social ?: $client->nome_fantasia }}</div>
            <div class="client-details">
                {{ $client->endereco ?? 'Endereço não informado' }}, {{ $client->numero ?? 's/n' }} - {{ $client->bairro ?? '' }}<br>
                {{ $client->municipio ?? 'Farroupilha' }} - {{ $client->estado ?? 'RS' }} | CNPJ/CPF: {{ $client->cpf_cnpj }}
            </div>
        </div>

        <!-- Texto de Quitação / Legal -->
        <div class="legal-text">
            <strong>VALOR POR EXTENSO:</strong> <span style="text-transform: uppercase;">{{ $payableAmount_extenso }}</span><br>
            Recebemos a importância acima referente ao plano {{ $invoice->plan->name ?? 'Publicidade Digital' }}. Damos por este recibo plena e geral quitação.
        </div>

        <!-- Assinaturas do topo -->
        <table width="100%" class="signature-area">
            <tr>
                <td class="date-box">
                    <span style="font-size: 8pt; font-weight: bold;">{{ \Carbon\Carbon::parse($invoice->action_date ?? now())->format('d/m/Y') }}</span><br>
                    Data do Aceite / Pagamento
                </td>
                <td width="10%"></td>
                <td class="sig-box">Assinatura do Recebedor / O Vermelhinho</td>
            </tr>
        </table>

        <!-- Canhoto / Recibo destacável -->
        <div class="canhoto">
            Recebemos de <span class="highlight">{{ $client->razao_social ?: $client->nome_fantasia }}</span> a importância de <span style="text-transform: uppercase; font-weight: bold;">{{ $payableAmount_extenso }}</span> em <span class="highlight">{{ \Carbon\Carbon::parse($invoice->action_date ?? now())->format('d/m/Y') }}</span>.
            <div style="float: right; border-top: 0.5pt solid #000; width: 120pt; text-align: center; margin-top: 10pt; font-size: 6pt;">Assinatura</div>
        </div>
    </div>
</body>
</html>
