import { buildHmacPayload, buildSignedGetHeaders, signHmac } from '../../src/transport/signing'

describe('AMINA request signing', () => {
  it('builds the HMAC payload in the manual order', () => {
    const payload = buildHmacPayload({
      method: 'GET',
      timestamp: '1659002057',
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      uri: '/partners/150661/accounts/1506614001/balances',
      userId: '12345678',
      agreementNumber: '123456-1',
    })

    expect(payload).toBe(
      'GET\n1659002057\n83dc868e-7a56-4fdf-897b-f2ab57fee916\n/partners/150661/accounts/1506614001/balances\n12345678\n123456-1',
    )
  })

  it('signs the manual example with base64 HMAC-SHA256', () => {
    const payload = buildHmacPayload({
      method: 'GET',
      timestamp: '1659002057',
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      uri: '/partners/150661/accounts/1506614001/balances',
      userId: '12345678',
      agreementNumber: '123456-1',
    })

    expect(signHmac(payload, 'secret')).toBe('MK/pcsl6ySrUFMrFgya054imx1sJhVzCM6uOmdq6O+k=')
  })

  it('builds auth, request-id, and signed headers without a query in Amina-Uri', () => {
    const headers = buildSignedGetHeaders({
      uri: '/api/b2c/v1/securities/portfolios/157769305/positions',
      token: 'access-token',
      userId: '25742014',
      hmacSecret: 'secret',
      agreementNumber: '157769',
      userAgent: 'chainlink-artex-amina-adapter/1.0.0',
      now: 1659002057000,
      nonce: '83dc868e-7a56-4fdf-897b-f2ab57fee916',
    })

    expect(headers).toMatchObject({
      Authorization: 'Bearer access-token',
      'User-Agent': 'chainlink-artex-amina-adapter/1.0.0',
      'Amina-Context-Agreement-Number': '157769',
      'Amina-Nonce': '83dc868e-7a56-4fdf-897b-f2ab57fee916',
      'Amina-Timestamp': '1659002057',
      'Amina-Uri': '/api/b2c/v1/securities/portfolios/157769305/positions',
      'Amina-Signature': 'DDC7F0mI7ba2MVGhuV7pF1jyDcSDSwjutOwauBwFfec=',
    })
    expect(headers['X-Request-Id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
    expect(headers['X-Correlation-Id']).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/,
    )
  })

  it('uses a fresh nonce and signature on each call', () => {
    const input = {
      uri: '/api/b2c/v1/securities/portfolios/157769305/positions',
      token: 'access-token',
      userId: '25742014',
      hmacSecret: 'secret',
      agreementNumber: '157769',
      userAgent: 'chainlink-artex-amina-adapter/1.0.0',
    }

    const first = buildSignedGetHeaders(input)
    const second = buildSignedGetHeaders(input)

    expect(first['Amina-Nonce']).not.toBe(second['Amina-Nonce'])
    expect(first['Amina-Signature']).not.toBe(second['Amina-Signature'])
  })
})
