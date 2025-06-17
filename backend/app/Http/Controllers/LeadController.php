<?php


// app/Http/Controllers/LeadController.php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Endereco;
use App\Models\Contato;
use App\Models\RedeSocial;
use App\Models\Segmento;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class LeadController extends Controller
{
    public function store(Request $request)
    {
        $data = $request->all();

        DB::beginTransaction();
        try {
            $cliente = Cliente::create($data['cliente']);

            if (isset($data['endereco'])) {
                $cliente->endereco()->create($data['endereco']);
            }

            if (isset($data['contatos'])) {
                foreach ($data['contatos'] as $contato) {
                    $cliente->contatos()->create($contato);
                }
            }

            if (isset($data['redes_sociais'])) {
                foreach ($data['redes_sociais'] as $rede) {
                    $cliente->redesSociais()->create($rede);
                }
            }

            if (isset($data['segmentos'])) {
                $cliente->segmentos()->sync($data['segmentos']);
            }

            DB::commit();
            return response()->json(['message' => 'Lead cadastrado com sucesso', 'id' => $cliente->id], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Erro ao cadastrar lead', 'details' => $e->getMessage()], 500);
        }
    }
} 
