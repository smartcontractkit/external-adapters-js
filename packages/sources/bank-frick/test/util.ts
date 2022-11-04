import { generateKeyPairSync } from 'crypto'

type AllowedPkFormats = 'pkcs1' | 'pkcs8'
export const generatePrivateKeyString = (privateKeyFormat: AllowedPkFormats = 'pkcs8') => {
  const s = generateKeyPairSync('rsa', {
    modulusLength: 2048, // options
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: privateKeyFormat,
      format: 'pem',
    },
  })
  return s.privateKey
}
