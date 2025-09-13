const despesaForm = document.getElementById('despesa-form');
const despesaList = document.getElementById('despesa-list');
// configuraçoes de arquivos .....
//const API_URL = 'http://localhost:3000';
// apos ativar o google cloud não executa mais localmente 
//const API_URL = 'https://despesas-app-cloud.rj.r.appspot.com';
const API_URL = 'https://github-cliente1-parte1.onrender.com';
// Função para buscar e exibir despesas
async function fetchDespesas() {
    try {
        const response = await fetch(`${API_URL}/despesas`);
        if (!response.ok) {
            throw new Error('Erro ao buscar as despesas.');
        }
        const despesas = await response.json();
        
        despesaList.innerHTML = '';
        despesas.forEach(despesa => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${despesa.descricao} - R$ ${despesa.valor} em ${despesa.data}</span>
                <button class="delete-btn" data-id="${despesa.id}">Excluir</button>
            `;
            despesaList.appendChild(li);
        });
    } catch (error) {
        console.error("Erro na requisição:", error);
        // Opcional: Adicionar uma mensagem de erro na página
        despesaList.innerHTML = `<li><p style="color: red;">Não foi possível carregar as despesas. Verifique se o backend está rodando.</p></li>`;
    }
}

// Função para adicionar despesa
despesaForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const descricao = document.getElementById('descricao').value;
    const valor = parseFloat(document.getElementById('valor').value);
    const data = document.getElementById('data').value;
    
    await fetch(`${API_URL}/despesas`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ descricao, valor, data }),
    });

    despesaForm.reset();
    fetchDespesas();
});

// Função para excluir despesa
despesaList.addEventListener('click', async (e) => {
    if (e.target.classList.contains('delete-btn')) {
        const id = e.target.dataset.id;
        await fetch(`${API_URL}/despesas/${id}`, {
            method: 'DELETE',
        });
        fetchDespesas();
    }
});

// Carregar as despesas ao iniciar a página
fetchDespesas();