// Referências para os elementos do DOM: Selecionam os elementos HTML para manipulação
const loginScreen = document.getElementById('login-screen');
const cadastroScreen = document.getElementById('cadastro-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

const loginForm = document.getElementById('login-form');
const cadastroForm = document.getElementById('cadastro-form');
const despesaForm = document.getElementById('despesa-form');
const logoutBtn = document.querySelector('.logout-btn');

const linkCadastro = document.getElementById('link-cadastro');
const linkLogin = document.getElementById('link-login');

const receitaTotalSpan = document.getElementById('receita-total');
const despesaTotalSpan = document.getElementById('despesa-total');
const saldoTotalSpan = document.getElementById('saldo-total');
const despesaTableBody = document.querySelector('#despesa-table tbody');
const userNameDisplay = document.getElementById('user-name-display');

// Adiciona uma variável global para o gráfico: Armazena a instância do gráfico para destruição e recriação
let myChart = null;

// URL da API: Define o endpoint do backend para chamadas de API
const API_URL = 'https://github-new-project-despesas-v2.onrender.com';

// --- Funções para gerenciar a exibição das telas ---
// Função para mostrar uma tela específica e ocultar as outras
function showScreen(screen) {
    loginScreen.classList.add('hidden');
    cadastroScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

// --- Funções de Autenticação (Agora com o backend real) ---
// Função para lidar com o login: Envia dados para o backend e gerencia a resposta
async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    try {
        const response = await fetch(`${API_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password }),
        });
        const data = await response.json();

        if (response.ok) {
            localStorage.setItem('sessionToken', data.session.access_token);
            localStorage.setItem('userName', email);
            checkAuthentication();
            console.log("Login bem-sucedido.");
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Erro no login:", error);
        alert("Erro no servidor. Tente novamente mais tarde.");
    }
}

// Função para lidar com o cadastro: Envia dados para o backend e gerencia a resposta
async function handleCadastro(e) {
    e.preventDefault();
    const email = document.getElementById('cadastro-email').value;
    const password = document.getElementById('cadastro-password').value;
    const nome = document.getElementById('cadastro-nome').value;

    try {
        const response = await fetch(`${API_URL}/cadastro`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email, password, nome }),
        });
        const data = await response.json();

        if (response.ok) {
            alert("Cadastro realizado com sucesso! Verifique seu e-mail para confirmar a conta.");
            showScreen(loginScreen);
        } else {
            alert(data.error);
        }
    } catch (error) {
        console.error("Erro no cadastro:", error);
        alert("Erro no servidor. Tente novamente mais tarde.");
    }
}

// Função para lidar com o logout: Remove dados do localStorage e volta para a tela de login
function handleLogout() {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userName');
    showScreen(loginScreen);
    console.log("Usuário deslogado.");
}

// --- Lógica do Dashboard (Agora com o backend real) ---
// Função para buscar transações do backend: Faz requisição autenticada e atualiza a UI
async function fetchTransacoes() {
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        handleLogout();
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/despesas`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });
        
        if (!response.ok) {
            if (response.status === 401) {
                alert("Sessão expirada. Por favor, faça login novamente.");
                handleLogout();
            }
            throw new Error('Erro ao buscar as transações.');
        }

        const transacoes = await response.json();

        // Ordena transações por data decrescente
        transacoes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // Pega apenas as últimas 10 para a tabela
        const recentTransacoes = transacoes.slice(0, 10);

        // Limpa a tabela
        despesaTableBody.innerHTML = '';

        // Calcula totais de receita, despesa e saldo
        const receitaTotal = transacoes.filter(t => t.tipo.toLowerCase() === 'receita').reduce((sum, t) => sum + t.valor, 0);
        const despesaTotal = transacoes.filter(t => t.tipo.toLowerCase() === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0);
        const saldoTotal = receitaTotal - despesaTotal;

        // Atualiza os cards de resumo
        receitaTotalSpan.textContent = `R$ ${receitaTotal.toFixed(2)}`;
        despesaTotalSpan.textContent = `R$ ${despesaTotal.toFixed(2)}`;
        saldoTotalSpan.textContent = `R$ ${saldoTotal.toFixed(2)}`;

        // Renderiza a lista de transações na tabela
        recentTransacoes.forEach(transacao => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${transacao.descricao}</td>
                <td>${transacao.valor.toFixed(2)}</td>
                <td>${new Date(transacao.created_at).toLocaleDateString('pt-BR')}</td>
                <td>${transacao.tipo}</td>
                <td>${transacao.categoria}</td>
                <td><button class="delete-btn" data-id="${transacao.id}">Excluir</button></td>
            `;
            despesaTableBody.appendChild(row);
        });

        // Chama a função para renderizar o gráfico
        renderChart(transacoes);

        // Mostra o dashboard após sucesso
        showScreen(dashboardScreen);
        logoutBtn.removeAttribute('disabled');

    } catch (error) {
        console.error("Erro ao buscar transações:", error);
        handleLogout(); 
        alert("Ocorreu um erro ao carregar seus dados. Por favor, faça login novamente.");
    }
}

// --- Função para renderizar o gráfico ---
// Função para criar ou atualizar o gráfico de distribuição de despesas
function renderChart(transacoes) {
    // Destrói o gráfico anterior se existir
    if (myChart) {
        myChart.destroy();
    }
    
    // Agrupa transações por categoria (apenas despesas)
    const categorias = {};
    transacoes.forEach(t => {
        if (t.tipo.toLowerCase() === 'despesa') {
            if (!categorias[t.categoria]) {
                categorias[t.categoria] = 0;
            }
            categorias[t.categoria] += t.valor;
        }
    });

    const labels = Object.keys(categorias);
    const dataValues = Object.values(categorias);
    const backgroundColors = [
        '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'
    ];

    const ctx = document.getElementById('pie-chart').getContext('2d');
    myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: labels,
            datasets: [{
                data: dataValues,
                backgroundColor: backgroundColors,
            }]
        },
        options: {
            responsive: true,
            plugins: {
                legend: {
                    position: 'top',
                },
                title: {
                    display: true,
                    text: 'Distribuição de Despesas por Categoria'
                }
            }
        },
    });
}

// Função para lidar com a exclusão de transações: Confirma e envia requisição de delete
async function handleDelete(e) {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        const token = localStorage.getItem('sessionToken');

        if (confirm("Tem certeza que deseja excluir esta transação?")) {
            try {
                const response = await fetch(`${API_URL}/despesas/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${token}` },
                });

                if (response.ok) {
                    alert('Transação excluída com sucesso!');
                    fetchTransacoes();
                } else {
                    const data = await response.json();
                    alert(data.error || 'Erro ao excluir a transação.');
                }
            } catch (error) {
                console.error("Erro ao excluir transação:", error);
                alert("Não foi possível excluir a transação. Tente novamente.");
            }
        }
    }
}

// --- Event Listeners ---
// Adiciona ouvintes de eventos para formulários e botões
document.addEventListener('DOMContentLoaded', checkAuthentication);
loginForm.addEventListener('submit', handleLogin);
cadastroForm.addEventListener('submit', handleCadastro);
logoutBtn.addEventListener('click', handleLogout);

linkCadastro.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen(cadastroScreen);
});

linkLogin.addEventListener('click', (e) => {
    e.preventDefault();
    showScreen(loginScreen);
});

// Ouvinte para o formulário de transação: Adiciona nova transação
despesaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('sessionToken');
    if (!token) {
        alert("Você precisa estar logado para adicionar uma transação.");
        return;
    }

    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const tipo = document.getElementById('tipo').value;
    const categoria = document.getElementById('categoria').value;
    
    try {
        const response = await fetch(`${API_URL}/despesas`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ descricao, valor, tipo, categoria }),
        });

        if (response.ok) {
            alert('Transação adicionada com sucesso!');
            despesaForm.reset();
            fetchTransacoes(); 
        } else {
            const data = await response.json();
            alert(data.error || 'Erro ao adicionar a transação.');
        }
    } catch (error) {
        console.error("Erro ao adicionar transação:", error);
        alert("Não foi possível adicionar a transação. Tente novamente.");
    }
});

// Ouvinte para a tabela: Trata cliques no botão de excluir
despesaTableBody.addEventListener('click', handleDelete);

// Função para verificar autenticação ao carregar a página
function checkAuthentication() {
    const token = localStorage.getItem('sessionToken');
    if (token) {
        const userName = localStorage.getItem('userName');
        userNameDisplay.textContent = userName;
        fetchTransacoes();
    } else {
        showScreen(loginScreen);
    }
}
