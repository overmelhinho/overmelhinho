<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;
use Illuminate\Mail\Mailables\Address;

class ResetPasswordMail extends Mailable
{
    use Queueable, SerializesModels;

    public $resetUrl;

    public function __construct($token, $email)
    {
        $frontendUrl = env('FRONTEND_URL', 'http://localhost:5173');
        $this->resetUrl = $frontendUrl . '/reset-password?token=' . $token . '&email=' . urlencode($email);
    }

    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'O Vermelhinho - Redefinição de Senha',
        );
    }

    public function content(): Content
    {
        return new Content(
            htmlString: '
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
                <h2 style="color: #dc2626;">Redefinição de Senha</h2>
                <p>Você solicitou a redefinição de senha para a sua conta no <strong>O Vermelhinho</strong>.</p>
                <p>Clique no botão abaixo para cadastrar uma nova senha:</p>
                <div style="text-align: center; margin: 30px 0;">
                    <a href="' . $this->resetUrl . '" style="background-color: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Redefinir Minha Senha</a>
                </div>
                <p style="font-size: 14px; color: #666;">Se o botão não funcionar, copie e cole o link abaixo no seu navegador:</p>
                <p style="font-size: 14px; word-break: break-all; color: #3b82f6;"><a href="' . $this->resetUrl . '">' . $this->resetUrl . '</a></p>
                <p style="font-size: 12px; color: #999; margin-top: 40px;">Se você não solicitou essa redefinição, apenas ignore este e-mail.</p>
            </div>'
        );
    }
}
