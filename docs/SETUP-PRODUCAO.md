# ObraReport IA — Guia de Produção (produto de prateleira)

Decisões: **Supabase** (banco/auth/storage), **Mercado Pago** (Pix+cartão),
login **e-mail+senha / Google / telefone(SMS)**, e **offline-first com sync**.

O app continua funcionando em **modo demo local** enquanto as variáveis de
ambiente não estiverem configuradas. Ao preencher as chaves, ele entra em
**modo produção**.

---

## Roadmap por fases (cada fase é entregue funcionando)

| Fase | Entrega | Status |
|---|---|---|
| **1. Fundação** | Schema do banco + RLS multi-empresa, clientes Supabase, env, este guia | ✅ feito |
| **2. Autenticação real** | Cadastro/login (e-mail+senha, Google, telefone/SMS), verificação, recuperação, middleware de sessão, onboarding gravando empresa | a fazer |
| **3. Camada de dados** | Trocar o store local pela leitura/escrita no Supabase, módulo a módulo (obras, RDOs, etc.), mantendo a UI | a fazer |
| **4. Storage de mídia** | Upload real de fotos/vídeos e documentos para o Supabase Storage (em vez de base64) | a fazer |
| **5. Cobrança (Mercado Pago)** | Assinatura recorrente, checkout, webhook, e **limites de plano aplicados** (RDOs/mês, obras, usuários) | a fazer |
| **6. Voz robusta (Whisper)** | Gravação de áudio + transcrição via OpenAI Whisper (resolve iPhone/Safari) | a fazer |
| **7. Offline-first + sync** | Fila local de alterações e sincronização ao reconectar (PWA instalável) | a fazer |
| **8. Convites & equipe** | Convidar membros e contratantes por e-mail/link, papéis e permissões | a fazer |
| **9. Produção/qualidade** | Monitoramento (Sentry), rate-limit na IA, e-mails transacionais, LGPD (exportar/excluir dados), termos | a fazer |

---

## Passo a passo — o que VOCÊ provisiona

### 1) Supabase
1. Crie um projeto em https://supabase.com (região São Paulo).
2. **SQL Editor** → cole `supabase/migrations/0001_init.sql` → **Run**. Isso cria
   o schema, RLS, triggers de cadastro e os buckets de Storage.
3. **Project Settings → API**: copie `Project URL`, `anon public key` e
   `service_role key`.
4. **Authentication → Providers**:
   - **Email**: ative; ligue "Confirm email" (recomendado).
   - **Google**: ative e cole o Client ID/Secret do Google Cloud (OAuth consent + credenciais).
   - **Phone**: ative e configure um provedor de SMS (ex.: Twilio) com as credenciais.
5. **Authentication → URL Configuration**: Site URL = sua URL do app; adicione as
   Redirect URLs (`https://SEU-APP/auth/callback`).

### 2) Mercado Pago
1. Crie a aplicação em https://www.mercadopago.com.br/developers.
2. Copie o **Access Token** (produção) e a **Public Key**.
3. Configure o webhook apontando para `https://SEU-APP/api/mercadopago/webhook`.

### 3) OpenAI (IA já integrada)
- `OPENAI_API_KEY` (e opcional `OPENAI_MODEL`).

### 4) Variáveis no Vercel
Preencha conforme `.env.example`:
```
OPENAI_API_KEY, OPENAI_MODEL
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
MERCADOPAGO_ACCESS_TOKEN, NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY, MERCADOPAGO_WEBHOOK_SECRET
NEXT_PUBLIC_APP_URL
```
Depois faça **Redeploy**.

---

## Arquitetura (resumo)
- **Multi-empresa (multi-tenant):** cada linha tem `company_id`; o RLS garante que
  um usuário só enxerga dados da própria empresa. O **contratante** (role `client`)
  só vê as obras vinculadas a ele (`client_project_ids`) e pode comentar/aprovar.
- **Cadastro:** um trigger cria empresa + perfil + assinatura (trial 14 dias) no
  primeiro acesso; convites passam `company_id`/`role` nos metadados.
- **Storage:** arquivos no caminho `"<company_id>/..."`, com política de acesso por empresa.
