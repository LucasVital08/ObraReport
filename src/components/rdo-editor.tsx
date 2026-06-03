"use client";

import React from "react";
import type { RdoDraft } from "@/lib/rdo";
import type { ActivityStatus, MediaItem, RdoActivity, RdoItem } from "@/lib/types";
import { evaluateCompleteness } from "@/lib/ai/engine";
import { Card, CardHeader, Field, Input, Textarea, Select, Button, Badge, Progress } from "@/components/ui";
import { uid, colorFromString } from "@/lib/utils";
import {
  Plus, X, Clock, Users, Hammer, Package, Wrench, AlertTriangle,
  MessageSquare, ListTodo, FileText, Camera, CheckCircle2, Circle, Sparkles,
} from "lucide-react";

interface Props {
  draft: RdoDraft;
  onChange: (patch: Partial<RdoDraft>) => void;
  teamSuggestions?: string[];
}

const WEATHER = ["Ensolarado", "Parcialmente nublado", "Nublado", "Chuvoso", "Indiferente (obra interna)"];

export function RdoEditor({ draft, onChange, teamSuggestions = [] }: Props) {
  const completeness = evaluateCompleteness({
    ...draft, id: "", companyId: "", number: 0, createdAt: "", updatedAt: "",
  });

  const tone = completeness.score >= 80 ? "success" : completeness.score >= 60 ? "brand" : "warning";

  return (
    <div className="grid lg:grid-cols-3 gap-5">
      <div className="lg:col-span-2 space-y-5">
        {/* Dados gerais */}
        <Card>
          <CardHeader title="Dados gerais" icon={<FileText size={18} />} />
          <div className="p-4 grid sm:grid-cols-2 gap-4">
            <Field label="Data"><Input type="date" value={draft.date} onChange={(e) => onChange({ date: e.target.value })} /></Field>
            <Field label="Responsável"><Input value={draft.responsible} onChange={(e) => onChange({ responsible: e.target.value })} /></Field>
            <Field label="Horário de chegada">
              <div className="relative"><Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="time" value={draft.arrival} onChange={(e) => onChange({ arrival: e.target.value })} className="pl-9" /></div>
            </Field>
            <Field label="Horário de saída">
              <div className="relative"><Clock size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                <Input type="time" value={draft.departure} onChange={(e) => onChange({ departure: e.target.value })} className="pl-9" /></div>
            </Field>
            <Field label="Clima">
              <Select value={draft.weather} onChange={(e) => onChange({ weather: e.target.value })}>
                <option value="">Selecione…</option>
                {WEATHER.map((w) => <option key={w} value={w}>{w}</option>)}
              </Select>
            </Field>
            <Field label="Condição do local"><Input value={draft.siteCondition} onChange={(e) => onChange({ siteCondition: e.target.value })} placeholder="Ex.: área liberada" /></Field>
          </div>
        </Card>

        {/* Equipe */}
        <Card>
          <CardHeader title="Equipe presente" icon={<Users size={18} />} subtitle={`${draft.team.filter((t) => t.present).length} presente(s)`} />
          <div className="p-4 space-y-2">
            {draft.team.map((t, i) => (
              <div key={i} className="flex items-center gap-2">
                <button onClick={() => updateTeam(i, { present: !t.present })}
                  className={t.present ? "text-success" : "text-muted"}>
                  {t.present ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                </button>
                <Input value={t.name} onChange={(e) => updateTeam(i, { name: e.target.value })} placeholder="Nome" className="flex-1" />
                <Input value={t.role || ""} onChange={(e) => updateTeam(i, { role: e.target.value })} placeholder="Função" className="w-32" />
                <button onClick={() => onChange({ team: draft.team.filter((_, j) => j !== i) })} className="text-muted hover:text-danger p-1"><X size={16} /></button>
              </div>
            ))}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button size="sm" variant="outline" onClick={() => onChange({ team: [...draft.team, { name: "", role: "", present: true }] })}>
                <Plus size={14} /> Adicionar membro
              </Button>
              {teamSuggestions.filter((s) => !draft.team.some((t) => t.name === s)).map((s) => (
                <button key={s} onClick={() => onChange({ team: [...draft.team, { name: s, present: true }] })}
                  className="text-xs rounded-full border border-border px-2.5 py-1 text-muted hover:border-brand hover:text-brand">+ {s}</button>
              ))}
            </div>
          </div>
        </Card>

        {/* Atividades */}
        <Card>
          <CardHeader title="Atividades executadas" icon={<Hammer size={18} />} subtitle={`${draft.activities.length} atividade(s)`} />
          <div className="p-4 space-y-2">
            {draft.activities.map((a, i) => (
              <div key={a.id} className="flex items-start gap-2">
                <Select value={a.status} onChange={(e) => updateActivity(i, { status: e.target.value as ActivityStatus })} className="w-32 shrink-0">
                  <option value="concluida">Concluída</option>
                  <option value="parcial">Parcial</option>
                  <option value="nao_executada">Não executada</option>
                </Select>
                <Textarea value={a.description} onChange={(e) => updateActivity(i, { description: e.target.value })} className="flex-1 min-h-10" rows={1} placeholder="Descreva a atividade" />
                <button onClick={() => onChange({ activities: draft.activities.filter((_, j) => j !== i) })} className="text-muted hover:text-danger p-1 mt-2"><X size={16} /></button>
              </div>
            ))}
            <Button size="sm" variant="outline" onClick={() => onChange({ activities: [...draft.activities, { id: uid("act"), description: "", status: "concluida" }] })}>
              <Plus size={14} /> Adicionar atividade
            </Button>
          </div>
        </Card>

        {/* Materiais e equipamentos */}
        <div className="grid sm:grid-cols-2 gap-5">
          <ItemListCard title="Materiais utilizados" icon={<Package size={18} />} items={draft.materials} onSet={(materials) => onChange({ materials })} />
          <ItemListCard title="Equipamentos utilizados" icon={<Wrench size={18} />} items={draft.equipment} onSet={(equipment) => onChange({ equipment })} />
        </div>

        {/* Ocorrências, solicitações, pendências */}
        <StringListCard title="Ocorrências e impedimentos" icon={<AlertTriangle size={18} />} values={draft.occurrences} onSet={(occurrences) => onChange({ occurrences })} placeholder="Descreva uma ocorrência" />
        <StringListCard title="Solicitações do cliente" icon={<MessageSquare size={18} />} values={draft.clientRequests} onSet={(clientRequests) => onChange({ clientRequests })} placeholder="Solicitação do contratante" />
        <StringListCard title="Pendências / próximo dia" icon={<ListTodo size={18} />} values={draft.pending} onSet={(pending) => onChange({ pending })} placeholder="O que ficou pendente" />

        {/* Fotos e vídeos */}
        <MediaCard media={draft.media} onSet={(media) => onChange({ media })} author={draft.responsible} />

        {/* Resumo e observações */}
        <Card>
          <CardHeader title="Resumo executivo e observações" icon={<FileText size={18} />} />
          <div className="p-4 space-y-4">
            <Field label="Resumo executivo do dia">
              <Textarea value={draft.executiveSummary} onChange={(e) => onChange({ executiveSummary: e.target.value })} placeholder="Síntese do que foi realizado no dia" />
            </Field>
            <Field label="Observações gerais">
              <Textarea value={draft.notes} onChange={(e) => onChange({ notes: e.target.value })} placeholder="Observações técnicas, ações do cliente, etc." />
            </Field>
          </div>
        </Card>
      </div>

      {/* Sidebar: Checklist Inteligente */}
      <div className="space-y-5">
        <div className="lg:sticky lg:top-20 space-y-5">
          <Card className="p-5">
            <div className="flex items-center gap-2 mb-1">
              <Sparkles size={18} className="text-brand" />
              <h3 className="font-semibold">Checklist Inteligente</h3>
            </div>
            <p className="text-sm text-muted">Avaliação automática da qualidade do seu RDO.</p>
            <div className="mt-4 flex items-end justify-between">
              <Badge tone={tone === "success" ? "success" : tone === "warning" ? "warning" : "brand"}>{completeness.levelLabel}</Badge>
              <span className="text-2xl font-bold">{completeness.score}%</span>
            </div>
            <div className="mt-2"><Progress value={completeness.score} tone={tone} /></div>
            <p className="text-sm text-muted mt-3">{completeness.message}</p>

            {completeness.missingRequired.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-danger mb-1.5">Campos obrigatórios faltantes</p>
                <ul className="space-y-1">
                  {completeness.missingRequired.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm text-muted"><Circle size={12} className="text-danger" /> {m}</li>
                  ))}
                </ul>
              </div>
            )}
            {completeness.missingRecommended.length > 0 && (
              <div className="mt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-warning mb-1.5">Recomendados</p>
                <ul className="space-y-1">
                  {completeness.missingRecommended.map((m) => (
                    <li key={m} className="flex items-center gap-2 text-sm text-muted"><Circle size={12} className="text-warning" /> {m}</li>
                  ))}
                </ul>
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );

  function updateTeam(i: number, patch: Partial<{ name: string; role: string; present: boolean }>) {
    onChange({ team: draft.team.map((t, j) => (j === i ? { ...t, ...patch } : t)) });
  }
  function updateActivity(i: number, patch: Partial<RdoActivity>) {
    onChange({ activities: draft.activities.map((a, j) => (j === i ? { ...a, ...patch } : a)) });
  }
}

function StringListCard({ title, icon, values, onSet, placeholder }: {
  title: string; icon: React.ReactNode; values: string[]; onSet: (v: string[]) => void; placeholder: string;
}) {
  const [text, setText] = React.useState("");
  return (
    <Card>
      <CardHeader title={title} icon={icon} subtitle={`${values.length} item(ns)`} />
      <div className="p-4 space-y-2">
        {values.map((v, i) => (
          <div key={i} className="flex items-start gap-2 rounded-xl bg-black/5 dark:bg-white/5 p-2.5">
            <span className="flex-1 text-sm">{v}</span>
            <button onClick={() => onSet(values.filter((_, j) => j !== i))} className="text-muted hover:text-danger"><X size={16} /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={text} onChange={(e) => setText(e.target.value)} placeholder={placeholder}
            onKeyDown={(e) => { if (e.key === "Enter" && text.trim()) { onSet([...values, text.trim()]); setText(""); } }} />
          <Button size="icon" variant="outline" onClick={() => { if (text.trim()) { onSet([...values, text.trim()]); setText(""); } }}><Plus size={16} /></Button>
        </div>
      </div>
    </Card>
  );
}

function ItemListCard({ title, icon, items, onSet }: {
  title: string; icon: React.ReactNode; items: RdoItem[]; onSet: (v: RdoItem[]) => void;
}) {
  const [name, setName] = React.useState("");
  const [qty, setQty] = React.useState("");
  return (
    <Card>
      <CardHeader title={title} icon={icon} subtitle={`${items.length} item(ns)`} />
      <div className="p-4 space-y-2">
        {items.map((it, i) => (
          <div key={it.id} className="flex items-center gap-2 rounded-xl bg-black/5 dark:bg-white/5 p-2.5">
            <span className="flex-1 text-sm">{it.name}</span>
            {it.quantity && <Badge>{it.quantity}</Badge>}
            <button onClick={() => onSet(items.filter((_, j) => j !== i))} className="text-muted hover:text-danger"><X size={16} /></button>
          </div>
        ))}
        <div className="flex gap-2">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item" className="flex-1" />
          <Input value={qty} onChange={(e) => setQty(e.target.value)} placeholder="Qtd" className="w-20" />
          <Button size="icon" variant="outline" onClick={() => { if (name.trim()) { onSet([...items, { id: uid("it"), name: name.trim(), quantity: qty.trim() || undefined }]); setName(""); setQty(""); } }}><Plus size={16} /></Button>
        </div>
      </div>
    </Card>
  );
}

function MediaCard({ media, onSet, author }: { media: MediaItem[]; onSet: (m: MediaItem[]) => void; author: string }) {
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [phase, setPhase] = React.useState<MediaItem["phase"]>("durante");

  function addPlaceholder(kind: MediaItem["kind"]) {
    const caption = kind === "photo" ? "Foto da obra" : "Vídeo da obra";
    onSet([...media, {
      id: uid("med"), kind, phase, caption, color: colorFromString(caption + media.length),
      author, createdAt: new Date().toISOString(), includeInPdf: true,
    }]);
  }

  function onFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        const kind: MediaItem["kind"] = file.type.startsWith("video") ? "video" : "photo";
        onSet([...media, {
          id: uid("med"), kind, phase, caption: file.name.replace(/\.[^.]+$/, ""),
          dataUrl: typeof reader.result === "string" && kind === "photo" ? reader.result : undefined,
          color: colorFromString(file.name), author, createdAt: new Date().toISOString(), includeInPdf: true,
        }]);
      };
      reader.readAsDataURL(file);
    });
    e.target.value = "";
  }

  const phases: MediaItem["phase"][] = ["antes", "durante", "depois"];

  return (
    <Card>
      <CardHeader title="Fotos e vídeos" icon={<Camera size={18} />} subtitle={`${media.filter((m) => m.kind === "photo").length} fotos • ${media.filter((m) => m.kind === "video").length} vídeos`} />
      <div className="p-4 space-y-3">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm text-muted">Fase:</span>
          {phases.map((p) => (
            <button key={p} onClick={() => setPhase(p)}
              className={`text-xs rounded-full px-3 py-1 capitalize ${phase === p ? "bg-brand text-white" : "border border-border text-muted"}`}>{p}</button>
          ))}
        </div>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {media.map((m, i) => (
            <div key={m.id} className="relative group rounded-xl overflow-hidden aspect-square border border-border">
              {m.dataUrl ? (
                <img src={m.dataUrl} alt={m.caption} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center" style={{ background: m.color }}>
                  {m.kind === "video" ? <span className="text-white text-2xl">▶</span> : <Camera size={20} className="text-white/80" />}
                </div>
              )}
              <span className="absolute top-1 left-1 text-[10px] bg-black/60 text-white rounded px-1 capitalize">{m.phase}</span>
              <button onClick={() => onSet(media.filter((_, j) => j !== i))} className="absolute top-1 right-1 bg-black/60 text-white rounded p-0.5 opacity-0 group-hover:opacity-100"><X size={12} /></button>
              <input value={m.caption} onChange={(e) => onSet(media.map((x, j) => j === i ? { ...x, caption: e.target.value } : x))}
                className="absolute bottom-0 inset-x-0 text-[10px] bg-black/60 text-white px-1 py-0.5 outline-none" />
            </div>
          ))}
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button size="sm" variant="outline" onClick={() => fileRef.current?.click()}><Camera size={14} /> Enviar foto/vídeo</Button>
          <Button size="sm" variant="ghost" onClick={() => addPlaceholder("photo")}><Plus size={14} /> Foto exemplo</Button>
          <Button size="sm" variant="ghost" onClick={() => addPlaceholder("video")}><Plus size={14} /> Vídeo exemplo</Button>
          <input ref={fileRef} type="file" accept="image/*,video/*" multiple capture="environment" className="hidden" onChange={onFiles} />
        </div>
      </div>
    </Card>
  );
}
