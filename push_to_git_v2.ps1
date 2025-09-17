# Script para automatizar o processo de commit e push para o GitHub

# ---
# PERGUNTA AO USUÁRIO
# ---
Write-Host "Este é o primeiro envio deste projeto para o GitHub? (S/N)"
$isFirstPush = Read-Host

# ---
# LÓGICA DO SCRIPT
# ---
if ($isFirstPush.ToUpper() -eq "S") {
    # ---
    # BLOCO DE COMANDOS PARA O PRIMEIRO ENVIO
    # ---
    Write-Host "---"
    Write-Host "Configuração inicial para o primeiro envio ao GitHub."
    Write-Host " "
    Write-Host "Lembrete Importante: Por favor, crie primeiro o repositório vazio no GitHub."
    Write-Host "O script só consegue enviar arquivos para um repositório que já existe."
    Write-Host " "

    # Solicita o nome do repositório
    Write-Host "Por favor, digite o nome do repositório a ser criado no GitHub:"
    $repoName = Read-Host

    # Informa o nome de usuário do GitHub
    $githubUser = "Waldeckgil"
    Write-Host "O seu usuário do GitHub é: $githubUser"

    # Inicializa o repositório Git localmente
    Write-Host "Executando: git init"
    git init

    # Conecta o repositório local ao repositório remoto no GitHub
    Write-Host "Executando: git remote add origin https://github.com/$githubUser/$repoName.git"
    git remote add origin "https://github.com/$githubUser/$repoName.git"

    Write-Host "Configuração inicial concluída."
    Write-Host "---"

} else {
    # ---
    # BLOCO DE COMANDOS PARA ENVIOS SUBSEQUENTES
    # ---
    Write-Host "---"
    Write-Host "Iniciando processo de commit e push para o repositório existente."
}

# ---
# BLOCO DE COMANDOS PARA COMIT E PUSH (COMUM AOS DOIS CENÁRIOS)
# ---

# Remove o arquivo .env do cache do Git para que ele não seja rastreado
Write-Host "Executando: git rm --cached .env"
git rm --cached .env

# Adiciona todos os arquivos alterados ao stage
Write-Host "Executando: git add ."
git add .

# Solicita a mensagem do commit
Write-Host "Digite a mensagem do commit:"
$commitMessage = Read-Host

# Verifica se a mensagem de commit não está vazia
if ([string]::IsNullOrEmpty($commitMessage)) {
    Write-Host "Mensagem de commit não pode ser vazia. O script foi abortado."
    exit
}

# Realiza o commit com a mensagem fornecida
Write-Host "Executando: git commit -m `"$commitMessage`""
git commit -m "$commitMessage"

# Envia as alterações para o repositório remoto na branch 'main'
Write-Host "Executando: git push -u origin main"
git push -u origin main

Write-Host "---"
Write-Host "Processo de envio para o GitHub concluído com sucesso!"