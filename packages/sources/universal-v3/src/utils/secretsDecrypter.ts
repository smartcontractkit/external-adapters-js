import EthCrypto from 'eth-crypto'

export type Base64ByteString = string

type HexString = string
type Address = HexString

export const decrypt = async (
  privateKey: string,
  encryptedBytesString: Base64ByteString,
  secretsOwner: Address,
): Promise<Record<string, unknown>> => {
  let decryptedPayload: { signature: string; message: string }
  let signer: Address

  try {
    const encryptedHexString = Buffer.from(encryptedBytesString, 'base64').toString('hex')

    const encryptedObject = EthCrypto.cipher.parse(encryptedHexString)

    const decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject)
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
    throw Error('Secrets not signed by subscription owner')
  }

  try {
    const decryptedSecrets = JSON.parse(decryptedPayload.message)
    if (typeof decryptedSecrets !== 'object') {
      throw Error
    }
    return decryptedSecrets
  } catch {
    throw Error('Invalid JSON format for secrets')
  }
}
