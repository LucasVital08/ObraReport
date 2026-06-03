import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = { title: "Política de Privacidade — ObraReport IA" };

export default function PrivacidadePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface"><div className="max-w-3xl mx-auto px-4 h-16 flex items-center"><Link href="/"><Logo /></Link></div></header>
      <main className="max-w-3xl mx-auto px-4 py-10 prose-sm">
        <h1 className="text-2xl font-bold mb-4">Política de Privacidade</h1>
        <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
          <p>O ObraReport IA respeita a sua privacidade e está em conformidade com a Lei Geral de Proteção de Dados (LGPD — Lei nº 13.709/2018).</p>
          <h2 className="font-semibold text-foreground text-base">1. Dados coletados</h2>
          <p>Coletamos dados de cadastro (nome, e-mail, empresa), dados das obras, relatórios, fotos, vídeos e informações de equipe e contatos inseridos por você.</p>
          <h2 className="font-semibold text-foreground text-base">2. Uso dos dados</h2>
          <p>Os dados são utilizados exclusivamente para a prestação do serviço de gestão de obras e geração de relatórios. Cada empresa possui dados isolados.</p>
          <h2 className="font-semibold text-foreground text-base">3. Armazenamento</h2>
          <p>Nesta versão de demonstração, os dados são armazenados localmente no seu navegador. Em produção, são armazenados de forma segura com criptografia.</p>
          <h2 className="font-semibold text-foreground text-base">4. Seus direitos</h2>
          <p>Você pode acessar, corrigir e excluir seus dados a qualquer momento nas Configurações do aplicativo.</p>
          <h2 className="font-semibold text-foreground text-base">5. Contato</h2>
          <p>Em caso de dúvidas, entre em contato com o encarregado de dados da sua empresa.</p>
        </div>
        <Link href="/" className="inline-block mt-8 text-brand hover:underline">← Voltar ao início</Link>
      </main>
    </div>
  );
}
