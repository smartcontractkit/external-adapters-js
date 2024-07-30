import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'
import CryptoJS from 'crypto-js'
import { BaseEndpointTypes } from '../endpoint/balance'

export const sign = (str: string, secret: string) => {
  const hash = CryptoJS.HmacSHA256(str, secret)
  return hash.toString(CryptoJS.enc.Base64)
}

export const getApiKeys = (apiKey: string, config: BaseEndpointTypes['Settings']) => {
  if (apiKey) {
    const signingKeyName = `${apiKey}_SIGNING_KEY`
    const accessKeyName = `${apiKey}_ACCESS_KEY`
    const passPhraseName = `${apiKey}_PASSPHRASE`

    const signingKey = process.env[signingKeyName]
    const accessKey = process.env[accessKeyName]
    const passPhrase = process.env[passPhraseName]

    if (!signingKey || !accessKey || !passPhrase) {
      throw new AdapterInputError({
        statusCode: 400,
        message: `Missing '${signingKeyName}' or '${accessKeyName}' or '${passPhraseName}' environment variables.`,
      })
    }

    return [signingKey, accessKey, passPhrase]
  } else {
    return [config.SIGNING_KEY, config.ACCESS_KEY, config.PASSPHRASE]
  }
}
