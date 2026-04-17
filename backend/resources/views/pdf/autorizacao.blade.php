<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
    <title>A.P {{ str_pad($autorizacao->numero, 5, '0', STR_PAD_LEFT) }}</title>
    <style>
        @page {
            margin: 0;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Arial', 'Helvetica', sans-serif;
            font-size: 8.2px;
            color: #1F2937;
            background: #ffffff;
            line-height: 1.3;
            padding: 40px 30px 20px 30px;
        }

        table { width: 100%; border-collapse: collapse; }
        td, th { vertical-align: top; }

        /* ── HEADER ── */
        .header-table { border-bottom: 2px solid #E5E7EB; padding-bottom: 4px; margin-bottom: 8px; }
        .logo-img { max-height: 35px; }
        .header-company { text-align: right; font-size: 8px; color: #6B7280; line-height: 1.1; }
        .header-company strong { color: #111827; font-size: 10px; display: block; margin-bottom: 1px; text-transform: uppercase; }

        /* ── TITLE ── */
        .doc-title { text-align: center; font-size: 12px; font-weight: bold; color: #111827; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px; }

        /* ── SECTIONS ── */
        .section-title { font-size: 9px; font-weight: bold; color: #B70F0A; text-transform: uppercase; margin-bottom: 3px; letter-spacing: 0.5px;}
        
        .info-table { margin-bottom: 8px; }
        .info-table td { padding: 4px 6px; border: 1px solid #F3F4F6; width: 50%; }
        .info-table .label { display: block; font-size: 7px; font-weight: bold; color: #9CA3AF; text-transform: uppercase; margin-bottom: 1px; }
        .info-table .value { display: block; font-size: 9.5px; font-weight: bold; color: #111827; }
        .info-table .value-desc { font-size: 9px; font-weight: normal; color: #374151; }

        /* ── PAYMENT & INSTALLMENTS ── */
        .pay-summary { margin-bottom: 5px; }
        .pay-summary td { border: 1px solid #E5E7EB; background: #F9FAFB; padding: 5px; text-align: center; width: 25%; }
        .pay-summary .val { font-size: 10px; font-weight: bold; color: #111827; margin-top: 1px; }
        .pay-summary .val.red { color: #B70F0A; }

        .installments-table th { background: #F3F4F6; padding: 3px; font-size: 7.5px; color: #4B5563; text-transform: uppercase; border: 1px solid #E5E7EB; }
        .installments-table td { padding: 3px; font-size: 9px; color: #111827; border: 1px solid #E5E7EB; text-align: center; font-weight: bold; }

        /* ── OBS ── */
        .obs-box { border: 1px solid #F3F4F6; background: #FAFAFA; padding: 5px; margin-bottom: 8px; border-radius: 4px; font-size: 8px; color: #374151; }
        .obs-box p { margin-bottom: 1px; }
        .obs-box p:last-child { margin-bottom: 0; }

        /* ── SIGNATURES ── */
        .signature-area { margin-top: 15px; page-break-inside: avoid; }
        .sign-table td { width: 50%; padding: 0 10px; text-align: center; }
        .sign-line { border-top: 1px solid #6B7280; width: 90%; margin: 15px auto 3px auto; }
        .sign-label { font-size: 8px; font-weight: bold; color: #111827; text-transform: uppercase; }
        
        .legal-footer { margin-top: 10px; padding-top: 4px; border-top: 1px solid #E5E7EB; font-size: 6.8px; color: #9CA3AF; text-align: justify; line-height: 1.2; page-break-inside: avoid; }
    </style>
</head>
<body>
    <div style="height: 10px;"></div>

    <!-- 1. HEADER -->
    <table class="header-table">
        <tr>
            <td style="width: 40%; vertical-align: middle;">
                <img src="{{ public_path('logo-contract.png') }}" class="logo-img" alt="Logo">
            </td>
            <td class="header-company">
                <strong>O VERMELHINHO INFORMAÇÕES</strong>
                Rua Cel. Pena de Moraes, 513, Sala 1004 • Centro<br>
                Farroupilha/RS • (54) 3268.0002<br>
                CNPJ: 09.951.787/0001-28 • angelica@overmelhinho.com.br
            </td>
        </tr>
    </table>

    <!-- 2. TITLE -->
    <div class="doc-title">
        Autorização de Publicidade - Nº {{ str_pad($autorizacao->numero, 5, '0', STR_PAD_LEFT) }}
    </div>

    <!-- 3. CLIENT INFO -->
    <div class="section-title">Dados do Contratante</div>
    <table class="info-table">
        <tr>
            <td colspan="2">
                <span class="label">Razão Social / Identificação</span>
                <span class="value">{{ ltrim($autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia) }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Nome Fantasia</span>
                <span class="value">{{ $autorizacao->cliente->nome_fantasia }}</span>
            </td>
            <td>
                @php 
                    $cpfCnpjRaw = $autorizacao->cliente->cpf_cnpj; 
                    $onlyNumbers = preg_replace('/[^0-9]/', '', $cpfCnpjRaw ?? '');
                    $docLabel = 'CNPJ/CPF';
                    $cpfCnpjFormatted = '—';
                    if (strlen($onlyNumbers) === 11) {
                        $docLabel = 'CPF';
                        $cpfCnpjFormatted = preg_replace('/(\d{3})(\d{3})(\d{3})(\d{2})/', '$1.$2.$3-$4', $onlyNumbers);
                    } elseif (strlen($onlyNumbers) === 14) {
                        $docLabel = 'CNPJ';
                        $cpfCnpjFormatted = preg_replace('/(\d{2})(\d{3})(\d{3})(\d{4})(\d{2})/', '$1.$2.$3/$4-$5', $onlyNumbers);
                    } elseif ($onlyNumbers) {
                        $cpfCnpjFormatted = $cpfCnpjRaw;
                    }
                @endphp
                <span class="label">{{ $docLabel }}</span>
                <span class="value">{{ $cpfCnpjFormatted }}</span>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                @php $end = $autorizacao->cliente->enderecos->first(); @endphp
                <span class="label">Endereço de Faturamento</span>
                <span class="value-desc">
                    {{ $end?->logradouro ?? '—' }}, {{ $end?->numero ?? 'S/N' }} - {{ $end?->bairro ?? '---' }} 
                    | {{ $end?->cidade ?? '—' }}-{{ $end?->estado ?? '—' }} | CEP: {{ $end?->cep ?? '—' }}
                </span>
            </td>
        </tr>
        <tr>
            <td>
                @php $contato = $autorizacao->cliente->contatos->first(); @endphp
                <span class="label">Contatos (Fone/Celular)</span>
                <span class="value">{{ $contato?->telefone_principal ?: $contato?->celular ?: '—' }} / {{ $contato?->telefone_secundario ?: '—' }}</span>
            </td>
            <td>
                <span class="label">E-mail Principal</span>
                <span class="value-desc">{{ $contato?->email_principal ?? '—' }}</span>
            </td>
        </tr>
    </table>

    <!-- 4. AD DETAILS -->
    <div class="section-title">Detalhes da Veiculação</div>
    <table class="info-table">
        <tr>
            <td colspan="2">
                <span class="label">Título / Chamada do Anúncio</span>
                <span class="value" style="color: #B70F0A;">{{ $autorizacao->titulo_anuncio }}</span>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="label">Descritivo e Soluções (Escopo do Serviço)</span>
                <span class="value-desc">{{ $autorizacao->descricao_anuncio ?: 'Inclusão de publicação comercial nas plataformas digitais e impressas da contratada.' }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Vigência Comercial</span>
                <span class="value">{{ $autorizacao->data_inicio->format('d/m/Y') }} até {{ $autorizacao->data_fim->format('d/m/Y') }}</span>
            </td>
            <td>
                <span class="label">Vendedor</span>
                <span class="value">{{ $autorizacao->vendedor?->name ?? 'Equipe Comercial' }}</span>
            </td>
        </tr>
    </table>

    <!-- 5. FINANCIALS -->
    <div class="section-title">Resumo Financeiro</div>
    <table class="pay-summary">
        <tr>
            <td>
                <span class="label">Valor Bruto</span>
                <div class="val">R$ {{ number_format($autorizacao->valor_total, 2, ',', '.') }}</div>
            </td>
            <td>
                <span class="label">Acordo de Pagto.</span>
                <div class="val">{{ $autorizacao->modo_pagamento }}</div>
            </td>
            <td>
                <span class="label">Meio Escolhido</span>
                <div class="val uppercase">{{ match(strtolower($autorizacao->payment_method)) { 'pix' => 'PIX', 'boleto' => 'Boleto', 'cartao' => 'Cartão', 'dinheiro' => 'Dinheiro', default => $autorizacao->payment_method } }}</div>
            </td>
            <td>
                <span class="label">Total Líquido</span>
                <div class="val red">R$ {{ number_format($autorizacao->valor_liquido, 2, ',', '.') }}</div>
            </td>
        </tr>
    </table>

    @if($autorizacao->parcelas && count($autorizacao->parcelas) > 0)
    <table class="installments-table" style="width: 60%; margin: 0 auto 15px auto;">
        <thead>
            <tr>
                <th width="33%">Parcela</th>
                <th width="33%">Vencimento</th>
                <th width="34%">Valor (R$)</th>
            </tr>
        </thead>
        <tbody>
            @foreach($autorizacao->parcelas as $p)
            <tr>
                <td>{{ $p->numero }} de {{ count($autorizacao->parcelas) }}</td>
                <td>{{ $p->vencimento->format('d/m/Y') }}</td>
                <td>R$ {{ number_format($p->payable_amount, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    {{-- OBSERVAÇÕES --}}
    @if($autorizacao->observacoes_anuncio || $autorizacao->observacoes_financeiro)
    <div class="obs-box">
        @if($autorizacao->observacoes_anuncio)
            <p><strong>Observações de Arte/Produção:</strong> {{ $autorizacao->observacoes_anuncio }}</p>
        @endif
        @if($autorizacao->observacoes_financeiro)
            <p><strong>Observações Faturamento:</strong> {{ $autorizacao->observacoes_financeiro }}</p>
        @endif
    </div>
    @endif

    <!-- SIGNATURES -->
    <div class="signature-area">
        <table class="sign-table">
            <tr>
                <td valign="bottom">
                    <div class="sign-line"></div>
                    <div class="sign-label">CONTRATADA</div>
                    <div style="font-size: 8.5px; color: #6B7280; font-weight: normal; margin-top:2px;">Guia de Negócios Farroupilha Ltda</div>
                </td>
                <td valign="bottom" style="position: relative;">
                    @if($autorizacao->status === 'assinado')
                        @if($autorizacao->justificativa_assinatura)
                            <div style="font-size: 8px; color: #059669; font-weight: bold; margin-bottom: 8px;">ACEITE REGISTRADO ELETRONICAMENTE</div>
                        @elseif($autorizacao->assinatura_base64)
                            <img src="{{ $autorizacao->assinatura_base64 }}" style="max-height: 40px; margin-bottom: -10px; z-index: -1;">
                        @endif
                    @endif
                    <div class="sign-line"></div>
                    <div class="sign-label">CONTRATANTE</div>
                    <div style="font-size: 8px; color: #6B7280; font-weight: normal; margin-top:2px; height: 20px;">
                        {{ $autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia }}
                        @if($autorizacao->status === 'assinado')
                            <br>Assinado em {{ $autorizacao->assinado_em->format('d/m/Y H:i') }} | IP: {{ $autorizacao->assinatura_ip ?? 'N/A' }}
                        @endif
                    </div>
                </td>
            </tr>
        </table>
    </div>

    <!-- LEGAL FOOTER -->
    <div class="legal-footer">
        Este documento constitui autorização irrevogável para a prestação dos serviços acima descritos. O CONTRATANTE atesta a veracidade das informações, expressa ciência dos prazos de vigência e reconhece a dívida correspondente aos valores financeiros apurados conforme cronograma de pagamento. A veiculação está sujeita às Políticas de Uso do O Vermelhinho. Eventual inadimplência ensejará na paralisação da veiculação e o legítimo protesto deste título extrajudicial, acrescido das multas e juros legais aplicáveis. Fica eleito o Foro da Comarca de Farroupilha/RS para dirimir eventuais litígios.
    </div>

</body>
</html>
