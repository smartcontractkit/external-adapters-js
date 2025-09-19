import { Buffer } from 'buffer'
import { createHash } from 'crypto'
import nacl from 'tweetnacl'
import { reconstructRawMessage } from '../../src/transport/sigutils'

export function generateSignature(
  assetId: string,
  seqNum: number,
  nav: number,
  recordDate: Date,
  previousSignature: string,
  previousHash: string,
): {
  contentHex: string
  signatureHex: string
  publicKeyHex: string
  hashHex: string
  message: string
} {
  // Generate Ed25519 keypair
  const keyPair = nacl.sign.keyPair()
  const publicKeyHex = Buffer.from(keyPair.publicKey).toString('hex')
  const privateKey = keyPair.secretKey

  // Build and encode the message
  const message = reconstructRawMessage(
    assetId,
    seqNum,
    nav,
    recordDate,
    previousSignature,
    previousHash,
  )
  const messageBytes = Buffer.from(message, 'utf8')
  const contentHex = messageBytes.toString('hex')

  // Sign the message
  const signature = nacl.sign.detached(messageBytes, privateKey)
  const signatureHex = Buffer.from(signature).toString('hex')

  // Compute SHA-256 hash of the message (as in sigutils.ts)
  const hashHex = createHash('sha256').update(message).digest('hex')

  console.log('Message:', message)
  console.log('Message Hex:', contentHex)
  console.log('Signature Hex:', signatureHex)
  console.log('Public Key Hex:', publicKeyHex)
  console.log('Hash Hex:', hashHex)

  return {
    contentHex,
    signatureHex,
    hashHex,
    publicKeyHex,
    message,
  }
}
