import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { BorshAccountsCoder, Idl } from '@coral-xyz/anchor'
import { type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import * as adrenaProgramIdl from '../idl/adrena.json'
import * as flashTradeProgramIdl from '../idl/flash_trade.json'
import * as fragmetricLiquidRestakingProgramIdl from '../idl/fragmetric_liquid_restaking.json'

const programToIdlMap: Record<string, Idl> = {
  fragnAis7Bp6FTsMoa6YcH8UffhEw43Ph79qAiK3iF3: fragmetricLiquidRestakingProgramIdl as Idl,
  '13gDzEXCdocbj8iAiqrScGo47NiSuYENGsRqi3SEAwet': adrenaProgramIdl as Idl,
  FLASH6Lo6h3iasJKWDs2F8TkW2UKf3s15C8PMGuVfgBn: flashTradeProgramIdl as Idl,
}

export const getAnchorData = async <const Fields extends string[]>({
  rpc,
  stateAccountAddress,
  account,
  fields,
}: {
  rpc: Rpc<SolanaRpcApi>
  stateAccountAddress: string
  account: string
  fields: Fields
}): Promise<Record<Fields[number], any>> => {
  const encoding = 'base64'

  const resp = await rpc.getAccountInfo(stateAccountAddress as Address, { encoding }).send()
  const programAddress = resp.value?.owner
  if (!programAddress) {
    throw new AdapterInputError({
      message: `No program address found for state account '${stateAccountAddress}'`,
      statusCode: 500,
    })
  }

  const idl = programToIdlMap[programAddress.toString()]

  if (!idl) {
    throw new AdapterInputError({
      message: `No IDL known for program address '${programAddress}'`,
      statusCode: 500,
    })
  }

  const data = Buffer.from(resp.value.data[0] as string, encoding)
  const coder = new BorshAccountsCoder(idl as unknown as Idl)
  const dataDecoded = coder.decode(account, data)
  for (const field of fields) {
    const value = dataDecoded[field]
    if (value === undefined || value === null) {
      throw new AdapterInputError({
        message: `No field '${field}' in IDL for program with address '${programAddress}'. Available fields are: ${Object.keys(
          dataDecoded,
        ).join(', ')}`,
        statusCode: 500,
      })
    }
  }
  return Object.fromEntries(
    Object.entries(dataDecoded).filter(([key]) => fields.includes(key)),
  ) as Record<Fields[number], any>
}
