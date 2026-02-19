<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class JobRoleController extends Controller
{
    /**
     * GET /api/v1/job-roles?search=...
     * Returns paginated list of roles filtered by name
     */
    public function index(Request $request)
    {
        $q = $request->query('search', '');

        $query = DB::table('job_roles')->orderBy('name');

        if ($q) {
            $query->where('name', 'ilike', '%' . $q . '%');
        }

        $roles = $query->limit(50)->get();

        return response()->json($roles);
    }

    /**
     * POST /api/v1/job-roles
     * Creates a new role (if it doesn't already exist)
     */
    public function store(Request $request)
    {
        $request->validate([
            'name' => 'required|string|max:150',
        ]);

        $name = trim($request->name);

        // Return existing if name already exists (case-insensitive)
        $existing = DB::table('job_roles')
            ->whereRaw('lower(name) = lower(?)', [$name])
            ->first();

        if ($existing) {
            return response()->json($existing, 200);
        }

        $id = DB::table('job_roles')->insertGetId([
            'name' => $name,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $role = DB::table('job_roles')->find($id);

        return response()->json($role, 201);
    }
}
