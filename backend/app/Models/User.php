<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;
use Spatie\Permission\Traits\HasRoles;

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable, HasRoles;

    /**
     * ✅ Importante:
     * Seus roles no banco estão com guard_name = 'web'.
     * Fixar isso aqui impede o Spatie de tentar resolver roles via 'sanctum' por padrão.
     * Isso NÃO quebra o login via Sanctum (autenticação continua normal),
     * apenas alinha a camada de roles/permissões com o que existe no banco hoje.
     */
    protected string $guard_name = 'web';

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'name',
        'email',
        'password',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
        ];
    }

    /**
     * Route notifications for the Slack channel.
     */
    public function routeNotificationForSlack($notification): ?string
    {
        return config('services.slack.notifications.channel');
    }
}
