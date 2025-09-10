import { BorshCoder, Idl } from '@coral-xyz/anchor'
import { getProgramDerivedAddress, type Address } from '@solana/addresses'
import { type Rpc, type SolanaRpcApi } from '@solana/rpc'

export class SolanaAccountReader {
  // Fetch account information by deriving an address given a program address and a list of seeds
  // accountName must match the IDL exactly
  // seeds typed as any due to type not being exported by @solana/addresses
  async fetchAccountInformationByAddressAndSeeds<T>(
    rpc: Rpc<SolanaRpcApi>,
    programAddress: Address,
    seeds: any[],
    accountName: string,
    idl: Idl,
  ): Promise<T> {
    const [pda] = await getProgramDerivedAddress({
      programAddress,
      seeds,
    })

    return this.fetchAccountInformation(rpc, pda, accountName, idl)
  }

  // Fetch account information for a single address, accountName must match IDL account name exactly
  async fetchAccountInformation<T>(
    rpc: Rpc<SolanaRpcApi>,
    address: Address,
    accountName: string,
    idl: Idl,
  ): Promise<T> {
    const encoding = 'base64'
    const resp = await rpc.getAccountInfo(address, { encoding }).send()
    const value = resp.value
    if (!value?.data?.[0]) {
      throw new Error(`Account ${accountName} not found at ${address}`)
    }
    const dataEncoded = value.data[0] as string
    const data = Buffer.from(dataEncoded, encoding)
    const coder = new BorshCoder(idl as unknown as Idl)
    return coder.accounts.decode(accountName, data) as unknown as T
  }
}
