import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import * as BufferLayout from '@solana/buffer-layout'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { StakePoolLayout } from '@solana/spl-stake-pool'
import {
  AccountLayout,
  MintLayout,
  TOKEN_2022_PROGRAM_ID,
  TOKEN_PROGRAM_ID,
} from '@solana/spl-token'
import { assertDataLength } from './solana-account-utils'

export const LEGACY_TOKEN_PROGRAM_ADDRESS = TOKEN_PROGRAM_ID.toBase58()
export const TOKEN_2022_PROGRAM_ADDRESS = TOKEN_2022_PROGRAM_ID.toBase58()
export const TOKEN_PROGRAM_ADDRESSES = [LEGACY_TOKEN_PROGRAM_ADDRESS, TOKEN_2022_PROGRAM_ADDRESS]

export type MintInfo = {
  supply: bigint
  decimals: number
}

export type TokenAccountInfo = {
  mintAddress: string
  ownerAddress: string
  amount: bigint
}

type DecodedMint = {
  supply: bigint
  decimals: number
}

type DecodedTokenAccount = {
  mint: { toBase58?(): string; toString(): string }
  owner: { toBase58?(): string; toString(): string }
  amount: bigint
}

interface SanctumPoolState {
  total_sol_value: bigint
  trading_protocol_fee_bps: number
  lp_protocol_fee_bps: number
  version: number
  is_disabled: number
  is_rebalancing: number
  padding: number[]
  admin: Uint8Array
  rebalance_authority: Uint8Array
  protocol_fee_beneficiary: Uint8Array
  pricing_program: Uint8Array
  lp_token_mint: Uint8Array
}

const SanctumPoolStateLayout = BufferLayout.struct<SanctumPoolState>([
  BufferLayout.nu64('total_sol_value'),
  BufferLayout.u16('trading_protocol_fee_bps'),
  BufferLayout.u16('lp_protocol_fee_bps'),
  BufferLayout.u8('version'),
  BufferLayout.u8('is_disabled'),
  BufferLayout.u8('is_rebalancing'),
  BufferLayout.seq(BufferLayout.u8(), 1, 'padding'),
  BufferLayout.blob(32, 'admin'),
  BufferLayout.blob(32, 'rebalance_authority'),
  BufferLayout.blob(32, 'protocol_fee_beneficiary'),
  BufferLayout.blob(32, 'pricing_program'),
  BufferLayout.blob(32, 'lp_token_mint'),
])

const solanaTokenProgramAddress = LEGACY_TOKEN_PROGRAM_ADDRESS
const solanaToken2022ProgramAddress = TOKEN_2022_PROGRAM_ADDRESS
const solanaStakePoolProgramAddress = 'SPoo1Ku8WFXoNDMHPsrGSTSG1Y47rzgn41SLUNakuHy'
const sanctumControllerProgramAddress = '5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx'

const programToBufferLayoutMap: Record<string, BufferLayout.Layout<unknown>[]> = {
  [solanaTokenProgramAddress]: [AccountLayout, MintLayout],
  [solanaToken2022ProgramAddress]: [AccountLayout, MintLayout],
  [solanaStakePoolProgramAddress]: [StakePoolLayout],
  [sanctumControllerProgramAddress]: [SanctumPoolStateLayout],
}

const publicKeyToString = (value: { toBase58?(): string; toString(): string }) =>
  value.toBase58 ? value.toBase58() : value.toString()

export const decodeMintInfo = (data: Buffer, description: string): MintInfo => {
  assertDataLength(data, description, MintLayout.span)
  const decoded = MintLayout.decode(data) as DecodedMint

  return {
    supply: decoded.supply,
    decimals: decoded.decimals,
  }
}

export const decodeTokenAccountInfo = (data: Buffer, description: string): TokenAccountInfo => {
  assertDataLength(data, description, AccountLayout.span)
  const decoded = AccountLayout.decode(data) as DecodedTokenAccount

  return {
    mintAddress: publicKeyToString(decoded.mint),
    ownerAddress: publicKeyToString(decoded.owner),
    amount: decoded.amount,
  }
}

const getLayout = (programAddress: string, dataLength: number): BufferLayout.Layout<unknown> => {
  const layoutCandidates = programToBufferLayoutMap[programAddress]
  if (!layoutCandidates) {
    throw new AdapterInputError({
      message: `No layout known for program address '${programAddress}'`,
      statusCode: 500,
    })
  }
  if (layoutCandidates.length === 1) {
    const layout = layoutCandidates[0]
    if (layout) return layout
  }
  for (const layout of layoutCandidates) {
    if (layout.span === dataLength) {
      return layout
    }
  }
  throw new AdapterInputError({
    message: `No layout with matching data length (${dataLength}) for program address '${programAddress}'. Available layouts have lengths: [${layoutCandidates
      .map((l) => l.span)
      .join(', ')}]`,
    statusCode: 500,
  })
}

export const fetchDataFromBufferLayoutStateAccount = async ({
  stateAccountAddress,
  rpc,
}: {
  stateAccountAddress: string
  rpc: Rpc<SolanaRpcApi>
}): Promise<{
  programAddress: string
  data: Record<string, unknown>
}> => {
  const encoding = 'base64'
  const resp = await rpc.getAccountInfo(stateAccountAddress as Address, { encoding }).send()
  const programAddress = resp.value?.owner
  if (!programAddress) {
    throw new AdapterInputError({
      message: `No program address found for state account '${stateAccountAddress}'`,
      statusCode: 500,
    })
  }

  const data = Buffer.from(resp.value.data[0] as string, encoding)
  const layout = getLayout(programAddress.toString(), data.length)
  const decodedData = layout.decode(data) as Record<string, unknown>
  return {
    programAddress: programAddress.toString(),
    data: decodedData,
  }
}

export const fetchFieldFromBufferLayoutStateAccount = async ({
  stateAccountAddress,
  field,
  extraFields,
  rpc,
}: {
  stateAccountAddress: string
  field: string
  extraFields?: string[]
  rpc: Rpc<SolanaRpcApi>
}) => {
  const { programAddress, data: dataDecoded } = await fetchDataFromBufferLayoutStateAccount({
    stateAccountAddress,
    rpc,
  })
  const resultValue = dataDecoded[field]

  if (resultValue === undefined || resultValue === null) {
    throw new AdapterInputError({
      message: `No field '${field}' in layout for program with address '${programAddress}'. Available fields are: ${Object.keys(
        dataDecoded,
      ).join(', ')}`,
      statusCode: 500,
    })
  }

  return {
    result: resultValue.toString(),
    extraFields: Object.fromEntries(
      (extraFields ?? []).map((f) => [f, dataDecoded[f]?.toString()]),
    ),
  }
}
