import {
  makeLogger,
  TimestampedProviderErrorResponse,
} from '@chainlink/external-adapter-framework/util'
import { BasicAddress } from './endpoint/address'

const logger = makeLogger('StaderAddressListUtil')

export type validatorsRegistryResponse = [
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

export const filterDuplicates = <T extends BasicAddress>(addresses: T[]): T[] => {
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

export const calculatePages = (count: number, batchSize: number): number => {
  return count % batchSize === 0 ? count / batchSize : count / batchSize + 1
}

export const buildErrorResponse = (errorMessage: string): TimestampedProviderErrorResponse => {
  return {
    statusCode: 502,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs: 0,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
