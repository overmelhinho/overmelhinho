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
            font-size: 10.5px;
            color: #232323;
            background: #fff;
            line-height: 1.4;
        }

        .container {
            width: 100%;
        }

        /* ── HEADER ─────── */
        .header {
            width: 100%;
            margin-bottom: 5px;
            text-align: center;
        }
        .logo-img {
            height: 48px;
            margin-bottom: 5px;
        }
        .empresa-info p {
            font-size: 9px;
            color: #666;
            line-height: 1.3;
        }
        
        .title-box {
            text-align: center;
            margin: 10px 0;
            padding: 8px 0;
            border-top: 2px solid #B70F0A;
            border-bottom: 1px solid #FDB913;
        }
        .title-box h2 {
            font-size: 13px;
            text-transform: uppercase;
            font-weight: 900;
            color: #232323;
            letter-spacing: 0.5px;
        }

        /* ── SECTIONS ── */
        .section-bar {
            background-color: #232323;
            padding: 5px 15px;
            margin-top: 15px;
            margin-bottom: 8px;
            border-bottom: 3px solid #FDB913;
        }
        .section-bar h3 {
            font-size: 10px;
            text-transform: uppercase;
            font-weight: 900;
            letter-spacing: 2px;
            color: #fff;
        }

        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 5px;
        }
        .data-table td {
            padding: 4px 10px;
            vertical-align: top;
            border-bottom: 1px solid #eee;
        }
        .label {
            font-size: 8.5px;
            font-weight: 900;
            color: #B70F0A;
            text-transform: uppercase;
            display: block;
            margin-bottom: 1px;
        }
        .value {
            font-size: 10px;
            color: #232323;
            font-weight: 600;
        }

        /* ── TABLES ─────── */
        table.payment-table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 5px;
            border: 1px solid #eee;
        }
        table.payment-table th {
            background-color: #f9f9f9;
            border-bottom: 2px solid #FDB913;
            padding: 6px;
            font-size: 9px;
            font-weight: 900;
            text-transform: uppercase;
            color: #232323;
        }
        table.payment-table td {
            border-bottom: 1px solid #eee;
            padding: 6px;
            font-size: 10px;
            color: #232323;
        }

        .text-right { text-align: right; }
        .text-center { text-align: center; }

        /* ── SIGNATURE ──── */
        .signature-area {
            margin-top: 30px;
        }
        .signature-table {
            width: 100%;
        }
        .signature-line {
            border-top: 1px solid #B70F0A;
            width: 85%;
            margin: 35px auto 5px auto;
        }
        .signature-label {
            font-size: 9px;
            font-weight: 900;
            color: #232323;
            text-transform: uppercase;
        }

        .footer-legal {
            font-size: 7px;
            color: #999;
            margin-top: 30px;
            text-align: justify;
            line-height: 1.4;
            border-top: 1px solid #eee;
            padding-top: 10px;
        }

        .accent-red {
            color: #B70F0A;
        }
    </style>
</head>
<body>

<div class="container">
    {{-- 1. HEADER --}}
    <div class="header">
        <div style="text-align: center; margin-bottom: 10px;">
            <img src="{{ public_path('logo-contract.png') }}" class="logo-img" alt="Logo">
        </div>
        
        <div class="empresa-info">
            <p style="font-weight: 900; color: #232323; font-size: 10px; margin-bottom: 2px;">GUIA DE NEGÓCIOS FARROUPILHA LTDA</p>
            <p>
                Rua Cel. Pena de Moraes, 513, Sala 1004 • Centro • Farroupilha/RS<br>
                (54) 3268.0002 • contato@overmelhinho.com.br • CNPJ: 09.951.787/0001-28
            </p>
        </div>
    </div>

    {{-- 2. TITLE BOX --}}
    <div class="title-box">
        <h2>Autorização de Publicidade e Prestação de Serviços nº {{ str_pad($autorizacao->numero, 5, '0', STR_PAD_LEFT) }}</h2>
    </div>

    {{-- 3. GERAL --}}
    <div class="section-bar">
        <h3>1. Identificação do Contratante</h3>
    </div>
    
    <table class="data-table">
        <tr>
            <td width="70%">
                <span class="label">Razão Social / Nome</span>
                <span class="value">{{ $autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia }}</span>
            </td>
            <td width="30%">
                <span class="label">Vendedor</span>
                <span class="value">{{ $autorizacao->vendedor?->name ?? '—' }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Nome Fantasia</span>
                <span class="value">{{ $autorizacao->cliente->nome_fantasia }}</span>
            </td>
            <td>
                <span class="label">Código da Autorização</span>
                <span class="value">#{{ str_pad($autorizacao->numero, 5, '0', STR_PAD_LEFT) }}</span>
            </td>
        </tr>
        <tr>
            <td>
                @php
                    $cpfCnpj = $autorizacao->cliente->cpf_cnpj;
                @endphp
                <span class="label">CNPJ/CPF</span>
                <span class="value">{{ $cpfCnpj }}</span>
            </td>
            <td>
                @php $end = $autorizacao->cliente->enderecos->first(); @endphp
                <span class="label">Cidade / UF</span>
                <span class="value">{{ $end?->cidade ?? '—' }} / {{ $end?->estado ?? '—' }}</span>
            </td>
        </tr>
        <tr>
            <td colspan="2">
                <span class="label">Endereço Completo</span>
                <span class="value">
                    {{ $end?->logradouro ?? '—' }}, {{ $end?->numero ?? 'S/N' }} - {{ $end?->bairro ?? '---' }} | CEP: {{ $end?->cep ?? '—' }}
                </span>
            </td>
        </tr>
        <tr>
            <td>
                @php $contato = $autorizacao->cliente->contatos->first(); @endphp
                <span class="label">E-mail para Faturamento</span>
                <span class="value">{{ $contato?->email_principal ?? '—' }}</span>
            </td>
            <td>
                <span class="label">Fone Principal / Celular</span>
                <span class="value">{{ $contato?->telefone_principal ?: $contato?->celular ?: '—' }}</span>
            </td>
        </tr>
    </table>

    {{-- 4. PUBLICIDADE --}}
    <div class="section-bar">
        <h3>2. Objeto e Detalhes da Veiculação</h3>
    </div>
    <table class="data-table">
        <tr>
            <td>
                <span class="label">Título do Anúncio</span>
                <span class="value accent-red" style="font-size: 11px;">{{ $autorizacao->titulo_anuncio }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Informativo Técnico / Veiculação</span>
                <span class="value" style="font-weight: normal; color: #444;">{{ $autorizacao->descricao_anuncio ?: 'Inclusão de publicidade no Guia Comercial O Vermelhinho, Portal de Notícias e Redes Sociais conforme plano contratado.' }}</span>
            </td>
        </tr>
        <tr>
            <td>
                <span class="label">Vigência do Contrato</span>
                <span class="value">{{ $autorizacao->data_inicio->format('d/m/Y') }} a {{ $autorizacao->data_fim->format('d/m/Y') }}</span>
            </td>
        </tr>
    </table>

    {{-- 5. PAGAMENTO --}}
    <div class="section-bar">
        <h3>3. Condições Comerciais e Pagamento</h3>
    </div>
    
    <table class="data-table" style="margin-bottom: 10px;">
        <tr>
            <td width="25%">
                <span class="label">Valor Bruto</span>
                <span class="value">R$ {{ number_format($autorizacao->valor_total, 2, ',', '.') }}</span>
            </td>
            <td width="25%">
                <span class="label">Forma de Pagto</span>
                <span class="value">{{ $autorizacao->modo_pagamento }}</span>
            </td>
            <td width="25%">
                <span class="label">Meio de Pagto</span>
                <span class="value">{{ match($autorizacao->payment_method) { 'pix' => 'PIX', 'boleto' => 'Boleto', 'cartao' => 'Cartão', 'dinheiro' => 'Dinheiro', default => $autorizacao->payment_method } }}</span>
            </td>
            <td width="25%">
                <span class="label">Valor Total Líquido</span>
                <span class="value accent-red">R$ {{ number_format($autorizacao->valor_liquido, 2, ',', '.') }}</span>
            </td>
        </tr>
    </table>

    <table class="payment-table" style="width: 70%; margin: 10px auto;">
        <thead>
            <tr>
                <th width="20%">Parcela</th>
                <th width="40%" class="text-center">Vencimento</th>
                <th width="40%" class="text-right">Valor Parcela</th>
            </tr>
        </thead>
        <tbody>
            @foreach($autorizacao->parcelas as $p)
            <tr>
                <td class="text-center">{{ $p->numero }}</td>
                <td class="text-center">{{ $p->vencimento->format('d/m/Y') }}</td>
                <td class="text-right" style="font-weight: bold;">R$ {{ number_format($p->payable_amount, 2, ',', '.') }}</td>
            </tr>
            @endforeach
        </tbody>
    </table>

    {{-- 6. OBSERVAÇÕES --}}
    @if($autorizacao->observacoes_anuncio || $autorizacao->observacoes_financeiro)
    <div class="section-bar">
        <h3>4. Observações e Ajustes Específicos</h3>
    </div>
    <div style="padding: 5px 10px; font-size: 8.5px; line-height: 1.5; color: #444;">
        @if($autorizacao->observacoes_anuncio)
            <p><strong>Notas de Produção:</strong> {{ $autorizacao->observacoes_anuncio }}</p>
        @endif
        @if($autorizacao->observacoes_financeiro)
            <p><strong>Notas de Faturamento:</strong> {{ $autorizacao->observacoes_financeiro }}</p>
        @endif
    </div>
    @endif

    {{-- 7. ASSINATURAS --}}
    <div class="signature-area">
        <table class="signature-table">
            <tr>
                <td width="50%" valign="bottom">
                    <div class="signature-line"></div>
                    <p class="text-center signature-label">CONTRATADA<br>Guia de Negócios Farroupilha Ltda</p>
                </td>
                <td width="50%" valign="bottom">
                    @if($autorizacao->status === 'assinado')
                        @if($autorizacao->justificativa_assinatura)
                            <p class="text-center" style="font-size: 8px; color: #B70F0A; font-weight: 900; margin-bottom: 20px;">ACEITE FORMALIZADO VIA WHATSAPP / ADMINISTRATIVO</p>
                        @elseif($autorizacao->assinatura_base64)
                            <div class="text-center">
                                <img src="{{ $autorizacao->assinatura_base64 }}" style="max-height: 45px; margin-bottom: -15px;">
                            </div>
                        @endif
                    @endif
                    <div class="signature-line"></div>
                    <p class="text-center signature-label">CONTRATANTE (ACEITE DIGITAL)<br>{{ $autorizacao->cliente->razao_social ?: $autorizacao->cliente->nome_fantasia }}</p>
                </td>
            </tr>
        </table>
        @if($autorizacao->status === 'assinado')
        <div class="text-center" style="margin-top: 15px; font-size: 7px; color: #999; font-style: italic;">
            Documento assinado digitalmente em {{ $autorizacao->assinado_em->format('d/m/Y H:i') }} | IP: {{ $autorizacao->assinatura_ip ?? 'Autorizado' }} | Hash: {{ substr(md5($autorizacao->id), 0, 16) }}
        </div>
        @endif
    </div>

    {{-- 8. TERMOS --}}
    <div class="footer-legal">
        Este documento constitui autorização irrevogável para a prestação dos serviços acima descritos. O CONTRATANTE declara ciência dos prazos e valores, autorizando a emissão de cobrança conforme cronograma. A veiculação está sujeita aos termos de uso do Portal O Vermelhinho. Eventual inadimplência sujeita o título a protesto e encargos legais. Foro: Farroupilha/RS.
    </div>
</div>

</body>
</html>
