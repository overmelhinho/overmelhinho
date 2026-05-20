<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\Cliente;
use App\Models\Endereco;
use App\Models\Contato;
use App\Models\Cidade;
use App\Models\Segmento;
use App\Models\Autorizacao;
use App\Models\AutorizacaoParcela;
use App\Models\JobOpportunity;
use App\Models\Candidate;
use App\Models\User;
use App\Models\RedeSocial;
use App\Models\Quote;
use App\Models\Lead;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Hash;

class MigrateLegacyData extends Command
{
    protected $signature = 'migrate:legacy {--clear : Limpar dados atuais antes de migrar}';
    protected $description = 'Migra dados do banco MySQL legado para o novo sistema';

    private $bairros = [];
    private $enderecoBairroMap = [];

    public function handle()
    {
        if ($this->option('clear')) {
            $this->info('Limpando dados atuais...');
            // Executar o script de reset que criamos anteriormente
            $this->call('tinker', ['scripts/reset_data.php']);
        }

        $this->info('Iniciando migração do banco legado...');

        // 0. Cachear Bairros e Mapeamento
        $this->info('Cacheando bairros e mapeamentos...');
        $this->bairros = DB::connection('legacy')->table('bairros')->pluck('bairro', 'id')->toArray();
        $this->enderecoBairroMap = DB::connection('legacy')->table('enderecos_bairros')->pluck('id_bairro', 'id_endereco')->toArray();

        // 1. Migrar Cidades
        $this->withRetry(fn() => $this->migrateCidades());

        // 2. Migrar Categorias (Segmentos)
        $this->withRetry(fn() => $this->migrateCategorias());

        // 3. Migrar Clientes
        $this->withRetry(fn() => $this->migrateClientes());

        // 4. Migrar Publicidades (Autorizações)
        $this->withRetry(fn() => $this->migratePublicidades());

        // 5. Migrar Imagens da Galeria
        $this->withRetry(fn() => $this->migrateImagens());

        // 6. Migrar Vagas de Emprego
        $this->withRetry(fn() => $this->migrateVagas());

        // 7. Migrar Candidatos
        $this->withRetry(fn() => $this->migrateCandidatos());

        // 8. Migrar Usuários (Administradores e Vendedores)
        // $this->withRetry(fn() => $this->migrateUsuarios());

        // 9. Migrar Orçamentos (Quotes)
        // $this->withRetry(fn() => $this->migrateOrcamentos());

        $this->info('Migração concluída!');
    }

    private function migrateCidades()
    {
        if (Cidade::count() > 0) {
            $this->info('Cidades já migradas, pulando...');
            return;
        }
        $this->info('Migrando cidades...');
        $legacyCidades = DB::connection('legacy')->table('cidades')->get();

        foreach ($legacyCidades as $lc) {
            Cidade::updateOrCreate(
                ['id' => $lc->id],
                [
                    'nome' => $lc->cidade,
                    'uf' => $lc->uf,
                ]
            );
        }
    }

    private function migrateCategorias()
    {
        if (Segmento::count() > 0) {
            $this->info('Segmentos já migrados, pulando...');
            return;
        }
        $this->info('Migrando categorias (segmentos)...');
        $legacyCategorias = DB::connection('legacy')->table('categorias')->get();

        foreach ($legacyCategorias as $cat) {
            Segmento::updateOrCreate(
                ['id' => $cat->id],
                [
                    'nome' => $cat->nome,
                ]
            );
        }
    }

    private function migrateClientes()
    {
        $this->info('Migrando clientes (isso pode levar alguns minutos)...');
        
        $lastId = Cliente::max('id') ?? 0;
        $total = DB::connection('legacy')->table('clientes')->where('id', '>', $lastId)->count();
        $this->info("Total de clientes pendentes no legado: $total (começando após ID $lastId)");
        $bar = $this->output->createProgressBar($total);

        // Desabilitar eventos e auditoria para velocidade máxima
        Cliente::flushEventListeners();
        Endereco::flushEventListeners();
        Contato::flushEventListeners();

        DB::connection('legacy')->table('clientes')
            ->where('id', '>', $lastId)
            ->orderBy('id')
            ->chunk(200, function ($clientes) use ($bar) {
            
            // Reconnect to avoid timeout
            DB::connection('pgsql')->reconnect();
            
            $clienteIds = $clientes->pluck('id')->toArray();
            $enderecoIds = $clientes->pluck('id_endereco')->filter()->toArray();
            
            // Pre-carregar endereços do lote
            $legacyEnderecos = DB::connection('legacy')->table('enderecos')
                ->whereIn('id', $enderecoIds)
                ->get()
                ->keyBy('id');
                
            // Pre-carregar categorias do lote
            $legacyCategoriasMap = DB::connection('legacy')->table('clientes_categorias')
                ->whereIn('id_cliente', $clienteIds)
                ->get()
                ->groupBy('id_cliente');

            $links = [];
            foreach ($clientes as $lc) {
                try {
                    // Criar/Atualizar Cliente
                    $cliente = Cliente::updateOrCreate(
                        ['id' => $lc->id],
                        [
                            'nome_fantasia' => $lc->pj_nome_fantasia ?: ($lc->pf_nome ? $lc->pf_nome . ' ' . $lc->pf_sobrenome_principal : 'Sem Nome'),
                            'razao_social' => $lc->pj_razao_social,
                            'cpf_cnpj' => $lc->pj_cnpj ?: $lc->pj_cpf ?: $lc->documento,
                            'inscricao_estadual' => $lc->pj_ie ?: $lc->pj_inscricao_estadual_municipal,
                            'responsavel' => $lc->pj_nome_contato,
                            'tipo_cliente' => $lc->pj_cnpj ? 'PJ' : 'PF',
                            'exibir_no_site' => $lc->ativo === 'Sim',
                        ]
                    );

                    // Criar Endereço
                    $le = $legacyEnderecos[$lc->id_endereco] ?? null;
                    if ($le) {
                        $idBairro = $this->enderecoBairroMap[$le->id] ?? null;
                        $nomeBairro = $this->bairros[$idBairro] ?? null;

                        Endereco::updateOrCreate(
                            ['id' => $le->id],
                            [
                                'cliente_id' => $cliente->id,
                                'logradouro' => $le->endereco,
                                'numero' => $le->numero,
                                'complemento' => $le->complemento,
                                'bairro' => $nomeBairro,
                                'cidade_id' => $le->id_cidade,
                                'cep' => $le->cep,
                                'tipo_endereco' => 'Comercial',
                            ]
                        );
                    }

                    // Criar Contato
                    Contato::updateOrCreate(
                        ['id' => $cliente->id], 
                        [
                            'cliente_id' => $cliente->id,
                            'telefone_principal' => $lc->fone_principal,
                            'telefone_secundario' => $lc->fone_secundario,
                            'celular' => $lc->celular,
                            'email_principal' => $lc->email,
                            'email_cobranca' => $lc->email_financeiro,
                            'site' => $lc->pj_site,
                            'nome_contato' => $lc->pj_nome_contato,
                            'has_whatsapp_principal' => $lc->fone_principal_possui_whatsapp === 'Sim',
                            'has_whatsapp_celular' => $lc->celular_possui_whatsapp === 'Sim',
                        ]
                    );

                    // Acumular Categorias
                    $legacyCats = $legacyCategoriasMap[$lc->id] ?? collect();
                    foreach ($legacyCats as $lcat) {
                        $links[] = ['cliente_id' => $cliente->id, 'segmento_id' => $lcat->id_categoria];
                    }

                    // Migrar Redes Sociais
                    $socialPlatforms = [
                        'facebook' => $lc->pj_facebook,
                        'instagram' => $lc->pj_instagram,
                        'youtube' => $lc->pj_youtube,
                        'linkedin' => $lc->pj_linkedin,
                        'tiktok' => $lc->pj_tiktok,
                        'twitter' => $lc->pj_twitter,
                    ];

                    foreach ($socialPlatforms as $type => $url) {
                        if (!empty($url) && !in_array(strtolower($url), ['não informado', '---', 'nao informado'])) {
                            RedeSocial::updateOrCreate(
                                ['cliente_id' => $cliente->id, 'tipo' => $type],
                                ['url' => $url]
                            );
                        }
                    }
                } catch (\Exception $e) {
                    $this->error("Erro no cliente ID {$lc->id}: " . $e->getMessage());
                    \Log::error("Migração Cliente ID {$lc->id}: " . $e->getMessage());
                }

                $bar->advance();
            }

            if (!empty($links)) {
                DB::table('cliente_segmento')->insertOrIgnore($links);
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function migratePublicidades()
    {
        $this->info('Migrando publicidades (autorizações)...');
        
        $lastId = Autorizacao::max('id') ?? 0;
        $total = DB::connection('legacy')->table('publicidades')->where('id', '>', $lastId)->count();
        $this->info("Total de publicidades pendentes: $total (começando após ID $lastId)");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        // Cache de pagamentos para evitar milhares de queries
        $this->info(' Carregando cache de pagamentos...');
        $pagamentos = DB::connection('legacy')->table('publicidades_parcelas_pagamentos')->pluck('id_parcela')->toArray();
        $pagamentos = array_flip($pagamentos); // Para busca rápida isset()

        DB::connection('legacy')->table('publicidades')->where('id', '>', $lastId)->orderBy('id')->chunk(200, function ($publicidades) use ($bar, $pagamentos) {
            // Reconnect to avoid timeout
            DB::connection('pgsql')->reconnect();
            
            $ids = $publicidades->pluck('id')->toArray();
            
            // Pre-carregar parcelas para o lote todo
            $batchParcelas = DB::connection('legacy')->table('publicidades_parcelas')
                ->whereIn('id_publicidade', $ids)
                ->get()
                ->groupBy('id_publicidade');
            
            foreach ($publicidades as $lp) {
                try {
                    // Verificar se o cliente existe
                    if (!Cliente::find($lp->id_cliente)) {
                        $bar->advance();
                        continue;
                    }

                    $numero = $lp->num_autorizacao ?: $lp->id;
                    
                    // Verificar se o número já está em uso por outro registro para evitar erro de UNIQUE
                    $exists = Autorizacao::where('numero', $numero)->where('id', '!=', $lp->id)->exists();
                    if ($exists) {
                        $numero = $numero . '-dup-' . $lp->id;
                    }

                    $autorizacao = Autorizacao::updateOrCreate(
                        ['id' => $lp->id],
                        [
                            'cliente_id' => $lp->id_cliente,
                            'numero' => $numero,
                            'titulo_anuncio' => $lp->titulo ?: 'Publicidade Legada',
                            'descricao_anuncio' => $lp->observacoes_anuncio,
                            'valor_total' => is_numeric($lp->valor) ? $lp->valor : 0,
                            'data_inicio' => $this->sanitizeDate($lp->data_inicial) ?: $this->sanitizeDate($lp->data_emissao) ?: $this->sanitizeDate($lp->data_cadastro) ?: '2000-01-01',
                            'data_fim' => $this->sanitizeDate($lp->data_final) ?: '2099-12-31',
                            'modo_pagamento' => strtolower($lp->tipo_pagamento) === 'parcelado' ? 'parcelado' : 'direto',
                            'num_parcelas' => $lp->parcelamento_qtd ?: 1,
                            'data_primeira_parcela' => $this->sanitizeDate($lp->parcelamento_data_parcela1 ?: $lp->data_inicial ?: $lp->data_emissao) ?: '2000-01-01',
                            'payment_method' => $this->mapPaymentMethod($lp->modo_pagamento),
                            'assinatura_base64' => $lp->arquivo_assinatura,
                            'status' => 'assinado',
                            'vendedor_id' => $lp->id_vendedor,
                        ]
                    );

                    // Migrar Parcelas pré-carregadas
                    $legacyParcelas = $batchParcelas[$lp->id] ?? collect();

                    foreach ($legacyParcelas as $idx => $lpar) {
                        $isPago = isset($pagamentos[$lpar->id]);

                        AutorizacaoParcela::updateOrCreate(
                            ['id' => $lpar->id],
                            [
                                'autorizacao_id' => $autorizacao->id,
                                'numero' => $idx + 1,
                                'vencimento' => $this->sanitizeDate($lpar->data_vencimento) ?: $autorizacao->data_inicio,
                                'valor' => is_numeric($lpar->valor) ? $lpar->valor : 0,
                                'status' => $isPago ? 'pago' : 'pendente',
                            ]
                        );
                    }
                } catch (\Exception $e) {
                    $this->error("Erro na publicidade ID {$lp->id}: " . $e->getMessage());
                    \Log::error("Migração Publicidade ID {$lp->id}: " . $e->getMessage());
                }

                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function sanitizeDate($date)
    {
        if (!$date || str_starts_with($date, '0000') || str_starts_with($date, '-')) {
            return null;
        }
        return $date;
    }

    private function mapPaymentMethod($legacyMethod)
    {
        $map = [
            'Direto' => 'dinheiro',
            'Boleto' => 'boleto',
            'Cheque' => 'dinheiro',
            'Permuta' => 'dinheiro',
            'Cartão de Débito' => 'cartao',
            'Cartão de Crédito' => 'cartao',
        ];

        return $map[$legacyMethod] ?? 'pix';
    }

    private function migrateImagens()
    {
        $this->info('Migrando imagens da galeria...');
        
        $lastId = \App\Models\GaleriaImagem::max('id') ?? 0;
        $total = DB::connection('legacy')->table('clientes_imagens')->where('id', '>', $lastId)->count();
        $this->info("Total de imagens pendentes: $total (começando após ID $lastId)");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        DB::connection('legacy')->table('clientes_imagens')->where('id', '>', $lastId)->orderBy('id')->chunk(200, function ($imagens) use ($bar) {
            foreach ($imagens as $li) {
                // Verificar se o cliente existe
                if (!Cliente::find($li->id_cliente)) {
                    $bar->advance();
                    continue;
                }

                try {
                    // Evitar erro de unique (cliente_id, url) que ocorre em dados legados duplicados
                    $exists = \App\Models\GaleriaImagem::where('cliente_id', $li->id_cliente)
                                ->where('url', $li->imagem)
                                ->exists();

                    if (!$exists) {
                        \App\Models\GaleriaImagem::updateOrCreate(
                            ['id' => $li->id],
                            [
                                'cliente_id' => $li->id_cliente,
                                'url' => $li->imagem,
                                'thumb_url' => $li->imagem, // Legado não parece ter thumbs separados
                                'legenda' => 'Imagem Legada',
                            ]
                        );
                    }
                } catch (\Exception $e) {
                    $this->error("Erro na imagem ID {$li->id}: " . $e->getMessage());
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function migrateVagas()
    {
        $this->info('Migrando vagas de emprego...');
        
        $lastId = JobOpportunity::max('id') ?? 0;
        $total = DB::connection('legacy')->table('empregos')->where('id_empregos', '>', $lastId)->count();
        $this->info("Total de vagas pendentes: $total (começando após ID $lastId)");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        DB::connection('legacy')->table('empregos')->where('id_empregos', '>', $lastId)->orderBy('id_empregos')->chunk(100, function ($vagas) use ($bar) {
            foreach ($vagas as $lv) {
                // Verificar se o cliente existe
                if (!Cliente::find($lv->id_clientes)) {
                    $bar->advance();
                    continue;
                }

                try {
                    JobOpportunity::updateOrCreate(
                        ['id' => $lv->id_empregos],
                        [
                            'client_id' => $lv->id_clientes,
                            'title' => $lv->titulo,
                            'description' => $this->cleanLegacyHtml($lv->descricao),
                            'salary_range' => $this->mapSalaryRange($lv->faixa_salarial),
                            'hiring_type' => $this->mapContractType($lv->tipo_contrato),
                            'work_model' => $lv->metodo_trabalho == '1' ? 'Presencial' : null,
                            'vacancies' => $lv->nro_vagas,
                            'experience_required' => $lv->experiencia_exigida,
                            'education_level' => $this->mapEducationLevel($lv->nivel_escolaridade),
                            'contact_email' => $lv->email,
                            'contact_whatsapp' => $lv->whatsapp,
                            'is_active' => 'true',
                            'status' => 'Published',
                            'published_at' => $this->sanitizeDate($lv->data_cadastro),
                            'expires_at' => $this->sanitizeDate($lv->data_validade),
                        ]
                    );
                } catch (\Exception $e) {
                    $this->error("Erro na vaga ID {$lv->id_empregos}: " . $e->getMessage());
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function migrateCandidatos()
    {
        $this->info('Migrando candidatos...');
        
        $lastId = Candidate::max('id') ?? 0;
        $total = DB::connection('legacy')->table('vaga_curriculo')->where('id', '>', $lastId)->count();
        $this->info("Total de candidatos pendentes: $total (começando após ID $lastId)");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        DB::connection('legacy')->table('vaga_curriculo')->where('id', '>', $lastId)->orderBy('id')->chunk(200, function ($candidatos) use ($bar) {
            foreach ($candidatos as $lc) {
                // Verificar se a vaga existe
                if (!JobOpportunity::find($lc->id_vaga)) {
                    $bar->advance();
                    continue;
                }

                try {
                    Candidate::updateOrCreate(
                        ['id' => $lc->id],
                        [
                            'job_opportunity_id' => $lc->id_vaga,
                            'name' => $lc->nome,
                            'email' => $lc->email,
                            'phone' => $lc->telefone,
                            'status' => 'New',
                        ]
                    );
                } catch (\Exception $e) {
                    $this->error("Erro no candidato ID {$lc->id}: " . $e->getMessage());
                }
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function cleanLegacyHtml($html)
    {
        if (!$html) return null;
        $desc = html_entity_decode($html, ENT_QUOTES | ENT_HTML5, 'UTF-8');
        $desc = str_ireplace(['<br>', '<br/>', '<br />'], "\n", $desc);
        $desc = strip_tags($desc);
        $desc = html_entity_decode($desc, ENT_QUOTES, 'UTF-8');
        return trim(preg_replace("/\n{3,}/", "\n\n", $desc));
    }

    private function mapSalaryRange($id)
    {
        $map = [
            '1' => 'Até R$ 1.000,00', '2' => 'R$ 1.000,00 a R$ 2.000,00', '3' => 'R$ 2.000,00 a R$ 3.000,00',
            '4' => 'R$ 3.000,00 a R$ 4.000,00', '5' => 'R$ 4.000,00 a R$ 5.000,00', '6' => 'Acima de R$ 5.000,00',
            '7' => 'A Combinar', '8' => 'A Combinar',
        ];
        return $map[$id] ?? null;
    }

    private function mapContractType($id)
    {
        $map = [
            '1' => 'CLT (Efetivo)', '2' => 'PJ (Pessoa Jurídica)', '3' => 'Estágio',
            '4' => 'Temporário', '5' => 'Freelancer', '6' => 'Trainee',
        ];
        return $map[$id] ?? null;
    }

    private function mapEducationLevel($id)
    {
        $map = [
            '1' => 'Ensino Fundamental Incompleto', '2' => 'Ensino Fundamental Completo', '3' => 'Ensino Médio Incompleto',
            '4' => 'Ensino Médio Completo', '5' => 'Ensino Técnico Incompleto', '6' => 'Ensino Técnico Completo',
            '7' => 'Ensino Superior Incompleto', '8' => 'Ensino Superior Completo', '9' => 'Pós-graduação',
            '10' => 'Indiferente / Não Informado',
        ];
        return $map[$id] ?? null;
    }

    private function migrateUsuarios()
    {
        $this->info('Migrando usuários e vendedores...');
        $legacyUsers = DB::connection('legacy')->table('usuarios')->get();

        foreach ($legacyUsers as $lu) {
            $user = User::updateOrCreate(
                ['email' => $lu->email],
                [
                    'id' => $lu->id,
                    'name' => $lu->nome,
                    'password' => Hash::make($lu->senha), // Assumindo que a senha no legado é simples/plain
                ]
            );

            // Atribuir Role
            $role = (strtolower($lu->tipo) === 'vendedor') ? 'vendedor' : 'admin';
            if (!$user->hasRole($role)) {
                $user->assignRole($role);
            }
        }
        $this->info('Usuários migrados com sucesso.');
    }

    private function migrateOrcamentos()
    {
        $this->info('Migrando orçamentos (quotes)...');
        
        $lastId = Quote::max('id') ?? 0;
        $total = DB::connection('legacy')->table('relatorio_orcamento')->where('id', '>', $lastId)->count();
        $this->info("Total de orçamentos pendentes: $total (começando após ID $lastId)");
        
        if ($total === 0) return;

        $bar = $this->output->createProgressBar($total);

        DB::connection('legacy')->table('relatorio_orcamento')->where('id', '>', $lastId)->orderBy('id')->chunk(200, function ($quotes) use ($bar) {
            foreach ($quotes as $lq) {
                // Verificar se o cliente existe
                if ($lq->id_empresa > 0 && !Cliente::find($lq->id_empresa)) {
                    $bar->advance();
                    continue;
                }

                $quote = Quote::updateOrCreate(
                    ['id' => $lq->id],
                    [
                        'cliente_id' => $lq->id_empresa > 0 ? $lq->id_empresa : null,
                        'customer_name' => $lq->nome_usuario,
                        'customer_whatsapp' => $lq->telefone,
                        'service_requested' => $lq->mensagem,
                        'status' => 'pending',
                        'created_at' => $lq->data_envio . ' ' . $lq->hora_envio,
                    ]
                );
                $bar->advance();
            }
        });

        $bar->finish();
        $this->newLine();
    }

    private function withRetry(callable $callback, $maxRetries = 5)
    {
        $retries = 0;
        while ($retries < $maxRetries) {
            try {
                // Configurar timeout longo na sessão
                DB::connection('pgsql')->statement("SET statement_timeout = '10min'");
                return $callback();
            } catch (\Exception $e) {
                if (str_contains($e->getMessage(), 'timeout') || str_contains($e->getMessage(), 'connection')) {
                    $retries++;
                    $this->error("Erro de conexão/timeout: " . $e->getMessage());
                    $this->warn("Tentando reconectar e retomar em 5 segundos... ($retries/$maxRetries)");
                    
                    DB::connection('pgsql')->purge();
                    sleep(5);
                    continue;
                }
                throw $e;
            }
        }
    }
}
