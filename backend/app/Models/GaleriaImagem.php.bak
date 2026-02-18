namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class GaleriaImagem extends Model
{
    protected $table = 'galerias_imagens';

    protected $fillable = [
        'cliente_id',
        'url',
        'legenda',
        'ordem'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
