import { generateKeyPairSync } from 'crypto'

export const generatePrivateKeyString = () => {
  const s = generateKeyPairSync('rsa', {
    modulusLength: 2048, // options
    publicKeyEncoding: {
      type: 'pkcs1',
      format: 'pem',
    },
    privateKeyEncoding: {
      type: 'pkcs8',
      format: 'pem',
    },
  })
  return s.privateKey
}
