import nock from 'nock'
import { SHA256 } from 'crypto-js'
import { TimestampedRequestSigner } from '../../src/utils/timestampedRequestSigner'

interface HttpRequest {
  url: string
  headers: Record<string, string>
}

interface ValidInput {
  code: string
  httpRequests?: HttpRequest[]
  args?: string[]
  decryptedSecrets?: string[]
  timestamp: number
}

interface ValidInputWithSignature extends ValidInput {
  signature?: string
  requestHash?: string
}

export const mockSandbox = (): nock.Scope =>
  nock('http://faassandbox.com', {
    encodedQueryParams: true,
  })
    // basic request
    .post('/execute', (body) => {
      if (body.source !== 'return 1') return false
      try {
        return true
      } catch {
        return false
      }
    })
    .reply(200, () => ({ success: '0x01' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    // request with http requests & args
    .post('/execute', (body) => {
      if (
        JSON.stringify(body.queries) !==
          JSON.stringify([
            {
              url: 'https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd',
            },
            {
              url: 'https://api.coinpaprika.com/v1/tickers/btc-bitcoin',
            },
          ]) ||
        JSON.stringify(body.args) !== JSON.stringify(['bitcoin', 'usd', 'btc-bitcoin']) ||
        body.source !== 'return 2'
      )
        return false
      try {
        checkRequestAuthorization(body)
        return true
      } catch {
        return false
      }
    })
    .reply(200, () => ({ success: '0x02' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    // request using secrets
    .post('/execute', (body) => {
      if (
        JSON.stringify(body.secrets) !== JSON.stringify({ test: '0x64' }) &&
        JSON.stringify(body.source) !== 'return secrets.test'
      )
        return false
      try {
        checkRequestAuthorization(body)
        return true
      } catch {
        return false
      }
    })
    .reply(200, () => ({ success: '0x30783634' }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    // request with error in code
    .post('/execute', (body) => {
      if (body.source !== 'return )') return false
      try {
        checkRequestAuthorization(body)
        return true
      } catch {
        return false
      }
    })
    .reply(
      200,
      () => ({
        error: {
          name: 'JavaScript Syntax Error',
          message: "Unexpected token ')'",
        },
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )
    // with invalid result
    .post('/execute', (body) => {
      if (body.source !== 'return 1') return false
      try {
        checkRequestAuthorization(body)
        return true
      } catch {
        return false
      }
    })
    .reply(200, () => ({ success: 1 }), [
      'Content-Type',
      'application/json',
      'Connection',
      'close',
      'Vary',
      'Accept-Encoding',
      'Vary',
      'Origin',
    ])
    .post('/execute', (body) => {
      if (body.source !== `return '${stringWith257Chars}'`) return false
      try {
        checkRequestAuthorization(body)
        return true
      } catch {
        return false
      }
    })
    .reply(
      200,
      () => ({
        success:
          '0x74686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e20746869734973203874686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e2074686973497354656e20746869732049732039',
      }),
      [
        'Content-Type',
        'application/json',
        'Connection',
        'close',
        'Vary',
        'Accept-Encoding',
        'Vary',
        'Origin',
      ],
    )

const checkRequestAuthorization = (input: ValidInputWithSignature) => {
  const timestampSignature = new TimestampedRequestSigner(
    '',
    'MIIBCgKCAQEAwbgb+Pj1t0Y5O1Z8kxblzCZYKXCkVJ3OBuEmdEeQXraICVGEF5K8biZqtvATzQ280T6/+Vv+9PRzBada7CfzCGPJu/aN9xIeUZVmqxTQdvh1M2WC+mgGihGsc2gMpcJ+7NkT4h6wuTkBdKHmB55r7J0fHW/xMjAjKvWo9UNvlX+okEOfY2Kl/c8f2H/EbIYFw4y5DxKbrt0tojVSmW1+abVmmsail2Ak7LCQDz38xFPrAWB0Z8yv4MXW7jWzr5yPy9UBNHARRxQEHo7zxk4/XZ7YPz2r7FXsm6Nc4zC0KnaviWaNnPMSz61d7d59TASEZUehzmFtudP/HuWx8uf2nQIDAQAB',
  )
  if (typeof input.signature !== 'string') throw Error('Signature is missing or invalid')
  if (typeof input.timestamp !== 'number') throw Error('Timestamp is missing or invalid')
  const requestDataWithoutHashOrSignature = { ...input }
  delete requestDataWithoutHashOrSignature.requestHash
  delete requestDataWithoutHashOrSignature.signature
  const requestHash = SHA256(JSON.stringify(requestDataWithoutHashOrSignature)).toString()
  if (requestHash !== input.requestHash) throw Error('The hash of the request is invalid')
  if (!timestampSignature.verifySignature(requestHash, input.signature))
    throw Error('The signature for the request is invalid')
}

export const stringWith257Chars =
  'thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIs 8thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen thisIsTen this Is 9'
