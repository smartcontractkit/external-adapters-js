import { Requester, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig, AdapterRequest } from '@chainlink/types'
import { CALLBACK_URL, DEFAULT_SECRET_ID, RAINFALL_URL, API_KEY } from '../config'

const customError = (data: any) => data.Response === 'Error'


export const execute: ExecuteWithConfig<Config> = async (request: AdapterRequest, config: Config) => {
    const jobRunID = request.id || '1'
    validateAdapterRequestAndEnvVars(request, jobRunID)
    const options = {
        ...config.api,
        headers: {
            "X-Api-Key": API_KEY,
            "content-type": "application/json"
        },
        params: getApiParams(request),
        url: RAINFALL_URL,
    }
    try {
        const response = await Requester.request(options, customError)
        return Requester.success(jobRunID, response, config.verbose, true)
    } catch (e) {
        throw new AdapterError({
            jobRunID,
            message: `There was an error ${e}`,
            statusCode: 500,
            pending: false
        })
    }
}

const validateAdapterRequestAndEnvVars = (request: AdapterRequest, jobRunID: string) => {
    if (!request.data || Object.keys(request.data).length === 0) {
        throw new AdapterError({
            jobRunID,
            message: "Missing Data",
            statusCode: 400,
            pending: false
        })
    }
    if (!API_KEY) {
        throw new AdapterError({
            jobRunID,
            message: "Missing API Key",
            statusCode: 500,
            pending: false
        })
    }
    if (!CALLBACK_URL) {
        throw new AdapterError({
            jobRunID,
            message: "Missing Callback URL",
            statusCode: 500,
            pending: false
        })
    }
}

interface RainfallApiParams {
    data: {
        [T: string]: number | string
    },
    secret: number,
    callback_url: string
}

const getApiParams = (request: any): RainfallApiParams => {
    const requestObj: RainfallApiParams = {
        data: {},
        secret: request.data.id || DEFAULT_SECRET_ID,
        callback_url: CALLBACK_URL
    }
    for (const param in request.data) {
        const paramValue = isFloat(request.data[param]) ? parseFloat(request.data[param]) : request.data[param]
        requestObj.data[param] = paramValue
    }
    return requestObj
}

const isFloat = (num: any): boolean => Number(num) === num && num % 1 !== 0;