import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { config } from '../config'

// 23 bytes keeps the carrier value safely within positive int192 bounds.
const TRUNCATED_CARRIER_BYTES = 23

// Shared carrier rule for both fields: take the leftmost 23 bytes, interpret them
// as an unsigned big-endian integer, and return its decimal string representation.
const truncateBytesToDecimal = (byteValue: Buffer, sourceField: 'root' | 'contractId'): string => {
  const truncatedHex = byteValue.subarray(0, TRUNCATED_CARRIER_BYTES).toString('hex')

  if (!truncatedHex) {
    throw new Error(`Unable to map ${sourceField}: decoded value is empty.`)
  }

  return BigInt(`0x${truncatedHex}`).toString()
}

export const decodeRootToDecimal = (base64Value: string): string => {
  let decodedBytes: Buffer

  try {
    decodedBytes = Buffer.from(atob(base64Value), 'binary')
  } catch {
    throw new Error(`Unable to decode root: invalid base64 value ${JSON.stringify(base64Value)}.`)
  }

  return truncateBytesToDecimal(decodedBytes, 'root')
}

export const normalizeContractIdToDecimal = (hexValue: string): string => {
  const normalizedHex = hexValue.replace(/^0x/i, '')

  if (!/^(?:[0-9a-f]{2})+$/i.test(normalizedHex)) {
    throw new Error(
      `Unable to normalize contractId: invalid hex value ${JSON.stringify(hexValue)}.`,
    )
  }

  return truncateBytesToDecimal(Buffer.from(normalizedHex, 'hex'), 'contractId')
}

export const getTrizeApiEndpoint = (network: string, settings: typeof config.settings): string => {
  const endpointEnvVar = network == 'testnet' ? 'TESTNET_API_ENDPOINT' : 'API_ENDPOINT'
  const endpoint = settings[endpointEnvVar]
  if (!endpoint) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Error: missing environment variable ${endpointEnvVar}`,
    })
  }
  return endpoint
}

export const doTrizeCustomInputValidation = (
  network: string,
  settings: typeof config.settings,
): AdapterInputError | undefined => {
  getTrizeApiEndpoint(network, settings)
  return
}
