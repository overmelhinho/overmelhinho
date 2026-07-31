<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Role;
use Illuminate\Support\Facades\Hash;

use Illuminate\Routing\Controllers\HasMiddleware;
use Illuminate\Routing\Controllers\Middleware;

class UserController extends Controller implements HasMiddleware
{
    public static function middleware(): array
    {
        return [
            new Middleware('role:Admin|Administrador|Diretor', except: ['updateSelf']),
        ];
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
            'is_active' => 'sometimes|boolean',
            'roles'    => 'required|array|min:1',
            'roles.*'  => 'exists:roles,id',
        ]);

        $isActive = (bool) ($data['is_active'] ?? true);

        $user = User::create([
            'name'     => $data['name'],
            'email'    => $data['email'],
            'password' => bcrypt($data['password']),
        ]);

        // ✅ PostgreSQL exige boolean nativo (true/false), não integer (1/0).
        // PDO envia 1/0 via Eloquent, causando "Datatype mismatch".
        // Usar DB::table + DB::raw garante o boolean correto.
        \DB::table('users')
            ->where('id', $user->id)
            ->update(['is_active' => \DB::raw($isActive ? 'true' : 'false')]);

        $user->refresh();

        // ✅ Importante:
        // Evita assignRole($role->name) (que tenta resolver pelo guard default e pode cair em sanctum).
        // Passando os Models Role, o Spatie sincroniza corretamente respeitando o guard_name do role (web).
        $roles = Role::query()
            ->whereIn('id', $data['roles'])
            ->get();

        $user->syncRoles($roles);

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
            'email'    => 'sometimes|email|unique:users,email,' . $id,
            'password' => 'nullable|string|min:6',
            'is_active' => 'sometimes|boolean',

            // ✅ Ajuste seguro:
            // - permite enviar [] para remover todas as roles
            // - não exige min:1 no update (senão você não consegue “limpar”)
            'roles'    => 'sometimes|array',
            'roles.*'  => 'exists:roles,id',
        ]);

        // Remover 'roles' e 'is_active' do update Eloquent para tratar separadamente
        $updateData = $data;
        unset($updateData['roles']);
        $hasIsActive = array_key_exists('is_active', $updateData);
        unset($updateData['is_active']);

        if (!empty($updateData)) {
            // Usa fn($v) => !is_null($v) para preservar valores false
            $user->update(array_filter($updateData, fn($v) => !is_null($v)));
        }

        // ✅ PostgreSQL exige boolean nativo (true/false), não integer (1/0).
        if ($hasIsActive) {
            $newActive = (bool) $data['is_active'];
            \DB::table('users')
                ->where('id', $user->id)
                ->update(['is_active' => \DB::raw($newActive ? 'true' : 'false')]);
            $user->refresh();
        }

        if (array_key_exists('roles', $data)) {
            $roleIds = $data['roles'] ?? [];

            $roles = Role::query()
                ->whereIn('id', $roleIds)
                ->get();

            // ✅ Sincroniza roles com Models (respeita guard_name do role no banco)
            $user->syncRoles($roles);
        }

        return response()->json($user->load('roles'));
    }

    public function destroy($id)
    {
        $user = User::findOrFail($id);
        $user->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Atualiza os dados do próprio usuário logado.
     */
    public function updateSelf(Request $request)
    {
        $user = $request->user();

        $request->validate([
            'name'             => 'sometimes|string|max:255',
            'email'            => 'sometimes|email|unique:users,email,' . $user->id,
            'current_password' => 'required_with:password|string',
            'password'         => [
                'nullable',
                'confirmed',
                \Illuminate\Validation\Rules\Password::min(8)
                    ->letters()
                    ->mixedCase()
                    ->numbers()
                    ->symbols(),
            ],
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
            'message' => 'Perfil atualizado com sucesso.',
            'user'    => $user->load('roles', 'permissions'),
        ]);
    }

    /**
     * Alterna o status ativo/inativo do usuário.
     */
    public function toggleActive($id)
    {
        $user = User::findOrFail($id);
        
        // Evitar que o admin desative a si próprio por acidente
        if (auth()->id() == $user->id) {
            return response()->json(['message' => 'Você não pode desativar a sua própria conta.'], 400);
        }

        // Usa DB::raw para enviar literal boolean do PostgreSQL (true/false),
        // evitando o type mismatch que ocorre quando PDO envia 0/1 (integer).
        $newValue = !((bool) $user->is_active);
        \DB::table('users')
            ->where('id', $user->id)
            ->update(['is_active' => \DB::raw($newValue ? 'true' : 'false')]);

        $user->refresh();

        return response()->json([
            'message' => 'Status do usuário atualizado com sucesso.',
            'is_active' => $user->is_active,
        ]);
    }
}
