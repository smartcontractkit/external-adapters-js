import {
  AdapterDataProviderError,
  AdapterInputError,
} from '@chainlink/external-adapter-framework/validation/error'
import { address, getProgramDerivedAddress } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'
import { getSysvarClockDecoder, SYSVAR_CLOCK_ADDRESS } from '@solana/sysvars'

export const CLOCK_SYSVAR_ADDRESS = SYSVAR_CLOCK_ADDRESS
const clockDecoder = getSysvarClockDecoder()

type MultipleAccountsResponse = Awaited<
  ReturnType<ReturnType<Rpc<SolanaRpcApi>['getMultipleAccounts']>['send']>
>

export type AccountInfo = NonNullable<MultipleAccountsResponse['value']>[number]

export type PdaSeed = Parameters<typeof getProgramDerivedAddress>[0]['seeds'][number]

export const providerError = (message: string) =>
  new AdapterDataProviderError(
    {
      message,
      statusCode: 502,
    },
    {
      providerDataRequestedUnixMs: 0,
      providerDataReceivedUnixMs: 0,
      providerIndicatedTimeUnixMs: undefined,
    },
  )

export const parseSolanaAddress = (value: string, name: string) => {
  try {
    return address(value)
  } catch {
    throw new AdapterInputError({
      message: `${name} must be a valid Solana address`,
      statusCode: 400,
    })
  }
}

export const derivePda = async (programAddress: string, seeds: PdaSeed[]) => {
  const [pda] = await getProgramDerivedAddress({
    programAddress: parseSolanaAddress(programAddress, 'programAddress'),
    seeds,
  })

  return pda
}

export const getAccountDataBuffer = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
) => {
  const encodedData = accountInfo?.data?.[0]
  if (typeof encodedData !== 'string' || encodedData.length === 0) {
    throw providerError(`No account data found for ${description}`)
  }

  return Buffer.from(encodedData, 'base64')
}

export const assertOwnerProgram = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
  expectedOwners: string[],
  ownerDescription: string,
) => {
  const owner = accountInfo?.owner?.toString()
  if (!owner || !expectedOwners.includes(owner)) {
    throw providerError(
      `Expected ${description} to be owned by ${ownerDescription} [${expectedOwners.join(
        ', ',
      )}], found '${owner}'`,
    )
  }
}

export const assertDataLength = (data: Buffer, description: string, minLength: number) => {
  if (data.length < minLength) {
    throw providerError(
      `Expected ${description} account data to be at least ${minLength} bytes, found ${data.length}`,
    )
  }
}

export const assertDiscriminator = (data: Buffer, description: string, discriminator: Buffer) => {
  if (!data.subarray(0, discriminator.length).equals(discriminator)) {
    throw providerError(
      `Expected ${description} discriminator to be ${discriminator.toString('hex')}, found ${data
        .subarray(0, discriminator.length)
        .toString('hex')}`,
    )
  }
}

export const decodeClockUnixTimestamp = (accountInfo: AccountInfo | null | undefined) => {
  const data = getAccountDataBuffer(accountInfo, `Clock sysvar '${CLOCK_SYSVAR_ADDRESS}'`)

  return clockDecoder.decode(data).unixTimestamp
}

export const fetchMultipleAccounts = async (rpc: Rpc<SolanaRpcApi>, addresses: string[]) => {
  const encoding = 'base64' as const
  const validatedAddresses = addresses.map((accountAddress) =>
    parseSolanaAddress(accountAddress, 'address'),
  )
  let resp: MultipleAccountsResponse
  try {
    resp = await rpc.getMultipleAccounts(validatedAddresses, { encoding }).send()
  } catch (e: unknown) {
    throw providerError(e instanceof Error ? e.message : 'Failed to fetch Solana accounts')
  }

  if (!resp.value || resp.value.length !== addresses.length) {
    throw providerError(
      `Expected ${addresses.length} account responses, received ${resp.value?.length ?? 0}`,
    )
  }

  return resp.value
}
