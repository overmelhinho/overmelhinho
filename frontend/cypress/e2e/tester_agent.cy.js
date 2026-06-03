describe('Agente Testador E2E - Portal O Vermelhinho', () => {
    let logs = [];
    let errors = [];

    before(() => {
        // Limpa dados de teste anteriores do banco local
        cy.exec('C:\\xampp2\\php\\php.exe ..\\backend\\artisan e2e:cleanup', { failOnNonZeroExit: false, timeout: 60000 });
    });

    beforeEach(() => {
        logs = [];
        errors = [];
        // Captura logs do console
        cy.on('window:before:load', (win) => {
            cy.stub(win.console, 'log').callsFake((...args) => {
                logs.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
            });
            cy.stub(win.console, 'error').callsFake((...args) => {
                errors.push(args.map(a => typeof a === 'object' ? JSON.stringify(a) : a).join(' '));
            });
        });

        // Realiza o login antes de cada teste
        cy.visit('/');
        cy.get('input[name="email"]').type('admin@overmelhinho.com.br');
        cy.get('input[name="password"]').type('admin@2024');
        cy.get('button[type="submit"]').click();

        // Aguarda carregar o dashboard
        cy.url({ timeout: 15000 }).should('include', '/dashboard');
    });

    afterEach(function() {
        if (this.currentTest.state === 'failed') {
            const specName = this.currentTest.title.replace(/[^a-z0-9]/gi, '_');
            cy.writeFile(`cypress/screenshots/console_logs_${specName}.json`, {
                test: this.currentTest.title,
                errors: errors,
                logs: logs
            });
        }
    });

    it('1. Deve navegar por todas as rotas principais sem apresentar erros de renderização ou 404', () => {
        const routes = [
            { path: '/dashboard' },
            { path: '/leads' },
            { path: '/clientes' },
            { path: '/campanhas' },
            { path: '/vagas' },
            { path: '/financeiro' },
            { path: '/relatorios' },
            { path: '/tickets' },
            { path: '/configuracoes' }
        ];

        routes.forEach((route) => {
            cy.visit(route.path);
            cy.contains('Página não encontrada').should('not.exist');
            cy.get('body').should('be.visible');
        });
    });

    it('2. Deve executar o CRUD completo de Leads', () => {
        const leadName = 'Lead E2E Teste Robot';
        const leadNameEdit = 'Lead E2E Teste Robot Editado';

        cy.visit('/leads');

        // Espera o skeleton / carregamento sumir
        cy.contains('button', 'Novo Lead', { timeout: 20000 }).should('be.visible').click();

        // Criar (aguarda modal carregar)
        cy.get('input[name="nome"]', { timeout: 10000 }).should('be.visible').type(leadName);
        cy.get('select[name="origem"]').select('site');
        cy.get('select[name="status"]').select('novo');
        cy.contains('button', 'Avançar').click();

        cy.get('input[name="email"]').type('lead.robot@e2e.com');
        cy.get('input[name="telefone"]').type('54999998888');
        cy.contains('button', 'Avançar').click();

        cy.get('textarea[name="observacoes"]').type('Lead temporário de teste E2E.');
        cy.contains('button', 'Salvar').click();

        // Valida se a mensagem de sucesso apareceu
        cy.contains('Lead salvo com sucesso!', { timeout: 30000 }).should('be.visible');

        // Aguarda o modal fechar completamente e liberar o scroll-lock do body
        cy.get('body', { timeout: 15000 }).should('not.have.attr', 'data-scroll-locked');

        // Filtra pelo nome para isolar o registro
        cy.get('input[placeholder="Buscar nome, e-mail ou origem..."]').clear().type(leadName);
        cy.contains(leadName, { timeout: 25000 }).should('be.visible');

        // Editar
        cy.contains('tr', leadName, { timeout: 20000 }).find('button[title="Editar"]').click();
        cy.get('input[name="nome"]', { timeout: 10000 }).should('be.visible').focus().clear().should('have.value', '').type(leadNameEdit);
        cy.contains('button', 'Avançar').click();
        cy.contains('button', 'Avançar').click();
        cy.contains('button', 'Salvar').click();

        // Valida se a mensagem de sucesso apareceu
        cy.contains('Lead salvo com sucesso!', { timeout: 30000 }).should('be.visible');

        // Aguarda fechar o modal
        cy.get('body', { timeout: 15000 }).should('not.have.attr', 'data-scroll-locked');

        // Filtra pelo nome editado
        cy.get('input[placeholder="Buscar nome, e-mail ou origem..."]').clear().type(leadNameEdit);
        cy.contains(leadNameEdit, { timeout: 25000 }).should('be.visible');

        // Deletar
        cy.contains('tr', leadNameEdit, { timeout: 20000 }).find('button[title="Deletar"]').click();
        // O confirm é aceito automaticamente pelo Cypress
        cy.contains(leadNameEdit, { timeout: 20000 }).should('not.exist');
    });

    it('3. Deve executar o CRUD completo de Clientes', () => {
        const clientName = 'Cliente E2E Teste Robot';
        const clientNameEdit = 'Cliente E2E Teste Robot Editado';

        cy.visit('/clientes');

        // Espera a listagem e botão "Novo cliente" carregar (case-sensitive)
        cy.contains('button', 'Novo cliente', { timeout: 20000 }).should('be.visible').click();

        // Dispensa o Modal do Assistente de Pré-preenchimento por IA
        cy.contains('button', 'Cancelar', { timeout: 10000 }).click();

        // Muda para Cliente Gratuito (simplifica etapas do formulário)
        cy.contains('div', 'Tipo do cliente').parent().find('select').select('gratuito');

        // Etapa 0: Identificação
        cy.get('input[name="nome_fantasia"]', { timeout: 10000 }).should('be.visible').type(clientName);
        cy.contains('button', 'Avançar').click();

        // Etapa 1: Endereço
        cy.get('input[name="enderecos[0].cep"]').type('95170488');
        cy.get('input[name="enderecos[0].estado"]').type('RS');
        cy.get('input[name="enderecos[0].cidade"]').type('Farroupilha');
        cy.get('input[name="enderecos[0].bairro"]').type('Centro');
        cy.get('input[name="enderecos[0].rua"]').type('Rua Júlio de Castilhos');
        cy.get('input[name="enderecos[0].numero"]').type('123');
        cy.contains('button', 'Avançar').click();

        // Etapa 2: Contato
        cy.get('input[name="telefone_principal"]').type('5432611000');
        cy.get('input[name="responsavel"]').type('Responsável E2E');
        cy.contains('button', 'Avançar').click();

        // Etapa 3: Segmentos
        cy.contains('button', 'Avançar').click();

        // Etapa 4: Horários e salvar
        cy.contains('button', 'Salvar Cliente').click();

        // Verifica criação bem sucedida e retorno à listagem
        cy.url({ timeout: 20000 }).should('match', /\/clientes$/);

        // Filtra na listagem para encontrar o cliente
        cy.get('input[placeholder="Digite e aperte Enter para buscar..."]').clear().type(`${clientName}{enter}`);
        cy.contains(clientName, { timeout: 25000 }).should('be.visible');

        // Editar
        cy.contains('tr', clientName, { timeout: 20000 }).contains('Editar').click();
        cy.url().should('include', '/editar');
        cy.get('input[name="nome_fantasia"]', { timeout: 10000 }).should('be.visible').focus().clear().should('have.value', '').type(clientNameEdit);
        cy.contains('button', /Salvar (alterações|Agora)/i).click();

        // Retorna à listagem
        cy.url({ timeout: 20000 }).should('match', /\/clientes$/);

        // Filtra pelo nome editado
        cy.get('input[placeholder="Digite e aperte Enter para buscar..."]').clear().type(`${clientNameEdit}{enter}`);
        cy.contains(clientNameEdit, { timeout: 25000 }).should('be.visible');

        // Deletar
        cy.contains('tr', clientNameEdit, { timeout: 20000 }).contains('Excluir').click();
        cy.contains('button', 'Sim, excluir permanentemente').click();

        // Garante remoção
        cy.contains('tr', clientNameEdit, { timeout: 10000 }).should('not.exist');
    });

    it('4. Deve executar o CRUD completo de Campanhas', () => {
        const campaignName = 'Campanha E2E Teste Robot';
        const campaignNameEdit = 'Campanha E2E Teste Robot Editado';

        cy.visit('/campanhas');

        // Espera listagem de campanhas e clica em nova
        cy.contains('a', 'NOVA CAMPANHA', { timeout: 20000 }).should('be.visible').click();
        cy.url().should('include', '/campanhas/nova');

        // Passo 1: Tipo de publicidade
        cy.contains('h3', 'Banner Home', { timeout: 10000 }).click();

        // Passo 2: Dados básicos da campanha
        cy.get('input[placeholder="Ex: Banner Natal 2025"]').type(campaignName);

        // Ativa como institucional para pular seleção de cliente e período dinâmico
        cy.contains('Campanha Institucional').closest('div.flex').find('button').click();
        cy.contains('button', 'Próximo').click();

        // Passo 3: Segmentação
        cy.contains('button', 'Próximo').click();

        // Passo 4: Mídia
        cy.contains('button', 'Ver Resumo').click();

        // Passo 5: Resumo e Salvar
        cy.contains('button', 'Finalizar e Gerar').click();

        // Verifica se a campanha foi criada e retornou à listagem
        cy.url({ timeout: 20000 }).should('match', /\/campanhas$/);

        // Filtra para localizar a campanha
        cy.get('input[placeholder="Pesquisar por Campanha, ID ou Cliente..."]', { timeout: 30000 }).clear().type(`${campaignName}{enter}`);
        cy.contains(campaignName, { timeout: 25000 }).should('be.visible');

        // Editar (clicar na linha da tabela navega direto para /editar na rota de campanhas)
        cy.contains('tr', campaignName, { timeout: 20000 }).contains('div', campaignName).click();
        cy.url({ timeout: 20000 }).should('include', '/editar');

        // Altera nome
        cy.contains('label', 'Título da Campanha').parent().find('input', { timeout: 15000 }).should('be.visible').focus().clear().should('have.value', '').type(campaignNameEdit);
        cy.contains('button', 'Salvar Alterações').click();

        // Aguarda redirecionamento para detalhes após salvar
        cy.url({ timeout: 20000 }).should('match', /\/campanhas\/\d+$/);
        cy.visit('/campanhas');
        cy.url({ timeout: 20000 }).should('match', /\/campanhas$/);

        // Filtra pelo nome editado
        cy.get('input[placeholder="Pesquisar por Campanha, ID ou Cliente..."]', { timeout: 30000 }).clear().type(`${campaignNameEdit}{enter}`);
        cy.contains(campaignNameEdit, { timeout: 25000 }).should('be.visible');

        // Deletar
        cy.contains('tr', campaignNameEdit, { timeout: 20000 }).find('button[title="Excluir Campanha"]').click();
        cy.contains('button', 'Excluir Agora').click();

        cy.contains(campaignNameEdit, { timeout: 10000 }).should('not.exist');
    });

    it('5. Deve executar o CRUD completo de Vagas', () => {
        const jobTitle = 'Vaga E2E Teste Robot';
        const jobTitleEdit = 'Vaga E2E Teste Robot Editado';

        cy.visit('/vagas');

        // Espera listagem de vagas e clica em nova
        cy.contains('a', 'Nova Vaga', { timeout: 20000 }).should('be.visible').click();
        cy.url().should('include', '/vagas/nova');

        // Passo 1: Dados da Empresa
        cy.get('input[placeholder="Buscar cliente (nome, CNPJ, endereço…)"]').click();
        
        // Aguarda carregar as sugestões no combobox antes de clicar na primeira
        cy.get('input[placeholder="Buscar cliente (nome, CNPJ, endereço…)"]')
          .parent()
          .find('button', { timeout: 20000 })
          .first()
          .click({ force: true });

        cy.contains('button', 'Próximo').click();

        // Passo 2: Informações da Vaga
        cy.get('input[placeholder="Ex: Cozinheiro(a)"]', { timeout: 10000 }).should('be.visible').type(jobTitle);
        cy.contains('button', 'Próximo').click();

        // Passo 3: Habilidades
        cy.get('select').eq(0).select('Informática e TI');
        
        cy.get('input[placeholder="Buscar ou criar cargo..."]').type('Desenvolvedor E2E Test');
        cy.contains('button', 'Criar cargo', { timeout: 10000 }).click({ force: true });

        // Aguarda o cargo ser criado e selecionado (garante que canAdvance retorne true)
        cy.contains('span', 'Desenvolvedor E2E Test', { timeout: 20000 }).should('be.visible');

        cy.get('select').eq(2).select('PJ');
        cy.get('select').eq(3).select('Remoto');
        cy.get('select').eq(4).select('A Combinar');
        cy.contains('button', 'Próximo').click();

        // Passo 4: Publicação e Salvar
        cy.contains('button', 'Criar Vaga', { timeout: 15000 }).click();

        // Verifica na listagem
        cy.url({ timeout: 20000 }).should('match', /\/vagas$/);

        // Filtra pelo título para localizar a vaga
        cy.get('input[placeholder="Buscar por título, empresa ou cidade..."]', { timeout: 30000 }).clear().type(`${jobTitle}{enter}`);
        cy.contains(jobTitle, { timeout: 25000 }).should('be.visible');

        // Editar
        cy.contains('tr', jobTitle, { timeout: 20000 }).contains('Editar').click();
        cy.url().should('include', '/editar');
        cy.contains('button', 'Próximo').click();
        cy.get('input[placeholder="Ex: Cozinheiro(a)"]', { timeout: 10000 }).should('be.visible').focus().clear().should('have.value', '').type(jobTitleEdit);
        cy.contains('button', 'Próximo').click();
        cy.contains('button', 'Próximo').click();
        cy.contains('button', /Criar Vaga|Salvar Alterações/i, { timeout: 15000 }).click();

        cy.url({ timeout: 20000 }).should('match', /\/vagas$/);

        // Filtra pelo título editado
        cy.get('input[placeholder="Buscar por título, empresa ou cidade..."]', { timeout: 30000 }).clear().type(`${jobTitleEdit}{enter}`);
        cy.contains(jobTitleEdit, { timeout: 25000 }).should('be.visible');

        // Deletar
        cy.contains('tr', jobTitleEdit, { timeout: 20000 }).contains('Remover').click();
        // O confirm é aceito automaticamente
        cy.contains(jobTitleEdit, { timeout: 10000 }).should('not.exist');
    });
});
