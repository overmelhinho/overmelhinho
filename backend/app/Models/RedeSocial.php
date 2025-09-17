namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class RedeSocial extends Model
{
    protected $table = 'redes_sociais';

    protected $fillable = [
        'cliente_id',
        'tipo',
        'url'
    ];

    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'cliente_id');
    }
}
