import { Requester } from '@chainlink/external-adapter-framework/util/requester'
import { AdapterError } from '@chainlink/external-adapter-framework/validation/error'
import { createPrivateKey, createSign } from 'crypto'
import { HttpsProxyAgent } from 'https-proxy-agent'
import { stringify } from 'querystring'

interface GeneralResponse<T> {
  data: {
    data: T[]
    totalPage: number
    pageNo: number
    pageLimit: number
  }
  code: string
  message: string
}

type EmptyParams = Record<string, never>
type WalletAssetListParams = {
  walletId: string
}

const successCode = '000000'

export const request = async <T>(
  baseUrl: string,
  url: string,
  params: EmptyParams | WalletAssetListParams,
  apiKey: string,
  privateKey: string,
  requester: Requester,
  proxy?: string,
) => {
  const results: T[] = []

  const finalParam = {
    ...params,
    pageLimit: 500,
    pageNo: 1,
    timestamp: Date.now(),
  }

  let requestNextPage = true
  while (requestNextPage) {
    const requestConfig = {
      baseURL: baseUrl,
      url: url,
      method: 'GET',
      httpsAgent: proxy && proxy.length > 0 ? new HttpsProxyAgent(proxy) : null,
      headers: {
        'open-apikey': apiKey,
        signature: sign(stringify(finalParam), privateKey),
      },
      params: finalParam,
    }

    const response = await requester.request<GeneralResponse<T>>(
      JSON.stringify(requestConfig),
      requestConfig,
    )

    if (!response || !response.response || !response.response.data) {
      throw new AdapterError({
        statusCode: 500,
        message: `Ceffu wallet API ${url} does not return data`,
      })
    }

    const data = response.response.data
    if (data.code != successCode) {
      throw new AdapterError({
        statusCode: 500,
        message: `Ceffu wallet API ${url} failed, code: ${data.code}, message:${data.message}`,
      })
    }

    requestNextPage = data.data.pageNo < data.data.totalPage
    finalParam.pageNo = data.data.pageNo + 1

    results.push(...data.data.data)
  }

  return results
}

export const sign = (data: string, privateKey: string) => {
  const key = createPrivateKey({
    key: Buffer.from(privateKey, 'base64'),
    type: 'pkcs8',
    format: 'der',
  })

  const sign = createSign('sha512WithRSAEncryption')
  sign.write(data)
  sign.end()

  return sign.sign(key, 'base64')
}
