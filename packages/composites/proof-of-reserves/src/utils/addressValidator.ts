import { utils } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'

type AddressObject = { address: string }
type AddressArray = AddressObject[]

export const validateAddresses = (indexer: string, addresses: AddressArray): AddressArray => {
  switch (indexer) {
    case 'eth_balance':
      return filterDuplicates(getValidEvmAddresses(addresses))
    default:
      Logger.debug(`There is no address validation procedure defined for the "${indexer}" indexer.`)
      return addresses
  }
}

/** Converts an array of AddressObjects to an array of AddressObjects with valid checksums
 *
 * If an address is encountered with an invalid checksum, it is removed from the array
 * and a warning is logged.
 */
const getValidEvmAddresses = (addresses: AddressArray): AddressArray => {
  const validAddresses: AddressArray = []
  for (const { address } of addresses) {
    try {
      validAddresses.push({ address: utils.getAddress(address) })
    } catch (error) {
      Logger.warn(
        error,
        `The address "${address}" is invalid or has an invalid checksum and has been removed from the request.`,
      )
    }
  }
  return validAddresses
}

const filterDuplicates = (addresses: AddressArray): AddressArray => {
  const uniqueMap: Record<string, boolean> = {}
  const uniqueAddresses: AddressArray = []
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
