import { store, nextId, recordAudit } from "../store";
import { allPatients } from "./patients";
import { conversationSchema, messageSchema, type Conversation, type Message } from "../schemas";

export const conversationIdFor = (patientId: string) => `cv-${patientId}`;

export function listConversations(): Conversation[] {
  const byConv = new Map<string, Message[]>();
  for (const m of store.messages) byConv.set(m.conversationId, [...(byConv.get(m.conversationId) ?? []), m]);
  return [...byConv.keys()]
    .map((id) => {
      const p = allPatients().find((x) => conversationIdFor(x.id) === id);
      if (!p) return undefined;
      const msgs = byConv.get(id)!;
      const unread = msgs.filter((m) => m.from === "patient" && m.delivery !== "read").length;
      return conversationSchema.parse({ id, patientId: p.id, patientName: p.name, patientCode: p.code, unread, locked: p.consent === "revoked" });
    })
    .filter((c): c is Conversation => !!c)
    .sort((a, b) => Date.parse(lastAt(b.id)) - Date.parse(lastAt(a.id)));
}

export const lastAt = (conversationId: string) => store.messages.filter((m) => m.conversationId === conversationId).map((m) => m.at).sort().pop() ?? "1970-01-01T00:00:00+00:00";
export const messagesFor = (conversationId: string) => store.messages.filter((m) => m.conversationId === conversationId).sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
export const unreadTotal = () => listConversations().reduce((n, c) => n + c.unread, 0);

/** Clinician-initiated only. Patient messages are never answered by the AI. */
export function sendMessage(input: { patientId: string; text: string; template?: string }): Message {
  const patient = allPatients().find((p) => p.id === input.patientId);
  if (!patient || patient.consent === "revoked") throw new Error("MESSAGING_LOCKED");
  const m = messageSchema.parse({ id: nextId("m"), conversationId: conversationIdFor(input.patientId), from: "clinician", text: input.text, at: new Date().toISOString().replace("Z", "+00:00"), template: input.template, delivery: "sent" });
  store.messages.push(m);
  recordAudit({ action: "message.sent", subject: input.patientId });
  return m;
}
