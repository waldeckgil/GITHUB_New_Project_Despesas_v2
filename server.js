// Importa o Express, o Supabase SDK e o dotenv
require('dotenv').config();
const express = require('express');
const { createClient } = require('@supabase/supabase-js');
const cors = require('cors');

// Inicializa o Express
const app = express();
const port = process.env.PORT || 4000;

// Middleware para processar requisições JSON e permitir CORS
app.use(express.json());
app.use(cors());

// --- Configuração do Supabase usando variáveis de ambiente ou chaves diretas ---
const supabaseUrl = 'https://yyayfhfgowguqzvpnghp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inl5YXlmaGZnb3dndXF6dnBuZ2hwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTYwNDAwNjYsImV4cCI6MjA3MTYxNjA2Nn0.LmEfxJbEQh0lRCthTiIdJlZbojHG6VORWz9B76zEb-s';
const supabase = createClient(supabaseUrl, supabaseKey);

// Defina a URL do seu frontend no Netlify como origem permitida
//const netlifyUrl = 'https://comforting-maamoul-8e28f7.netlify.app';
  const netlifyUrl = 'https://projeto0002.netlify.app';



// Middleware para verificar o token de autenticação
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) {
        return res.status(401).json({ error: 'Token de autenticação não fornecido' });
    }
    
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
        return res.status(401).json({ error: 'Token inválido' });
    }
    
    req.user = user; // Anexa o objeto do usuário à requisição
    next();
};

// --- Rotas de Autenticação ---
app.post('/cadastro', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email,
            password: password,
        });

        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json({ message: 'Usuário cadastrado com sucesso!', user: data.user });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email,
            password: password,
        });

        if (error) return res.status(401).json({ error: 'Credenciais inválidas' });
        res.status(200).json({ message: 'Login bem-sucedido!', session: data.session });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// --- Rotas para as Despesas (Protegidas por autenticação) ---
app.post('/despesas', authMiddleware, async (req, res) => {
    const { descricao, valor, tipo, categoria } = req.body;
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('despesas_v2')
            .insert([{ descricao, valor, tipo, categoria, user_id: userId }])
            .select();

        if (error) return res.status(400).json({ error: error.message });
        res.status(201).json({ message: 'Transação adicionada com sucesso!', data });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.get('/despesas', authMiddleware, async (req, res) => {
    const userId = req.user.id;
    try {
        const { data, error } = await supabase
            .from('despesas_v2')
            .select('*')
            .eq('user_id', userId);

        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json(data);
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.delete('/despesas/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    try {
        const { error } = await supabase
            .from('despesas_v2')
            .delete()
            .eq('id', id)
            .eq('user_id', userId);

        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json({ message: 'Transação excluída com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

app.delete('/despesas/periodo', authMiddleware, async (req, res) => {
    const { data_inicio, data_fim } = req.body;
    const userId = req.user.id;
    try {
        const { error } = await supabase
            .from('despesas_v2')
            .delete()
            .eq('user_id', userId)
            .gte('created_at', data_inicio)
            .lte('created_at', data_fim);

        if (error) return res.status(400).json({ error: error.message });
        res.status(200).json({ message: 'Período de transações excluído com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro no servidor' });
    }
});

// --- Rotas de Teste (mantidas para sua conveniência) ---
app.get('/', (req, res) => {
  res.send('Bem-vindo ao backend do Finance Control!');
});

app.get('/test-supabase', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('despesas_v2')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Erro ao testar a conexão com o Supabase:', error);
      return res.status(500).json({ message: 'Erro ao conectar ao Supabase', error });
    }

    res.status(200).json({ message: 'Conexão com o Supabase bem-sucedida!', data });
  } catch (err) {
    res.status(500).json({ error: 'Erro interno no servidor' });
  }
});

// --- Inicia o servidor ---
app.listen(port, () => {
  console.log(`Servidor rodando em http://localhost:${port}`);
});