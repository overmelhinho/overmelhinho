<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\User;

class VerificationController extends Controller
{
    public function verifyAndLogin(Request $request)
    {
        $user = User::where('email', $request->input('email'))->first();

        if (
            !$user ||
            $user->two_factor_code !== $request->input('code') ||
            now()->gt($user->two_factor_expires_at)
        ) {
            return response()->json(['message' => 'Código inválido ou expirado'], 400);
        }

        $user->two_factor_code = null;
        $user->two_factor_expires_at = null;
        $user->two_factor_verified = true;
        $user->save();

        $token = $user->createToken('api-token')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }
}
