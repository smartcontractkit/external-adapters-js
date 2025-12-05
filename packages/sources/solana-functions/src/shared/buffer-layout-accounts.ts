import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import * as BufferLayout from '@solana/buffer-layout'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { AccountLayout, MintLayout } from '@solana/spl-token'

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

const solanaTokenProgramAddress = 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA'
const sanctumControllerProgramAddress = '5ocnV1qiCgaQR8Jb8xWnVbApfaygJ8tNoZfgPwsgx9kx'

// https://github.com/solana-labs/solana-program-library/blob/token-v4.0.0/token/program/src/state.rs#L37
const MINT_SIZE = 82
// https://github.com/solana-labs/solana-program-library/blob/token-v4.0.0/token/program/src/state.rs#L129
const TOKEN_ACCOUNT_SIZE = 165

const programToBufferLayoutMap: Record<string, BufferLayout.Layout<unknown>> = {
  [sanctumControllerProgramAddress]: SanctumPoolStateLayout,
}

export const fetchFieldFromBufferLayoutStateAccount = async ({
  stateAccountAddress,
  field,
  rpc,
}: {
  stateAccountAddress: string
  field: string
  rpc: Rpc<SolanaRpcApi>
}): Promise<string> => {
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

  // Dynamically select layout for Token Program accounts based on size
  let layout: BufferLayout.Layout<unknown>

  if (programAddress.toString() === solanaTokenProgramAddress) {
    if (data.length === MINT_SIZE) {
      layout = MintLayout
    } else if (data.length === TOKEN_ACCOUNT_SIZE) {
      layout = AccountLayout
    } else {
      throw new AdapterInputError({
        message: `Unsupported Token Program account size: ${data.length} bytes. Expected ${MINT_SIZE} (Mint) or ${TOKEN_ACCOUNT_SIZE} (Token Account)`,
        statusCode: 500,
      })
    }
  } else {
    layout = programToBufferLayoutMap[programAddress.toString()]

    if (!layout) {
      throw new AdapterInputError({
        message: `No layout known for program address '${programAddress}'`,
        statusCode: 500,
      })
    }
  }
  const dataDecoded = layout.decode(data) as Record<string, unknown>
  const resultValue = dataDecoded[field]

  if (resultValue === undefined || resultValue === null) {
    throw new AdapterInputError({
      message: `No field '${field}' in layout for program with address '${programAddress}'. Available fields are: ${Object.keys(
        dataDecoded,
      ).join(', ')}`,
      statusCode: 500,
    })
  }

  return resultValue.toString()
}
