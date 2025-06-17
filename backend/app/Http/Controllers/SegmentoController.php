<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SegmentoController extends Controller
{
public function index()
{
    $segmentos = DB::table('segmentos')
        ->orderBy('nome')
        ->get();

    return response()->json($segmentos);
}

}
