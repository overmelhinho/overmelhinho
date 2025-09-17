<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;

class UserController extends Controller
{
    public function __construct()
    {
        \Log::info('UserController CONSTRUTOR chamado!');
        // $this->middleware(['role:Admin|Diretor']);
    }

    public function index()
    {
        return User::with('roles')->paginate(20);
    }

    public function store(Request $request)
    {
        \Log::info('Entrou no método store', ['request' => $request->all()]);

        $data = $request->validate([
            'name'     => 'required|string|max:255',
            'email'    => 'required|email|unique:users,email',
            'password' => 'required|string|min:6',
            'roles'    => 'required|array|min:1',
            'roles.*'  => 'exists:roles,id',
        ]);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        // Troque este bloco:
        // $user->syncRoles($data['roles']);
        // Por este abaixo (usando assignRole pelo nome):

        $user->roles()->detach(); // Limpa roles antigos (boa prática)
        foreach ($data['roles'] as $roleId) {
            $role = Role::find($roleId);
            if ($role) {
                $user->assignRole($role->name);
            }
        }

        return response()->json($user->load('roles'), 201);
    }

    public function show($id)
    {
        return User::with('roles')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        \Log::info('Entrou no método update', ['request' => $request->all(), 'id' => $id]);
        $user = User::findOrFail($id);
        $data = $request->validate([
            'name'     => 'sometimes|string|max:255',
            'email'    => 'sometimes|email|unique:users,email,'.$id,
            'password' => 'nullable|string|min:6',
            'roles'    => 'sometimes|array|min:1',
            'roles.*'  => 'exists:roles,id',
        ]);

        // Remover 'roles' do update para não tentar salvar coluna inexistente
        $updateData = $data;
        unset($updateData['roles']);

        if (!empty($updateData)) {
            $user->update(array_filter($updateData));
        }

        if (isset($data['roles'])) {
            $user->roles()->detach();
            foreach ($data['roles'] as $roleId) {
                $role = Role::find($roleId);
                if ($role) {
                    $user->assignRole($role->name);
                }
            }
        }

        return response()->json($user->load('roles'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();
        return response()->json(['success' => true]);
    }
}
