import crypto from 'crypto'
import { AttestResponse, BuildJsonResponse } from './verified-balance'

// From: https://confidentialcomputing.googleapis.com/.well-known/confidential_space_root.crt
export const PINNED_ROOT_CERTIFICATE = `-----BEGIN CERTIFICATE-----
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
uyT5CnJulxSC5CT1
-----END CERTIFICATE-----`

export const PINNED = {
  ROOT_CERTIFICATE: PINNED_ROOT_CERTIFICATE,
  ISS: 'https://confidentialcomputing.googleapis.com',
  AUD: 'https://public-api.tenbin.xyz/v1/verifier',
  SWNAME: 'CONFIDENTIAL_SPACE',
  DBGSTAT: 'disabled-since-boot',
}

const typeOf = (value: unknown): string => {
  if (value === null) {
    return 'null'
  }
  if (Array.isArray(value)) {
    return 'array'
  }
  return typeof value
}

// Verifies that two values in a record are deeply equal. Throws an error if
// they are not.  Uses the keys of the record to provide context in the error
// message.
export const verifyDeepEquals = (map: Record<string, unknown>): void => {
  const entries = Object.entries(map)
  if (entries.length !== 2) {
    throw new Error(`Expected exactly two keys in the map, but got ${entries.length}`)
  }
  const [name1, value1] = entries[0]!
  const [name2, value2] = entries[1]!
  verifyDeepEqualsRecursive(value1, value2, name1!, name2!)
}

const verifyDeepEqualsRecursive = (
  value1: unknown,
  value2: unknown,
  name1: string,
  name2: string,
): void => {
  if (value1 === value2) {
    return
  }

  const type1 = typeOf(value1)
  const type2 = typeOf(value2)
  verifyDeepEqualsRecursive(type1, type2, `type of ${name1}`, `type of ${name2}`)
  if (['number', 'string', 'boolean', 'undefined', 'null'].includes(type1)) {
    throw new Error(
      `Mismatch at ${name1} is ${JSON.stringify(value1)}; ${name2} is ${JSON.stringify(value2)}`,
    )
  }
  if (type1 === 'array') {
    const arr1 = value1 as unknown[]
    const arr2 = value2 as unknown[]
    verifyDeepEqualsRecursive(arr1.length, arr2.length, `${name1}.length`, `${name2}.length`)
    for (let i = 0; i < arr1.length; i++) {
      verifyDeepEqualsRecursive(arr1[i], arr2[i], `${name1}[${i}]`, `${name2}[${i}]`)
    }
    return
  }
  if (type1 === 'object') {
    const obj1Keys = Object.keys(value1 as Record<string, unknown>)
    const obj2Keys = Object.keys(value2 as Record<string, unknown>)
    verifyDeepEqualsRecursive(obj1Keys.sort(), obj2Keys.sort(), `keys(${name1})`, `keys(${name2})`)
    for (const key of obj1Keys) {
      verifyDeepEqualsRecursive(
        (value1 as Record<string, unknown>)[key],
        (value2 as Record<string, unknown>)[key],
        `${name1}.${key}`,
        `${name2}.${key}`,
      )
    }
    return
  }
  throw new Error(`Unsupported type at ${name1} and ${name2}: ${type1}`)
}

const verifyCanonicalMatchesData = (attestResponse: AttestResponse): void => {
  let canonical: unknown
  try {
    canonical = JSON.parse(attestResponse.canonical)
  } catch (e) {
    throw new Error(`Failed to parse canonical data: ${e}`)
  }

  const data = attestResponse.data

  verifyDeepEquals({ canonical, data })
}

const verifyCanonicalHashMatchesNonce = (attestResponse: AttestResponse): void => {
  const canonical = attestResponse.canonical
  const canonicalHash = crypto.createHash('sha256').update(canonical).digest('hex')
  const nonce = attestResponse.nonce
  verifyDeepEquals({ canonicalHash, nonce })
}

const verifyCertificates = (x5c: string[]): crypto.X509Certificate[] => {
  if (!Array.isArray(x5c) || x5c.length === 0) {
    throw new Error('Invalid x5c: expected a non-empty array of strings')
  }
  if (!x5c.every((cert) => typeof cert === 'string')) {
    throw new Error('Invalid x5c: all entries must be strings')
  }
  const certs = x5c.map((b64) => new crypto.X509Certificate(base64UrlDecode(b64)))
  certs.push(new crypto.X509Certificate(PINNED.ROOT_CERTIFICATE))

  const now = Date.now()
  for (const cert of certs) {
    const validFrom = new Date(cert.validFrom).getTime()
    const validTo = new Date(cert.validTo).getTime()
    if (now < validFrom) {
      throw new Error(`Certificate is not yet valid: validFrom is ${cert.validFrom}`)
    }
    if (now > validTo) {
      throw new Error(`Certificate has expired: validTo is ${cert.validTo}`)
    }
  }

  for (let i = 0; i < certs.length - 1; i++) {
    const cert = certs[i]!
    const issuerCert = certs[i + 1]!
    if (!cert.checkIssued(issuerCert)) {
      throw new Error(
        `Certificate chain is broken at index ${i}: issuer does not match subject of next certificate`,
      )
    }
    if (!cert.verify(issuerCert.publicKey)) {
      throw new Error(`Certificate chain is broken at index ${i}: signature verification failed`)
    }
  }

  return certs
}

const verifySignature = (message: Buffer, signature: Buffer, publicKey: crypto.KeyObject): void => {
  if (!crypto.verify('sha256', message, { key: publicKey }, signature)) {
    throw new Error('Signature verification failed')
  }
}

const verifyJwtBody = (body: Record<string, unknown>): void => {
  const { iss, aud, exp, nbf, iat, swname, dbgstat } = body
  verifyDeepEquals({ iss, pinnedIss: PINNED.ISS })
  verifyDeepEquals({ aud, pinnedAud: PINNED.AUD })

  const nowSeconds = Math.floor(Date.now() / 1000)
  if (nowSeconds > Number(exp)) {
    throw new Error(`JWT has expired: exp is ${exp}, now is ${nowSeconds}`)
  }
  if (nowSeconds < Number(nbf)) {
    throw new Error(`JWT is not yet valid: nbf is ${nbf}, now is ${nowSeconds}`)
  }
  if (nowSeconds < Number(iat)) {
    throw new Error(`JWT was issued in the future: iat is ${iat}, now is ${nowSeconds}`)
  }

  verifyDeepEquals({ swname, pinnedSwname: PINNED.SWNAME })
  verifyDeepEquals({ dbgstat, pinnedDbgstat: PINNED.DBGSTAT })
}

const base64UrlDecode = (b64: string): Buffer => {
  return Buffer.from(b64, 'base64')
}

const verifyJwt = (
  attestResponse: AttestResponse,
): {
  header: Record<string, unknown>
  body: Record<string, unknown>
  signature: Buffer
} => {
  const { jwt } = attestResponse.attestation
  const parts = jwt.split('.')
  if (parts.length !== 3) {
    throw new Error(`Invalid number of parts in JWT: expected 3, got ${parts.length}`)
  }
  const header = JSON.parse(base64UrlDecode(parts[0]!).toString('utf-8'))
  const body = JSON.parse(base64UrlDecode(parts[1]!).toString('utf-8'))
  const signature = base64UrlDecode(parts[2]!)

  verifyDeepEquals({ headerAlg: header.alg, expectedAlg: 'RS256' })

  const certs = verifyCertificates(header.x5c)
  verifySignature(Buffer.from(`${parts[0]}.${parts[1]}`), signature, certs[0]!.publicKey)

  verifyJwtBody(body)

  return {
    header,
    body,
    signature,
  }
}

export const verifyJwtBodyEatsNonce = (body: Record<string, unknown>, nonce: string): void => {
  const eatNonce = Array.isArray(body.eat_nonce) ? body.eat_nonce : [body.eat_nonce]
  if (
    !eatNonce.some(
      (eaten) => typeof eaten === 'string' && eaten.toLowerCase() === nonce.toLowerCase(),
    )
  ) {
    throw new Error(`JWT body does not eat the nonce: ${nonce}. Eaten: ${eatNonce.join(', ')}`)
  }
}

const verifyBuildJson = (
  body: Record<string, unknown>,
  buildJsonResponse: BuildJsonResponse,
): void => {
  const imageDigest = (body as { submods?: { container: { image_digest: string } } }).submods
    ?.container.image_digest
  const buildJsonImageDigest = buildJsonResponse.image_digest
  verifyDeepEquals({ imageDigest, buildJsonImageDigest })
}

// This implements the verification steps from VERIFIER.md from Tenbin's
// private repo.
export const verifyAttestResponse = (
  attestResponse: AttestResponse,
  buildJsonResponse: BuildJsonResponse,
): void => {
  verifyCanonicalMatchesData(attestResponse)
  verifyCanonicalHashMatchesNonce(attestResponse)
  const { body: jwtBody } = verifyJwt(attestResponse)
  verifyJwtBodyEatsNonce(jwtBody, attestResponse.nonce)
  verifyBuildJson(jwtBody, buildJsonResponse)
}
