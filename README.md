# ObraReport IA

SaaS brasileiro de **Diário de Obra (RDO)** que transforma **voz, texto, fotos e respostas
simples** em relatórios profissionais — e consolida tudo em um **Relatório Final da Obra**.

> "Fale o que aconteceu na obra. A IA transforma em RDO profissional, organiza fotos e vídeos,
> e no fim gera o relatório completo da obra."

Feito para construtoras, empreiteiros, engenheiros, arquitetos, mestres de obra, energia solar,
pintura, drywall, elétrica, climatização, manutenção e prestadores de serviço em campo.

## Principais recursos

- **4 modos de criação de RDO**: por **voz** (Web Speech API), por **texto livre**, por
  **perguntas guiadas** e **manual**.
- **Assistente RDO IA** — motor que extrai horários, equipe, atividades, materiais,
  equipamentos, ocorrências, solicitações, pendências e gastos do relato. Não inventa fatos:
  marca campos faltantes e gera perguntas complementares.
- **Checklist Inteligente** — pontua a completude do RDO (incompleto → excelente) e indica o
  que falta para deixá-lo profissional.
- **Fotos e vídeos** (antes/durante/depois), galeria e linha do tempo da obra.
- **Assinatura eletrônica** simples (supervisor e cliente) com termo de aceite.
- **PDF profissional** do RDO diário e **Relatório Final consolidado** da obra (com opções
  de incluir/ocultar gastos, vídeos, ocorrências e selecionar fotos).
- Módulos: **Obras, Tarefas (Kanban), Equipe, Cartão de ponto, Materiais, Equipamentos,
  Checklists, Ocorrências, Gastos (com gráficos), Contatos, Insights, Planos, Configurações,
  Painel admin**.
- **PWA** mobile-first, com menu inferior e botão central "Criar RDO". Dark mode.
- **LGPD**: dados isolados por empresa, política de privacidade e termos, exclusão de dados.

## Stack

- **Next.js 16** (App Router) + **TypeScript**
- **TailwindCSS v4** + **Lucide** (ícones) + **Recharts** (gráficos)
- **Zustand** + `persist` (camada de dados local-first em `localStorage`)
- **jsPDF** + **jspdf-autotable** (geração de PDF no cliente)
- Pronto para **Vercel**

## Como rodar

```bash
npm install
npm run dev        # http://localhost:3000
```

- Na tela de login, use **"Entrar no modo demonstração"** para carregar dados de exemplo
  (empresa AKS Enterprise, obra do Shopping Vitória, 5 RDOs, equipe, gastos, ocorrências).
- Ou **crie uma conta** e siga o onboarding.

```bash
npm run build && npm run start   # build de produção
npm run lint                     # análise estática
```

## Arquitetura

```
src/
  app/
    page.tsx                 # landing page pública
    login | register | recuperar-senha | onboarding | privacidade | termos
    api/ai/route.ts          # IA: usa OpenAI se OPENAI_API_KEY existir; senão, motor simulado
    app/                     # área autenticada (AppShell: sidebar + bottom nav mobile)
      page.tsx               # dashboard
      obras/ ...             # lista, criação, detalhe (abas) e relatório final
      rdo/novo | rdo/[id]    # criação (voz/texto/perguntas/manual) e visualização
      tarefas | equipe | ponto | fotos | materiais | equipamentos |
      gastos | checklists | ocorrencias | contatos | insights |
      relatorios | planos | config | admin
  components/                # ui.tsx, app-shell, rdo-editor, signature-pad, status, brand
  lib/
    types.ts                 # modelo de dados (reflete as tabelas previstas para o Supabase)
    store.ts                 # Zustand (estado + CRUD + persistência)
    seed.ts                  # dados de demonstração
    ai/engine.ts             # Assistente RDO IA (parser PT-BR), checklist e relatório final
    pdf.ts                   # geração de PDF (RDO diário e relatório final)
    rdo.ts | utils.ts | useSpeech.ts
```

### Dados e IA

Esta versão é **local-first**: o estado é persistido no `localStorage` por uma camada de
repositório (`store.ts`) cuja modelagem (`types.ts`) já reflete as tabelas planejadas para
**Supabase/PostgreSQL** (`companies`, `projects`, `daily_reports`, `report_photos`, etc.),
facilitando a migração futura para banco real, Supabase Auth e Storage.

A IA roda em **modo simulado** por padrão (parser determinístico em português, 100% offline).
Para usar **OpenAI**, defina `OPENAI_API_KEY` (e opcionalmente `OPENAI_MODEL`); a rota
`/api/ai` passa a chamar a OpenAI usando o mesmo schema de saída (`AiRdoResult`).

```bash
# .env.local (opcional)
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini
```

## Fluxo principal

Empresa → Obra → Criar RDO → Voz/Texto/Perguntas → IA organiza → Sistema aponta faltantes →
Usuário revisa → Fotos/Vídeos/Gastos → Assinatura → PDF diário → **Relatório Final da Obra**.
