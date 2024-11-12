import crypto from 'crypto'
import jwt from 'jsonwebtoken'

const LIFETIME = 120 * 1000 // milliseconds
const ALGORITHM = 'RS256'
const ISSUER = 'iss'
const SUBJECT = 'sub'
const EXPIRE_TIME = 'exp'
const ISSUE_TIME = 'iat'

export function buildSnowflakeJWT(config: {
  privateKey: string
  qualifiedUsername: string
}): string {
  const publicKey = crypto
    .createPublicKey({
      key: config.privateKey,
      format: 'pem',
    })
    .export({
      format: 'der',
      type: 'spki',
    })

  const publicKeyFingerprint =
    'SHA256:' + crypto.createHash('sha256').update(publicKey).digest('base64')

  const currentTime = Date.now()
  const jwtTokenExp = currentTime + LIFETIME

  const jwtPayload = {
    [ISSUER]: `${config.qualifiedUsername}.${publicKeyFingerprint}`,
    [SUBJECT]: `${config.qualifiedUsername}`,
    [ISSUE_TIME]: currentTime,
    [EXPIRE_TIME]: jwtTokenExp,
  }

  return jwt.sign(jwtPayload, config.privateKey, { algorithm: ALGORITHM })
}
