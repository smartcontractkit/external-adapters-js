import { ExecuteCallback } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import { INCOMING_TOKEN, CHAINLINK_URL } from "../config"

const customError = (data: any) => data.Response === 'Error'

export const callbackHandler: ExecuteCallback = async (req: any) => {
    console.log(`Callback function called.`, req)
    if (!req || Object.keys(req).length === 0) {
        return Requester.callbackResponse(false, "No data provided")
    }
    const runId = req.secret || 1
    const options = {
        url: `${CHAINLINK_URL}/v2/runs/${runId}`,
        headers: {
            "Authorization": `Bearer ${INCOMING_TOKEN}`
        },
        params: getApiParams(req, runId),
        method: "PATCH"
    }
    try {
        await Requester.request(options, customError)
        return Requester.callbackResponse(true)
    } catch (e) {
        return Requester.callbackResponse(false, `Failed PATCH request: ${e}`)
    }
}

interface CallbackApiParams {
    data: {
        data: {
            [T: string]: string
        }
    },
    RunId: number
}

const getApiParams = (request: any, runId: number): CallbackApiParams => {
    const params: CallbackApiParams = {
        data: {
            data: {},
        },
        RunId: runId
    }
    for (const param in request) {
        params.data.data[param] = request[param]
    }
    return params
}