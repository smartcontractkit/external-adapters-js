import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { address, getProgramDerivedAddress } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'

export const CLOCK_SYSVAR_ADDRESS = 'SysvarC1ock11111111111111111111111111111111'

// Solana Clock sysvar layout stores unix_timestamp as an i64 at byte offset 32.
const CLOCK_ACCOUNT_LENGTH = 40
const CLOCK_UNIX_TIMESTAMP_OFFSET = 32

type MultipleAccountsResponse = Awaited<
  ReturnType<ReturnType<Rpc<SolanaRpcApi>['getMultipleAccounts']>['send']>
>

export type AccountInfo = NonNullable<MultipleAccountsResponse['value']>[number]

export type PdaSeed = Parameters<typeof getProgramDerivedAddress>[0]['seeds'][number]

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
    throw new AdapterInputError({
      message: `No account data found for ${description}`,
      statusCode: 500,
    })
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
    throw new AdapterInputError({
      message: `Expected ${description} to be owned by ${ownerDescription} [${expectedOwners.join(
        ', ',
      )}], found '${owner}'`,
      statusCode: 500,
    })
  }
}

export const assertNameMatches = (
  actualName: string,
  expectedName: string,
  description: string,
) => {
  if (actualName !== expectedName) {
    throw new AdapterInputError({
      message: `Expected ${description} name to be '${expectedName}', found '${actualName}'`,
      statusCode: 500,
    })
  }
}

export const assertAddressMatches = (actual: string, expected: string, description: string) => {
  if (actual !== expected) {
    throw new AdapterInputError({
      message: `Expected ${description} to be '${expected}', found '${actual}'`,
      statusCode: 500,
    })
  }
}

export const assertDataLength = (data: Buffer, description: string, minLength: number) => {
  if (data.length < minLength) {
    throw new AdapterInputError({
      message: `Expected ${description} account data to be at least ${minLength} bytes, found ${data.length}`,
      statusCode: 500,
    })
  }
}

export const assertDiscriminator = (data: Buffer, description: string, discriminator: Buffer) => {
  if (!data.subarray(0, discriminator.length).equals(discriminator)) {
    throw new AdapterInputError({
      message: `Expected ${description} discriminator to be ${discriminator.toString(
        'hex',
      )}, found ${data.subarray(0, discriminator.length).toString('hex')}`,
      statusCode: 500,
    })
  }
}

export const decodeClockUnixTimestamp = (accountInfo: AccountInfo | null | undefined) => {
  const data = getAccountDataBuffer(accountInfo, `Clock sysvar '${CLOCK_SYSVAR_ADDRESS}'`)
  assertDataLength(data, 'Clock sysvar', CLOCK_ACCOUNT_LENGTH)

  return data.readBigInt64LE(CLOCK_UNIX_TIMESTAMP_OFFSET)
}

export const fetchMultipleAccounts = async (rpc: Rpc<SolanaRpcApi>, addresses: string[]) => {
  const encoding = 'base64' as const
  const validatedAddresses = addresses.map((accountAddress) =>
    parseSolanaAddress(accountAddress, 'address'),
  )
  const resp = await rpc.getMultipleAccounts(validatedAddresses, { encoding }).send()

  if (!resp.value || resp.value.length !== addresses.length) {
    throw new AdapterInputError({
      message: `Expected ${addresses.length} account responses, received ${
        resp.value?.length ?? 0
      }`,
      statusCode: 500,
    })
  }

  return resp.value
}
