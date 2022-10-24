import EthCrypto from 'eth-crypto'

export type Base64ByteString = string

type HexString = string
type Address = HexString

export const decrypt = async (
  privateKey: string,
  encryptedBytesString: Base64ByteString,
  secretsOwner?: Address,
): Promise<Record<string, unknown>> => {
  const encryptedHexString: HexString = Buffer.from(encryptedBytesString, 'base64').toString('hex')

  const encryptedObject = EthCrypto.cipher.parse(encryptedHexString)

  const decrypted = await EthCrypto.decryptWithPrivateKey(privateKey, encryptedObject)
  const decryptedPayload: { signature: string; message: string } = JSON.parse(decrypted)

  const senderAddress = EthCrypto.recover(
    decryptedPayload.signature,
    EthCrypto.hash.keccak256(decryptedPayload.message),
  )

  // check signature (NOTE: the ability off signature checking temporary & will be removed)
  if (process.env['SIGNATURE_CHECK']?.toLowerCase() === 'true' && senderAddress !== secretsOwner)
    throw Error('encrypted secrets not signed by secrets owner')

  try {
    return JSON.parse(decryptedPayload.message)
  } catch {} // eslint-disable-line no-empty
  throw Error('decrypted secrets are not a valid JSON string')
}
