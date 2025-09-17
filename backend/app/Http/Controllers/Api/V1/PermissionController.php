<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        // Lista todas as permissions
        return Permission::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);
        $permission = Permission::create([
            'name' => $data['name'],
            'guard_name' => 'web'
        ]);
        return response()->json($permission, 201);
    }

    public function show($id)
    {
        return Permission::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $permission = Permission::findOrFail($id);
        $data = $request->validate([
            'name' => 'required|string|unique:permissions,name,'.$id,
        ]);
        $permission->update([
            'name' => $data['name'],
            'guard_name' => 'web'
        ]);
        return response()->json($permission);
    }

    public function destroy($id)
    {
        $permission = Permission::findOrFail($id);
        $permission->delete();
        return response()->json(['success' => true]);
    }
}
