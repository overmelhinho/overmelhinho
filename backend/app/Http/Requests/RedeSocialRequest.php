namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class RedeSocialRequest extends FormRequest
{
    public function authorize()
    {
        return true; // Ajustar para policy se necessário
    }

    public function rules()
    {
        return [
            'tipo' => 'required|string|max:30',    // Ex: instagram, facebook, linkedin...
            'url'  => 'required|string|max:255|url'
        ];
    }
}
