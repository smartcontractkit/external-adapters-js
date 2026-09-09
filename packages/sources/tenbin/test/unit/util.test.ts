import crypto from 'crypto'
import fs from 'fs'
import path from 'path'
import {
  PINNED,
  verifyAttestResponse,
  verifyDeepEquals,
  verifyJwtBodyEatsNonce,
} from '../../src/transport/util'
import { AttestResponse } from '../../src/transport/verified-balance'

const originalPinned: typeof PINNED = { ...PINNED }

describe('util', () => {
  beforeEach(() => {
    jest.useFakeTimers().setSystemTime(new Date('2026-09-01T14:00:00Z'))

    for (const key of Object.keys(originalPinned) as (keyof typeof PINNED)[]) {
      PINNED[key] = originalPinned[key]
    }
  })

  describe('verifyDeepEquals', () => {
    it('should succeed with equal objects', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: 2 } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).not.toThrow()
    })

    it('should fail with unequal objects', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: 3 } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).toThrow('Mismatch at obj1.b.c is 2; obj2.b.c is 3')
    })

    it('should fail with objects with different keys', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { d: 2 } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).toThrow('Mismatch at keys(obj1.b)[0] is "c"; keys(obj2.b)[0] is "d"')
    })

    it('should fail with objects with different number of keys', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: 2, d: 3 } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).toThrow('Mismatch at keys(obj1.b).length is 1; keys(obj2.b).length is 2')
    })

    it('should fail with values with different types', () => {
      const obj1 = { a: 1, b: { c: 2 } }
      const obj2 = { a: 1, b: { c: '2' } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).toThrow('Mismatch at type of obj1.b.c is "number"; type of obj2.b.c is "string"')
    })

    it('should fail with nullable values with different types', () => {
      const obj1 = { a: 1, b: { c: null } }
      const obj2 = { a: 1, b: { c: undefined } }
      expect(() => {
        verifyDeepEquals({ obj1, obj2 })
      }).toThrow('Mismatch at type of obj1.b.c is "null"; type of obj2.b.c is "undefined"')
    })

    it('should fail with array vs object', () => {
      const obj1 = { '0': 1, '1': 2 }
      const array2 = [1, 2]
      expect(() => {
        verifyDeepEquals({ obj1, array2 })
      }).toThrow('Mismatch at type of obj1 is "object"; type of array2 is "array"')
    })

    it('should fail with arrays of different length', () => {
      const array1 = [1, 2]
      const array2 = [1, 2, 3]
      expect(() => {
        verifyDeepEquals({ array1, array2 })
      }).toThrow('Mismatch at array1.length is 2; array2.length is 3')
    })

    it('should fail with arrays with different values', () => {
      const array1 = [1, 2]
      const array2 = [1, 3]
      expect(() => {
        verifyDeepEquals({ array1, array2 })
      }).toThrow('Mismatch at array1[1] is 2; array2[1] is 3')
    })

    it('should fail with arrays with different object values', () => {
      const array1 = [1, { a: 2 }]
      const array2 = [1, { a: 3 }]
      expect(() => {
        verifyDeepEquals({ array1, array2 })
      }).toThrow('Mismatch at array1[1].a is 2; array2[1].a is 3')
    })
  })

  describe('verifyAttestResponse', () => {
    const responseJson = fs.readFileSync(path.join(__dirname, 'attest-response-2026-09-01.json'))
    const buildJson = fs.readFileSync(path.join(__dirname, 'github-build-2026-09-03.json'))
    const buildResponse = JSON.parse(buildJson.toString())

    it('should succeed with correct attest response', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).not.toThrow()
    })

    it('should fail when canonical is not valid JSON', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const jsonLength = attestResponse.canonical.length
      attestResponse.canonical += '{}'

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Failed to parse canonical data: SyntaxError: Unexpected non-whitespace character after JSON at position ${jsonLength} (line 1 column ${
          jsonLength + 1
        })`,
      )
    })

    it('should fail with modified attest response', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const originalBalance = attestResponse.data.agg_usd_computed_balance
      attestResponse.data.agg_usd_computed_balance = '0'

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Mismatch at canonical.agg_usd_computed_balance is "${originalBalance}"; data.agg_usd_computed_balance is "0"`,
      )
    })

    it('should fail with modified nonce', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const originalNonce = attestResponse.nonce
      attestResponse.nonce += '0'

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Mismatch at canonicalHash is "${originalNonce}"; nonce is "${attestResponse.nonce}"`,
      )
    })

    it('should fail with unexpected alg in JWT', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const jwtParts = attestResponse.attestation.jwt.split('.')
      const jwtHeader = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString('utf-8'))

      jwtHeader.alg = 'ES256'

      jwtParts[0] = Buffer.from(JSON.stringify(jwtHeader)).toString('base64')
      attestResponse.attestation.jwt = jwtParts.join('.')
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(`Mismatch at headerAlg is "${jwtHeader.alg}"; expectedAlg is "RS256"`)
    })

    it('should fail certificate chain in wrong order', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const jwtParts = attestResponse.attestation.jwt.split('.')
      const jwtHeader = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString('utf-8'))

      jwtHeader.x5c = jwtHeader.x5c.reverse()

      jwtParts[0] = Buffer.from(JSON.stringify(jwtHeader)).toString('base64')
      attestResponse.attestation.jwt = jwtParts.join('.')
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        'Certificate chain is broken at index 0: issuer does not match subject of next certificate',
      )
    })

    it('should fail certificates are not valid yet', () => {
      jest.setSystemTime(new Date('2020-01-01T12:00:00Z'))
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('Certificate is not yet valid: validFrom is Aug 31 14:28:54 2026 GMT')
    })

    it('should fail certificates are expired', () => {
      jest.setSystemTime(new Date('2027-01-01T12:00:00Z'))
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('Certificate has expired: validTo is Oct 30 14:28:53 2026 GMT')
    })

    it('should use the expected pinned root certificate', () => {
      const cert = new crypto.X509Certificate(PINNED.ROOT_CERTIFICATE)
      expect(cert.fingerprint256.replace(/:/g, '').toLowerCase()).toBe(
        '148b293821bb0c6a317f413c8ba475814091cb22d49b9e3c94198db8e8f86c39',
      )
    })

    it('should fail signature verification if the header is modified', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const jwtParts = attestResponse.attestation.jwt.split('.')
      const jwtHeader = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString('utf-8'))

      jwtHeader.unused = 'test'

      jwtParts[0] = Buffer.from(JSON.stringify(jwtHeader)).toString('base64')
      attestResponse.attestation.jwt = jwtParts.join('.')
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('Signature verification failed')
    })

    it('should fail if iss does not match pinned value', () => {
      PINNED.ISS = 'different'
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(`Mismatch at iss is "${originalPinned.ISS}"; pinnedIss is "${PINNED.ISS}"`)
    })

    it('should fail if aud does not match pinned value', () => {
      PINNED.AUD = 'different'
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(`Mismatch at aud is "${originalPinned.AUD}"; pinnedAud is "${PINNED.AUD}"`)
    })

    it('should fail if exp is not in the future', () => {
      jest.setSystemTime(new Date('2026-10-01T12:00:00Z'))
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('JWT has expired: exp is 1788272248, now is 1790856000')
    })

    it('should fail if nbf is not in the past', () => {
      jest.setSystemTime(new Date('2026-09-01T12:00:00Z'))
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('JWT is not yet valid: nbf is 1788268648, now is 1788264000')
    })

    it('should fail if swname does not match pinned value', () => {
      PINNED.SWNAME = 'different'
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Mismatch at swname is "${originalPinned.SWNAME}"; pinnedSwname is "${PINNED.SWNAME}"`,
      )
    })

    it('should fail if dbgstat does not match pinned value', () => {
      PINNED.DBGSTAT = 'different'
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Mismatch at dbgstat is "${originalPinned.DBGSTAT}"; pinnedDbgstat is "${PINNED.DBGSTAT}"`,
      )
    })

    it('should fail if jwt does not eat nonce', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      // Change the data to get a different nonce than the one eaten by the JWT
      attestResponse.data.agg_usd_computed_balance = '123'
      attestResponse.canonical = JSON.stringify(attestResponse.data)
      attestResponse.nonce = crypto
        .createHash('sha256')
        .update(attestResponse.canonical)
        .digest('hex')

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `JWT body does not eat the nonce: ${attestResponse.nonce}. Eaten: 916ce327f57db5c8ee5aeb00c86193fc01d9ff85578d76f07f748f939b852a82`,
      )
    })

    it('should fail if digest does not match build.json', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const buildResponse = JSON.parse(buildJson.toString())

      buildResponse.image_digest = 'different'

      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow(
        `Mismatch at imageDigest is "sha256:b574c4fd412a5d7d299bae4f2a3a5af5e185fd4a4965c8200870e73abeab8ee4"; buildJsonImageDigest is "${buildResponse.image_digest}"`,
      )
    })

    it('should fail if x5c contains non-string entries', () => {
      const attestResponse = JSON.parse(responseJson.toString()) as AttestResponse
      const jwtParts = attestResponse.attestation.jwt.split('.')
      const jwtHeader = JSON.parse(Buffer.from(jwtParts[0], 'base64').toString('utf-8'))

      jwtHeader.x5c[0] = 123

      jwtParts[0] = Buffer.from(JSON.stringify(jwtHeader)).toString('base64')
      attestResponse.attestation.jwt = jwtParts.join('.')
      expect(() => {
        verifyAttestResponse(attestResponse, buildResponse)
      }).toThrow('Invalid x5c: all entries must be strings')
    })
  })

  describe('verifyJwtBodyEatsNonce', () => {
    it('should succeed when eat_nonce is a string that matches nonce', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: nonce }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).not.toThrow()
    })

    it('should succeed when eat_nonce is a string that matches nonce case-insensitively', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: 'TEST-NONCE' }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).not.toThrow()
    })

    it('should succeed when eat_nonce is an array containing matching nonce', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: ['other-nonce', nonce, 'another-nonce'] }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).not.toThrow()
    })

    it('should fail when eat_nonce is null', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: null }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).toThrow(`JWT body does not eat the nonce: ${nonce}. Eaten: `)
    })

    it('should fail when eat_nonce is undefined', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: undefined }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).toThrow(`JWT body does not eat the nonce: ${nonce}. Eaten: `)
    })

    it('should skip non-string entries and match string entries in array', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: [123, nonce, null] }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).not.toThrow()
    })

    it('should fail when eat_nonce array contains no matching string entries', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: [123, 'invalid-nonce', null] }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).toThrow(`JWT body does not eat the nonce: ${nonce}. Eaten: 123, invalid-nonce, `)
    })

    it('should fail when eat_nonce does not match nonce', () => {
      const nonce = 'test-nonce'
      const body = { eat_nonce: 'different-nonce' }
      expect(() => {
        verifyJwtBodyEatsNonce(body, nonce)
      }).toThrow(`JWT body does not eat the nonce: ${nonce}. Eaten: different-nonce`)
    })
  })
})
