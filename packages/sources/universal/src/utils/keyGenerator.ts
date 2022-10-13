import { generateKeyPairSync } from 'crypto'

const keys = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: {
    type: 'pkcs1',
    format: 'pem',
  },
  privateKeyEncoding: {
    type: 'pkcs1',
    format: 'pem',
  },
})
const publicKey = keys.publicKey
  .replace('-----BEGIN RSA PUBLIC KEY-----\n', '')
  .replace('\n-----END RSA PUBLIC KEY-----\n', '')
  .replace(/\n/g, '')
const privateKey = keys.privateKey
  .replace('-----BEGIN RSA PRIVATE KEY-----\n', '')
  .replace('\n-----END RSA PRIVATE KEY-----\n', '')
  .replace(/\n/g, '')
console.log(`PUBLICKEY:\n\n${publicKey}\n\nPRIVATEKEY:\n\n${privateKey}\n\n`)
