<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Queue\SerializesModels;

class TesteMailtrap extends Mailable
{
    use Queueable, SerializesModels;

    public $nome;

    /**
     * Create a new message instance.
     */
    public function __construct($nome = 'Usuário')
    {
        $this->nome = $nome;
    }

    /**
     * Build the message.
     */
    public function build()
    {
        return $this->subject('Teste Mailtrap')
                    ->view('emails.teste')
                    ->with(['nome' => $this->nome]);
    }
}
