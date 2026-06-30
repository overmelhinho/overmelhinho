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
        $this->token = config('services.tiny.token');

        if (empty($this->token)) {
            Log::error('[TinyErpService] Token não encontrado no config! Verifique se TINY_ERP_TOKEN está no .env e limpe o cache.');
        }
    }

    /**
     * Sincroniza o cliente com o Tiny.
     * Se não tiver ID Tiny, cria (contato.incluir).
     * Se tiver, atualiza (contato.alterar) - opcional para este escopo, vamos focar no incluir/verificar.
     */
    /**
     * Procura o contato no Tiny pelo CPF ou CNPJ.
     * Retorna o ID do contato no Tiny se localizado, ou null caso contrário.
     */
    public function findClientByCpfCnpj(string $cpfCnpj): ?string
    {
        try {
            $cleaned = preg_replace('/\D/', '', $cpfCnpj);
            if (empty($cleaned)) {
                return null;
            }

            Log::info("[TinyErpService] Buscando contato no Tiny por CPF/CNPJ: {$cleaned}");

            $response = Http::asForm()->post("{$this->baseUrl}/contatos.pesquisa.php", [
                'token' => $this->token,
                'formato' => 'json',
                'pesquisa' => '',
                'cpf_cnpj' => $cleaned,
            ]);

            $json = $response->json();
            Log::info("Resposta da busca por CPF/CNPJ no Tiny:", [
                'cpf_cnpj' => $cleaned,
                'response' => $json
            ]);

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                return null;
            }

            $contacts = $json['retorno']['contatos'] ?? [];
            foreach ($contacts as $c) {
                $tinyCpfCnpj = preg_replace('/\D/', '', $c['contato']['cpf_cnpj'] ?? '');
                if ($tinyCpfCnpj === $cleaned) {
                    return (string)($c['contato']['id'] ?? '');
                }
            }

            return null;
        } catch (\Exception $e) {
            Log::error('Erro ao buscar cliente por CPF/CNPJ no Tiny: ' . $e->getMessage());
            return null;
        }
    }

    public function syncClient(Cliente $client): ?string
    {
        try {
            // Se o local não tem tiny_id, tenta localizar por CPF/CNPJ no Tiny antes de tentar cadastrar
            if (empty($client->tiny_id) && !empty($client->cpf_cnpj)) {
                $foundId = $this->findClientByCpfCnpj($client->cpf_cnpj);
                if ($foundId) {
                    Log::info("[TinyErpService] Cliente #{$client->id} já existe no Tiny com ID {$foundId}. Vinculando localmente.");
                    $client->update(['tiny_id' => $foundId]);
                    return $foundId;
                }
            }

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
                $erroMsg = 'Erro desconhecido';
                if (isset($json['retorno']['erros'][0]['erro'])) {
                    $erroMsg = $json['retorno']['erros'][0]['erro'];
                } elseif (isset($json['retorno']['registros'][0]['registro']['erros'][0]['erro'])) {
                    $erroMsg = $json['retorno']['registros'][0]['registro']['erros'][0]['erro'];
                }
                
                Log::error("Erro ao sincronizar contato no Tiny", [
                    'client_id' => $client->id,
                    'erro' => $erroMsg
                ]);
                throw new \Exception($erroMsg);
            }

            $tinyId = $json['retorno']['registros'][0]['registro']['id'] ?? $client->tiny_id;

            if ($tinyId && !$client->tiny_id) {
                $client->update(['tiny_id' => (string)$tinyId]);
            }

            return (string)$tinyId;
        }
        catch (\Exception $e) {
            Log::error('Exceção ao sincronizar cliente Tiny: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Cria Pedido de Venda/OS no Tiny.
     * Método: pedido.incluir.php
     * Isso gera automaticamente a Conta a Receber no Tiny.
     */
    public function createServiceOrder(Invoice $invoice, float $amountOverride = null): array
    {
        try {
            if (empty($invoice->client->tiny_id)) {
                $tinyId = $this->syncClient($invoice->client);
            } else {
                $tinyId = $invoice->client->tiny_id;
            }
        } catch (\Exception $e) {
            throw new \Exception("Erro ao sincronizar cliente no Tiny: " . $e->getMessage());
        }

        if (!$tinyId) {
            throw new \Exception("Não foi possível obter o ID do cliente no Tiny.");
        }

        $valorCobrado = $amountOverride !== null 
            ? $amountOverride 
            : ($invoice->payable_amount ?? $invoice->amount);

        // Identifica número da autorização, se aplicável
        $autorizacaoNumero = '';
        if ($invoice->group_id && str_starts_with($invoice->group_id, 'autorizacao-')) {
            $autId = str_replace('autorizacao-', '', $invoice->group_id);
            $aut = \App\Models\Autorizacao::find($autId);
            if ($aut) {
                $autorizacaoNumero = $aut->numero;
            }
        }

        $obsBase = "Parcela {$invoice->parcel_number}/{$invoice->total_parcels}.";
        if ($autorizacaoNumero) {
            $obsBase .= " Autorização: {$autorizacaoNumero}.";
        }
        if ($invoice->total_parcels > 1) {
            $obsBase .= " Grupo: {$invoice->group_id}";
        }

        $planName = $invoice->plan ? $invoice->plan->name : 'Plano Avulso';
        $planCode = $invoice->plan && $invoice->plan->tiny_product_id ? $invoice->plan->tiny_product_id : 'SRV-01';

        $pedido = [
            'data_pedido' => now()->format('d/m/Y'),
            'cliente' => [
                'codigo' => (int)$tinyId,
                'nome' => $invoice->client->razao_social ?: $invoice->client->nome_fantasia,
                'cpf_cnpj' => preg_replace('/\D/', '', $invoice->client->cpf_cnpj ?? ''),
                'endereco' => $invoice->client->enderecos()->first()->rua ?? '',
                'numero' => $invoice->client->enderecos()->first()->numero ?? '',
                'bairro' => $invoice->client->enderecos()->first()->bairro ?? '',
                'cep' => preg_replace('/\D/', '', $invoice->client->enderecos()->first()->cep ?? ''),
                'cidade' => $invoice->client->enderecos()->first()->cidade ?? '',
                'uf' => $invoice->client->enderecos()->first()->estado ?? '',
            ],
            'itens' => [
                [
                    'item' => [
                        'codigo' => $planCode,
                        'descricao' => $planName,
                        'unidade' => 'UN',
                        'quantidade' => 1,
                        'valor_unitario' => number_format($valorCobrado, 2, '.', '')
                    ]
                ]
            ],
            'parcelas' => [
                [
                    'parcela' => [
                        'dias' => 0,
                        'data' => $invoice->due_date instanceof \Carbon\Carbon ? $invoice->due_date->format('d/m/Y') : date('d/m/Y', strtotime($invoice->due_date)),
                        'valor' => number_format($valorCobrado, 2, '.', ''),
                        'forma_pagamento' => $this->mapFormaPagamento($invoice->payment_method),
                        'meio_pagamento' => $this->mapPaymentMethod($invoice->payment_method),
                        'obs' => $obsBase
                    ]
                ]
            ],
            'obs_internas' => $obsBase,
            'situacao' => 'aprovado'
        ];

        try {
            $response = Http::asForm()->post("{$this->baseUrl}/pedido.incluir.php", [
                'token' => $this->token,
                'formato' => 'json',
                'pedido' => json_encode(['pedido' => $pedido]),
            ]);

            $json = $response->json();
            Log::info('Resposta Tiny createServiceOrder:', ['invoice_id' => $invoice->id, 'response' => $json]);

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                Log::error('Erro ao criar pedido no Tiny', ['response' => $json, 'invoice_id' => $invoice->id]);
                throw new \Exception("Erro Tiny: " . ($json['retorno']['erros'][0]['erro'] ?? 'Erro desconhecido'));
            }

            $tinyOrderId = $json['retorno']['registros'][0]['registro']['id']
                ?? $json['retorno']['registros']['registro']['id']
                ?? null;
                
            $tinyContaId = $json['retorno']['registros'][0]['registro']['id_conta_receber']
                ?? $json['retorno']['registros']['registro']['id_conta_receber']
                ?? null;

            return [
                'tiny_order_id' => $tinyOrderId,
                'tiny_account_id' => $tinyContaId, // O Tiny V2 pode não retornar isso direto no pedido, mas guardamos se retornar
                'payment_url' => null,
            ];

        }
        catch (\Exception $e) {
            Log::error('Exceção ao criar pedido Tiny: ' . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Alias para createServiceOrder para manter compatibilidade com outras partes do sistema.
     */
    public function createReceivable(Invoice $invoice, float $amountOverride = null): array
    {
        return $this->createServiceOrder($invoice, $amountOverride);
    }

    /**
     * Efetua a baixa (liquidação) de uma conta a receber no Tiny.
     * Método: conta.receber.baixar.php
     *
     * Quando o valor da parcela foi editado localmente (ex: de R$ 199 para R$ 50),
     * o Tiny ainda tem o valor original. Na baixa, enviamos:
     *   - valor: o que foi efetivamente pago (R$ 50)
     *   - desconto: a diferença (R$ 149)
     * Isso mantém o fluxo de caixa correto.
     *
     * @param string $tinyAccountId  ID da conta no Tiny
     * @param float  $amount         Valor efetivamente pago
     * @param float  $discount       Desconto a aplicar (diferença entre valor original e pago)
     */
    public function payReceivable(string $tinyAccountId, float $amount = null, float $discount = 0): bool
    {
        try {
            $conta = [
                'id' => (int)$tinyAccountId,
                'data' => now()->format('d/m/Y'),
            ];

            if ($amount !== null) {
                $conta['valor'] = number_format($amount, 2, '.', '');
            }

            if ($discount > 0) {
                $conta['desconto'] = number_format($discount, 2, '.', '');
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

            if (!is_array($json)) {
                return null;
            }

            if ($response->failed() || ($json['retorno']['status'] ?? '') !== 'OK') {
                $erros = $json['retorno']['erros'] ?? [];
                foreach ($erros as $erro) {
                    $msg = $erro['erro'] ?? '';
                    $code = $json['retorno']['codigo_erro'] ?? '';
                    if ($code == '32' || str_contains(mb_strtolower($msg), 'não localizada') || str_contains(mb_strtolower($msg), 'nao localizada')) {
                        return ['not_found' => true];
                    }
                }
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
    /**
     * Gera uma nova conta no Tiny para uma parcela editada.
     * Necessário para que o boleto/link de pagamento saia com o valor correto.
     *
     * @param Invoice $invoice    Fatura local
     * @param float   $newAmount  Novo valor
     * @param string  $newDueDate Novo vencimento
     * @return array ['tiny_account_id' => string, 'payment_url' => string]
     */
    public function updateReceivable(Invoice $invoice, float $newAmount, string $newDueDate): array
    {
        Log::info("[TinyErpService::updateReceivable] Gerando nova conta para boleto atualizado.", [
            'invoice_id' => $invoice->id,
            'old_tiny_id' => $invoice->tiny_account_id,
            'new_amount' => $newAmount
        ]);

        // Salvamos temporariamente os novos valores no objeto para a criação
        $originalAmount = $invoice->payable_amount ?? $invoice->amount;
        $originalDate = $invoice->due_date;

        $invoice->payable_amount = $newAmount;
        $invoice->amount = $newAmount;
        $invoice->due_date = $newDueDate;

        try {
            // Criamos a nova conta (o Tiny gerará um novo link de boleto)
            $tinyData = $this->createReceivable($invoice, $newAmount);
            
            return $tinyData;
        } finally {
            // Restauramos os valores originais no objeto (o Controller salvará os novos se tudo der certo)
            $invoice->payable_amount = $originalAmount;
            $invoice->amount = $originalAmount;
            $invoice->due_date = $originalDate;
        }
    }

    protected function mapFormaPagamento(?string $method): string
    {
        $map = [
            'boleto'   => 'boleto',
            'pix'      => 'pix',
            'cartao'   => 'credito',
            'dinheiro' => 'dinheiro',
        ];

        return $map[$method] ?? 'boleto';
    }

    protected function mapPaymentMethod(?string $method): string
    {
        $map = [
            'boleto'   => 'Boleto Bancário',
            'pix'      => 'PIX',
            'cartao'   => 'Cartão de Crédito',
            'dinheiro' => 'Dinheiro',
        ];

        return $map[$method] ?? 'Boleto Bancário';
    }
}

