"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { useStore } from "@/lib/store";
import { RdoEditor } from "@/components/rdo-editor";
import { SignaturePad } from "@/components/signature-pad";
import { PageHeader } from "@/components/page";
import { Card, CardHeader, Button, Badge, Modal, Field, Input, Select, useToast, EmptyState, Progress } from "@/components/ui";
import { RdoStatusBadge } from "@/components/status";
import { Avatar } from "@/components/brand";
import { evaluateCompleteness } from "@/lib/ai/engine";
import { generateRdoPdf, embedReportImages } from "@/lib/pdf";
import { getClientVisibility, CLIENT_VISIBILITY_SECTIONS } from "@/lib/visibility";
import { formatBRL, formatDateBR, uid, nowISO } from "@/lib/utils";
import { RDO_STATUS_LABELS, ROLE_LABELS, type RdoStatus, type Signature, type DailyReport } from "@/lib/types";
import {
  Pencil, FileDown, Share2, PenLine, Save, Users, Hammer, AlertTriangle,
  ListTodo, Package, Camera, FileText, MessageCircle, MessageSquare, Mail, Link2, X,
  CheckCircle2, Sparkles, Wallet, ShieldCheck, Trash2,
} from "lucide-react";

export default function RdoViewPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { show, node } = useToast();
  const report = useStore((s) => s.reports.find((r) => r.id === id));
  const projects = useStore((s) => s.projects);
  const company = useStore((s) => s.company);
  const team = useStore((s) => s.team);
  const updateReport = useStore((s) => s.updateReport);
  const deleteReport = useStore((s) => s.deleteReport);
  const isClient = useStore((s) => s.user.role === "client");

  const [editing, setEditing] = React.useState(false);
  const [signOpen, setSignOpen] = React.useState(false);
  const [signLocked, setSignLocked] = React.useState(false);
  const [shareOpen, setShareOpen] = React.useState(false);
  const [pdfChoiceOpen, setPdfChoiceOpen] = React.useState(false);

  if (!report) {
    return <EmptyState title="RDO não encontrado" description="Este relatório pode ter sido removido." action={<Button onClick={() => router.push("/app")}>Voltar ao início</Button>} />;
  }
  const project = projects.find((p) => p.id === report.projectId);
  const teamNames = team.filter((t) => t.projectId === report.projectId || !t.projectId).map((t) => t.name);
  const completeness = evaluateCompleteness(report);

  // Política de visibilidade do contratante. Para o time interno, vis não filtra
  // (vê tudo). Para o contratante, esconde as seções sensíveis.
  const vis = getClientVisibility(company);
  const showOcc = !isClient || vis.ocorrencias;
  const showPending = !isClient || vis.pendencias;
  const occLines = showOcc ? [...report.occurrences, ...report.impediments] : [];
  const pendingLines = showPending ? report.pending : [];
  const hiddenLabels = CLIENT_VISIBILITY_SECTIONS.filter((s) => !vis[s.key]).map((s) => s.label);

  // PDF: versão do contratante (filtrada) quando for o cliente ou ao compartilhar.
  // Baixa as fotos do Storage para base64 antes (jsPDF não embute URL remota).
  async function downloadPdf(forClient = isClient) {
    if (!project) return;
    show("Gerando PDF…");
    const reportForPdf = await embedReportImages(report!);
    const doc = generateRdoPdf(reportForPdf, project, company, forClient ? vis : undefined);
    doc.save(`RDO-${report!.number}-${project.name.slice(0, 20)}.pdf`);
    show("PDF gerado!");
  }

  // Compartilha o ARQUIVO PDF (WhatsApp, etc.) via Web Share API do celular.
  // Sempre a versão do contratante. Sem suporte, cai no download.
  async function sharePdf() {
    if (!project) return;
    show("Preparando PDF…");
    const reportForPdf = await embedReportImages(report!);
    const doc = generateRdoPdf(reportForPdf, project, company, vis);
    const blob = doc.output("blob") as Blob;
    const file = new File([blob], `RDO-${report!.number}-${project.name.slice(0, 20)}.pdf`, { type: "application/pdf" });
    const nav = navigator as Navigator & { canShare?: (d: { files: File[] }) => boolean };
    if (nav.canShare && nav.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: `RDO #${report!.number}`, text: `RDO #${report!.number} — ${project.name}` });
        return;
      } catch { /* usuário cancelou ou falhou → cai no download */ }
    }
    doc.save(file.name);
    show("PDF baixado (compartilhamento direto indisponível neste aparelho).");
  }

  if (editing) {
    return (
      <div>
        {node}
        <div className="flex items-center justify-between mb-4">
          <Button variant="ghost" onClick={() => setEditing(false)}><X size={16} /> Cancelar</Button>
          <Button onClick={() => { setEditing(false); show("RDO atualizado!"); }}><Save size={16} /> Salvar alterações</Button>
        </div>
        <RdoEditor draft={report} onChange={(patch) => updateReport(report.id, patch)} teamSuggestions={teamNames} />
      </div>
    );
  }

  return (
    <div>
      {node}
      <PageHeader
        title={`RDO #${report.number}`}
        description={`${project?.name || ""} • ${formatDateBR(report.date)}`}
        backHref={project ? `/app/obras/${project.id}` : "/app"}
        action={
          <div className="flex gap-2 flex-wrap">
            {isClient ? (
              <Button variant="outline" size="sm" onClick={() => { setSignLocked(true); setSignOpen(true); }} disabled={report.status === "aprovado"}>
                <ShieldCheck size={15} /> {report.status === "aprovado" ? "Aprovado" : "Aprovar / assinar"}
              </Button>
            ) : (
              <>
                <Button variant="outline" size="sm" onClick={() => setEditing(true)}><Pencil size={15} /> Editar</Button>
                <Button variant="outline" size="sm" onClick={() => { setSignLocked(false); setSignOpen(true); }}><PenLine size={15} /> Assinar</Button>
                <Button variant="outline" size="sm" onClick={() => setShareOpen(true)}><Share2 size={15} /> Compartilhar</Button>
              </>
            )}
            <Button size="sm" onClick={() => (isClient ? downloadPdf() : setPdfChoiceOpen(true))}><FileDown size={15} /> PDF</Button>
          </div>
        }
      />

      {/* Barra de status */}
      <Card className="p-4 mb-5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          <RdoStatusBadge status={report.status} />
          <Badge tone="neutral">Modo: {report.createMode}</Badge>
          <span className="text-sm text-muted">{report.arrival || "—"} às {report.departure || "—"}</span>
        </div>
        {!isClient && (
          <Select value={report.status} onChange={(e) => updateReport(report.id, { status: e.target.value as RdoStatus })} className="w-48">
            {Object.entries(RDO_STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        )}
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          {report.rawInput && !isClient && (
            <Card className="p-4 bg-brand-soft border-brand/20">
              <p className="text-xs font-semibold uppercase tracking-wide text-brand-dark flex items-center gap-1.5 mb-1"><Sparkles size={12} /> Relato original (voz/texto)</p>
              <p className="text-sm text-foreground/80 italic">“{report.rawInput}”</p>
            </Card>
          )}

          <Card>
            <CardHeader title="Resumo executivo" icon={<FileText size={18} />} />
            <div className="p-4 text-sm">{report.executiveSummary || <span className="text-muted">Sem resumo.</span>}</div>
          </Card>

          {(!isClient || vis.equipe) && (
            <Card>
              <CardHeader title="Equipe presente" icon={<Users size={18} />} />
              <div className="p-4 flex flex-wrap gap-2">
                {report.team.length === 0 ? <span className="text-muted text-sm">Nenhum membro.</span> :
                  report.team.map((t, i) => (
                    <Badge key={i} tone={t.present ? "success" : "neutral"}>{t.name}{t.role ? ` • ${t.role}` : ""}</Badge>
                  ))}
              </div>
            </Card>
          )}

          <Card>
            <CardHeader title="Atividades executadas" icon={<Hammer size={18} />} />
            <div className="divide-y divide-border">
              {report.activities.length === 0 ? <p className="p-4 text-sm text-muted">Nenhuma atividade.</p> :
                report.activities.map((a) => (
                  <div key={a.id} className="p-3.5 flex items-start gap-3">
                    <Badge tone={a.status === "concluida" ? "success" : a.status === "parcial" ? "warning" : "danger"}>
                      {a.status === "concluida" ? "Concluída" : a.status === "parcial" ? "Parcial" : "Não exec."}
                    </Badge>
                    <span className="text-sm flex-1">{a.description}</span>
                  </div>
                ))}
            </div>
          </Card>

          {(report.materials.length > 0 || report.equipment.length > 0) && (
            <Card>
              <CardHeader title="Materiais e equipamentos" icon={<Package size={18} />} />
              <div className="p-4 flex flex-wrap gap-2">
                {report.materials.map((m) => <Badge key={m.id} tone="info">{m.name}{m.quantity ? ` (${m.quantity})` : ""}</Badge>)}
                {report.equipment.map((e) => <Badge key={e.id} tone="brand">{e.name}{e.quantity ? ` (${e.quantity})` : ""}</Badge>)}
              </div>
            </Card>
          )}

          {(occLines.length > 0 || report.clientRequests.length > 0) && (
            <Card>
              <CardHeader title="Ocorrências e solicitações" icon={<AlertTriangle size={18} />} />
              <div className="p-4 space-y-1.5 text-sm">
                {occLines.map((o, i) => <p key={i} className="flex gap-2"><span className="text-danger">•</span> {o}</p>)}
                {report.clientRequests.map((o, i) => <p key={`c${i}`} className="flex gap-2"><span className="text-info">•</span> Cliente: {o}</p>)}
              </div>
            </Card>
          )}

          <MediaGallery media={report.media} />

          {report.expenses.length > 0 && (!isClient || vis.gastos) && (
            <Card>
              <CardHeader title="Gastos do dia" icon={<Wallet size={18} />} />
              <div className="divide-y divide-border">
                {report.expenses.map((e) => (
                  <div key={e.id} className="p-3 flex items-center justify-between text-sm">
                    <span>{e.description} <Badge>{e.category}</Badge></span>
                    <span className="font-medium">{formatBRL(e.amount)}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {(pendingLines.length > 0 || report.nextDayPlan.length > 0) && (
            <Card>
              <CardHeader title="Pendências e próximos passos" icon={<ListTodo size={18} />} />
              <div className="p-4 space-y-1.5 text-sm">
                {[...pendingLines, ...report.nextDayPlan].map((p, i) => <p key={i} className="flex gap-2"><span className="text-brand">→</span> {p}</p>)}
              </div>
            </Card>
          )}

          <CommentsCard report={report} />
        </div>

        {/* Sidebar */}
        <div className="space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1"><Sparkles size={18} className="text-brand" /><h3 className="font-semibold">Qualidade do RDO</h3></div>
            <div className="mt-3 flex items-end justify-between">
              <Badge tone={completeness.score >= 80 ? "success" : "warning"}>{completeness.levelLabel}</Badge>
              <span className="text-2xl font-bold">{completeness.score}%</span>
            </div>
            <div className="mt-2"><Progress value={completeness.score} tone={completeness.score >= 80 ? "success" : "warning"} /></div>
            <p className="text-sm text-muted mt-3">{completeness.message}</p>
          </Card>

          <Card>
            <CardHeader title="Assinaturas" icon={<PenLine size={18} />} />
            <div className="p-4 space-y-3">
              {report.signatures.length === 0 ? (
                <EmptyState title="Sem assinaturas" description="Colete a assinatura do supervisor e do cliente." />
              ) : report.signatures.map((s) => (
                <div key={s.id} className="flex items-center gap-3">
                  {s.dataUrl ? <img src={s.dataUrl} alt="assinatura" className="h-10 w-24 object-contain border border-border rounded" /> :
                    <div className="h-10 w-24 border border-border rounded flex items-center justify-center text-xs text-muted">assinado</div>}
                  <div>
                    <p className="text-sm font-medium capitalize">{s.role}</p>
                    <p className="text-xs text-muted">{s.name} • {formatDateBR(s.signedAt)}</p>
                  </div>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => { setSignLocked(isClient); setSignOpen(true); }}>
                <PenLine size={15} /> {isClient ? "Aprovar / assinar" : "Adicionar assinatura"}
              </Button>
            </div>
          </Card>

          {!isClient && (
            <Button variant="ghost" className="w-full text-danger" onClick={() => { if (confirm("Excluir este RDO?")) { deleteReport(report.id); router.push("/app"); } }}>
              Excluir RDO
            </Button>
          )}
        </div>
      </div>

      <SignModal key={`sign-${signLocked}`} open={signOpen} onClose={() => setSignOpen(false)} defaultName={report.supervisor}
        lockedRole={signLocked ? "cliente" : undefined}
        onSign={(sig) => {
          updateReport(report.id, {
            signatures: [...report.signatures.filter((s) => s.role !== sig.role), sig],
            status: sig.role === "cliente"
              ? "aprovado"
              : (report.status === "rascunho" || report.status === "incompleto" ? "assinado" : report.status),
          });
          setSignOpen(false);
          show(sig.role === "cliente" ? "RDO aprovado e assinado!" : "Assinatura registrada!");
        }} />

      <ShareModal open={shareOpen} onClose={() => setShareOpen(false)} report={report} project={project?.name || ""}
        onPdf={() => downloadPdf(true)} onSharePdf={sharePdf} onShared={() => { updateReport(report.id, { status: report.status === "assinado" || report.status === "aprovado" ? report.status : "enviado" }); show("Marcado como enviado."); }} />

      <PdfChoiceModal open={pdfChoiceOpen} onClose={() => setPdfChoiceOpen(false)}
        onFull={() => downloadPdf(false)} onClient={() => downloadPdf(true)} hiddenLabels={hiddenLabels} />
    </div>
  );
}

function MediaGallery({ media }: { media: { id: string; kind: string; phase: string; caption: string; color?: string; dataUrl?: string }[] }) {
  if (media.length === 0) return null;
  return (
    <Card>
      <CardHeader title="Fotos e vídeos" icon={<Camera size={18} />} subtitle={`${media.length} mídia(s)`} />
      <div className="p-4 grid grid-cols-3 sm:grid-cols-4 gap-2">
        {media.map((m) => (
          <div key={m.id} className="rounded-xl overflow-hidden aspect-square border border-border relative">
            {m.dataUrl ? <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover" /> :
              <div className="w-full h-full flex items-center justify-center" style={{ background: m.color }}>
                {m.kind === "video" ? <span className="text-white text-2xl">▶</span> : <Camera size={18} className="text-white/80" />}
              </div>}
            <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white rounded px-1 capitalize">{m.phase}</span>
            <span className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-white px-1 py-0.5 truncate">{m.caption}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

function CommentsCard({ report }: { report: DailyReport }) {
  const user = useStore((s) => s.user);
  const addRdoComment = useStore((s) => s.addRdoComment);
  const deleteRdoComment = useStore((s) => s.deleteRdoComment);
  const [text, setText] = React.useState("");
  const comments = report.comments ?? [];

  function submit() {
    const t = text.trim();
    if (!t) return;
    addRdoComment(report.id, { authorName: user.name, authorRole: user.role, text: t });
    setText("");
  }

  return (
    <Card>
      <CardHeader title="Observações e comentários" icon={<MessageSquare size={18} />}
        subtitle="Conversa entre a executora e o contratante sobre este RDO" />
      <div className="p-4 space-y-4">
        {comments.length === 0 ? (
          <p className="text-sm text-muted">Nenhum comentário ainda. Registre observações sobre o que foi lançado.</p>
        ) : (
          <div className="space-y-3">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <Avatar name={c.authorName} size={32} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm flex items-center gap-2 flex-wrap">
                    <span className="font-medium">{c.authorName}</span>
                    <Badge tone={c.authorRole === "client" ? "info" : "neutral"}>{ROLE_LABELS[c.authorRole]}</Badge>
                  </p>
                  <p className="text-sm text-foreground/90 mt-0.5 whitespace-pre-wrap">{c.text}</p>
                  <p className="text-xs text-muted mt-0.5">{formatDateBR(c.createdAt)}</p>
                </div>
                {c.authorName === user.name && (
                  <button onClick={() => deleteRdoComment(report.id, c.id)} className="text-muted hover:text-danger p-1 self-start"><Trash2 size={14} /></button>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex gap-2">
          <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2}
            placeholder="Escreva uma observação…"
            className="flex-1 rounded-xl border border-border bg-transparent px-3 py-2 text-sm resize-none focus:outline-none focus:border-brand" />
          <Button onClick={submit} disabled={!text.trim()} className="self-end">Enviar</Button>
        </div>
      </div>
    </Card>
  );
}

function SignModal({ open, onClose, onSign, defaultName, lockedRole }: {
  open: boolean; onClose: () => void; onSign: (s: Signature) => void; defaultName: string; lockedRole?: Signature["role"];
}) {
  const [role, setRole] = React.useState<Signature["role"]>(lockedRole ?? "cliente");
  const [name, setName] = React.useState("");
  const [document, setDocument] = React.useState("");
  const [dataUrl, setDataUrl] = React.useState("");
  const [accepted, setAccepted] = React.useState(false);

  function changeRole(r: Signature["role"]) {
    setRole(r);
    if (r === "supervisor" && !name) setName(defaultName);
  }

  return (
    <Modal open={open} onClose={onClose} title={lockedRole === "cliente" ? "Aprovar e assinar RDO" : "Assinatura eletrônica"} wide
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button disabled={!name || !accepted} onClick={() => onSign({ id: uid("sig"), role, name, document, dataUrl, signedAt: nowISO(), accepted })}>
            <CheckCircle2 size={16} /> {lockedRole === "cliente" ? "Aprovar e assinar" : "Confirmar assinatura"}
          </Button>
        </>
      }>
      <div className="space-y-4">
        {lockedRole ? (
          <Field label="Quem está assinando">
            <div className="rounded-xl border border-border px-3 py-2.5 text-sm bg-black/5 dark:bg-white/5">
              {lockedRole === "cliente" ? "Cliente / Contratante" : lockedRole}
            </div>
          </Field>
        ) : (
          <Field label="Quem está assinando">
            <Select value={role} onChange={(e) => changeRole(e.target.value as Signature["role"])}>
              <option value="cliente">Cliente / Contratante</option>
              <option value="supervisor">Supervisor / Responsável</option>
              <option value="responsavel">Responsável técnico</option>
              <option value="testemunha">Testemunha</option>
            </Select>
          </Field>
        )}
        <Field label="Nome completo"><Input value={name} onChange={(e) => setName(e.target.value)} /></Field>
        <Field label="Documento (opcional)"><Input value={document} onChange={(e) => setDocument(e.target.value)} placeholder="CPF/RG" /></Field>
        <Field label="Assinatura"><SignaturePad onChange={setDataUrl} /></Field>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" checked={accepted} onChange={(e) => setAccepted(e.target.checked)} className="mt-0.5" />
          <span className="text-muted">Declaro que visualizei as informações constantes neste relatório e confirmo ciência sobre os serviços, ocorrências, fotos e pendências nele registradas.</span>
        </label>
      </div>
    </Modal>
  );
}

// Escolha da versão do PDF (uso interno): completa × versão do contratante.
function PdfChoiceModal({ open, onClose, onFull, onClient, hiddenLabels }: {
  open: boolean; onClose: () => void; onFull: () => void; onClient: () => void; hiddenLabels: string[];
}) {
  return (
    <Modal open={open} onClose={onClose} title="Gerar PDF">
      <div className="space-y-2">
        <button onClick={() => { onFull(); onClose(); }}
          className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand text-left">
          <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center shrink-0"><FileText size={20} /></div>
          <div>
            <p className="font-medium">Versão completa (uso interno)</p>
            <p className="text-sm text-muted">Todas as seções: equipe, ocorrências, gastos, pendências e observações.</p>
          </div>
        </button>
        <button onClick={() => { onClient(); onClose(); }}
          className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand text-left">
          <div className="h-10 w-10 rounded-xl bg-success-soft text-success flex items-center justify-center shrink-0"><ShieldCheck size={20} /></div>
          <div>
            <p className="font-medium">Versão para o contratante</p>
            <p className="text-sm text-muted">
              {hiddenLabels.length ? `Oculta: ${hiddenLabels.join(", ")}.` : "Política atual não oculta nenhuma seção."}
            </p>
          </div>
        </button>
      </div>
      <p className="text-xs text-muted mt-3">Ajuste o que o contratante vê em Configurações → “O que o contratante enxerga”.</p>
    </Modal>
  );
}

function ShareModal({ open, onClose, report, project, onPdf, onSharePdf, onShared }: {
  open: boolean; onClose: () => void; report: { number: number; executiveSummary: string }; project: string; onPdf: () => void; onSharePdf: () => void; onShared: () => void;
}) {
  const text = `📋 *RDO #${report.number}* — ${project}\n\n${report.executiveSummary}\n\nGerado com ObraReport IA.`;
  const link = typeof window !== "undefined" ? window.location.href : "";
  return (
    <Modal open={open} onClose={onClose} title="Compartilhar relatório">
      <div className="space-y-2">
        <button onClick={() => { onShared(); onSharePdf(); }} className="w-full flex items-center gap-3 rounded-xl border border-brand bg-brand-soft p-3 text-left">
          <div className="h-10 w-10 rounded-xl bg-brand text-white flex items-center justify-center"><Share2 size={20} /></div>
          <div><p className="font-medium">Enviar o PDF (WhatsApp, e-mail…)</p><p className="text-sm text-muted">Compartilha o arquivo direto do celular</p></div>
        </button>
        <a href={`https://wa.me/?text=${encodeURIComponent(text + "\n" + link)}`} target="_blank" rel="noopener" onClick={onShared}
          className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand">
          <div className="h-10 w-10 rounded-xl bg-success-soft text-success flex items-center justify-center"><MessageCircle size={20} /></div>
          <div><p className="font-medium">Enviar pelo WhatsApp</p><p className="text-sm text-muted">Compartilhe o resumo e o link</p></div>
        </a>
        <a href={`mailto:?subject=${encodeURIComponent("RDO #" + report.number + " — " + project)}&body=${encodeURIComponent(text + "\n" + link)}`} onClick={onShared}
          className="flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand">
          <div className="h-10 w-10 rounded-xl bg-info-soft text-info flex items-center justify-center"><Mail size={20} /></div>
          <div><p className="font-medium">Enviar por e-mail</p><p className="text-sm text-muted">Abrir cliente de e-mail</p></div>
        </a>
        <button onClick={() => { navigator.clipboard?.writeText(link); }}
          className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand text-left">
          <div className="h-10 w-10 rounded-xl bg-black/5 dark:bg-white/10 flex items-center justify-center"><Link2 size={20} /></div>
          <div><p className="font-medium">Copiar link</p><p className="text-sm text-muted">Link protegido (visualização)</p></div>
        </button>
        <button onClick={onPdf} className="w-full flex items-center gap-3 rounded-xl border border-border p-3 hover:border-brand text-left">
          <div className="h-10 w-10 rounded-xl bg-brand-soft text-brand-dark flex items-center justify-center"><FileDown size={20} /></div>
          <div><p className="font-medium">Baixar PDF</p><p className="text-sm text-muted">Documento profissional</p></div>
        </button>
      </div>
    </Modal>
  );
}
