import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'

export type EncodedAccountData = readonly [string, string]

export type AccountInfo = {
  data?: EncodedAccountData
  owner?: { toString(): string } | string
}

type MultipleAccountsRpcResponse = {
  value?: (AccountInfo | null)[]
}

export const getAccountDataBuffer = (
  accountInfo: AccountInfo | null | undefined,
  description: string,
) => {
  const encodedData = accountInfo?.data?.[0]
  if (!encodedData) {
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

export const fetchMultipleAccounts = async (rpc: Rpc<SolanaRpcApi>, addresses: string[]) => {
  const encoding = 'base64'
  const resp = (await rpc
    .getMultipleAccounts(addresses as Address[], { encoding })
    .send()) as MultipleAccountsRpcResponse

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
