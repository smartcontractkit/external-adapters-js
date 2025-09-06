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

export const request = async <T>(
  baseUrl: string,
  url: string,
  params: Record<string, string | number>,
  proxy: string,
  apiKey: string,
  privateKey: string,
  requester: Requester,
) => {
  const results: T[] = []

  params.pageLimit = 500
  params.pageNo = 1
  params.timestamp = Date.now()

  let loop = true
  while (loop) {
    const requestConfig = {
      baseURL: baseUrl,
      url: url,
      method: 'GET',
      httpsAgent: proxy.length > 0 ? new HttpsProxyAgent(proxy) : null,
      headers: {
        'open-apikey': apiKey,
        signature: sign(stringify(params), privateKey),
      },
      params,
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
    if (data.code != '000000') {
      throw new AdapterError({
        statusCode: 500,
        message: `Ceffu wallet API ${url} failed, code: ${data.code}, message:${data.message}`,
      })
    }

    loop = data.data.data.length != 0 && data.data.pageNo < data.data.totalPage
    params.pageNo = data.data.pageNo + 1

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
