import { describe, expect, it } from 'vitest'
import {
  claimsDirectSubject,
  handleReply,
  handleWake,
  natsUrlHasUserinfo,
  rejectDirectSubscription,
  replySubject,
  validateEnvelope,
  wakeSubject,
  NATS_SECRET_SOURCE,
  type CanonicalEnvelope,
} from '../src/index.ts'

const envelope: CanonicalEnvelope = {
  message_id: 'msg-1',
  correlation_id: 'corr-1',
  causation_id: 'cause-1',
  conversation_id: 'convo-1',
  session_id: 'sess-1',
  from: 'looper',
  to: 'iris',
  reply_to: 'nova.iris.direct',
  requires_substantive_ack: true,
  created_at: '2026-08-19T09:00:00Z',
  trace: ['sp005'],
}

describe('nats-seat-bridge', () => {
  it('never claims nova.<agent>.direct', () => {
    expect(claimsDirectSubject()).toBe(false)
    expect(() => rejectDirectSubscription('nova.looper.direct')).toThrow(/must not subscribe/)
    expect(wakeSubject('looper')).toBe('nexus.wake.looper')
    expect(replySubject('looper')).toBe('nexus.glass.reply.looper')
  })

  it('rejects synthesized identity and missing ack flag', () => {
    expect(() => validateEnvelope({})).toThrow(/missing/)
    expect(() => validateEnvelope({ ...envelope, from: 'anonymous' })).toThrow(/synthesized/)
  })

  it('preserves reply_to and returns Mode A or bounded Mode B', () => {
    const wake = handleWake('looper', envelope)
    expect(wake.kind).toBe('wake')
    const modeA = handleReply(envelope, envelope, false)
    expect(modeA.kind).toBe('mode_a')
    const modeB = handleReply(envelope, envelope, true)
    expect(modeB.kind).toBe('mode_b')
  })

  it('lost reply is a durable typed failure', () => {
    expect(handleReply(envelope, null, false)).toEqual({
      kind: 'lost_reply',
      error: 'durable_typed_failure',
    })
  })

  it('forbids credential userinfo and names db.env only', () => {
    expect(NATS_SECRET_SOURCE).toBe('/adapt/secrets/db.env')
    expect(natsUrlHasUserinfo('nats://127.0.0.1:18020')).toBe(false)
    expect(natsUrlHasUserinfo('nats://user:pass@127.0.0.1:18020')).toBe(true)
  })
})
