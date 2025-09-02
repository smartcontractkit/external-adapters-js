import { superstateApiKeyRequest, TransactionStatus } from '@superstateinc/api-key-request'
import { parseUnits } from 'ethers'
import { transport as nav } from '../endpoint/nav'
import { NetAssetValue } from './utils'

export interface ResponseSchema {
  ticker: string
  operation_type: string
  status: string
  share_amount: string
  dollar_amount: string
  notional_value: string
}

export const getTransactions = async (
  apiKey: string | undefined,
  apiSecret: string | undefined,
  ticker: string,
  operations: string[],
) => {
  const transactions = (await superstateApiKeyRequest({
    // Already validated in customInputValidation
    apiKey: apiKey || '',
    apiSecret: apiSecret || '',
    endpoint: 'v2/transactions',
    method: 'GET',
    queryParams: {
      transaction_status: TransactionStatus.Pending,
    },
  })) as ResponseSchema[]

  const result = (transactions ?? [])
    .filter((t) => t && t.ticker && t.operation_type)
    .filter((t) => t.ticker.toUpperCase() == ticker.toUpperCase())
    .filter((t) =>
      operations.map((op) => op.toUpperCase()).includes(t.operation_type.toUpperCase()),
    )

  return result
}

export const getNavPrice = async (fundId: number) => {
  const report = await nav.execute(fundId, NetAssetValue)
  if (!report || !report.result || report.result == 0) {
    throw new Error(`Unable to fetch nav for ${fundId}, received ${JSON.stringify(report)}`)
  } else {
    return report.result
  }
}

export const multiply = (decimals: number, t1: string, t2 = '1') => {
  const a = parseUnits(t1, decimals)
  const b = parseUnits(t2, decimals)
  const result = (a * b) / 10n ** BigInt(decimals)

  return result < 0n ? -result : result
}
