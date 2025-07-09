<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Role;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;

class RoleController extends Controller
{
    public function index()
    {
        return Role::with('permissions')->get();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|unique:roles,name',
            'permissions' => 'array',
        ]);
        $role = Role::create(['name' => $data['name'], 'guard_name' => 'web']);
        if (!empty($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }
        return response()->json($role->load('permissions'), 201);
    }

    public function show($id)
    {
        return Role::with('permissions')->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $role = Role::findOrFail($id);
        $data = $request->validate([
            'name'        => 'sometimes|string|unique:roles,name,'.$id,
            'permissions' => 'array',
        ]);
        $role->update($data);
        if (isset($data['permissions'])) {
            $role->syncPermissions($data['permissions']);
        }
        return response()->json($role->load('permissions'));
    }

    public function destroy($id)
    {
        $role = Role::findOrFail($id);
        $role->delete();
        return response()->json(['success' => true]);
    }
}
