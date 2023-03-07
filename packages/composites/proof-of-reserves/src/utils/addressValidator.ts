import { utils } from 'ethers'
import { Logger, util, Validator } from '@chainlink/ea-bootstrap'
import type { AdapterResponse } from '@chainlink/ea-bootstrap'
import { TInputParameters } from '../endpoint/reserves'

type AddressObject = {
  address: string
  network?: string
  chainId?: string
}

const indexerToNetwork: Record<string, string> = {
  ada_balance: 'cardano',
  eth_balance: 'ethereum',
  bitcoin_json_rpc: 'bitcoin',
  lotus: 'filecoin',
}

export const getValidAddresses = (
  protocolOutput: AdapterResponse,
  validator: Validator<TInputParameters>,
): AdapterResponse => {
  const validatedInput = { ...protocolOutput }
  if (!util.parseBool(validator.validated.data.disableAddressValidation)) {
    validatedInput.data.result = validateAddresses(
      validator.validated.id,
      validator.validated.data.indexer,
      validatedInput.data.result as any,
    ) as any
  }
  if (!util.parseBool(validator.validated.data.disableDuplicateAddressFiltering)) {
    validatedInput.data.result = filterDuplicates(
      validator.validated.id,
      validatedInput.data.result as any,
    ) as any
  }
  return validatedInput
}

export const validateAddresses = (
  id: string,
  indexer: string,
  addresses: AddressObject[],
): AddressObject[] => {
  const validatedAddresses: AddressObject[] = []
  for (const addressObj of addresses) {
    const { address, network } = addressObj
    let validatedAddress: string | undefined = undefined
    const validationNetwork = network || indexerToNetwork[indexer]
    switch (validationNetwork.toLowerCase()) {
      case 'ethereum':
        validatedAddress = getValidEvmAddress(id, address)
        break
      case 'bitcoin':
        validatedAddress = getValidBtcAddress(id, address)
        break
      case 'dogecoin':
        validatedAddress = getValidDogeAddress(id, address)
        break
      case 'cardano':
        validatedAddress = getValidCardanoAddress(id, address)
        break
      case 'filecoin':
        validatedAddress = getValidFilecoinAddress(id, address)
        break
      default:
        Logger.debug(
          `JobId ${id}: There is no address validation procedure defined for the "${network}" network.`,
        )
        validatedAddresses.push(addressObj)
        break
    }
    if (validatedAddress) validatedAddresses.push({ ...addressObj, address: validatedAddress })
  }
  return validatedAddresses
}

/**
 * Returns either a valid Ethereum-style address with a valid checksum
 * or logs a warning and returns undefined
 */
const getValidEvmAddress = (id: string, address: string): string | undefined => {
  try {
    return utils.getAddress(address)
  } catch (e: any) {
    const error = e as Error
    Logger.warn(
      error,
      `JobId ${id}: The address "${address}" is invalid or has an invalid checksum and has been removed from the request.`,
    )
  }
  return
}

const getValidBtcAddress = (id: string, address: string): string | undefined => {
  const addressPrefix = address[0]
  switch (addressPrefix) {
    // Legacy (P2PKH) and Nested SegWit (P2SH) Bitcoin addresses start with 1 and are case-sensitive
    case '1':
    case '3':
      if (isBase58(address)) return address
      Logger.warn(
        { warning: 'Invalid address detected' },
        `JobId ${id}: The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
    case 'b':
    case 'B':
      address = address.toLowerCase()
      if (address.slice(0, 3) === 'bc1' && isBech32(address.slice(3))) return address
      Logger.warn(
        { warning: 'Invalid address detected' },
        `JobId ${id}: The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
    default:
      Logger.warn(
        { warning: 'Invalid address detected' },
        `JobId ${id}: The address "${address}" is not a valid Bitcoin address and has been removed.`,
      )
      return
  }
}

const getValidDogeAddress = (id: string, address: string): string | undefined => {
  if (address[0] !== 'D') {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Dogecoin address and has been removed.`,
    )
    return
  }
  if (isBase58(address.slice(1))) return address
  Logger.warn(
    { warning: 'Invalid address detected' },
    `JobId ${id}: The address "${address}" is not a valid Dogecoin address and has been removed.`,
  )
  return
}

const getValidCardanoAddress = (id: string, address: string): string | undefined => {
  if (address.slice(0, 4).toLowerCase() === 'addr' && isBech32(address.slice(5).toLowerCase()))
    return address.toLowerCase()
  if (isBase58(address)) return address
  Logger.warn(
    { warning: 'Invalid address detected' },
    `JobId ${id}: The address "${address}" is not a valid Dogecoin address and has been removed.`,
  )
  return
}

const getValidFilecoinAddress = (id: string, address: string): string | undefined => {
  address = address.toLowerCase()
  if (address[0] !== 'f' && address[0] !== 't') {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Filecoin address and has been removed.`,
    )
    return
  }
  if (address[1] !== '0' && address[1] !== '1' && address[1] !== '2' && address[1] !== '3') {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Filecoin address and has been removed.`,
    )
    return
  }
  if (address[1] === '0' && isBase10(address.slice(2))) return address
  if (isBase32(address.slice(2))) return address
  return
}

export const filterDuplicates = (id: string, addresses: AddressObject[]): AddressObject[] => {
  const uniqueMap: Record<string, boolean> = {}
  const uniqueAddresses: AddressObject[] = []
  for (const addressObject of addresses) {
    if (uniqueMap[addressObject.address]) {
      Logger.warn(
        { warning: 'Duplicate address detected' },
        `JobId ${id}: The address "${addressObject.address}" is duplicated in the request and the duplicate has been removed.`,
      )
    } else {
      uniqueMap[addressObject.address] = true
      uniqueAddresses.push(addressObject)
    }
  }
  return uniqueAddresses
}

const isBase58 = (value: string): boolean => /^[A-HJ-NP-Za-km-z1-9]*$/.test(value)

const isBase32 = (value: string): boolean => /^[a-z2-7]*$/.test(value)

const isBase10 = (value: string): boolean => /^[0-9]*$/.test(value)

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
