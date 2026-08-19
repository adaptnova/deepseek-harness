export const NATS_SECRET_SOURCE = '/adapt/secrets/db.env'
export const WAKE_PREFIX = 'nexus.wake.'
export const REPLY_PREFIX = 'nexus.glass.reply.'
export const FORBIDDEN_DIRECT_PREFIX = 'nova.'

export type CanonicalEnvelope = {
  message_id: string
  correlation_id: string | null
  causation_id: string | null
  conversation_id: string
  session_id: string
  from: string
  to: string
  reply_to: string | null
  requires_substantive_ack: boolean
  created_at: string
  trace: string[]
  body?: unknown
}

export type BridgeDecision =
  | { kind: 'wake'; subject: string; envelope: CanonicalEnvelope }
  | { kind: 'mode_a'; envelope: CanonicalEnvelope }
  | { kind: 'mode_b'; envelope: CanonicalEnvelope }
  | { kind: 'lost_reply'; error: 'durable_typed_failure' }

const REQUIRED = [
  'message_id',
  'correlation_id',
  'causation_id',
  'conversation_id',
  'session_id',
  'from',
  'to',
  'reply_to',
  'requires_substantive_ack',
  'created_at',
  'trace',
] as const

export function claimsDirectSubject(): boolean {
  return false
}

export function natsUrlHasUserinfo(url: string): boolean {
  return /nats:\/\/[^/\s]+:[^/\s]+@/i.test(url)
}

export function validateEnvelope(input: unknown): CanonicalEnvelope {
  if (input === null || typeof input !== 'object') {
    throw new Error('synthesized identity rejected')
  }
  const value = input as Record<string, unknown>
  for (const key of REQUIRED) {
    if (!(key in value)) {
      throw new Error(`missing ${key}`)
    }
  }
  if (typeof value.from !== 'string' || value.from.length === 0 || value.from === 'anonymous') {
    throw new Error('plaintext or synthesized identity rejected')
  }
  if (typeof value.requires_substantive_ack !== 'boolean') {
    throw new Error('requires_substantive_ack must be boolean')
  }
  return value as CanonicalEnvelope
}

export function wakeSubject(agent: string): string {
  return `${WAKE_PREFIX}${agent}`
}

export function replySubject(agent: string): string {
  return `${REPLY_PREFIX}${agent}`
}

export function rejectDirectSubscription(subject: string): void {
  if (subject.startsWith(FORBIDDEN_DIRECT_PREFIX) && subject.endsWith('.direct')) {
    throw new Error('nats-seat-bridge must not subscribe to nova.<agent>.direct')
  }
}

export function handleWake(agent: string, input: unknown): BridgeDecision {
  const envelope = validateEnvelope(input)
  return { kind: 'wake', subject: wakeSubject(agent), envelope }
}

export function handleReply(
  original: CanonicalEnvelope,
  reply: unknown | null,
  midTask: boolean,
): BridgeDecision {
  if (reply === null) {
    return { kind: 'lost_reply', error: 'durable_typed_failure' }
  }
  const incoming = validateEnvelope(reply)
  if (incoming.reply_to !== original.reply_to) {
    throw new Error('reply_to must be preserved')
  }
  if (incoming.conversation_id !== original.conversation_id || incoming.session_id !== original.session_id) {
    throw new Error('trace ids must be preserved')
  }
  if (incoming.requires_substantive_ack && midTask) {
    return { kind: 'mode_b', envelope: incoming }
  }
  return { kind: 'mode_a', envelope: incoming }
}
