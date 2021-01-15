import { AdapterError } from '@chainlink/external-adapter'
import { Requester, Validator } from '@chainlink/external-adapter'
import { ExecuteWithConfig } from '@chainlink/types'
import { Config } from '../config'

export const NAME = 'vehicle'

const customParams = {
  product: true,
  year: true,
  make: true,
  model: true,
  customerid: false,
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
  const validator = new Validator(request, customParams)
  if (validator.error) throw validator.error

  const jobRunID = validator.validated.id
  const product = validator.validated.data.product.toUpperCase()
  if (product !== 'CPI')
    throw new AdapterError({
      jobRunID,
      message: 'invalid product',
      statusCode: 400,
    })

  const { year, make } = validator.validated.data
  const url = `${config.api.baseURL}/CPIAPI/CPIAPI/Vehicle/${year}/${make}`

  const { model, customerid } = validator.validated.data
  const params = {
    model,
    customerid,
  }

  const auth = {
    username: config.username,
    password: config.password,
  }

  const reqConfig = {
    url,
    params,
    auth,
  }

  const response = await Requester.request(reqConfig)
  const path = ['cpi_vehicles', 'cpi_vehicle_list', 0, 'excellent']
  const result = Requester.validateResultNumber(response.data, path)

  return Requester.success(jobRunID, {
    data: { result },
    result,
    status: 200,
  })
}
