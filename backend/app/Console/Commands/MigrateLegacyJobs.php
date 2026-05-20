<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use App\Models\JobOpportunity;
use App\Models\Cliente;
use Illuminate\Support\Str;

class MigrateLegacyJobs extends Command
{
    protected $signature = 'migrate:legacy-jobs';
    protected $description = 'Migra as vagas de emprego do banco legado (MySQL) para o novo banco (PostgreSQL)';

    public function handle()
    {
        $this->info('Iniciando migração de vagas de emprego...');

        // 1. Carregar de/para das tabelas de apoio
        $areasLegacy = DB::connection('legacy')->select('SELECT * FROM empregos_area_profissional');
        $areas = [];
        foreach ($areasLegacy as $a) {
            $areas[$a->id_area_profissional] = trim($a->nome_area_profissional);
        }

        $cargosLegacy = DB::connection('legacy')->select('SELECT * FROM empregos_cargos');
        $cargos = [];
        foreach ($cargosLegacy as $c) {
            $cargos[$c->id_cargo] = trim($c->nome);
        }

        $cidadesLegacy = DB::connection('legacy')->select('SELECT * FROM cidades');
        $cidades = [];
        foreach ($cidadesLegacy as $cid) {
            $cidades[$cid->id] = trim($cid->cidade);
        }

        // 2. Buscar vagas legadas
        $vagasLegacy = DB::connection('legacy')->select('SELECT * FROM empregos');
        $this->info('Total de vagas a migrar: ' . count($vagasLegacy));

        $count = 0;
        $skipped = 0;

        foreach ($vagasLegacy as $v) {
            // Verifica se o cliente existe no banco novo
            $cliente = Cliente::find($v->id_clientes);
            if (!$cliente) {
                // $this->warn("Cliente ID {$v->id_clientes} não encontrado para a vaga {$v->id_empregos}. Pulando.");
                $skipped++;
                continue;
            }

            // Mapeia valores usando os IDs
            $areaNome = $areas[$v->id_area_profissional] ?? null;
            $cargoNome = $cargos[$v->id_cargo] ?? null;
            $cidadeNome = $cidades[$v->id_cidade] ?? null;

            // Converter status
            // No legacy não tem 'status', consideramos ativo se data_validade for maior que agora
            $isActive = !$v->data_validade || $v->data_validade >= date('Y-m-d');
            $statusStr = $isActive ? 'Published' : 'Draft'; // ou 'Expired' se quiser

            // Vagas disponíveis (legacy varchar) -> new integer
            $vacancies = (int)$v->nro_vagas > 0 ? (int)$v->nro_vagas : null;

            try {
                JobOpportunity::updateOrCreate(
                    // Tentaremos garantir que não duplique (usando old ID se pudéssemos, 
                    // mas já que o ID não está sendo mapeado, vamos usar client_id e titulo como chave única)
                    [
                        'client_id' => $v->id_clientes,
                        'title' => $v->titulo
                    ],
                    [
                        'description' => $v->descricao,
                        'salary_range' => $v->faixa_salarial,
                        'hiring_type' => $v->tipo_contrato,
                        'work_model' => $v->metodo_trabalho,
                        'city' => $cidadeNome,
                        'vacancies' => $vacancies,
                        'area' => $areaNome,
                        'role' => $cargoNome,
                        'education_level' => $v->nivel_escolaridade,
                        'experience_required' => $v->experiencia_exigida,
                        'contact_email' => $v->email,
                        'contact_whatsapp' => $v->whatsapp,
                        'status' => $statusStr,
                        'is_active' => $isActive ? 'true' : 'false',
                        'views_count' => 0,
                        'published_at' => $v->data_cadastro ?: null,
                        'expires_at' => $v->data_validade ?: null,
                        'created_at' => $v->data_cadastro ?: now(),
                        'updated_at' => now(),
                    ]
                );
                $count++;
            } catch (\Exception $e) {
                $this->error("Erro ao migrar vaga {$v->id_empregos}: " . $e->getMessage());
            }
        }

        $this->info("Migração concluída! Sucesso: $count | Ignorados (Sem cliente): $skipped");
        return 0;
    }
}
