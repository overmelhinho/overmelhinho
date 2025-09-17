namespace App\Http\Resources;

use Illuminate\Http\Resources\Json\JsonResource;

class SegmentoResource extends JsonResource
{
    public function toArray($request)
    {
        return [
            'id'            => $this->id,
            'id_categoria_pai' => $this->id_categoria_pai,
            'nome'          => $this->nome,
            'description'   => $this->description,
            'texto_seo'     => $this->texto_seo,
            'imagem'        => $this->imagem,
            'created_at'    => $this->created_at,
            'updated_at'    => $this->updated_at,
        ];
    }
}
