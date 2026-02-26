<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
    <title>Autorização nº {{ $autorizacao->numero }}</title>
    <style>
        @page {
            margin: 1cm;
        }
        * { margin: 0; padding: 0; box-sizing: border-box; }

        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            font-size: 10px;
            color: #334155;
            background: #fff;
            line-height: 1.4;
        }

        .container {
            width: 100%;
        }

        /* ── HEADER ─────── */
        .header {
            width: 100%;
            margin-bottom: 20px;
            border-bottom: 1px solid #e2e8f0;
            padding-bottom: 15px;
        }
        .header td {
            vertical-align: top;
        }
        .empresa-info h1 {
            font-size: 16px;
            color: #b91c1c;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .empresa-info p {
            font-size: 9px;
            color: #64748b;
            line-height: 1.5;
        }
        .doc-info {
            text-align: right;
        }
        .doc-info h2 {
            font-size: 14px;
            color: #0f172a;
            margin-bottom: 2px;
        }
        .doc-info .numero {
            font-size: 18px;
            font-weight: bold;
            color: #b91c1c;
            margin-bottom: 5px;
        }

        /* ── SECTIONS ─────── */
        .section-header {
            background-color: #f8fafc;
            padding: 6px 12px;
            margin-bottom: 10px;
            border-left: 4px solid #b91c1c;
        }
        .section-header h3 {
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            color: #1e293b;
        }

        .data-grid {
            width: 100%;
            margin-bottom: 20px;
        }
        .data-grid td {
            padding: 4px 12px;
            width: 50%;
            vertical-align: top;
        }
        .label {
            font-size: 8px;
            color: #94a3b8;
            text-transform: uppercase;
            display: block;
            margin-bottom: 2px;
        }
        .value {
            font-size: 10px;
            font-weight: 600;
            color: #1e293b;
        }

        /* ── TABLES ─────── */
        .table-responsive {
            margin-top: 10px;
            margin-bottom: 20px;
        }
        table.styled-table {
            width: 100%;
            border-collapse: collapse;
        }
        table.styled-table th {
            background-color: #f1f5f9;
            color: #475569;
            text-align: left;
            padding: 8px 12px;
            font-size: 9px;
            text-transform: uppercase;
            border-bottom: 1px solid #e2e8f0;
        }
        table.styled-table td {
            padding: 8px 12px;
            font-size: 10px;
            border-bottom: 1px solid #f1f5f9;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* ── SUMMARY PANEL ── */
        .summary-panel {
            background-color: #f8fafc;
            border-radius: 8px;
            padding: 15px;
            margin-top: 10px;
        }
        .summary-row {
            width: 100%;
            margin-bottom: 4px;
        }
        .summary-total {
            margin-top: 10px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
            font-size: 14px;
            font-weight: bold;
            color: #b91c1c;
        }

        /* ── SIGNATURE ──── */
        .signature-area {
            margin-top: 40px;
            text-align: center;
        }
        .signature-box {
            display: inline-block;
            width: 300px;
            border-top: 1px solid #94a3b8;
            padding-top: 8px;
            margin-top: 50px;
        }
        .signature-img {
            max-width: 200px;
            max-height: 80px;
            margin-bottom: -10px;
        }
        .digital-certified {
            margin-top: 15px;
            font-size: 8px;
            color: #64748b;
            background: #f1f5f9;
            padding: 8px;
            border-radius: 4px;
            display: inline-block;
        }

        /* ── INFO BOXES ─── */
        .alert {
            padding: 10px;
            border-radius: 4px;
            font-size: 9px;
            margin-bottom: 10px;
        }
        .alert-info { background: #eff6ff; border: 1px solid #bfdbfe; color: #1e40af; }

        .footer-legal {
            font-size: 7px;
            color: #94a3b8;
            margin-top: 30px;
            text-align: justify;
            line-height: 1.6;
        }

        .badge {
            display: inline-block;
            padding: 2px 8px;
            border-radius: 99px;
            font-size: 8px;
            font-weight: bold;
            text-transform: uppercase;
        }
        .badge-signed { background: #dcfce7; color: #166534; }
        .badge-pending { background: #fef9c3; color: #854d0e; }
        .badge-draft { background: #f1f5f9; color: #475569; }

        .divider {
            height: 1px;
            background: #e2e8f0;
            margin: 15px 0;
        }
    </style>
</head>
<body>

<div class="container">
    {{-- Header --}}
    <table class="header">
        <tr>
            <td width="60%">
                <div class="empresa-info">
                   <table width="100%">
                       <tr>
                           @if(file_exists(public_path('images/logo.png')))
                           <td width="60">
                               <img src="{{ public_path('images/logo.png') }}" alt="Logo" style="width:50px;">
                           </td>
                           @else
                           <td width="40">
                               <div style="width: 35px; height: 35px; background: #b91c1c; color: white; border-radius: 50%; text-align: center; line-height: 35px; font-weight: bold; font-size: 18px;">V</div>
                           </td>
                           @endif
                           <td style="padding-left: 10px;">
                               <h1>Guia de Negócios Farroupilha Ltda</h1>
                               <p>
                                   Rua Cel. Pena de Moraes, 513, Sala 1004 • Centro • Farroupilha/RS<br>
                                   (54) 3268.0002 • contato@overmelhinho.com.br • CNPJ: 09.951.787/0001-28
                               </p>
                           </td>
                       </tr>
                   </table>
                </div>
            </td>
            <td width="40%" class="doc-info">
                <h2>Autorização de Publicidade</h2>
                <div class="numero">#{{ str_pad($autorizacao->numero, 5, '0', STR_PAD_LEFT) }}</div>
                <div>
                   @php
                        $statusClass = match($autorizacao->status) {
                            'assinado' => 'badge-signed',
                            'aguardando_assinatura' => 'badge-pending',
                            default => 'badge-draft'
                        };
                   @endphp
                   <span class="badge {{ $statusClass }}">{{ $autorizacao->status_label }}</span>
                </div>
                <div style="font-size: 9px; color: #64748b; margin-top: 5px;">
                    Emitido em: {{ $autorizacao->created_at->format('d/m/Y H:i') }}
                </div>
            </td>
        </tr>
    </table>

    {{-- Dados do Cliente --}}
    <div class="section-header">
        <h3>1. Dados do Contratante</h3>
    </div>
    <table class="data-grid">
        <tr>
            <td>
                <span class="label">Razão Social / Nome</span>
                <span class="value">{{ $autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia }}</span>
            </td>
            <td>
                <span class="label">Nome Fantasia</span>
                <span class="value">{{ $autorizacao->cliente->nome_fantasia }}</span>
            </td>
        </tr>
        <tr>
            <td>
                @php
                    $cpfCnpj = $autorizacao->cliente->cpf_cnpj;
                    $masked = strlen($cpfCnpj) > 11 
                        ? substr($cpfCnpj, 0, 2) . '.***.***' . substr($cpfCnpj, -6)
                        : substr($cpfCnpj, 0, 3) . '.***.***-' . substr($cpfCnpj, -2);
                @endphp
                <span class="label">CNPJ / CPF</span>
                <span class="value">{{ $masked }}</span>
            </td>
            <td>
                @php $contato = $autorizacao->cliente->contatos->first(); @endphp
                <span class="label">Contato Principal / E-mail</span>
                <span class="value">{{ $contato?->nome_contato ?? '—' }} • {{ $contato?->email_principal ?? '—' }}</span>
            </td>
        </tr>
        <tr>
            <td>
                @php $end = $autorizacao->cliente->enderecos->first(); @endphp
                <span class="label">Cidade / Estado</span>
                <span class="value">{{ $end?->cidade ?? '—' }} / {{ $end?->estado ?? '—' }}</span>
            </td>
            <td>
                <span class="label">Telefones</span>
                <span class="value">{{ $contato?->telefone_principal ?: $contato?->celular ?: '—' }}</span>
            </td>
        </tr>
    </table>

    {{-- Publicidade --}}
    <div class="section-header">
        <h3>2. Objeto da Publicidade</h3>
    </div>
    <table class="data-grid">
        <tr>
            <td width="100%" colspan="2">
                <span class="label">Título do Anúncio / Veiculação</span>
                <span class="value" style="font-size: 12px; color: #b91c1c;">{{ $autorizacao->titulo_anuncio }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Veredor Responsável</span>
                <span class="value">{{ $autorizacao->vendedor?->name ?? '—' }}</span>
            </td>
            <td>
                <span class="label">Período de Vigência</span>
                <span class="value">{{ $autorizacao->data_inicio->format('d/m/Y') }} até {{ $autorizacao->data_fim->format('d/m/Y') }}</span>
            </td>
        </tr>
        @if($autorizacao->descricao_anuncio)
        <tr>
            <td colspan="2">
                <span class="label">Detalhamento Técnico</span>
                <span class="value" style="font-weight: normal;">{{ $autorizacao->descricao_anuncio }}</span>
            </td>
        </tr>
        @endif
    </table>

    {{-- Pagamento --}}
    <div class="section-header">
        <h3>3. Condições Comerciais</h3>
    </div>
    
    <table width="100%">
        <tr>
            <td width="35%" valign="top">
                <div class="summary-panel">
                    <table width="100%" class="summary-table">
                        <tr>
                            <td class="label">Valor Bruto</td>
                            <td class="value text-right">R$ {{ number_format($autorizacao->valor_total, 2, ',', '.') }}</td>
                        </tr>
                        @if($autorizacao->desconto_valor > 0)
                        <tr>
                            <td class="label" style="color: #059669;">Desconto Apicado</td>
                            <td class="value text-right" style="color: #059669;">
                                - R$ {{ number_format($autorizacao->desconto_tipo === 'fixed' ? $autorizacao->desconto_valor : ($autorizacao->valor_total * $autorizacao->desconto_valor / 100), 2, ',', '.') }}
                            </td>
                        </tr>
                        @endif
                        @if($autorizacao->taxa_cadastro > 0)
                        <tr>
                            <td class="label">Taxa de Cadastro</td>
                            <td class="value text-right">R$ {{ number_format($autorizacao->taxa_cadastro, 2, ',', '.') }}</td>
                        </tr>
                        @endif
                        @if($autorizacao->is_permuta)
                        <tr>
                            <td class="label" style="color: #7c3aed;">Crédito de Permuta</td>
                            <td class="value text-right" style="color: #7c3aed;">- R$ {{ number_format($autorizacao->permuta_amount, 2, ',', '.') }}</td>
                        </tr>
                        @endif
                        <tr>
                            <td colspan="2"><div class="divider" style="margin: 8px 0;"></div></td>
                        </tr>
                        <tr class="summary-total">
                            <td style="font-size: 11px;">Total a Pagar</td>
                            <td class="text-right">R$ {{ number_format($autorizacao->valor_liquido - ($autorizacao->is_permuta ? $autorizacao->permuta_amount : 0), 2, ',', '.') }}</td>
                        </tr>
                    </table>

                    <div style="margin-top: 15px;">
                        <span class="label">Forma de Pagamento</span>
                        <span class="value">
                            {{ match($autorizacao->payment_method) { 'pix' => 'PIX', 'boleto' => 'Boleto Bancário', 'cartao' => 'Cartão de Crédito', 'dinheiro' => 'Dinheiro', default => $autorizacao->payment_method } }} 
                            ({{ $autorizacao->num_parcelas }}x {{ $autorizacao->modo_pagamento }})
                        </span>
                    </div>
                </div>

                @if($autorizacao->is_permuta)
                <div class="alert alert-info" style="margin-top: 10px;">
                    <strong>Item de Permuta:</strong><br>
                    {{ $autorizacao->permuta_description }}
                </div>
                @endif
            </td>
            <td width="5%">&nbsp;</td>
            <td width="60%" valign="top">
                <span class="label" style="margin-bottom: 8px;">Cronograma de Vencimentos</span>
                <table class="styled-table">
                    <thead>
                        <tr>
                            <th>Parcela</th>
                            <th>Vencimento</th>
                            <th class="text-right">Valor Bruto</th>
                            @if($autorizacao->is_permuta)
                                <th class="text-right">Permuta</th>
                            @endif
                            <th class="text-right">A Pagar</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($autorizacao->parcelas as $p)
                        <tr>
                            <td class="text-center">{{ $p->numero }}</td>
                            <td>{{ $p->vencimento->format('d/m/Y') }}</td>
                            <td class="text-right">R$ {{ number_format($p->valor, 2, ',', '.') }}</td>
                            @if($autorizacao->is_permuta)
                                <td class="text-right" style="color: #7c3aed;">R$ {{ number_format($p->permuta_amount, 2, ',', '.') }}</td>
                            @endif
                            <td class="text-right" style="font-weight: 600;">R$ {{ number_format($p->payable_amount, 2, ',', '.') }}</td>
                        </tr>
                        @endforeach
                    </tbody>
                </table>
            </td>
        </tr>
    </table>

    {{-- Observações --}}
    @if($autorizacao->observacoes_anuncio || $autorizacao->observacoes_financeiro)
    <div style="margin-top: 10px;">
        <span class="label">Observações Adicionais</span>
        <p style="font-size: 9px; color: #475569;">
            {{ $autorizacao->observacoes_anuncio }} {{ $autorizacao->observacoes_financeiro }}
        </p>
    </div>
    @endif

    {{-- Assinatura --}}
    <div class="signature-area">
        @if($autorizacao->status === 'assinado')
            <div class="signature-box" style="border-top: none;">
                @if($autorizacao->assinatura_base64)
                    <img src="{{ $autorizacao->assinatura_base64 }}" class="signature-img">
                @endif
                <div style="border-top: 1px solid #94a3b8; width: 100%; margin-top: 5px;"></div>
                <div class="value">{{ $autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia }}</div>
                <div class="label">Assinado em {{ $autorizacao->assinado_em->format('d/m/Y \à\s H:i') }}</div>
                
                <div class="digital-certified">
                    🛡️ Documento assinado digitalmente | IP: {{ $autorizacao->assinatura_ip }}<br>
                    ID Check: {{ substr(md5($autorizacao->id . 'overmelhinho'), 0, 12) }}
                </div>
            </div>
        @else
            <div class="signature-box">
                <div class="value">Assinatura do Contratante</div>
                <div class="label">Aguardando Assinatura Digital</div>
            </div>
        @endif
    </div>

    {{-- Termos --}}
    <div class="footer-legal">
        <strong>1. Objeto:</strong> O presente instrumento tem como objeto a prestação de serviços de publicidade pelo CONTRATADO ao CONTRATANTE, conforme especificações técnicas detalhadas na seção 2. 
        <strong>2. Vigência:</strong> A veiculação terá início e término conforme as datas pactuadas, podendo ser renovada mediante novo ajuste.
        <strong>3. Responsabilidade:</strong> O CONTRATANTE é o único responsável pela veracidade das informações, imagens e marcas fornecidas para a publicidade.
        @if($autorizacao->is_permuta)
        <strong>4. Permuta:</strong> As partes acordam que parte do pagamento será realizado através de permuta de bens ou serviços conforme descrito neste documento, devendo a entrega ocorrer no prazo acordado.
        @endif
        <strong>5. Foro:</strong> As partes elegem o foro da Comarca de Farroupilha/RS para dirimir quaisquer dúvidas oriundas deste contrato.
    </div>
</div>

</body>
</html>
