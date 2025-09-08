import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { request } from './requester'

interface WalletApiResponse {
  walletId: number
  walletName: string
  walletType: number
  walletIdStr: string
}

export const getWallets = async (
  url: string,
  apiKey: string,
  privateKey: string,
  requester: Requester,
  proxy?: string,
): Promise<string[]> => {
  const response = await request<WalletApiResponse>(
    url,
    '/open-api/v1/wallet/list',
    {},
    apiKey,
    privateKey,
    requester,
    proxy,
  )

  if (!response || response.length == 0) {
    throw new AdapterError({
      statusCode: 500,
      message: 'Ceffu wallet list API returns empty wallets',
    })
  }

  return response.map((d) => d.walletIdStr)
}

interface AssetApiResponse {
  coinSymbol: string
  network: string | null
  amount: string
  availableAmount: string
  totalAmountWithMirror: string
}

export const getAssets = async (
  walletId: string,
  url: string,
  apiKey: string,
  privateKey: string,
  requester: Requester,
  proxy?: string,
): Promise<
  {
    coin: string
    amount: string
  }[]
> => {
  const response = await request<AssetApiResponse>(
    url,
    '/open-api/v1/wallet/asset/list',
    { walletId },
    apiKey,
    privateKey,
    requester,
    proxy,
  )

  if (!response || response.length == 0) {
    throw new AdapterError({
      statusCode: 500,
      message: 'Ceffu wallet asset API returns empty assets',
    })
  }

  return response
    .filter((r) => Number(r.amount) > 0)
    .map((r) => ({
      coin: r.coinSymbol,
      amount: r.amount,
    }))
}
