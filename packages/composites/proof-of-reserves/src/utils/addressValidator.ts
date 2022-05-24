import { utils } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'
import type { AdapterResponse } from '@chainlink/types'
import type { Validator } from '@chainlink/ea-bootstrap'

type AddressObject = {
  address: string
  network?: string
  chainId?: string
}

const indexerToNetwork: Record<string, string> = {
  eth_balance: 'ethereum',
  bitcoin_json_rpc: 'bitcoin',
}

export const getValidAddresses = (
  protocolOutput: AdapterResponse,
  validator: Validator,
): AdapterResponse => {
  const validatedInput = { ...protocolOutput }
  if (!parseBoolean(validator.validated.data.disableAddressValidation)) {
    validatedInput.result = validateAddresses(
      validator.validated.data.indexer,
      validatedInput.result,
    )
  }
  if (!parseBoolean(validator.validated.data.disableDuplicateAddressFiltering)) {
    validatedInput.result = filterDuplicates(validatedInput.result)
  }
  validatedInput.data.result = validatedInput.result
  return validatedInput
}

export const validateAddresses = (indexer: string, addresses: AddressObject[]): AddressObject[] => {
  const validatedAddresses: AddressObject[] = []
  for (const addressObj of addresses) {
    const { address, network } = addressObj
    let validatedAddress: string | undefined
    const validationNetwork = network || indexerToNetwork[indexer]
    switch (validationNetwork.toLowerCase()) {
      case 'ethereum':
        validatedAddress = getValidEvmAddress(address)
        if (validatedAddress) validatedAddresses.push({ ...addressObj, address: validatedAddress })
        break
      case 'bitcoin':
        validatedAddress = getValidBtcAddress(address)
        if (validatedAddress) validatedAddresses.push({ ...addressObj, address: validatedAddress })
        break
      default:
        Logger.debug(
          `There is no address validation procedure defined for the "${network}" network.`,
        )
        validatedAddresses.push(addressObj)
        break
    }
  }
  return validatedAddresses
}

/**
 * Returns either a valid Ethereum-style address with a valid checksum
 * or logs a warning and returns undefined
 */
const getValidEvmAddress = (address: string): string | undefined => {
  try {
    return utils.getAddress(address)
  } catch (error) {
    Logger.warn(
      error,
      `The address "${address}" is invalid or has an invalid checksum and has been removed from the request.`,
    )
  }
  return
}

const getValidBtcAddress = (address: string): string | undefined => {
  const addressPrefix = address[0]
  switch (addressPrefix) {
    // Legacy (P2PKH) and Nested SegWit (P2SH) Bitcoin addresses start with 1 and are case-sensitive
    case '1':
    case '3':
      if (address.length === 34 && isBase58(address)) return address
      Logger.warn(
        { warning: 'Invalid address detected' },
        `The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
    case 'b':
    case 'B':
      address = address.toLowerCase()
      if (address.slice(0, 3) === 'bc1' && address.length === 42 && isBech32(address.slice(3)))
        return address
      Logger.warn(
        { warning: 'Invalid address detected' },
        `The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
    default:
      Logger.warn(
        { warning: 'Invalid address detected' },
        `The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
  }
}

export const filterDuplicates = (addresses: AddressObject[]): AddressObject[] => {
  const uniqueMap: Record<string, boolean> = {}
  const uniqueAddresses: AddressObject[] = []
  for (const addressObject of addresses) {
    if (uniqueMap[addressObject.address]) {
      Logger.warn(
        { warning: 'Duplicate address detected' },
        `The address "${addressObject.address}" is duplicated in the request and the duplicate has been removed.`,
      )
    } else {
      uniqueMap[addressObject.address] = true
      uniqueAddresses.push(addressObject)
    }
  }
  return uniqueAddresses
}

const parseBoolean = (value: unknown) => {
  if ((typeof value === 'boolean' && value) || (typeof value === 'string' && value === 'true'))
    return true
  return false
}
const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value)

const isBech32 = (value: string): boolean => {
  for (const char of value) {
    if (!isValidBech32Char[char]) return false
  }
  return true
}

const isValidBech32Char: Record<string, boolean> = {
  q: true,
  p: true,
  z: true,
  r: true,
  y: true,
  '9': true,
  x: true,
  '8': true,
  g: true,
  f: true,
  '2': true,
  t: true,
  v: true,
  d: true,
  w: true,
  '0': true,
  s: true,
  '3': true,
  j: true,
  n: true,
  '5': true,
  '4': true,
  k: true,
  h: true,
  c: true,
  e: true,
  '6': true,
  m: true,
  u: true,
  a: true,
  '7': true,
  l: true,
}
