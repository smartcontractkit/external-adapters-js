import { makeLogger } from '@chainlink/external-adapter-framework/util'
import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Connection, PublicKey } from '@solana/web3.js'
import { inputParameters } from '../endpoint/solvJlp'

const logger = makeLogger('Solana helper functions')

type tokenMint = {
  token?: string
  contractAddress: string
}

type address = {
  address: string
  chainId?: string
  network?: string
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

function sanitizeInputs(addresses: { address: string }[], tokenMint: { contractAddress: string }) {
  return {
    mint: new PublicKey(tokenMint.contractAddress.trim()),
    normalizedAddresses: addresses.map((a) => a.address.trim()),
  }
}

async function fetchTokenAccounts(address: string, mint: PublicKey, connection: Connection) {
  const response = await connection.getParsedTokenAccountsByOwner(new PublicKey(address), { mint })

  if (response.value.length === 0) {
    logger.warn(`No token account found for address: ${address} and mint: ${mint.toBase58()}`)
  }

  return response
}

function extractBalances(
  response: Awaited<ReturnType<typeof fetchTokenAccounts>>,
  cachedDecimals: number,
) {
  if (response.value.length === 0) {
    return [
      {
        token: '',
        wallet: '',
        value: BigInt(0),
        decimals: cachedDecimals,
      },
    ]
  }

  return response.value.map((v) => ({
    token: v.account.data.parsed.info.mint,
    wallet: v.account.data.parsed.info.owner,
    value: BigInt(v.account.data.parsed.info.tokenAmount.amount),
    decimals: Number(v.account.data.parsed.info.tokenAmount.decimals ?? cachedDecimals),
  }))
}

export const getTokenBalance = async (
  addresses: address[],
  tokenMint: tokenMint,
  connection?: Connection,
) => {
  if (!connection) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'SOLANA_RPC_URL is missing',
    })
  }

  const { mint, normalizedAddresses } = sanitizeInputs(addresses, tokenMint)

  // Cache decimals (fetch from mint account once)
  const mintInfo = await connection.getParsedAccountInfo(mint)
  let cachedDecimals = 0
  if (mintInfo.value?.data && 'parsed' in mintInfo.value.data) {
    cachedDecimals = mintInfo.value.data.parsed.info.decimals
  }

  // Error tolerant fetch
  const responses = await Promise.allSettled(
    normalizedAddresses.map((address) => fetchTokenAccounts(address, mint, connection)),
  )

  // Flatten and normalize results
  const results = responses.flatMap((res) => {
    if (res.status === 'fulfilled') {
      return extractBalances(res.value, cachedDecimals)
    } else {
      logger.error(`Failed to fetch token accounts: ${res.reason}`)
      return []
    }
  })

  return { result: results }
}
