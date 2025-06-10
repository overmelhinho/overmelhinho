<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Mail;
use App\Mail\VerifyCodeMail;
use App\Models\User;

class AuthController extends Controller
{
    public function requestLogin(Request $request)
    {
        $credentials = $request->only('email', 'password');

        if (!Auth::attempt($credentials)) {
            return response()->json(['message' => 'Credenciais inválidas'], 401);
        }

        $user = Auth::user();
$code = rand(100000, 999999);
$user->two_factor_code = $code;
$user->two_factor_expires_at = now()->addMinutes(10);
$user->two_factor_verified = false;


        $user->save();

Mail::to($user->email)->send(new VerifyCodeMail($code));


        return response()->json(['message' => 'Código enviado ao e-mail.']);
    }
}
