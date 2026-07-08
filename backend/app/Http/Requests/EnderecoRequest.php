namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class EnderecoRequest extends FormRequest
{
    public function authorize()
    {
        return true; // ajustar para policy se necessário
    }

    public function rules()
    {
        return [
            'cep'          => 'required|string|max:10',
            'estado'       => 'required|string|max:2',
            'cidade'       => 'required|string|max:191',
            'bairro'       => 'required|string|max:191',
            'rua'          => 'required|string|max:191',
            'numero'       => 'required|string|max:20',
            'complemento'  => 'nullable|string|max:191',
            'caixa_postal' => 'nullable|string|max:20',
            'link_maps'    => 'nullable|string|max:2000',
            'link_waze'    => 'nullable|string|max:255',
            'iframe_maps'  => 'nullable|string',
            'latitude'     => 'nullable|numeric',
            'longitude'    => 'nullable|numeric',
        ];
    }
}
