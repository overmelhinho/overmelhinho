<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Endereco extends Model
{
    protected $table = 'enderecos';

    protected $fillable = [
        'id',
        'cliente_id',
        'nome_unidade',
        'telefone',
        'cep',
        'estado',
        'cidade',
        'bairro',
        'tipo_logradouro',
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
        'exibir_apenas_cidade' => \App\Casts\PostgresBoolean::class,
        'is_cobranca' => \App\Casts\PostgresBoolean::class,
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }

    protected static function boot()
    {
        parent::boot();

        static::saving(function ($endereco) {
            // Tenta extrair a latitude e longitude diretamente do link do Google Maps
            if (!empty($endereco->link_maps)) {
                // Tenta primeiro as coordenadas exatas do pino (!3d e !4d)
                if (preg_match('/!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/', $endereco->link_maps, $matches)) {
                    $endereco->latitude = $matches[1];
                    $endereco->longitude = $matches[2];
                } 
                // Se não tiver o pino, usa as coordenadas da câmera/viewport (@lat,lng)
                elseif (preg_match('/(-?\d{1,2}\.\d+),\s*(-?\d{1,3}\.\d+)/', $endereco->link_maps, $matches)) {
                    $endereco->latitude = $matches[1];
                    $endereco->longitude = $matches[2];
                }
            }

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
