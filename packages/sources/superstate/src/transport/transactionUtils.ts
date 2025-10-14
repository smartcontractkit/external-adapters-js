import { superstateApiKeyRequest, TransactionStatus } from '@superstateinc/api-key-request'
import { parseUnits } from 'ethers'
import { navTransport } from '../transport/nav'
import { NetAssetValue } from './utils'

export interface ResponseSchema {
  ticker: string
  operation_type: string
  status: string
  share_amount: string
  dollar_amount: string
  notional_value: string
  created_at: string
}

export const getTransactions = async (
  apiKey: string | undefined,
  apiSecret: string | undefined,
  ticker: string,
  transactionStatus: TransactionStatus,
  operations: string[],
) => {
  if (!apiKey || !apiSecret) {
    // This should never happen because we already validated in customInputValidation
    throw new Error('apiKey or apiSecret is empty')
  }
  const transactions = (await superstateApiKeyRequest({
    apiKey: apiKey,
    apiSecret: apiSecret,
    endpoint: 'v2/transactions',
    method: 'GET',
    queryParams: {
      transaction_status: transactionStatus,
    },
  })) as ResponseSchema[]

  const filtered = (transactions ?? [])
    .filter((t) => t && t.ticker && t.operation_type)
    .filter((t) => t.ticker.toUpperCase() == ticker.toUpperCase())
    .filter((t) =>
      operations.map((op) => op.toUpperCase()).includes(t.operation_type.toUpperCase()),
    )

  // Dedupe using created_at
  return Array.from(new Map(filtered.map((t) => [t.created_at, t])).values())
}

export const getNavPrice = async (fundId: number) => {
  const report = await navTransport.execute(fundId, NetAssetValue)
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
