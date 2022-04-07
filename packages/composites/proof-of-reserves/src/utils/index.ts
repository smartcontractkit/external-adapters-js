import { Logger, Requester, util } from '@chainlink/ea-bootstrap'
import { Config, Execute, AdapterRequest, AdapterResponse, AdapterContext } from '@chainlink/types'

export const makeRequestFactory =
  (config: Config, prefix: string): Execute =>
  async (input: AdapterRequest) =>
    (
      await Requester.request({
        ...config.api,
        method: 'post',
        url: util.getURL(prefix, true),
        data: input,
      })
    ).data as AdapterResponse

// Run, log, throw on error
export const callAdapter = async (
  execute: Execute,
  context: AdapterContext,
  input: AdapterRequest,
  tag: string,
): Promise<AdapterResponse> => {
  const output = await execute(input, context)
  Logger.debug(tag, { output })
  return output
}
