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
| **2. Autenticação real** | Cadastro/login (e-mail+senha, Google, telefone/SMS), verificação, recuperação, middleware de sessão, onboarding gravando empresa | ✅ feito |
| **3. Camada de dados** | Trocar o store local pela leitura/escrita no Supabase, módulo a módulo (obras, RDOs, etc.), mantendo a UI | ✅ feito |
| **4. Storage de mídia** | Upload real de fotos/vídeos e documentos para o Supabase Storage (em vez de base64) | ✅ feito |
| **5. Cobrança (Mercado Pago)** | Assinatura recorrente, checkout, webhook, e **limites de plano aplicados** (RDOs/mês, obras, usuários) | ✅ feito |
| **6. Voz robusta (Whisper)** | Gravação de áudio + transcrição (Whisper/Groq/Gemini) com fallback automático no iPhone/Safari | ✅ feito |
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
2. Copie o **Access Token** (produção) → variável `MERCADOPAGO_ACCESS_TOKEN`.
3. **Webhooks/Notificações**: aponte para `https://SEU-APP/api/billing/webhook`
   e marque o evento de **assinaturas (preapproval)**.
4. Como funciona no app: a tela **Planos** chama `POST /api/billing/checkout`,
   que cria uma **assinatura recorrente (preapproval)** e redireciona o cliente
   para o Mercado Pago (Pix/cartão/boleto). Ao autorizar, o MP chama o webhook,
   que ativa o plano da empresa (`subscriptions` + `companies.plan`) via
   `service_role`. **Sem o token configurado, o checkout entra em modo
   demonstração** (ativa o plano localmente) — o app nunca quebra.
5. **Limites de plano** já são aplicados na UI (obras ativas e RDOs/mês) com base
   em `src/lib/plans.ts` → `PLAN_LIMITS`. Ao estourar o limite, aparece o convite
   de upgrade.

### 3) OpenAI (IA já integrada)
- `OPENAI_API_KEY` (e opcional `OPENAI_MODEL`, `OPENAI_BASE_URL` para Gemini/Groq/etc.).

### 3.1) Voz (transcrição) — resolve o iPhone/Safari
- No Chrome/Android o app usa a Web Speech API (grátis, ao vivo). No **iPhone/Safari**,
  que não têm Web Speech confiável, o app **grava o áudio** e envia para
  `POST /api/ai/transcribe`.
- A transcrição usa, nesta ordem: provedor dedicado (`TRANSCRIBE_API_KEY` /
  `TRANSCRIBE_BASE_URL` / `TRANSCRIBE_MODEL`) → OpenAI Whisper (`OPENAI_API_KEY`) →
  Gemini nativo (detectado pela base `generativelanguage`).
- **Dica barata/rápida:** use o Whisper do **Groq** (compatível com OpenAI):
  `TRANSCRIBE_BASE_URL=https://api.groq.com/openai/v1`,
  `TRANSCRIBE_MODEL=whisper-large-v3`, `TRANSCRIBE_API_KEY=<sua chave Groq>`.
- Sem nenhuma chave de transcrição, o microfone no iPhone informa que a transcrição
  está indisponível e o usuário digita normalmente (o app não quebra).

### 4) Variáveis no Vercel
Variáveis usadas pelo código (defina no Vercel):
```
# IA (RDO). Sem isso, cai no motor local determinístico.
OPENAI_API_KEY, OPENAI_MODEL, OPENAI_BASE_URL

# Voz/transcrição (opcional; resolve iPhone/Safari). Sem isso, o iPhone digita.
TRANSCRIBE_API_KEY, TRANSCRIBE_BASE_URL, TRANSCRIBE_MODEL

# Supabase (banco/auth/storage). Sem isso, o app roda em modo demo local.
NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY   # usado só no webhook (server)

# Cobrança. Sem o token, o checkout entra em modo demonstração.
MERCADOPAGO_ACCESS_TOKEN

# URL pública do app (back_url do checkout). Ex.: https://obrareport.vercel.app
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
