import { BaseEndpointTypes } from '../../src/endpoint/reserve'
import {
  SignatureParams,
  buildPositionHeaders,
  signRequest,
} from '../../src/transport/authentication'

const PATH = '/api/b2c/v1/securities/portfolios/900000001/positions'
const USER_ID = '31415926'
const AGREEMENT = '654321-7'
const HMAC_SECRET = 'test-hmac-secret'
const ACCESS_TOKEN = 'test-access-token'
const NONCE = '3f2504e0-4f89-41d3-9a0c-0305e82c3301'
const TIMESTAMP = 1700000000
const UUID_V4 = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
const BASE64 = /^[A-Za-z0-9+/]+={0,2}$/

const settings = {
  API_ENDPOINT: 'https://sandbox.amina.example',
  AMINA_USER_ID: USER_ID,
  AMINA_PASSWORD: 'test-password',
  AMINA_HMAC_SECRET: HMAC_SECRET,
  AMINA_AGREEMENT_NUMBER: AGREEMENT,
} as unknown as BaseEndpointTypes['Settings']

describe('signRequest', () => {
  const params: SignatureParams = {
    method: 'GET',
    path: PATH,
    timestamp: TIMESTAMP,
    nonce: NONCE,
    userId: USER_ID,
    agreementNumber: AGREEMENT,
    hmacSecret: HMAC_SECRET,
  }

  it('signs the six lines with HMAC-SHA256 and base64 in the provider order', () => {
    expect(signRequest(params)).toEqual({
      'Amina-Nonce': NONCE,
      'Amina-Timestamp': '1700000000',
      'Amina-Uri': PATH,
      'Amina-Signature': '7h7o+4rpEqs1W8Od/d5yh0PzVe4XCAoCxILIv9/zkAk=',
      'Amina-Context-Agreement-Number': AGREEMENT,
    })
  })
})

describe('buildPositionHeaders', () => {
  afterEach(() => {
    jest.restoreAllMocks()
  })

  it('uses a fresh UUID nonce for each request', () => {
    const first = buildPositionHeaders({ path: PATH, accessToken: ACCESS_TOKEN, settings })
    const second = buildPositionHeaders({ path: PATH, accessToken: ACCESS_TOKEN, settings })

    expect(first['Amina-Nonce']).toMatch(UUID_V4)
    expect(second['Amina-Nonce']).toMatch(UUID_V4)
    expect(first['Amina-Nonce']).not.toBe(second['Amina-Nonce'])
  })

  it('sets the path-only URI, the UNIX-second timestamp, the Bearer token and the UUID request and correlation IDs', () => {
    jest.spyOn(Date, 'now').mockReturnValue(1700000000123)

    const headers = buildPositionHeaders({ path: PATH, accessToken: ACCESS_TOKEN, settings })

    expect(headers).toMatchObject({
      Authorization: `Bearer ${ACCESS_TOKEN}`,
      'Amina-Timestamp': '1700000000',
      'Amina-Uri': PATH,
      'Amina-Context-Agreement-Number': AGREEMENT,
    })
    expect(headers['X-Request-Id']).toMatch(UUID_V4)
    expect(headers['X-Correlation-Id']).toMatch(UUID_V4)
    expect(headers['Amina-Nonce']).toMatch(UUID_V4)
    expect(headers['Amina-Signature']).toMatch(BASE64)
  })
})
