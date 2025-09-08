const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors'); // Importado apenas uma vez
require('dotenv').config();

const app = express();
//const port = 3000;
const port = process.env.PORT || 3000;

// Inicializa o cliente Supabase
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Defina a URL do seu frontend no Netlify como origem permitida
const netlifyUrl = 'https://comforting-maamoul-8e28f7.netlify.app';

// Configuração do CORS para permitir apenas a sua URL do Netlify
app.use(cors({
  origin: netlifyUrl
}));

// Linha original comentada para referência:
// app.use(cors()); 

app.use(express.json());

// Rota para adicionar uma despesa
app.post('/despesas', async (req, res) => {
    const { descricao, valor, data } = req.body;
    const { data: despesa, error } = await supabase
        .from('despesas')
        .insert([{ descricao, valor, data }])
        .select();

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(201).json(despesa);
});

// Rota para buscar todas as despesas
app.get('/despesas', async (req, res) => {
    const { data, error } = await supabase
        .from('despesas')
        .select('*');

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(200).json(data);
});

// Rota para excluir uma despesa
app.delete('/despesas/:id', async (req, res) => {
    const { id } = req.params;
    const { error } = await supabase
        .from('despesas')
        .delete()
        .eq('id', id);

    if (error) {
        return res.status(400).json({ error: error.message });
    }
    res.status(200).json({ message: 'Despesa excluída com sucesso' });
});

app.listen(port, () => {
    console.log(`Backend rodando na porta ${port}`);
});