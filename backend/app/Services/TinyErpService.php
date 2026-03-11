<?php

namespace App\Services;

use App\Models\Cliente;
use App\Models\Invoice;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class TinyErpService
{
    protected string $token;
    protected string $baseUrl = 'https://api.tiny.com.br/api2';

    public function __construct()
    {
        // Suporta tanto TINY_ERP_TOKEN quanto TINY_ERP (legado)
        $this->token = config('services.tiny.token', 
            env('TINY_ERP_TOKEN', env('TINY_ERP', ''))
        );

        if (empty($this->token)) {
            Log::warning('[TinyErpService] Token não configurado! Defina TINY_ERP_TOKEN no .env');
        }
    }

    /**
     * Sincroniza o cliente com o Tiny.
     * Se não tiver ID Tiny, cria (contato.incluir).
     * Se tiver, atualiza (contato.alterar) - opcional para este escopo, vamos focar no incluir/verificar.
     */
    public function syncClient(Cliente $client): ?string
    {
        try {
            $contatoData = $this->mapClientToTiny($client);
            $method = $client->tiny_id ? 'contato.alterar.php' : 'contato.incluir.php';

            if ($client->tiny_id) {
                // O ID deve ser enviado como o identificador do registro (inteiro)
                $contatoData['id'] = (int)$client->tiny_id;
            }

            // O Tiny v2 exige JSON singular para 'alterar' e plural (lista) para 'incluir'
            $payload = ($method === 'contato.alterar.php')
                ? ['contato' => $contatoData]
                : ['contatos' => [['contato' => $contatoData]]];

            Log::info("Enviando dados do cliente ao Tiny ({$method}):", [
                'client_id' => $client->id,
                'method' => $method,
                'data' => $payload
            ]);

            $response = Http::asForm()->post("{$this->baseUrl}/{$method}", [
                'token' => $this->token,
                'formato' => 'json',
                'contato' => json_encode($payload),
            ]);

            $json = $response->json();
            Log::info("Resposta do Tiny ({$method}):", [
                'client_id' => $client->id,
                'response' => $json
            ]);

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                Log::error("Erro ao sincronizar contato no Tiny", [
                    'method' => $method,
                    'response' => $json,
                    'client_id' => $client->id
                ]);
                return $client->tiny_id;
            }

            // No incluir, retornará o ID no registros[0]. No alterar pode vir ID ou vazio (se não houve mudança)
            $tinyId = $json['retorno']['registros'][0]['registro']['id'] ?? $client->tiny_id;

            if ($tinyId && !$client->tiny_id) {
                $client->update(['tiny_id' => (string)$tinyId]);
            }

            return (string)$tinyId;

        }
        catch (\Exception $e) {
            Log::error('Exceção ao sincronizar cliente Tiny: ' . $e->getMessage());
            return $client->tiny_id;
        }
    }

    /**
     * Cria conta a receber no Tiny.
     * Método: conta.receber.incluir
     */
    public function createReceivable(Invoice $invoice, float $amountOverride = null): array
    {
        // Sempre tenta sincronizar/atualizar o cliente antes de criar a conta
        $tinyId = $this->syncClient($invoice->client);
        if (!$tinyId) {
            throw new \Exception("Não foi possível sincronizar o cliente nº {$invoice->client->id} com o Tiny.");
        }

        $valorCobrado = $amountOverride !== null 
            ? $amountOverride 
            : ($invoice->payable_amount ?? $invoice->amount);

        $contaReceber = [
            'data_emissao' => now()->format('d/m/Y'),
            'vencimento' => $invoice->due_date instanceof \Carbon\Carbon ? $invoice->due_date->format('d/m/Y') : date('d/m/Y', strtotime($invoice->due_date)),
            'valor' => number_format($valorCobrado, 2, ',', ''),
            'historico' => "Fatura #{$invoice->id} - Plano " . ($invoice->plan ? $invoice->plan->name : 'Avulso'),
            'cliente' => [
                'id' => (int)$invoice->client->tiny_id,
                'nome' => $invoice->client->razao_social ?: $invoice->client->nome_fantasia,
                'cpf_cnpj' => preg_replace('/\D/', '', $invoice->client->cpf_cnpj ?? ''),
                'endereco' => $invoice->client->enderecos()->first()->rua ?? '',
                'numero' => $invoice->client->enderecos()->first()->numero ?? '',
                'bairro' => $invoice->client->enderecos()->first()->bairro ?? '',
                'cep' => preg_replace('/\D/', '', $invoice->client->enderecos()->first()->cep ?? ''),
                'cidade' => $invoice->client->enderecos()->first()->cidade ?? '',
                'uf' => $invoice->client->enderecos()->first()->estado ?? '',
            ],
            'meio_pagamento' => $this->mapPaymentMethod($invoice->payment_method),
            'observacoes' => "Parcela {$invoice->parcel_number}/{$invoice->total_parcels}. " . ($invoice->total_parcels > 1 ? "Grupo: {$invoice->group_id}" : ""),
        ];

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/conta.receber.incluir.php", [
                'token' => $this->token,
                'formato' => 'json',
                'conta' => json_encode(['conta' => array_merge(['sequencia' => '1'], $contaReceber)]),
            ]);

            $json = $response->json();
            Log::info('Resposta Tiny createReceivable:', ['invoice_id' => $invoice->id, 'response' => $json]);

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                Log::error('Erro ao criar conta no Tiny', ['response' => $json, 'invoice_id' => $invoice->id]);
                throw new \Exception("Erro Tiny: " . ($json['retorno']['erros'][0]['erro'] ?? 'Erro desconhecido'));
            }

            $tinyContaId = $json['retorno']['registros'][0]['registro']['id']
                ?? $json['retorno']['registros']['registro']['id']
                ?? null;

            // O Tiny retorna ID da conta. O link de pagamento (boleto) geralmente precisa ser gerado em outro passo
            // ou se o Tiny estiver configurado p/ gerar boleto automático, ele pode retornar o link ou token.
            // Para simplificar, assumimos que vamos pegar o 'link_boleto' se vier, ou vamos precisar de outra chamada 
            // 'boleto.gerar' se for o caso. O prompt diz: "O Tiny devolve o ID da conta e o link de pagamento".
            // Vamos logar o retorno para debug, mas salvar o ID.

            $paymentLink = null;
            // Verifica se o Tiny retornou link (depende da config da conta Tiny)
            // Se não, teríamos que chamar algo como 'gerar.boleto'.
            // Vamos salvar o ID primeiro.

            return [
                'tiny_account_id' => $tinyContaId,
                'payment_url' => $paymentLink, // Pode ser null inicialmente
            ];

        }
        catch (\Exception $e) {
            Log::error('Exceção ao criar conta Tiny: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Efetua a baixa (liquidação) de uma conta a receber no Tiny.
     * Método: conta.receber.baixar.php
     */
    public function payReceivable(string $tinyAccountId, float $amount = null): bool
    {
        try {
            $conta = [
                'id' => (int)$tinyAccountId,
                'data' => now()->format('d/m/Y'),
            ];

            if ($amount) {
                // O Tiny v2 espera o valor com vírgula para centavos se enviado como string formatada
                $conta['valor'] = number_format($amount, 2, ',', '');
            }

            Log::info("Baixando conta no Tiny: {$tinyAccountId}", $conta);

            $response = Http::asForm()->post("{$this->baseUrl}/conta.receber.baixar.php", [
                'token' => $this->token,
                'formato' => 'json',
                'conta' => json_encode(['conta' => $conta]),
            ]);

            $json = $response->json();
            Log::info('Resposta Tiny payReceivable:', ['tiny_id' => $tinyAccountId, 'response' => $json]);

            return ($json['retorno']['status'] ?? '') === 'OK';
        }
        catch (\Exception $e) {
            Log::error("Erro ao baixar conta {$tinyAccountId} no Tiny: " . $e->getMessage());
            return false;
        }
    }

    /**
     * Obtém os dados de uma conta a receber no Tiny para conferir o status.
     * Método: conta.receber.obter.php
     */
    public function getReceivableStatus(string $tinyAccountId): ?array
    {
        try {
            $response = Http::asForm()->post("{$this->baseUrl}/conta.receber.obter.php", [
                'token' => $this->token,
                'formato' => 'json',
                'id' => (int)$tinyAccountId,
            ]);

            $json = $response->json();

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                return null;
            }

            // O Tiny retorna a situação (1 = Aberto, 2 = Recebido, 3 = Cancelado)
            return $json['retorno']['conta'] ?? null;
        }
        catch (\Exception $e) {
            Log::error("Erro ao obter status da conta {$tinyAccountId} no Tiny: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Sincroniza um Plano (Serviço) com o Tiny.
     */
    public function syncPlan(\App\Models\Plan $plan): bool
    {
        try {
            $productData = [
                'sequencia' => '1',
                'codigo' => $plan->tiny_product_id ?: 'PLANO-' . $plan->id,
                'nome' => $plan->name,
                'unidade' => 'UN',
                'preco' => number_format($plan->price, 2, '.', ''),
                'origem' => '0',
                'tipo' => 'S', // S para Serviço, P para Produto
                'situacao' => 'A', // Ativo
                'ncm' => '0000.00.00', // NCM padrão para serviços se não houver
            ];

            $response = Http::asForm()->post("{$this->baseUrl}/produto.incluir.php", [
                'token' => $this->token,
                'formato' => 'json',
                'produto' => json_encode(['produtos' => [['produto' => $productData]]]),
            ]);

            $json = $response->json();
            Log::info('Resposta Tiny syncPlan:', ['plan_id' => $plan->id, 'response' => $json]);

            // Se retornar erro de "Código já cadastrado", consideramos OK (já existe)
            if (($json['retorno']['status'] ?? '') === 'Erro') {
                foreach (($json['retorno']['erros'] ?? []) as $erro) {
                    if (str_contains($erro['erro'] ?? '', 'já cadastrado')) {
                        return true;
                    }
                }
                Log::error('Erro ao criar produto no Tiny', ['response' => $json, 'plan_id' => $plan->id]);
                return false;
            }

            // A estrutura de retorno do Tiny para inclusão costuma ser registros -> registro -> id
            $tinyProductId = $json['retorno']['registros'][0]['registro']['id']
                ?? $json['retorno']['registros']['registro']['id']
                ?? null;

            // Se criou com sucesso ou já existia, atualizamos o tiny_product_id local se estivesse vazio
            $updateData = [];
            if (!$plan->tiny_product_id) {
                $updateData['tiny_product_id'] = $productData['codigo'];
            }
            if ($tinyProductId) {
                $updateData['tiny_id'] = (string)$tinyProductId;
            }

            if (!empty($updateData)) {
                $plan->update($updateData);
            }

            return true;
        }
        catch (\Exception $e) {
            Log::error('Exceção ao sincronizar plano Tiny: ' . $e->getMessage());
            return false;
        }
    }

    /**
     * Mapeia objeto Cliente para array formato Tiny
     */
    protected function mapClientToTiny(Cliente $client): array
    {
        $contato = $client->contatos()->first();
        $endereco = $client->enderecos()->first();

        $cpfCnpj = preg_replace('/\D/', '', $client->cpf_cnpj ?? '');
        $tipoPessoa = strlen($cpfCnpj) > 11 ? 'J' : 'F';

        $estados = [
            'acre' => 'AC', 'alagoas' => 'AL', 'amapá' => 'AP', 'amazonas' => 'AM', 'bahia' => 'BA',
            'ceará' => 'CE', 'distrito federal' => 'DF', 'espírito santo' => 'ES', 'goiás' => 'GO',
            'maranhão' => 'MA', 'mato grosso' => 'MT', 'mato grosso do sul' => 'MS', 'minas gerais' => 'MG',
            'pará' => 'PA', 'paraíba' => 'PB', 'paraná' => 'PR', 'pernambuco' => 'PE', 'piauí' => 'PI',
            'rio de janeiro' => 'RJ', 'rio grande do norte' => 'RN', 'rio grande do sul' => 'RS',
            'rondônia' => 'RO', 'roraima' => 'RR', 'santa catarina' => 'SC', 'são paulo' => 'SP',
            'sergipe' => 'SE', 'tocantins' => 'TO'
        ];

        $ufRaw = trim($endereco->estado ?? '');
        $uf = '';
        if ($ufRaw) {
            $uf = (strlen($ufRaw) === 2) ? strtoupper($ufRaw) : ($estados[mb_strtolower($ufRaw)] ?? '');
        }

        $data = [
            'nome' => $client->razao_social ?: $client->nome_fantasia,
            'fantasia' => $client->nome_fantasia,
            'tipo_pessoa' => $tipoPessoa,
            'cpf_cnpj' => $cpfCnpj,
            'ie' => $client->inscricao_estadual ?? '',
            'im' => $client->inscricao_municipal ?? '',
            'contribuinte' => ($client->inscricao_estadual && $tipoPessoa === 'J') ? '1' : '9',
            'endereco' => $endereco ? ($endereco->rua ?? '') : '',
            'numero' => $endereco ? ($endereco->numero ?? '') : '',
            'complemento' => $endereco ? ($endereco->complemento ?? '') : '',
            'bairro' => $endereco ? ($endereco->bairro ?? '') : '',
            'cep' => $endereco ? preg_replace('/\D/', '', $endereco->cep ?? '') : '',
            'cidade' => $endereco ? ($endereco->cidade ?? '') : '',
            'uf' => $uf,
            'pais' => 'Brasil',
            'fone' => $contato ? preg_replace('/\D/', '', $contato->telefone_principal ?? '') : '',
            'celular' => $contato ? preg_replace('/\D/', '', $contato->celular ?? '') : '',
            'email' => $contato ? ($contato->email_principal ?? '') : '',
            'situacao' => 'A',
            'tipos_contato' => [
                ['tipo_contato' => 'C'] // C para Cliente
            ],
            'atualizar_cliente' => 'S', // Forçar atualização de campos bloqueados
            // Mapeia também endereço de cobrança, pois alguns contextos exigem
            'endereco_cobranca' => $endereco ? ($endereco->rua ?? '') : '',
            'numero_cobranca' => $endereco ? ($endereco->numero ?? '') : '',
            'complemento_cobranca' => $endereco ? ($endereco->complemento ?? '') : '',
            'bairro_cobranca' => $endereco ? ($endereco->bairro ?? '') : '',
            'cep_cobranca' => $endereco ? preg_replace('/\D/', '', $endereco->cep ?? '') : '',
            'cidade_cobranca' => $endereco ? ($endereco->cidade ?? '') : '',
            'uf_cobranca' => $uf,
        ];

        // Código de integração local
        $data['codigo'] = (string)$client->id;

        // Sequência é obrigatória pelo Tiny v2 em todas as operações de lista
        $data['sequencia'] = '1';

        return $data;
    }

    /**
     * Mapeia o método de pagamento interno para o formato do Tiny.
     */
    protected function mapPaymentMethod(?string $method): string
    {
        $map = [
            'boleto' => 'Boleto Bancário',
            'pix' => 'Pix',
            'cartao' => 'Cartão de Crédito',
            'dinheiro' => 'Dinheiro',
        ];

        return $map[$method] ?? 'Boleto Bancário';
    }
}
