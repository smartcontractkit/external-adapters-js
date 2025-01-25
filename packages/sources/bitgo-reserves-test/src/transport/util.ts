import * as crypto from 'crypto'

export interface DataSchema {
  totalReserve: string
  cashReserve: string
  investedReserve: string
  lastUpdated: string
}

export interface ResponseSchema {
  data: string // formatted & escaped DataSchema
  dataSignature: string
  ripcord: boolean
}

export function createRequest(params: { [key: string]: string }[], endpoint: string) {
  return params.map((param) => {
    return {
      params: [param],
      request: {
        baseURL: endpoint,
      },
    }
  })
}

export function parseResponse(
  params: { [key: string]: string }[],
  payload: ResponseSchema,
  pubkey: string,
) {
  if (!payload || !payload.data) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `The data provider didn't return any value`,
          statusCode: 502,
        },
      }
    })
  }

  if (payload.ripcord) {
    return [
      {
        params: params[0],
        response: {
          errorMessage: 'Ripcord indicator true',
          ripcord: payload.ripcord,
          statusCode: 502,
        },
      },
    ]
  }

  const verifier = crypto.createVerify('sha256')
  verifier.update(payload.data)
  if (!verifier.verify(pubkey, payload.dataSignature, 'base64')) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `Data verification failed`,
          statusCode: 502,
        },
      }
    })
  }

  const data = JSON.parse(payload.data) as DataSchema
  const timestamps = {
    providerIndicatedTimeUnixMs: new Date(data.lastUpdated).getTime(),
  }
  const result = Number(data.totalReserve)
  if (result === undefined || isNaN(result)) {
    return params.map((param) => {
      return {
        params: param,
        response: {
          errorMessage: `Missing totalReserve`,
          statusCode: 502,
        },
      }
    })
  }

  return params.map((param) => {
    return {
      params: param,
      response: {
        result,
        data: {
          result,
        },
        timestamps,
      },
    }
  })
}

export function normalizePubkey(envPubkey: string): string {
  return envPubkey.replace(/\\n/g, '\n')
}
