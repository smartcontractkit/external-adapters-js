import EthCrypto from 'eth-crypto'
import type { Encrypted } from 'eth-crypto'

export type Base64ByteString = string

type HexString = string
type Address = HexString
type JSONstring = string

export const decrypt = async (
  privateKey: string,
  encryptedBytesString: Base64ByteString,
  secretsOwner: Address,
): Promise<Record<string, unknown>> => {
  let encryptedHexString: HexString
  let encryptedObject: Encrypted
  let decrypted: JSONstring
  let decryptedPayload: { signature: string; message: string }
  let signer: Address

  try {
    encryptedHexString = Buffer.from(encryptedBytesString, 'base64').toString('hex')

    encryptedObject = EthCrypto.cipher.parse(encryptedHexString)

    decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject)
    decryptedPayload = JSON.parse(decrypted)

    signer = EthCrypto.recover(
      decryptedPayload.signature,
      EthCrypto.hash.keccak256(decryptedPayload.message),
    )
  } catch {
    throw Error('Encrypted secrets are invalid')
  }

  // check signature (NOTE: the ability off signature checking temporary & will be removed)
  if (signer !== secretsOwner) {
    throw Error('Encrypted secrets not signed by subscription owner')
  }

  try {
    return JSON.parse(decryptedPayload.message)
  } catch {} // eslint-disable-line no-empty
  throw Error('Decrypted secrets are not a valid JSON string')
}
