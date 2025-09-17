namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ContatoRequest extends FormRequest
{
    public function authorize()
    {
        return true; // ajustar para policy se necessário
    }

    public function rules()
    {
        return [
            'telefone_principal'  => 'nullable|string|max:20',
            'telefone_secundario' => 'nullable|string|max:20',
            'celular'             => 'nullable|string|max:20',
            'whatsapp_principal'  => 'boolean',
            'whatsapp_secundario' => 'boolean',
            'email_principal'     => 'nullable|email|max:191',
            'email_cobranca'      => 'nullable|email|max:191',
            'site'                => 'nullable|string|max:191',
            'nome_contato'        => 'nullable|string|max:191',
        ];
    }
}
