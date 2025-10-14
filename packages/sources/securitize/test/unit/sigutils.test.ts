import { LoggerFactoryProvider } from '@chainlink/external-adapter-framework/util'
import { validateResponseSignature } from '../../src/transport/sigutils'
import { generateSignature } from '../test-utils/signature-helper'

// Initialize logger factory before tests
beforeAll(() => {
  LoggerFactoryProvider.set()
})

describe('sigutils', () => {
  const assetId = 'asset-123'
  const seqNum = 40
  const nav = 123.45
  const recordDate = new Date()

  let contentHex: string,
    signatureHex: string,
    hashHex: string,
    publicKeyHex: string,
    prevContentHex: string,
    prevSignatureHex: string,
    prevHashHex: string,
    prevPublicKeyHex: string
  let pubkeys: string[]

  beforeAll(() => {
    const baseValidSig = generateSignature(assetId, seqNum, nav, recordDate, 'prevSig', 'prevHash')
    prevContentHex = baseValidSig.contentHex
    prevSignatureHex = baseValidSig.signatureHex
    prevHashHex = baseValidSig.hashHex
    prevPublicKeyHex = baseValidSig.publicKeyHex

    const signature = generateSignature(
      assetId,
      seqNum,
      nav,
      recordDate,
      prevSignatureHex,
      prevHashHex,
    )
    contentHex = signature.contentHex
    signatureHex = signature.signatureHex
    hashHex = signature.hashHex
    publicKeyHex = signature.publicKeyHex

    pubkeys = [publicKeyHex, prevPublicKeyHex]
  })

  describe('validateResponseSignature', () => {
    it('should validate a valid response signature', () => {
      const response = {
        assetId,
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: signatureHex,
          hash: hashHex,
          prevContent: prevContentHex,
          prevSig: prevSignatureHex,
          prevHash: prevHashHex,
        },
      }

      expect(() => validateResponseSignature(response, pubkeys)).not.toThrow()
    })

    it('should fail when required fields are missing', () => {
      const response = {
        assetId: '',
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: '',
          hash: hashHex,
          prevContent: prevContentHex,
          prevSig: prevSignatureHex,
          prevHash: prevHashHex,
        },
      }

      expect(() => validateResponseSignature(response, pubkeys)).toThrow()
    })

    it('should fail when latest signature verification fails', () => {
      const response = {
        assetId,
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: signatureHex,
          hash: hashHex,
          prevContent: null,
          prevSig: null,
          prevHash: null,
        },
      }

      // removed latest pubkey
      expect(() => validateResponseSignature(response, [prevPublicKeyHex])).toThrow()
    })

    it('should fail when previous signature verification fails', () => {
      const response = {
        assetId,
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: signatureHex,
          hash: hashHex,
          prevContent: prevContentHex,
          prevSig: prevSignatureHex,
          prevHash: prevHashHex,
        },
      }

      // removed previous pubkey
      expect(() => validateResponseSignature(response, [publicKeyHex])).toThrow(
        'Failed to verify signature',
      )
    })

    it('should fail when message validation fails', () => {
      const response = {
        assetId,
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: signatureHex,
          hash: hashHex,
          prevContent: prevContentHex,
          prevSig: 'invalid-sig',
          prevHash: 'invalid-hash',
        },
      }

      expect(() => validateResponseSignature(response, pubkeys)).toThrow()
    })

    it('should fail when hash validation fails', () => {
      const response = {
        assetId,
        seqNum,
        nav,
        recordDate: recordDate.toISOString(),
        signedMessage: {
          content: contentHex,
          signature: signatureHex,
          hash: prevHashHex, // use prevHashHex here
          prevContent: prevContentHex,
          prevSig: prevSignatureHex,
          prevHash: prevHashHex,
        },
      }

      expect(() => validateResponseSignature(response, pubkeys)).toThrow()
    })
  })
})
