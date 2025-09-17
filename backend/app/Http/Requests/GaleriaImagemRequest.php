namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class GaleriaImagemRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Ajustar para policy se necessário
    }

    public function rules()
    {
        return [
            'url'     => 'required|string|max:255',
            'legenda' => 'nullable|string|max:191',
            'ordem'   => 'nullable|integer|min:0'
        ];
    }
}
