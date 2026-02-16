# Deploy no Netlify

## Passos para Deploy

1. Acesse [Netlify](https://app.netlify.com/)
2. Clique em "Add new site" > "Deploy manually" ou "Import from Git"
3. Se escolher "Deploy manually":
   - Arraste a pasta `dist` após rodar `npm run build`
4. Se escolher "Import from Git":
   - Conecte seu repositório
   - As configurações já estão no `netlify.toml`

## Variáveis de Ambiente

Após o deploy, configure as variáveis de ambiente no Netlify:

1. Vá em "Site settings" > "Environment variables"
2. Adicione as seguintes variáveis:

```
VITE_SUPABASE_URL=https://lrkaukvytfyyqoymozsl.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imxya2F1a3Z5dGZ5eXFveW1venNsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzEyNTgyNzUsImV4cCI6MjA4NjgzNDI3NX0.NTDSYSTfZWzHdgI0kdoHYelFXLNxjqPuRFOtBREBPDo
```

3. Salve e faça redeploy do site

## Credenciais de Login

**Email**: cloudx2025@gmail.com
**Senha**: Cloudx2025@@

## Problemas Comuns

Se o login não funcionar após o deploy:
1. Verifique se as variáveis de ambiente foram configuradas corretamente
2. Limpe o cache do navegador
3. Verifique se o Supabase está acessível (sem bloqueio de CORS)
