# Script para automatizar o processo de commit e push para o GitHub

# Adiciona todos os arquivos alterados ao stage
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
git commit -m "$commitMessage"

# Envia as alterações para o repositório remoto na branch 'master'
git push origin master

Write-Host "Processo concluído! Os arquivos foram enviados para o GitHub."
