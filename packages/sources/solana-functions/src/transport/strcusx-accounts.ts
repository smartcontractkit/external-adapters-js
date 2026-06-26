import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BorshAccountsCoder, type Idl } from '@coral-xyz/anchor'
import * as StrcusxYieldStrategyIDL from '../idl/strcusx_yield_strategy.json'
import { decodeAnchorAccount, toBigint, type Stringable } from '../shared/account-reader'
import { calculateUnvestedAssets } from '../shared/exchange-rate-utils'
import { derivePda, providerError, type PdaSeed } from '../shared/solana-account-utils'

const STRATEGY_NAME_LENGTH = 32

export const PDA_SEEDS = {
  CONTROLLER: 'CONTROLLER',
  STRATEGY: 'STRATEGY',
  ACCOUNTING: 'ACCOUNTING',
} as const

const strcusxAccountsCoder = new BorshAccountsCoder(StrcusxYieldStrategyIDL as Idl)

export type Tranche = 'junior' | 'senior'

type DecodedAccountingState = {
  senior_shares: Stringable
  junior_shares: Stringable
  total_assets: Stringable
  senior_assets: Stringable
  total_vesting_assets: Stringable
  senior_vesting_assets: Stringable
  vesting_start_time: Stringable
  vesting_end_time: Stringable
}

type AccountingState = {
  seniorShares: bigint
  juniorShares: bigint
  totalAssets: bigint
  seniorAssets: bigint
  totalVestingAssets: bigint
  seniorVestingAssets: bigint
  vestingStartTime: bigint
  vestingEndTime: bigint
}

export const parseStrategyName = (value: string) => {
  const byteLength = Buffer.byteLength(value)
  if (byteLength === 0 || byteLength > STRATEGY_NAME_LENGTH) {
    throw new AdapterInputError({
      message: `strategyName must be 1-${STRATEGY_NAME_LENGTH} UTF-8 bytes`,
      statusCode: 400,
    })
  }

  return value
}

export const deriveAccountAddress = (programAddress: string, seeds: PdaSeed[]) =>
  derivePda(programAddress, seeds).then((pda) => pda.toString())

export const decodeControllerState = (data: Buffer) => {
  const decoded = decodeAnchorAccount<{ asset_mint: Stringable }>(
    strcusxAccountsCoder,
    'Controller',
    data,
  )

  return {
    assetMintAddress: decoded.asset_mint.toString(),
  }
}

export const decodeStrategyState = (data: Buffer) => {
  const decoded = decodeAnchorAccount<{ junior_mint: Stringable; senior_mint: Stringable }>(
    strcusxAccountsCoder,
    'Strategy',
    data,
  )

  return {
    juniorMintAddress: decoded.junior_mint.toString(),
    seniorMintAddress: decoded.senior_mint.toString(),
  }
}

export const decodeAccountingState = (data: Buffer): AccountingState => {
  const decoded = decodeAnchorAccount<DecodedAccountingState>(
    strcusxAccountsCoder,
    'AccountingState',
    data,
  )

  return {
    seniorShares: toBigint(decoded.senior_shares),
    juniorShares: toBigint(decoded.junior_shares),
    totalAssets: toBigint(decoded.total_assets),
    seniorAssets: toBigint(decoded.senior_assets),
    totalVestingAssets: toBigint(decoded.total_vesting_assets),
    seniorVestingAssets: toBigint(decoded.senior_vesting_assets),
    vestingStartTime: toBigint(decoded.vesting_start_time),
    vestingEndTime: toBigint(decoded.vesting_end_time),
  }
}

export const calculateBookValueAssets = (accounting: AccountingState, unixTimestamp: bigint) => {
  if (accounting.seniorVestingAssets > accounting.totalVestingAssets) {
    throw providerError(
      'AccountingState seniorVestingAssets must be less than or equal to totalVestingAssets',
    )
  }

  const unvestedTotalVestingAssets = calculateUnvestedAssets(
    accounting.totalVestingAssets,
    unixTimestamp,
    accounting.vestingStartTime,
    accounting.vestingEndTime,
  )
  const unvestedSeniorVestingAssets = calculateUnvestedAssets(
    accounting.seniorVestingAssets,
    unixTimestamp,
    accounting.vestingStartTime,
    accounting.vestingEndTime,
  )

  if (accounting.totalAssets < unvestedTotalVestingAssets) {
    throw providerError(
      'AccountingState totalAssets must be greater than or equal to unvested totalVestingAssets',
    )
  }
  if (accounting.seniorAssets < unvestedSeniorVestingAssets) {
    throw providerError(
      'AccountingState seniorAssets must be greater than or equal to unvested seniorVestingAssets',
    )
  }

  return {
    totalAssets: accounting.totalAssets - unvestedTotalVestingAssets,
    seniorAssets: accounting.seniorAssets - unvestedSeniorVestingAssets,
  }
}
