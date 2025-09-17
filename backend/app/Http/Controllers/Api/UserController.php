<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\User;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Support\Facades\Hash;

class UserController extends Controller
{
    public function __construct()
    {
        // Só admin/diretor acessam os métodos CRUD abaixo, exceto updateSelf
        $this->middleware(['role:admin|diretor'])->except(['updateSelf']);
    }

    // Listar todos usuários (apenas admin/diretor)
    public function index()
    {
        return User::with('roles', 'permissions')->get();
    }

    // Criar novo usuário (apenas admin/diretor)
    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required',
            'email' => 'required|email|unique:users',
            'password' => 'required',
            'roles' => 'array',
            'permissions' => 'array',
        ]);
        $user = User::create([
            'name' => $data['name'],
            'email' => $data['email'],
            'password' => bcrypt($data['password']),
        ]);
        if (!empty($data['roles'])) {
            $user->syncRoles($data['roles']);
        }
        if (!empty($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }
        return response()->json($user->load('roles', 'permissions'), 201);
    }

    // Atualizar um usuário específico (apenas admin/diretor)
    public function update(Request $request, $id)
    {
        $user = User::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'password' => 'sometimes',
            'roles' => 'array',
            'permissions' => 'array',
        ]);
        if (isset($data['name'])) $user->name = $data['name'];
        if (isset($data['email'])) $user->email = $data['email'];
        if (isset($data['password'])) $user->password = bcrypt($data['password']);
        $user->save();

        if (isset($data['roles'])) {
            $user->syncRoles($data['roles']);
        }
        if (isset($data['permissions'])) {
            $user->syncPermissions($data['permissions']);
        }
        return response()->json($user->load('roles', 'permissions'));
    }

    // Deletar usuário (apenas admin/diretor)
    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->noContent();
    }

    // Atualizar dados do próprio usuário autenticado (qualquer usuário autenticado)
    public function updateSelf(Request $request)
    {

\Log::info('Entrou no updateSelf', [
        'user_id' => optional($request->user())->id,
        'request' => $request->all(),
    ]);
        $user = $request->user();

        $request->validate([
            'name' => 'sometimes|string|max:255',
            'email' => 'sometimes|email|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password' => 'nullable|string|min:6',
        ]);

        if ($request->filled('name')) {
            $user->name = $request->name;
        }
        if ($request->filled('email')) {
            $user->email = $request->email;
        }
        if ($request->filled('password')) {
            if (!Hash::check($request->current_password, $user->password)) {
                return response()->json(['message' => 'Senha atual incorreta.'], 422);
            }
            $user->password = bcrypt($request->password);
        }
        $user->save();

        return response()->json([
            'message' => 'Usuário atualizado com sucesso.',
            'user' => $user->load('roles', 'permissions'),
        ]);
    }
}
