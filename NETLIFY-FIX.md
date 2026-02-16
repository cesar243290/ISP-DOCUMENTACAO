# Corrigir Tela Branca no Netlify

## Problema
A aplicação mostra uma tela branca no Netlify porque as variáveis de ambiente não foram configuradas.

## Solução (Passo a Passo)

### 1. Acesse o painel do Netlify
- Vá para https://app.netlify.com
- Clique no seu site

### 2. Configure as Variáveis de Ambiente
- No menu lateral, clique em **"Site configuration"** (ou "Site settings")
- Clique em **"Environment variables"**
- Clique em **"Add a variable"** ou **"Add environment variables"**

### 3. Adicione estas variáveis:

**Variável 1:**
- Key: `VITE_SUPABASE_URL`
- Value: `https://lrkaukvytfyyqoymozsl.supabase.co`

**Variável 2:**
- Key: `VITE_SUPABASE_ANON_KEY`
- Value: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2F1a3Z5dGZ5eXFveW1venNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTgyNzUsImV4cCI6MjA4NjgzNDI3NX0.NTDSYSTfZWzHdgI0kdoHYelFXLNxjqPuRFOtBREBPDo`

### 4. Faça um novo deploy
- Volte para **"Deploys"**
- Clique em **"Trigger deploy"** → **"Deploy site"**
- Aguarde o build finalizar (geralmente 1-2 minutos)

### 5. Teste o site
Após o deploy, acesse seu site novamente. Deve aparecer a página de login.

---

## Verificação Adicional

Se ainda aparecer tela branca, abra o Console do navegador (F12) e veja se há erros. Os erros mais comuns são:

1. **Erro de CORS**: Verifique se o domínio do Netlify está autorizado no Supabase
2. **Erro 404**: Verifique se o build foi feito corretamente

## Dicas

- As variáveis com prefixo `VITE_` são expostas no código front-end
- Nunca coloque chaves secretas (service role key) em variáveis `VITE_*`
- O Netlify detecta automaticamente que é um projeto Vite e aplica as configurações corretas
