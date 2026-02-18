<?php

namespace App\Http\Controllers;

use App\Models\User; // Ou ajuste o namespace do seu modelo de usuário
use Illuminate\Http\Request;

class UsuarioController extends Controller
{
    /**
     * Retorna os usuários com a role 'Comercial'.
     */
    public function index(Request $request)
    {
        $role = $request->query('role');

        if ($role) {
            $usuarios = User::where('role', $role)->get();
        } else {
            $usuarios = User::all();
        }

        return response()->json([
            'success' => true,
            'data' => $usuarios,
        ]);
    }
}
