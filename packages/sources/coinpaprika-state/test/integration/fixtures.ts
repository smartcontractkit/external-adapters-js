import nock from 'nock'
import { PassThrough } from 'stream'

export const sseEventChunk = (payload: object | string, event = 't_s') => {
  const dataStr = typeof payload === 'string' ? payload : JSON.stringify(payload)
  return `event: ${event}\n` + `data: ${dataStr}\n\n`
}

const makeRawSSEStream = (chunks: string[]) => {
  const stream = new PassThrough()
  for (const ch of chunks) stream.write(ch)
  return stream
}

const makeSSEStream = (events: object[]) => {
  return makeRawSSEStream(events.map((ev) => sseEventChunk(ev)))
}

export const endSSEStream = (stream?: PassThrough) => {
  if (!stream) return
  try {
    stream.end()
  } catch {
    // Ignore errors when ending stream
  }
  try {
    stream.destroy()
  } catch {
    // Ignore errors when destroying stream
  }
}

export const mockStreamPost = ({
  apiBase,
  pairs,
  events,
  authHeader = 'TEST-KEY',
}: {
  apiBase: string
  pairs: Array<{ base: string; quote: string }>
  events: object[]
  authHeader?: string
}) => {
  const scope = nock(apiBase, {
    reqheaders: {
      authorization: (v) => v === authHeader,
      accept: (v) => (v || '').toLowerCase().includes('text/event-stream'),
      'content-type': (v) => (v || '').toLowerCase().includes('application/json'),
    },
  })

  const stream = makeSSEStream(events)

  scope
    .post('/stream', (body) => Array.isArray(body) && body.length === pairs.length)
    .reply(200, () => stream, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    })

  return { scope, stream }
}

export const mockStreamPostAnyBody = ({
  apiBase,
  events,
  authHeader = 'TEST-KEY',
}: {
  apiBase: string
  events: object[]
  authHeader?: string
}) => {
  const scope = nock(apiBase, {
    reqheaders: {
      authorization: (v) => v === authHeader,
      accept: (v) => (v || '').toLowerCase().includes('text/event-stream'),
      'content-type': (v) => (v || '').toLowerCase().includes('application/json'),
    },
  })

  const stream = makeSSEStream(events)

  scope.post('/stream').reply(200, () => stream, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'chunked',
  })

  return { scope, stream }
}

export const mockStreamPostRawAnyBody = ({
  apiBase,
  chunks,
  authHeader = 'TEST-KEY',
}: {
  apiBase: string
  chunks: string[]
  authHeader?: string
}) => {
  const scope = nock(apiBase, {
    reqheaders: {
      authorization: (v) => v === authHeader,
      accept: (v) => (v || '').toLowerCase().includes('text/event-stream'),
      'content-type': (v) => (v || '').toLowerCase().includes('application/json'),
    },
  })

  const stream = makeRawSSEStream(chunks)

  scope.post('/stream').reply(200, () => stream, {
    'Content-Type': 'text/event-stream',
    Connection: 'keep-alive',
    'Cache-Control': 'no-cache',
    'Transfer-Encoding': 'chunked',
  })

  return { scope, stream }
}

export const waitFor = async <T>(
  fn: () => Promise<T>,
  timeoutMs = 5000,
  stepMs = 150,
): Promise<T> => {
  const start = Date.now()
  let lastErr: unknown
  // eslint-disable-next-line no-constant-condition
  while (true) {
    try {
      return await fn()
    } catch (e) {
      lastErr = e
      if (Date.now() - start > timeoutMs) throw lastErr
      await new Promise((r) => setTimeout(r, stepMs))
    }
  }
}

export const mockStreamPostRawMatchingBody = ({
  apiBase,
  chunks,
  matchBody,
  authHeader = 'TEST-KEY',
  firstDelayMs = 10,
}: {
  apiBase: string
  chunks: string[]
  matchBody: (body: unknown) => boolean
  authHeader?: string
  firstDelayMs?: number
}) => {
  const scope = nock(apiBase, {
    reqheaders: {
      authorization: (v) => v === authHeader,
      accept: (v) => (v || '').toLowerCase().includes('text/event-stream'),
      'content-type': (v) => (v || '').toLowerCase().includes('application/json'),
    },
  })
  const stream = new PassThrough()
  setTimeout(() => {
    for (const ch of chunks) stream.write(ch)
  }, firstDelayMs)

  scope
    .post('/stream', (body) => {
      try {
        return matchBody(body)
      } catch {
        return false
      }
    })
    .reply(200, () => stream, {
      'Content-Type': 'text/event-stream',
      Connection: 'keep-alive',
      'Cache-Control': 'no-cache',
      'Transfer-Encoding': 'chunked',
    })

  return { scope, stream }
}
