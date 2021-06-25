import { ExecuteCallback } from '@chainlink/types'
import { Requester } from '@chainlink/ea-bootstrap'
import { INCOMING_TOKEN, CHAINLINK_URL } from "../config"

const customError = (data: any) => data.Response === 'Error'

export const callbackHandler: ExecuteCallback = async (req: any) => {
    console.log(`Callback function called.`, req)
    if (!req || !req.body || Object.keys(req.body).length === 0) {
        return Requester.callbackResponse(400, false, "No data provided")
    }
    const runId = req.body.secret || 1
    const options = {
        url: `${CHAINLINK_URL}/v2/runs/${runId}`,
        headers: {
            "Authorization": `Bearer ${INCOMING_TOKEN}`
        },
        data: {
            data: {
                pending: false,
                data: req.body,
            },
            RunId: runId,
        },
        method: "patch"
    }
    try {
        await Requester.request(options, customError)
        return Requester.callbackResponse(200, true)
    } catch (e) {
        return Requester.callbackResponse(500, false, `Failed PATCH request: ${e}`)
    }
}