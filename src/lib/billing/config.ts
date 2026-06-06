// Configuração de cobrança (Mercado Pago). Tudo flag-gated: sem o access token,
// a cobrança fica em modo demonstração (o plano é ativado localmente) e o app
// continua funcionando normalmente.
export const MP_ACCESS_TOKEN = process.env.MERCADOPAGO_ACCESS_TOKEN || "";
export const isMercadoPagoEnabled = Boolean(MP_ACCESS_TOKEN);

// URL pública do app (usada nos back_url do checkout). Em produção, defina
// NEXT_PUBLIC_APP_URL; senão caímos na origem da requisição.
export const APP_URL = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");

export const MP_API = "https://api.mercadopago.com";
