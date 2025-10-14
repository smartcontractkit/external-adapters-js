import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import { Connection, PublicKey } from '@solana/web3.js'
import { config } from '../config'
import { inputParameters } from '../endpoint/solvJlp'

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

export const getSolanaRpcUrl = (settings: typeof config.settings) => {
  if (!settings.SOLANA_RPC_URL) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Environment variable SOLANA_RPC_URL is missing',
    })
  }
  return settings.SOLANA_RPC_URL
}
