import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Connection, PublicKey } from '@solana/web3.js'
import { inputParameters } from '../endpoint/solvJlp'

const logger = makeLogger('Solana helper functions')

type TokenMint = {
  token?: string
  contractAddress: string
}

type Address = {
  address: string
  chainId?: string
  network?: string
}

type ExtractedBalance = {
  value: bigint
  decimals: number
}

export const getToken = async (
  addresses: typeof inputParameters.validated.addresses,
  token: string,
  connection?: Connection,
) => {
  if (!connection) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'SOLANA_RPC_URL is missing',
    })
  }

  const response = await Promise.all(
    addresses
      .filter((a) => a.token?.toLowerCase() == token)
      .flatMap((a) =>
        a.wallets.map((wallet) => ({
          token: new PublicKey(a.contractAddress),
          wallet: new PublicKey(wallet),
        })),
      )
      .map(async (a) =>
        connection.getParsedTokenAccountsByOwner(a.wallet, {
          mint: a.token,
        }),
      ),
  )

  const result = response
    .flatMap((r) => r.value)
    .map((v) => ({
      value: BigInt(v.account.data.parsed.info.tokenAmount.amount),
      decimals: Number(v.account.data.parsed.info.tokenAmount.decimals),
    }))

  const formattedResponse = response
    .flatMap((r) => r.value)
    .map((r) => ({
      token: r.account.data.parsed.info.mint,
      wallet: r.account.data.parsed.info.owner,
      value: r.account.data.parsed.info.tokenAmount.amount,
      decimals: r.account.data.parsed.info.tokenAmount.decimals,
    }))

  return {
    result,
    formattedResponse,
  }
}

async function fetchTokenAccounts(address: string, mint: PublicKey, connection: Connection) {
  const response = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), { mint })

  if (response.value.length === 0) {
    logger.warn(`No token account found for address: ${address} and mint: ${mint.toBase58()}`)
  }

  return response.value
}

function extractBalances(
  accounts: Awaited<ReturnType<typeof fetchTokenAccounts>>,
): ExtractedBalance[] {
  if (accounts.length === 0) {
    return []
  }

  return accounts.map((v) => ({
    value: BigInt(v.account.data.parsed.info.tokenAmount.amount),
    decimals: Number(v.account.data.parsed.info.tokenAmount.decimals),
  }))
}

export const getTokenBalance = async (
  addresses: Address[],
  tokenMint: TokenMint,
  connection?: Connection,
): Promise<{ result: ExtractedBalance[] }> => {
  if (!connection) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'SOLANA_RPC_URL is missing',
    })
  }

  const mint = new PublicKey(tokenMint.contractAddress)

  // Error tolerant fetch
  const responses = await Promise.allSettled(
    addresses.map((addr) => fetchTokenAccounts(addr.address, mint, connection)),
  )

  // Flatten and normalize results
  const results = responses.flatMap((res) => {
    if (res.status === 'fulfilled') {
      return extractBalances(res.value)
    } else {
      logger.error(`Failed to fetch token accounts: ${res.reason}`)
      return []
    }
  })

  return { result: results }
}
