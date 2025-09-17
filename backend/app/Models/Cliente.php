// app/Models/Cliente.php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    protected $table = 'clientes';

    protected $fillable = [
        'nome_fantasia', 'razao_social', 'nome_alternativo', 'cpf_cnpj',
        'inscricao_estadual', 'inscricao_municipal', 'registro_profissional',
        'descricao', 'observacoes', 'video', 'portfolio_url', 'logo_url', 'possui_publicidade'
    ];

    // Relacionamentos
    public function enderecos() { return $this->hasMany(Endereco::class, 'cliente_id'); }
    public function contatos() { return $this->hasMany(Contato::class, 'cliente_id'); }
    public function redesSociais() { return $this->hasMany(RedeSocial::class, 'cliente_id'); }
    public function segmentos() { return $this->belongsToMany(Segmento::class, 'cliente_segmento', 'cliente_id', 'segmento_id'); }
    public function galeriaImagens() { return $this->hasMany(GaleriaImagem::class, 'cliente_id'); }
    public function historicoAlteracoes() { return $this->hasMany(HistoricoAlteracao::class, 'cliente_id'); }
}
