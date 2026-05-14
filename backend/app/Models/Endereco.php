<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Endereco extends Model
{
    protected $table = 'enderecos';

    protected $fillable = [
        'cliente_id',
        'nome_unidade',
        'telefone',
        'cep',
        'estado',
        'cidade',
        'bairro',
        'rua',
        'numero',
        'endereco_compacto',
        'complemento',
        'caixa_postal',
        'link_maps',
        'link_waze',
        'iframe_maps',
        'exibir_apenas_cidade',
        'is_cobranca',
        'latitude',
        'longitude',
    ];

    protected $casts = [
        'exibir_apenas_cidade' => 'boolean',
        'is_cobranca' => 'boolean',
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($endereco) {
            // Se a latitude estiver vazia e a gente tiver rua e cidade
            if (empty($endereco->latitude) && !empty($endereco->rua) && !empty($endereco->cidade)) {
                $query = $endereco->rua;
                if (!empty($endereco->numero)) {
                    $query .= ', ' . $endereco->numero;
                }
                $query .= ', ' . $endereco->cidade . ', ' . $endereco->estado;

                try {
                    $response = \Illuminate\Support\Facades\Http::withHeaders([
                        'User-Agent' => 'Overmelhinho App (suporte@overmelhinho.com.br)'
                    ])->timeout(3)->get('https://nominatim.openstreetmap.org/search', [
                        'format' => 'json',
                        'q' => $query,
                        'limit' => 1,
                    ]);

                    if ($response->successful()) {
                        $data = $response->json();
                        if (is_array($data) && count($data) > 0) {
                            $endereco->latitude = $data[0]['lat'];
                            $endereco->longitude = $data[0]['lon'];
                        }
                    }
                } catch (\Exception $e) {
                    // Silently ignore se a API externa falhar, não queremos quebrar o salvamento do cliente
                }
            }
        });
    }
}
