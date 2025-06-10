<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\VerificationController;

Route::post('/login', [AuthController::class, 'requestLogin']);
Route::post('/verify-login', [VerificationController::class, 'verifyAndLogin']);

