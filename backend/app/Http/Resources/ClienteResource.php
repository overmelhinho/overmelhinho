// app/Http/Resources/ClienteResource.php
namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class ClienteResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id' => $this->id,
            'nome_fantasia' => $this->nome_fantasia,
            'razao_social' => $this->razao_social,
            'cpf_cnpj' => $this->cpf_cnpj,
            'descricao' => $this->descricao,
            'segmentos' => SegmentoResource::collection($this->whenLoaded('segmentos')),
            'enderecos' => EnderecoResource::collection($this->whenLoaded('enderecos')),
            'contatos' => ContatoResource::collection($this->whenLoaded('contatos')),
            'redes_sociais' => RedeSocialResource::collection($this->whenLoaded('redesSociais')),
            'galeria' => GaleriaImagemResource::collection($this->whenLoaded('galeriaImagens')),
            // outros campos...
        ];
    }
}
