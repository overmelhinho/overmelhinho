<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Carbon;
use App\Models\User;
use Illuminate\Support\Facades\Validator;

class PasswordResetController extends Controller
{
    public function sendResetLinkEmail(Request $request)
    {
        $request->validate(['email' => 'required|email']);

        // Remove tokens antigos
        DB::table('password_resets')->where('email', $request->email)->delete();

        // Gera novo token
        $token = Str::random(60);
        DB::table('password_resets')->insert([
            'email' => $request->email,
            'token' => Hash::make($token),
            'created_at' => Carbon::now(),
        ]);

        // Em produção: envie o token por e-mail
        return response()->json([
            'message' => 'Token de redefinição gerado com sucesso.',
            'token' => $token, // Remover em produção
        ]);
    }

    public function reset(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'token' => 'required|string',
            'password' => 'required|string|confirmed|min:6',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $reset = DB::table('password_resets')
            ->orderByDesc('created_at')
            ->get()
            ->first(function ($item) use ($request) {
                return Hash::check($request->token, $item->token);
            });

        if (!$reset) {
            return response()->json(['message' => 'Token inválido ou expirado'], 400);
        }

        $user = User::where('email', $reset->email)->first();
        if (!$user) {
            return response()->json(['message' => 'Usuário não encontrado'], 404);
        }

        $user->password = Hash::make($request->password);
        $user->setRememberToken(Str::random(60));
        $user->save();

        DB::table('password_resets')->where('email', $reset->email)->delete();

        return response()->json(['message' => 'Senha redefinida com sucesso.']);
    }
}
