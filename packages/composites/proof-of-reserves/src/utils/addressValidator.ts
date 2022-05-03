import { utils } from 'ethers'
import { Logger } from '@chainlink/ea-bootstrap'

type AddressObject = {
  address: string
  network?: string
}

const indexerToNetwork: Record<string, string> = {
  eth_balance: 'ethereum',
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
