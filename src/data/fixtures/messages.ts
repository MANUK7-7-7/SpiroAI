import { messageSchema, type Message } from "../schemas";

// FICTIONAL conversations. Seeded into the in-memory store on first use.
const raw: Omit<Message, "delivery">[] & { delivery?: Message["delivery"] }[] = [
  { id: "m-1", conversationId: "cv-p-001", from: "clinician", text: "Hello James, I’d like to check in and arrange a breathing test. Please book a visit so we can review how you’re feeling.", at: "2026-10-16T09:02:00-03:00", delivery: "read" },
  { id: "m-2", conversationId: "cv-p-001", from: "patient", text: "Thanks, doctor. I can come on Tuesday morning. Should I bring my inhaler?", at: "2026-10-16T09:08:00-03:00", delivery: "delivered" },
  { id: "m-3", conversationId: "cv-p-002", from: "patient", text: "My recording is complete.", at: "2026-10-16T09:08:00-03:00", delivery: "delivered" },
  { id: "m-4", conversationId: "cv-p-004", from: "patient", text: "Thank you, doctor.", at: "2026-10-16T09:08:00-03:00", delivery: "read" },
  { id: "m-5", conversationId: "cv-p-003", from: "patient", text: "I’ll repeat the test today.", at: "2026-10-16T09:08:00-03:00", delivery: "delivered" },
];

export const messagesSeed: Message[] = raw.map((m) => messageSchema.parse(m));
