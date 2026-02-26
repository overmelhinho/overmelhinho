describe('Fluxo de Criação de Lead', () => {
    beforeEach(() => {
        // Simula login
        cy.visit('/');
        cy.get('input[name="email"]').type('admin@overmelhinho.com.br');
        cy.get('input[name="password"]').type('admin@2024');
        cy.get('button[type="submit"]').click();

        // Verifica se entrou no dashboard
        cy.url({ timeout: 15000 }).should('include', '/dashboard');
    });

    it('deve criar um novo lead através do formulário multi-etapas', () => {
        // Intercepta a chamada de criação
        cy.intercept('POST', '**/api/v1/leads').as('createLead');

        // Navega para a página de leads
        cy.visit('/leads');

        // Clica no botão de novo lead
        cy.contains('button', 'Novo Lead').click();

        // Etapa 1: Dados Básicos
        cy.get('input[name="nome"]').type('Joaquim da Silva E2E');
        cy.get('select[name="origem"]').select('site');
        cy.get('select[name="status"]').select('novo');
        cy.contains('button', 'Avançar').click();

        // Etapa 2: Contato
        cy.get('input[name="email"]').type('joaquim.e2e@test.com');
        cy.get('input[name="telefone"]').type('51988887777');
        cy.contains('button', 'Avançar').click();

        // Etapa 3: Responsável / Observações
        cy.get('textarea[name="observacoes"]').type('Lead criado pelo robô de testes automatizados.');

        // Finalizar
        cy.contains('button', 'Salvar').click();

        // Aguarda a resposta do servidor
        cy.wait('@createLead', { timeout: 10000 });

        // Valida se a mensagem de sucesso apareceu
        cy.contains('Lead salvo com sucesso!', { timeout: 10000 }).should('be.visible');

        // Verifica se o lead aparece na tabela
        cy.contains('Joaquim da Silva E2E').should('exist');
    });
});
