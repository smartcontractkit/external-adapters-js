import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { BasicAddress } from '../endpoint/address'

const logger = makeLogger('StaderAddressListUtil')

export type NetworkChainMap = {
  [network: string]: {
    [chain: string]: { staderConfig: string }
  }
}

export type ValidatorRegistryResponse = [
  status: number,
  pubkey: string,
  preDepositSignature: string,
  depositSignature: string,
  withdrawVaultAddress: string,
  operatorId: number,
  initialBondEth: number,
  depositTime: number,
  withdrawnTime: number,
]

export const filterDuplicateAddresses = <T extends BasicAddress>(addresses: T[]): T[] => {
  const addressMap: Record<string, T> = {}
  for (const addressObject of addresses) {
    if (addressMap[addressObject.address]) {
      logger.warn(
        { warning: 'Duplicate address detected' },
        `The address "${addressObject.address}" is duplicated in the request and the duplicate has been removed.`,
      )
    } else {
      addressMap[addressObject.address] = addressObject
    }
  }
  return Object.values(addressMap)
}

export async function runAllSequentially<T>({
  count,
  handler,
}: {
  count: number
  handler: (i: number) => Promise<T>
}): Promise<T[]> {
  const results: T[] = []
  for (let i = 0; i < count; i++) {
    results.push(await handler(i))
  }
  return results
}
