# =====================================================
# RESET DE SENHA - SENTINELA AI
# =====================================================
# INSTRUCOES:
# 1. Cole o token JWT abaixo (pegue do LocalStorage do DevTools)
# 2. Execute este script no PowerShell
# =====================================================

$TOKEN = "COLE_SEU_TOKEN_AQUI"
$API   = "https://sentinelaai.com.br/api"

# --- Passo 1: Verificar quem voce eh ---
Write-Host "`n[1/3] Verificando identidade do token..." -ForegroundColor Cyan
try {
    $me = Invoke-RestMethod -Uri "$API/auth/me" -Headers @{ Authorization = "Bearer $TOKEN" } -Method Get
    Write-Host "  Logado como: $($me.email) | Role: $($me.role)" -ForegroundColor Green
} catch {
    Write-Host "  (endpoint /me nao existe, continuando...)" -ForegroundColor Yellow
}

# --- Passo 2: Buscar tenants para descobrir o userId ---
Write-Host "`n[2/3] Buscando userId de sheldonfeitosa@gmail.com..." -ForegroundColor Cyan
$userId = $null
try {
    $tenants = Invoke-RestMethod -Uri "$API/admin/tenants-detailed" -Headers @{ Authorization = "Bearer $TOKEN" } -Method Get
    foreach ($tenant in $tenants) {
        foreach ($user in $tenant.users) {
            if ($user.email -eq "sheldonfeitosa@gmail.com") {
                $userId = $user.id
                Write-Host "  Encontrado! userId=$userId | Nome: $($user.name)" -ForegroundColor Green
            }
        }
    }
} catch {
    Write-Host "  Erro ao buscar tenants: $_" -ForegroundColor Red
}

if ($null -eq $userId) {
    Write-Host "`n  ERRO: Usuario nao encontrado. Verifique se o token tem role SUPER_ADMIN." -ForegroundColor Red
    exit 1
}

# --- Passo 3: Resetar a senha ---
Write-Host "`n[3/3] Resetando senha para sheldonfeitosa@gmail.com..." -ForegroundColor Cyan
$novasenha = "Sentinela@2024"
$body = @{ userId = $userId; newPassword = $novasenha } | ConvertTo-Json

try {
    $result = Invoke-RestMethod `
        -Uri "$API/admin/reset-password" `
        -Method Post `
        -Body $body `
        -ContentType "application/json" `
        -Headers @{ Authorization = "Bearer $TOKEN" }

    Write-Host "`n===============================" -ForegroundColor Green
    Write-Host "  SENHA RESETADA COM SUCESSO!" -ForegroundColor Green
    Write-Host "===============================" -ForegroundColor Green
    Write-Host "  Email: sheldonfeitosa@gmail.com"
    Write-Host "  Nova senha: $novasenha"
    Write-Host "  Login: https://sentinelaai.com.br"
    Write-Host "===============================" -ForegroundColor Green
} catch {
    $err = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
    Write-Host "`n  ERRO ao resetar: $($err.error ?? $_)" -ForegroundColor Red
    Write-Host "  O token pode nao ter permissao de SUPER_ADMIN." -ForegroundColor Yellow
}
