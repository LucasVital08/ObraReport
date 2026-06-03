import Link from "next/link";
import { Logo } from "@/components/brand";

export const metadata = { title: "Termos de Uso — ObraReport IA" };

export default function TermosPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-surface"><div className="max-w-3xl mx-auto px-4 h-16 flex items-center"><Link href="/"><Logo /></Link></div></header>
      <main className="max-w-3xl mx-auto px-4 py-10">
        <h1 className="text-2xl font-bold mb-4">Termos de Uso</h1>
        <div className="space-y-4 text-sm text-foreground/80 leading-relaxed">
          <p>Ao utilizar o ObraReport IA, você concorda com os termos descritos abaixo.</p>
          <h2 className="font-semibold text-foreground text-base">1. Serviço</h2>
          <p>O ObraReport IA é uma plataforma de gestão de obras, diário de obra (RDO), controle de equipe, gastos, fotos, vídeos e geração de relatórios.</p>
          <h2 className="font-semibold text-foreground text-base">2. Responsabilidade do usuário</h2>
          <p>Você é responsável pela veracidade das informações inseridas. A IA organiza e estrutura o conteúdo fornecido, sem inventar fatos.</p>
          <h2 className="font-semibold text-foreground text-base">3. Assinaturas eletrônicas</h2>
          <p>As assinaturas coletadas têm caráter de assinatura eletrônica simples para fins operacionais e de ciência entre as partes.</p>
          <h2 className="font-semibold text-foreground text-base">4. Planos e pagamento</h2>
          <p>Os planos contratados são cobrados mensalmente conforme a tabela vigente. O cancelamento pode ser solicitado a qualquer momento.</p>
          <h2 className="font-semibold text-foreground text-base">5. Alterações</h2>
          <p>Estes termos podem ser atualizados periodicamente. Notificaremos sobre mudanças relevantes.</p>
        </div>
        <Link href="/" className="inline-block mt-8 text-brand hover:underline">← Voltar ao início</Link>
      </main>
    </div>
  );
}
