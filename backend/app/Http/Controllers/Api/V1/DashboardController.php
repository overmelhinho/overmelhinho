<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Lead;

class DashboardController extends Controller
{
    public function kpis(Request $request)
    {
        return response()->json([
            'total' => Lead::count(),
            'novo' => Lead::where('status', 'novo')->count(),
            'em_contato' => Lead::where('status', 'em_contato')->count(),
            'convertido' => Lead::where('status', 'convertido')->count(),
            'perdido' => Lead::where('status', 'perdido')->count(),
        ]);
    }


public function test()
{
    return response()->json(['ok' => true, 'message' => 'Dashboard funcionando']);
}



}
