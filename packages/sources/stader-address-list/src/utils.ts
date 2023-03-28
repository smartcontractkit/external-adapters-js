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

export type validatorPool = [poolName: string, poolAddress: string]

export const filterDuplicates = <T extends BasicAddress>(addresses: T[]): T[] => {
  const uniqueMap: Record<string, boolean> = {}
  const uniqueAddresses: T[] = []
  for (const addressObject of addresses) {
    if (uniqueMap[addressObject.address]) {
      logger.warn(
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

export const buildErrorResponse = (
  errorMessage: string,
  providerDataRequestedUnixMs: number,
): TimestampedProviderErrorResponse => {
  return {
    statusCode: 502,
    errorMessage,
    timestamps: {
      providerDataRequestedUnixMs,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  }
}
