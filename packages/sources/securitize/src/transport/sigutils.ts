import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createHash } from 'crypto'
import nacl from 'tweetnacl'
import { SingleResponseSchema } from './nav'

const logger = makeLogger('SecuritizeSigUtils')

// exported for test helpers
export function reconstructRawMessage(
  assetId: string,
  seqNum: number,
  nav: number,
  recordDate: Date,
  previousSignature: string,
  previousHash: string,
): string {
  return `${assetId}||${nav}||${recordDate.toISOString()}||${seqNum}||${previousSignature}||${previousHash}`
}

function validateMessage(response: SingleResponseSchema, includePrevious: boolean): void {
  const { content, prevSig, prevHash } = response.signedMessage

  const cleanHex = content.replace(/^0x/, '')
  const actualMessage = Buffer.from(cleanHex, 'hex').toString('utf8')
  const expectedMessage = reconstructRawMessage(
    response.assetId,
    response.seqNum || 0,
    response.nav || 0,
    new Date(response.recordDate),
    includePrevious && prevSig ? prevSig : '',
    includePrevious && prevHash ? prevHash : '',
  )

  // Current API implementation does not include previous signature in the current signature
  // Once applied, we should check for an exact match here for
  // actualMessage !== expectedMessage
  const trimmedActualMessage = actualMessage.replace(/\|\|$/, '')
  if (!expectedMessage.startsWith(trimmedActualMessage)) {
    const message = `Failed to validate message, expected message ${expectedMessage} does not match actual ${trimmedActualMessage}`
    logger.error(message)
    throw new AdapterError({
      statusCode: 502,
      message,
    })
  }
}

function verifySignatureFromHex(
  contentHex: string,
  signatureHex: string,
  publicKeysHex: string[],
): void {
  const verifyResults = publicKeysHex.map((publicKeyHex) => {
    const publicKeyBytes = Buffer.from(publicKeyHex, 'hex')
    const signatureBytes = Buffer.from(signatureHex, 'hex')
    const contentBytes = Buffer.from(contentHex, 'hex')
    return nacl.sign.detached.verify(contentBytes, signatureBytes, publicKeyBytes)
  })

  if (!verifyResults.some((result) => result)) {
    const message = `Failed to verify signature ${signatureHex}`
    logger.error(message)
    throw new AdapterError({
      statusCode: 502,
      message,
    })
  }
}

function validateHash(contentHex: string, responseHashHex: string) {
  const cleanHex = contentHex.replace(/^0x/, '')
  const asciiContent = Buffer.from(cleanHex, 'hex').toString('utf8')
  const contentHash = createHash('sha256').update(asciiContent).digest('hex')
  const responseHash = responseHashHex.replace(/^0x/, '')

  if (contentHash !== responseHash) {
    const message = `Reconstructed hash from content ${contentHash} does not match responseHash ${responseHash}`
    logger.error(message)
    throw new AdapterError({
      statusCode: 502,
      message,
    })
  }
}

function validateRequiredFields(response: SingleResponseSchema, includePrevious: boolean) {
  const signedMessage = response.signedMessage

  // Validate required fields
  const requiredFields = [
    response.assetId,
    response.nav,
    response.recordDate,
    response.seqNum,
    signedMessage,
    signedMessage.content,
    signedMessage.hash,
    signedMessage.signature,
  ]

  if (
    includePrevious &&
    signedMessage.prevContent &&
    signedMessage.prevHash &&
    signedMessage.prevSig
  ) {
    requiredFields.push(signedMessage.prevContent, signedMessage.prevHash, signedMessage.prevSig)
  }

  if (requiredFields.some((field) => !field)) {
    const message = `Missing required response fields, response: ${JSON.stringify(response)}`
    logger.error(message)
    throw new AdapterError({
      statusCode: 502,
      message,
    })
  }
}

export function validateResponseSignature(response: SingleResponseSchema, pubkeys: string[]) {
  // ensure all required fields are present to verify sig
  const isPrevSigPopulated =
    !!response.signedMessage.prevHash &&
    !!response.signedMessage.prevContent &&
    !!response.signedMessage.prevSig

  validateRequiredFields(response, isPrevSigPopulated)

  // verify signature
  verifySignatureFromHex(response.signedMessage.content, response.signedMessage.signature, pubkeys)

  // validate message content is constructed as expected
  validateMessage(response, isPrevSigPopulated)

  // validate hash
  validateHash(response.signedMessage.content, response.signedMessage.hash)

  if (isPrevSigPopulated) {
    // verify previous signature
    verifySignatureFromHex(
      response.signedMessage.prevContent || '',
      response.signedMessage.prevSig || '',
      pubkeys,
    )
    // validate previous hash
    validateHash(response.signedMessage.prevContent || '', response.signedMessage.prevHash || '')
  }
}
