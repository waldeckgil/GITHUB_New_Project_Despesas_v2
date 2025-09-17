// Referências para os elementos do DOM
const loginScreen = document.getElementById('login-screen');
const cadastroScreen = document.getElementById('cadastro-screen');
const dashboardScreen = document.getElementById('dashboard-screen');

const loginForm = document.getElementById('login-form');
const cadastroForm = document.getElementById('cadastro-form');
const despesaForm = document.getElementById('despesa-form');
const logoutBtn = document.querySelector('.logout-btn');

const linkCadastro = document.getElementById('link-cadastro');
const linkLogin = document.getElementById('link-login');

// Referências para os totais do dashboard
const receitaTotalSpan = document.getElementById('receita-total');
const despesaTotalSpan = document.getElementById('despesa-total');
const saldoTotalSpan = document.getElementById('saldo-total');
const despesaTableBody = document.querySelector('#despesa-table tbody');
const userNameDisplay = document.getElementById('user-name-display');

// Adiciona uma variável global para o gráfico
let myChart = null;

// URL da API
const API_URL = 'http://localhost:4000';

// --- Funções para gerenciar a exibição das telas ---
function showScreen(screen) {
    loginScreen.classList.add('hidden');
    cadastroScreen.classList.add('hidden');
    dashboardScreen.classList.add('hidden');
    screen.classList.remove('hidden');
}

// --- Funções de Autenticação (Agora com o backend real) ---
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

function handleLogout() {
    localStorage.removeItem('sessionToken');
    localStorage.removeItem('userName');
    showScreen(loginScreen);
    console.log("Usuário deslogado.");
}

// --- Lógica do Dashboard (Agora com o backend real) ---
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

        // Sort transactions by date descending
        transacoes.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        // Take only the last 10 for the table
        const recentTransacoes = transacoes.slice(0, 10);

        // Limpar a tabela

        despesaTableBody.innerHTML = '';

        // Calcular totais
        const receitaTotal = transacoes.filter(t => t.tipo.toLowerCase() === 'receita').reduce((sum, t) => sum + t.valor, 0);
        const despesaTotal = transacoes.filter(t => t.tipo.toLowerCase() === 'despesa').reduce((sum, t) => sum + Math.abs(t.valor), 0);
        const saldoTotal = receitaTotal - despesaTotal;

        // Renderizar os totais nos cards
        receitaTotalSpan.textContent = `R$ ${receitaTotal.toFixed(2)}`;
        despesaTotalSpan.textContent = `R$ ${despesaTotal.toFixed(2)}`;
        saldoTotalSpan.textContent = `R$ ${saldoTotal.toFixed(2)}`;

        // Renderizar a lista de transações
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

        // Chama a função para renderizar o gráfico com os dados
        renderChart(transacoes);

        // A CORREÇÃO PRINCIPAL: 
        // A tela do dashboard só é exibida e o botão de logout habilitado após o sucesso do fetch.
        showScreen(dashboardScreen);
        logoutBtn.removeAttribute('disabled');

    } catch (error) {
        console.error("Erro ao buscar transações:", error);
        // Em caso de erro, força o logout para garantir um estado limpo
        handleLogout(); 
        alert("Ocorreu um erro ao carregar seus dados. Por favor, faça login novamente.");
    }
}

// --- Função para renderizar o gráfico ---
function renderChart(transacoes) {
    // Destrói o gráfico anterior se ele existir para evitar sobreposição
    if (myChart) {
        myChart.destroy();
    }
    
    // Agrupa as transações por categoria
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
            // Atualiza a lista e o gráfico, o que também vai garantir que o botão "Sair" esteja visível
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

despesaTableBody.addEventListener('click', handleDelete);

// Checa a autenticação ao carregar a página
function checkAuthentication() {
    const token = localStorage.getItem('sessionToken');
    if (token) {
        const userName = localStorage.getItem('userName');
        userNameDisplay.textContent = userName;
        fetchTransacoes(); // Carrega os dados do dashboard
    } else {
        showScreen(loginScreen);
    }
}
