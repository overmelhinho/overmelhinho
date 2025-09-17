// app/Http/Requests/ClienteRequest.php
namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ClienteRequest extends FormRequest
{
    public function authorize()
    {
        // ajuste depois conforme política, por padrão true para testar
        return true;
    }

    public function rules()
    {
        return [
            'nome_fantasia' => 'required|string|max:191',
            'razao_social' => 'nullable|string|max:191',
            'cpf_cnpj' => 'required|string|max:20|unique:clientes,cpf_cnpj,' . $this->cliente,
            'descricao' => 'nullable|string|max:1000',
            'segmentos' => 'array|nullable',
            'segmentos.*' => 'exists:segmentos,id',
            // outros campos...
        ];
    }
}
