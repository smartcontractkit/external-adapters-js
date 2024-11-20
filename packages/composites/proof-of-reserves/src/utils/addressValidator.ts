import { utils } from 'ethers'
import { Logger, util, Validator } from '@chainlink/ea-bootstrap'
import type { AdapterResponse } from '@chainlink/ea-bootstrap'
import { TInputParameters } from '../endpoint/reserves'

type AddressObject = {
  address: string
  network?: string
  chainId?: string
  contractAddress?: string
  wallets?: string[]
}

const indexerToNetwork: Record<string, string> = {
  ada_balance: 'cardano',
  eth_balance: 'ethereum',
  eth_beacon: 'beacon',
  avalanche_platform: 'avalanche',
  bitcoin_json_rpc: 'bitcoin',
  lotus: 'filecoin',
  token_balance: 'multi-evm',
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
    const { address, network, chainId, contractAddress, wallets } = addressObj
    let validatedAddress: string | undefined = undefined
    let validationNetwork = network || indexerToNetwork[indexer]
    // If the indexer is eth_beacon, override the validationNetwork as it might contain a different value (goerli, ethereum, mainnet...)
    validationNetwork = indexer === 'eth_beacon' ? 'beacon' : validationNetwork

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
        validatedAddress = getValidCardanoAddress(id, address, chainId)
        break
      case 'filecoin':
        validatedAddress = getValidFilecoinAddress(id, address)
        break
      case 'beacon':
        validatedAddress = getValidBeaconValidatorAddress(id, address)
        break
      case 'avalanche':
      case 'avalanche-fuji':
        validatedAddress = getValidAvalancheAddress(id, address)
        break
      case 'multi-evm':
        if (contractAddress && wallets && wallets.length) {
          getValidEvmAddress(id, contractAddress)
          const validWallets = wallets
            .map((wallet) => getValidEvmAddress(id, wallet))
            .filter(Boolean) as string[]
          addressObj.wallets = validWallets
          validatedAddresses.push(addressObj)
        }
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

const getValidCardanoAddress = (
  id: string,
  address: string,
  chain = 'mainnet',
): string | undefined => {
  if (chain === 'mainnet') {
    // Validation for 'shelley' addresses
    if (address.slice(0, 4).toLowerCase() === 'addr' && isBech32(address.slice(5).toLowerCase())) {
      return address.toLowerCase()
    }
    // Validation for legacy 'byron' addresses
    if (isBase58(address)) {
      return address
    }
  }
  // Validation for testnet addresses
  else if (
    chain === 'testnet' &&
    address.slice(0, 10).toLowerCase() === 'addr_test1' &&
    isBech32(address.slice(10).toLowerCase())
  ) {
    return address.toLowerCase()
  }
  Logger.warn(
    { warning: 'Invalid address detected' },
    `JobId ${id}: The address "${address}" is not a valid Cardano ${chain} address and has been removed.`,
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

const getValidAvalancheAddress = (id: string, address: string): string | undefined => {
  if (address.substring(0, 2) === '0x') {
    // Validation for C-chain address
    return getValidEvmAddress(id, address)
  }

  // Validation for P nd X chain addresses
  if (!address.startsWith('X-') && !address.startsWith('P-')) {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Avalanche address and has been removed.`,
    )
    return
  }

  const addressKey = address.substring(2)
  const addressParts = addressKey.split('1')
  const [, bech32Part] = [addressParts.shift() as string, addressParts.join('1')]
  if (!bech32Part.length || !isBech32(bech32Part.toLowerCase())) {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Avalanche address and has been removed.`,
    )
    return
  }

  return address
}

const getValidBeaconValidatorAddress = (id: string, address: string): string | undefined => {
  try {
    const parsedKey = utils.hexlify(address)
    // Validator address is 48 bytes + '0x' prefix
    if (parsedKey === '0x'.padEnd(98, '0') || !utils.isHexString(parsedKey, 48)) {
      throw 'Invalid Address'
    }
  } catch (e) {
    Logger.warn(
      { warning: 'Invalid address detected' },
      `JobId ${id}: The address "${address}" is not a valid Beacon validator address and has been removed.`,
    )
    return
  }

  return address
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
