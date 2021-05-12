import { Requester, Validator, AdapterError, logger } from '@chainlink/external-adapter'
import { ExecuteWithConfig, Config } from '@chainlink/types'

export const NAME = 'territoryanalyzer'

const customError = (data: any) => data.error

const customParams = {
  propertyZip: true,
}

const timeAgo = (years = 3) => {
  const date = new Date()
  const mm = date.getMonth() + 1 // getMonth() is zero-based
  const dd = date.getDate()

  return [date.getFullYear() - years, (mm > 9 ? '' : '0') + mm, (dd > 9 ? '' : '0') + dd].join('')
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const { propertyZip } = validator.validated.data
  const url = `rest_api/get/territory/analyzer`

  const isValidZip = /(^\d{5}$)|(^\d{5}-\d{4}$)/.test(`${propertyZip}`)

  if (!isValidZip) {
    throw new AdapterError({
      jobRunID,
      message: 'Invalid zip code',
      cause: 'RegExp mismatch',
      statusCode: 400,
    })
  }

  const timeout = 20000

  const options = {
    ...config.api,
    withCredentials: false,
    method: 'post',
    data: {
      searchVars: {
        propertyZip,
        saleDateFrom: timeAgo(),
      },
    },
    url,
    headers: {
      'api-key': process.env.API_KEY,
      'Content-Type': 'application/json',
    },
  }

  const response = await Requester.request(options, customError, 3, timeout)
  const result = Object.values(response.data.data.soldAvgPriceArry)

  return Requester.success(jobRunID, {
    data: config.verbose ? { ...response.data, result } : { result },
    result,
    status: 200,
  })
}
