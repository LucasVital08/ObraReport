"use client";

import React from "react";
import { useStore } from "@/lib/store";
import { PageHeader } from "@/components/page";
import { Card, Button, Modal, Field, Input, Select, Badge, EmptyState } from "@/components/ui";
import { Avatar } from "@/components/brand";
import { type Contact } from "@/lib/types";
import { Plus, Phone, Mail, MessageCircle, Trash2, Search } from "lucide-react";

const TYPES = ["cliente", "engenheiro", "arquiteto", "fornecedor", "equipe", "responsável técnico", "contatos de emergência", "loja de material", "locadora", "prestador"];

export default function ContatosPage() {
  const contacts = useStore((s) => s.contacts);
  const addContact = useStore((s) => s.addContact);
  const deleteContact = useStore((s) => s.deleteContact);
  const [open, setOpen] = React.useState(false);
  const [q, setQ] = React.useState("");

  const filtered = contacts.filter((c) => (c.name + c.type + (c.company || "")).toLowerCase().includes(q.toLowerCase()));

  return (
    <div>
      <PageHeader title="Diretório de contatos" description="Clientes, fornecedores, equipe e emergências"
        action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Contato</Button>} />
      <Card className="p-3 mb-4">
        <div className="relative max-w-md"><Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar contato…" className="pl-9" /></div>
      </Card>
      {filtered.length === 0 ? (
        <Card><EmptyState title="Nenhum contato" action={<Button onClick={() => setOpen(true)}><Plus size={16} /> Adicionar</Button>} /></Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((c) => (
            <Card key={c.id} className="p-4 group">
              <div className="flex items-start gap-3">
                <Avatar name={c.name} size={42} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{c.name}</p>
                    <button onClick={() => deleteContact(c.id)} className="text-muted hover:text-danger opacity-0 group-hover:opacity-100"><Trash2 size={14} /></button>
                  </div>
                  <Badge tone="brand" className="capitalize mt-0.5">{c.type}</Badge>
                  {c.company && <p className="text-xs text-muted mt-1">{c.company}</p>}
                  <div className="mt-2 flex gap-2">
                    {c.phone && <a href={`tel:${c.phone}`} className="text-muted hover:text-brand"><Phone size={16} /></a>}
                    {c.whatsapp && <a href={`https://wa.me/${c.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="text-muted hover:text-success"><MessageCircle size={16} /></a>}
                    {c.email && <a href={`mailto:${c.email}`} className="text-muted hover:text-info"><Mail size={16} /></a>}
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
      <ContactModal open={open} onClose={() => setOpen(false)} onSave={(c) => { addContact(c); setOpen(false); }} />
    </div>
  );
}

function ContactModal({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (c: Omit<Contact, "id" | "companyId">) => void }) {
  const [f, setF] = React.useState({ name: "", type: TYPES[0], phone: "", whatsapp: "", email: "", company: "", address: "", note: "" });
  return (
    <Modal open={open} onClose={onClose} title="Novo contato"
      footer={<><Button variant="ghost" onClick={onClose}>Cancelar</Button><Button disabled={!f.name} onClick={() => onSave(f)}>Salvar</Button></>}>
      <div className="space-y-4">
        <Field label="Nome"><Input value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Tipo"><Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value })}>{TYPES.map((t) => <option key={t} value={t} className="capitalize">{t}</option>)}</Select></Field>
          <Field label="Empresa"><Input value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} /></Field>
          <Field label="Telefone"><Input value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value, whatsapp: e.target.value })} /></Field>
          <Field label="E-mail"><Input value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></Field>
        </div>
        <Field label="Endereço"><Input value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} /></Field>
      </div>
    </Modal>
  );
}
