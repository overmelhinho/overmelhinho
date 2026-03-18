<?php

namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;
use Illuminate\Support\Facades\Log;

class LeadResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  \Illuminate\Http\Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request)
    {
        try {
            return [
                'id'            => $this->id,
                'nome'          => $this->nome,
                'email'         => $this->email,
                'telefone'      => $this->telefone,
                'origem'        => $this->origem,
                'status'        => $this->status,
                'responsavel'   => $this->responsavel,
                'observacoes'   => $this->observacoes,
                'motivo_perda'  => $this->motivo_perda,
                'google_place_id' => $this->google_place_id,
                'endereco'      => $this->endereco,
                'referencia'    => $this->referencia,
                'interesse'     => $this->interesse,
                'cidade'        => $this->cidade,
                'created_at'    => optional($this->created_at)->toDateTimeString(),
                'updated_at'    => optional($this->updated_at)->toDateTimeString(),
            ];
        } catch (\Throwable $e) {
            Log::error('Erro na serialização do LeadResource: ' . $e->getMessage(), [
                'lead' => $this->resource ?? null
            ]);

            return [
                'erro' => 'Falha ao serializar lead.',
                'detalhes' => $e->getMessage(),
            ];
        }
    }
}
