import { Requester, Validator, AdapterError } from '@chainlink/ea-bootstrap'
import { Config, ExecuteWithConfig } from '@chainlink/types'
import { CALLBACK_ENDPOINT, DEFAULT_SECRET_ID, RAINFALL_URL, X_API_KEY_VALUE } from '../config'

const customError = (data: any) => data.Response === 'Error'

const customParams = {
    data: true
}

export const execute: ExecuteWithConfig<Config> = async (request, config) => {
    const validator = new Validator(request, customParams)
    if (validator.error) throw validator.error
    const jobRunID = validator.validated.id
    const options = {
        ...config.api,
        headers: {
            "X-Api-Key": X_API_KEY_VALUE,
            "content-type": "application/json"
        },
        params: getApiParams(validator),
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

interface RainfallApiParams {
    data: {
        [T: string]: number | string
    },
    secret: number,
    callback_url: string
}

const getApiParams = (validator: any): RainfallApiParams => {
    const requestObj: RainfallApiParams = {
        data: {},
        secret: validator.data.id || DEFAULT_SECRET_ID,
        callback_url: CALLBACK_ENDPOINT
    }
    for (const param in validator.data) {
        const paramValue = isFloat(validator.data[param]) ? parseFloat(validator.data[param]) : validator.data[param]
        requestObj.data[param] = paramValue
    }
    return requestObj
}

const isFloat = (num: any): boolean => Number(num) === num && num % 1 !== 0;