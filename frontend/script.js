// Função para consultar transações por período
async function handleConsultar() {
    const dates = flatpickrInstance.selectedDates;
    if (dates.length !== 2) {
        alert("Por favor, selecione uma data inicial e uma data final.");
        return;
    }

    const dataInicio = dates[0].toISOString().split('T')[0];
    // Adiciona 1 dia à data final para incluir o dia inteiro
    const dataFim = new Date(dates[1].getTime() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const token = localStorage.getItem('sessionToken');

    try {
        const response = await fetch(`${API_URL}/despesas/periodo?data_inicio=${dataInicio}&data_fim=${dataFim}`, {
            headers: { 'Authorization': `Bearer ${token}` },
        });

        if (!response.ok) {
            if (response.status === 401) {
                alert("Sessão expirada. Por favor, faça login novamente.");
                handleLogout();
            }
            throw new Error('Erro ao consultar transações.');
        }

        const transacoes = await response.json();

        // Exibir os resultados (por enquanto, em um alerta; futuramente, pode ser uma tabela ou modal separado)
        if (transacoes.length > 0) {
            let message = `Encontradas ${transacoes.length} transações no período de ${dataInicio} a ${new Date(dates[1]).toISOString().split('T')[0]}:\n\n`;
            transacoes.forEach(t => {
                message += `${t.descricao}: R$ ${t.valor} (${t.tipo}) - ${new Date(t.created_at).toLocaleDateString('pt-BR')}\n`;
            });
            alert(message);
        } else {
            alert(`Nenhuma transação encontrada no período de ${dataInicio} a ${new Date(dates[1]).toISOString().split('T')[0]}.`);
        }

        closeConsultaModal();

    } catch (error) {
        console.error("Erro ao consultar transações:", error);
        alert("Erro ao consultar transações. Tente novamente.");
    }
}
