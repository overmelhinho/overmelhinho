<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Http\Requests\LeadRequest;
use App\Http\Resources\LeadResource;
use Illuminate\Http\Request;
use App\Models\Oportunidade;
use Illuminate\Support\Facades\Log;
use App\Http\Resources\OportunidadeResource;

class LeadController extends Controller
{
    public function index(Request $request)
    {
        $search = $request->input('search');
        $status = $request->input('status');
        $page = $request->input('page', 1);
        $perPage = $request->input('per_page', 10);

        $query = Lead::query();

        if ($search) {
            $query->where(function ($q) use ($search) {
                $q->where('nome', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('origem', 'like', "%{$search}%");
            });
        }

        if ($status && $status !== 'Todos') {
            if ($status === 'recuperaveis') {
                $query->where('status', 'perdido')
                      ->whereNotNull('lost_at')
                      ->whereRaw("TIMESTAMPDIFF(MONTH, lost_at, NOW()) % 3 = 0")
                      ->whereRaw("TIMESTAMPDIFF(MONTH, lost_at, NOW()) > 0");
            } else {
                $query->where('status', $status);
            }
        }

        $query->orderBy('created_at', 'desc');

        $leads = $query->paginate($perPage, ['*'], 'page', $page);

        return response()->json([
            'data' => $leads->items(),
            'meta' => [
                'total' => $leads->total(),
                'page' => $leads->currentPage(),
                'per_page' => $leads->perPage(),
                'last_page' => $leads->lastPage(),
            ],
        ]);
    }

    public function show($id)
    {
        $lead = Lead::findOrFail($id);
        return new LeadResource($lead);
    }

    public function store(LeadRequest $request)
    {
        $data = $request->validated();
        \Log::info('[LEAD][STORE][VALIDATED]', $data);

        $lead = Lead::create($data)->fresh();

        // Envia notificação para a Angélica caso seja um Lead do App
        if (str_contains($lead->origem, 'App Mobile')) {
            $htmlContent = "
            <html>
            <body style='font-family: Arial, sans-serif; background-color: #f1f5f9; padding: 20px;'>
                <div style='max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);'>
                    <div style='background-color: #C00000; padding: 20px; text-align: center; color: #ffffff;'>
                        <h2 style='margin: 0;'>🚨 Novo Lead Captado via App</h2>
                    </div>
                    <div style='padding: 30px;'>
                        <p style='font-size: 16px; color: #333;'>Olá Angélica,</p>
                        <p style='font-size: 16px; color: #333;'>Um novo lead acabou de ser cadastrado no sistema pelo aplicativo móvel (na rua).</p>
                        <table style='width: 100%; margin-top: 20px; border-collapse: collapse;'>
                            <tr>
                                <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold; width: 120px;'>Empresa:</td>
                                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->nome}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Telefone:</td>
                                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->telefone}</td>
                            </tr>
                            <tr>
                                <td style='padding: 10px; border-bottom: 1px solid #eee; font-weight: bold;'>Origem:</td>
                                <td style='padding: 10px; border-bottom: 1px solid #eee;'>{$lead->origem}</td>
                            </tr>
                        </table>
                        <div style='margin-top: 30px; text-align: center;'>
                            <a href='https://dash.overmelhinho.com.br/leads-kanban' style='background-color: #C00000; color: #ffffff; padding: 12px 25px; text-decoration: none; border-radius: 25px; font-weight: bold; display: inline-block;'>Acessar Painel de Leads</a>
                        </div>
                    </div>
                </div>
            </body>
            </html>
            ";

            try {
                \Illuminate\Support\Facades\Mail::html($htmlContent, function ($message) {
                    $message->to('angelica@overmelhinho.com.br')
                        ->from(config('mail.from.address', 'relatorios@overmelhinho.com.br'), 'App - O Vermelhinho')
                        ->subject('🚨 Novo Lead Captado via App');
                });
            } catch (\Exception $e) {
                \Log::error('[LEAD][EMAIL_ERROR] Erro ao notificar Angélica: ' . $e->getMessage());
            }
        }

        return (new LeadResource($lead))->response()->setStatusCode(201);
    }

    public function update(LeadRequest $request, $id)
    {
        \Log::info('[LEAD][UPDATE] called for id: ' . $id);
        $lead = Lead::findOrFail($id);
        $data = $request->only([
            'nome',
            'email',
            'telefone',
            'origem',
            'status',
            'responsavel',
            'observacoes',
            'motivo_perda',
            'data_follow_up'
        ]);

        if (array_key_exists('status', $data)) {
            if ($data['status'] === 'perdido' && $lead->status !== 'perdido') {
                $data['lost_at'] = now();
            }
            elseif ($data['status'] !== 'perdido' && $lead->status === 'perdido') {
                $data['lost_at'] = null;
            }
        }

        $lead->update($data);
        return new LeadResource($lead);
    }

    public function destroy($id)
    {
        \Log::info('[LEAD][DESTROY] called for id: ' . $id);
        $lead = Lead::findOrFail($id);
        $lead->delete();
        \Log::info('[LEAD][DESTROY] success for id: ' . $id);
        return response()->json(['success' => true]);
    }

    public function converterOportunidade(Request $request, $leadId)
    {
        $lead = Lead::findOrFail($leadId);

        $data = $request->validate([
            'nome' => 'required|string|max:191',
            'valor_estimado' => 'nullable|numeric',
            'responsavel' => 'nullable|string|max:191',
            'previsao_fechamento' => 'nullable|date',
            'observacoes' => 'nullable|string',
            'origem' => 'nullable|string|max:100',
        ]);

        $data['lead_id'] = $lead->id;
        $data['etapa'] = 'novo';
        $data['status'] = 'aberta';

        return \Illuminate\Support\Facades\DB::transaction(function () use ($data, $lead) {
            $oportunidade = Oportunidade::create($data);

            $lead->status = 'Qualificado';
            $lead->save();

            return response()->json([
                'success' => true,
                'oportunidade' => new \App\Http\Resources\OportunidadeResource($oportunidade)
            ]);
        });
    }

    public function stats()
    {
        $now = now();
        $tomorrow = now()->addDay();
        
        $leadsPerdidos = Lead::where('status', 'perdido')->whereNotNull('lost_at')->get();
        
        $recuperaveisHoje = 0;
        $recuperaveisAmanha = 0;
        $recuperaveisMes = 0;

        foreach ($leadsPerdidos as $lead) {
            $lostAt = $lead->lost_at;
            $diffInMonths = (int) $lostAt->diffInMonths($now);
            
            // Lógica de 3 meses: (3, 6, 9, 12...)
            if ($diffInMonths > 0 && $diffInMonths % 3 === 0) {
                if ($lostAt->day === $now->day) $recuperaveisHoje++;
                if ($lostAt->day === $tomorrow->day) $recuperaveisAmanha++;
                
                // Para o mês: se o dia da perda já passou ou é hoje, e estamos no mês múltiplo de 3
                // Ou se o próximo ciclo cai neste mês
                $recuperaveisMes++; 
            }
        }

        return response()->json([
            'total' => Lead::count(),
            'novo' => Lead::where('status', 'novo')->count(),
            'em_contato' => Lead::where('status', 'em_contato')->count(),
            'convertido' => Lead::where('status', 'convertido')->count(),
            'perdido' => Lead::where('status', 'perdido')->count(),
            'recuperaveis_hoje' => $recuperaveisHoje,
            'recuperaveis_amanha' => $recuperaveisAmanha,
            'recuperaveis_mes' => $recuperaveisMes,
        ]);
    }

    public function sendFollowup($id)
    {
        $lead = Lead::findOrFail($id);
        $lead->notify(new \App\Notifications\LostLeadFollowupNotification($lead));
        
        return response()->json(['success' => true, 'message' => 'Follow-up enviado via API.']);
    }
}
