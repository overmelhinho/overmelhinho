<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration 
{
    public function up(): void
    {
        Schema::create('job_roles', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->timestamps();
        });

        // Seed default roles
        $roles = [
            'Açougueiro', 'Agente de Suporte Técnico', 'Agente de Turismo', 'Agente de Vendas',
            'Ajudante de Carga e Descarga', 'Ajudante de Plataforma', 'Ajudante de Recepção',
            'Almoxarife', 'Analista de Marketing', 'Analista de Recursos Humanos', 'Analista Fiscal',
            'Aplicador(a) de Adesivos', 'Arte Finalista', 'Assistente Administrativo',
            'Assistente Comercial', 'Assistente Contábil', 'Assistente de Loja',
            'Assistente de Marketing', 'Assistente de PCP', 'Assistente de Pré-venda',
            'Assistente de Vendas', 'Assistente Fiscal', 'Atendente', 'Atendente de Cafeteria',
            'Atendente de E-commerce', 'Atendente de Farmácia', 'Atendente de Padaria',
            'Atendente de SAC', 'Atendente de Vendas', 'Auxiliar Administrativo',
            'Auxiliar Comercial', 'Auxiliar Contábil', 'Auxiliar de Acabamento',
            'Auxiliar de Açougue', 'Auxiliar de Almoxarifado', 'Auxiliar de Banho e Tosa',
            'Auxiliar de Caixa', 'Auxiliar de Carga e Descarga', 'Auxiliar de Colagem',
            'Auxiliar de Confecção', 'Auxiliar de Confeitaria', 'Auxiliar de Copa/Cozinha',
            'Auxiliar de Cozinha', 'Auxiliar de Criação', 'Auxiliar de Desenvolvimento de Produto',
            'Auxiliar de Desenvolvimento Infantil', 'Auxiliar de Eletricista',
            'Auxiliar de Eletricista Instalador', 'Auxiliar de Escritório', 'Auxiliar de Estoque',
            'Auxiliar de Funileiro', 'Auxiliar de Higienização', 'Auxiliar de Impressão',
            'Auxiliar de Lavanderia', 'Auxiliar de Limpeza', 'Auxiliar de Loja',
            'Auxiliar de Manutenção', 'Auxiliar de Manutenção e Limpeza', 'Auxiliar de Marceneiro',
            'Auxiliar de Mecânica Pesada', 'Auxiliar de Mecânico', 'Auxiliar de Montagem',
            'Auxiliar de Padaria', 'Auxiliar de Produção', 'Auxiliar de Serviços Gerais',
            'Auxiliar de Sushiman', 'Auxiliar de TI', 'Auxiliar de Vendas',
            'Auxiliar de Veterinário', 'Auxiliar em Saúde Bucal', 'Auxiliar Fiscal',
            'Auxiliar Geral', 'Auxiliar Gráfico', 'Auxiliar Técnico', 'Auxiliar Veterinário(a)',
            'Babá', 'Balanceamento', 'Balconista', 'Banco de Talentos', 'Banhista (banho pet)',
            'Barbeiro', 'Barista', 'Bartender', 'Cabeleireira(o)', 'Caixa', 'Camareira',
            'Chapeiro', 'Chapista', 'Comercial', 'Comprador', 'Confeiteiro(a)', 'Conserto de Pneus',
            'Consultor(a) de Vendas', 'Consultor(a) Externo de Vendas',
            'Consultor(a) Interno de Vendas', 'Coordenador de Marketing',
            'Coordenador de Produção', 'Coordenador(a)', 'Cortadora', 'Costureira',
            'Cozinheira Industrial', 'Cozinheiro(a)', 'Cuidador(a) de Idosos',
            'Departamento Financeiro', 'Departamento Fiscal', 'Departamento Pessoal',
            'Departamento Societário', 'Designer', 'Designer de Sobrancelhas',
            'Direção de Escola', 'Eletricista', 'Eletricista Instalador', 'Eletromecânico',
            'Estágio', 'Estágio em Administração', 'Estágio em Direito',
            'Estágio em Educação Física', 'Estágio para Digitação',
            'Estágio para Educação Infantil', 'Esteticista Corporal', 'Estofador', 'Estoquista',
            'Extensionista de Cílios', 'Farmacêutico(a)', 'Financeiro', 'Fonoaudióloga(o)',
            'Freelancer', 'Frentista', 'Garçom | Garçonete', 'Gerente Comercial', 'Gesseiro',
            'Gestor(a)', 'Higienizador(a)', 'Impressor para Designer Gráfico',
            'Impressor Serigráfico', 'Inspetor de Qualidade', 'Manicure', 'Marceneiro',
            'Marketing Digital', 'Marketing | Vendas', 'Marmorista', 'Massoterapeuta',
            'Mecânico', 'Mecânico de Manutenção', 'Mecânico Diesel', 'Médico Veterinário',
            'Montador', 'Motoboy', 'Motorista', 'Motorista Entregador',
            'Operador de Centro de Plasma', 'Operador de Centro de Usinagem',
            'Operador de Máquinas', 'Operador de Torno CNC',
            'Operador e Programador de Torno CNC', 'Operador(a) de Caixa', 'Orçamentista',
            'Orçamentista - Energia Solar', 'Padeiro', 'Passadeira', 'Passadeira e Acabamentos',
            'PCP Programação e Controle de Produção', 'Pediatra', 'Pedreiro',
            'Pintura e Acabamento', 'Pizzaiolo', 'Porteiro(a)', 'Produção e Acabamento',
            'Produção e Instalação', 'Professor(a)', 'Programador de Centro de Usinagem',
            'Programador de Torno CNC', 'Programador e Preparador de Torno CNC',
            'Programador(a)', 'Recepcionista', 'Repositor(a)', 'Saladeira', 'Salgadeiro(a)',
            'Secretária', 'Secretária Recepcionista', 'Serralheiro', 'Servente', 'Serviços',
            'Serviços Gerais', 'Setor de Marketing e Design', 'Setor Fiscal', 'Social Media',
            'Soldador', 'Supervisor da Qualidade', 'Supervisor de Administração e Produção',
            'Supervisor de Produção', 'Sushiman | Sushiwoman',
            'Técnico de Segurança do Trabalho', 'Técnico(a) de Enfermagem',
            'Técnico(a) de Informática', 'Técnico(a) em Atendimento e Vendas',
            'Técnico(a) Instalador(a)', 'Trabalhador de Fruticultura',
            'Trabalhador(a) polivalente de malharia',
            'Trabalhador(a) polivalente para tecelagem', 'Vaga', 'Vendedor(a)',
            'Vendedor(a) Externo', 'Vendedor(a) Interno',
        ];

        $now = now();
        $data = array_map(fn($r) => ['name' => $r, 'created_at' => $now, 'updated_at' => $now], $roles);

        foreach (array_chunk($data, 50) as $chunk) {
            DB::table('job_roles')->insertOrIgnore($chunk);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('job_roles');
    }
};
