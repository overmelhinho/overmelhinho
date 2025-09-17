namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Oportunidade extends Model
{
    protected $fillable = [
        'lead_id', 'cliente_id', 'nome', 'etapa', 'valor_estimado',
        'responsavel', 'previsao_fechamento', 'observacoes', 'origem', 'status'
    ];

    public function lead()
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
