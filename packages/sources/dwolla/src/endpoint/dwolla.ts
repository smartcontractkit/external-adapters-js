import * as dwolla from 'dwolla-v2'

export const NAME = 'dwolla'

type Response = {
  jobRunID: string
  statusCode: number
  status?: string
  data: any
  result: any
  error?: any
}

export type JobRequest = {
  id: string
  data: Request
}

export type Request = {
  method?: string
}

export type GetRequest = Request & {
  transfer_id: string
}

export type SendRequest = Request & {
  destination: string
  amount: string
  currency?: string
  source?: string
}

const ENV = process.env.ENVIRONMENT || 'sandbox'
const ENDPOINT =
  ENV.toLowerCase() === 'sandbox' ? 'https://api-sandbox.dwolla.com' : 'https://api.dwolla.com'
const FUNDING_SOURCE = process.env.FUNDING_SOURCE || ''

let client: any = new dwolla.Client({
  key: process.env.DWOLLA_APP_KEY || '',
  secret: process.env.DWOLLA_APP_SECRET || '',
  environment: (ENV as 'sandbox' | 'production') || undefined,
})

// Convert xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (32 chars)
// into xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format
const convertToLongUUID = (uuid: string): string => {
  if (uuid.length != 32) return uuid
  return uuid.replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5')
}

const getTransfer = async (id: string) => {
  return new Promise((resolve, reject) => {
    client.auth
      .client()
      .then((appToken: any) => appToken.get(ENDPOINT + '/transfers/' + convertToLongUUID(id)))
      .then((res: any) => resolve({ statusCode: res.status, data: res.body }))
      .catch((err: any) => {
        reject({ statusCode: err.status, data: err.body.message })
      })
  })
}

const sendTransfer = async (data: SendRequest) => {
  return new Promise((resolve, reject) => {
    if (
      !('amount' in data) ||
      !('destination' in data) ||
      data.amount.length === 0 ||
      data.destination.length === 0 ||
      (!('source' in data) && FUNDING_SOURCE.length === 0)
    ) {
      return reject({ statusCode: 400, data: 'missing required parameters' })
    }

    let transferRequest = {
      _links: {
        source: {
          href: ENDPOINT + '/funding-sources/' + convertToLongUUID(data.source || FUNDING_SOURCE),
        },
        destination: {
          href: ENDPOINT + '/funding-sources/' + convertToLongUUID(data.destination),
        },
      },
      amount: {
        currency: data.currency || 'USD',
        value: data.amount,
      },
    }

    client.auth
      .client()
      .then((appToken: any) => appToken.post('transfers', transferRequest))
      .then((res: any) => {
        let location = res.headers.get('location')
        let parts = location.split('/')
        return resolve({
          statusCode: res.status,
          data: {
            // UUID is given in xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx format
            // Convert to xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
            result: parts[parts.length - 1].replace(/-/g, ''),
          },
        })
      })
      .catch((err: any) => {
        reject({ statusCode: err.status, data: err.body.message })
      })
  })
}

export const createRequest = async (input: JobRequest) => {
  return new Promise((resolve, reject) => {
    const data = input.data
    const method = process.env.API_METHOD || data.method || ''
    switch (method.toLowerCase()) {
      case 'sendtransfer':
        sendTransfer(<SendRequest>data)
          .then(resolve)
          .catch(reject)
        break
      case 'gettransfer':
        let getData = <GetRequest>data
        if (!('transfer_id' in getData))
          return reject({ statusCode: 400, data: 'missing required parameters' })

        getTransfer(getData.transfer_id)
          .then((response: any) => {
            response.data.result = response.data.status || ''
            return resolve(response)
          })
          .catch(reject)
        break
      default:
        return reject({ statusCode: 400, data: 'Invalid method' })
    }
  })
}

export const execute = async (req: JobRequest): Promise<Response> => {
  return new Promise<Response>((resolve) => {
    let response = <Response>{ jobRunID: req.id || '' }
    createRequest(req)
      .then(({ statusCode, data }: any) => {
        response.status = 'success'
        response.data = data
        response.statusCode = statusCode
        resolve(response)
      })
      .catch(({ statusCode, data }) => {
        response.status = 'errored'
        response.error = data
        response.statusCode = statusCode
        resolve(response)
      })
  })
}

// createRequest() wrapper for GCP
export const gcpservice = async (req: any = {}, res: any): Promise<any> => {
  let response = await execute(<JobRequest>req.body)
  res.status(response.statusCode).send(response)
}

// createRequest() wrapper for AWS Lambda
export const handler = async (
  event: JobRequest,
  context: any = {},
  callback: { (error: any, result: any): void },
): Promise<any> => {
  callback(null, await execute(event))
}
