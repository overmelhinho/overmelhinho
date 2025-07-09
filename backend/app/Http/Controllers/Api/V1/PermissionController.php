<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Spatie\Permission\Models\Permission;
use Illuminate\Http\Request;

class PermissionController extends Controller
{
    public function index()
    {
        return Permission::all();
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name' => 'required|string|unique:permissions,name',
        ]);
        $perm = Permission::create(['name' => $data['name'], 'guard_name' => 'web']);
        return response()->json($perm, 201);
    }

    public function show($id)
    {
        return Permission::findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $perm = Permission::findOrFail($id);
        $data = $request->validate([
            'name' => 'sometimes|string|unique:permissions,name,'.$id,
        ]);
        $perm->update($data);
        return response()->json($perm);
    }

    public function destroy($id)
    {
        $perm = Permission::findOrFail($id);
        $perm->delete();
        return response()->json(['success' => true]);
    }
}
