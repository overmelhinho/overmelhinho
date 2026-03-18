<?php

namespace App\Services;

use App\Models\Cliente;
use App\Services\LeadIntelService;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class AuditAutomationService
{
    protected LeadIntelService $intelService;

    public function __construct(LeadIntelService $intelService)
    {
        $this->intelService = $intelService;
    }

    /**
     * Executa a varredura para um cliente específico
     */
    public function scan(Cliente $cliente): array
    {
        Log::info("🚀 [Audit] Iniciando varredura para: {$cliente->nome_fantasia} (ID: {$cliente->id})");

        $query = $cliente->nome_fantasia ?: $cliente->razao_social;
        $cnpj = $cliente->cpf_cnpj;
        $cidade = $cliente->enderecos->first()?->cidade;

        $resultado = $this->intelService->buscarDados($query, $cnpj, $cidade);
        $novosDados = $resultado['dados'] ?? null;

        if (!$novosDados) {
            return ['status' => 'error', 'message' => 'Não foi possível encontrar dados na internet.'];
        }

        $divergencias = $this->compararDados($cliente, $novosDados);

        if (empty($divergencias)) {
            // Tudo igual! Atualiza apenas a data de última auditoria
            $cliente->update([
                'last_audit_at' => now(),
                'audit_status' => 'ok',
                'audit_differences' => null
            ]);
            Log::info("✅ [Audit] Nenhuma divergência para {$cliente->nome_fantasia}. Auditoria em dia.");
            return ['status' => 'no_changes'];
        }

        // Encontrou mudanças! Marca para revisão humana
        $cliente->update([
            'last_audit_at' => now(),
            'audit_status' => 'pending',
            'audit_differences' => $divergencias
        ]);

        Log::warning("⚠️ [Audit] Divergências encontradas para {$cliente->nome_fantasia}. Marcado para revisão.");
        return ['status' => 'pending_review', 'differences' => $divergencias];
    }

    /**
     * Compara os dados do banco com os dados encontrados na internet.
     * Para clientes gratuitos, compara apenas telefone.
     */
    protected function compararDados(Cliente $cliente, array $novos): array
    {
        $dif = [];
        $contato = $cliente->contatos->first();
        $endereco = $cliente->enderecos->first();
        $isPagante = ($cliente->tipo_cliente ?? 'gratuito') === 'pagante';

        // 1. Telefone (todos os clientes)
        $telAtual = $this->limparTelefone($contato?->telefone_principal);
        $telNovo = $this->limparTelefone($novos['telefone'] ?? '');
        if ($telNovo && $telAtual !== $telNovo) {
            $dif['telefone'] = ['current' => $telAtual, 'new' => $telNovo];
        }

        // Campos abaixo: apenas clientes pagantes
        if (!$isPagante) {
            return $dif;
        }

        // 2. Website
        $webAtual = $this->limparUrl($contato?->site);
        $webNovo = $this->limparUrl($novos['website'] ?? '');
        if ($webNovo && $webAtual !== $webNovo) {
            $dif['website'] = ['current' => $webAtual, 'new' => $webNovo];
        }

        // 3. Instagram
        $instaAtual = $this->limparUrl($cliente->redesSociais->where('tipo', 'instagram')->first()?->url);
        $instaNovo = $this->limparUrl($novos['instagram'] ?? '');
        if ($instaNovo && $instaAtual !== $instaNovo) {
            $dif['instagram'] = ['current' => $instaAtual, 'new' => $instaNovo];
        }

        // 4. Endereço estruturado (usa address_components do Google)
        $parts = $novos['endereco_parts'] ?? [];
        $ruaNova = $parts['rua'] ?? '';
        $ruaAtual = $endereco?->rua ?? '';

        if (!empty($ruaNova) && mb_strtolower(trim($ruaNova)) !== mb_strtolower(trim($ruaAtual))) {
            // Preserva o complemento atual se o novo não trouxer
            if (empty($parts['complemento']) && !empty($endereco?->complemento)) {
                $parts['complemento'] = $endereco->complemento;
            }
            // Endereço formatado para exibição no frontend
            $endAtual = $ruaAtual ? "{$ruaAtual}, {$endereco->numero}" : '';
            $endNovo  = "{$parts['rua']}, {$parts['numero']}";

            $dif['endereco'] = [
                'current' => $endAtual,
                'new'     => $endNovo,
                'parts'   => $parts,    // campos estruturados para salvar no banco
            ];
        }

        return $dif;
    }

    protected function limparTelefone($tel): string
    {
        return preg_replace('/\D/', '', (string)$tel);
    }

    protected function limparUrl($url): string
    {
        if (!$url) return '';
        $url = str_replace(['https://', 'http://', 'www.'], '', strtolower(trim($url)));
        return rtrim($url, '/');
    }
}
