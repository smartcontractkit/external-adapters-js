import {
  AdapterContext,
  AdapterRequest,
  AdapterResponse,
  Config,
  Execute,
  Logger,
  Requester,
  util,
} from '@chainlink/ea-bootstrap'

export const makeRequestFactory =
  (config: Config, prefix: string, postfix = ''): Execute =>
  async (input: AdapterRequest) =>
    (
      await Requester.request({
        ...config.api,
        method: 'post',
        url: (util.getURL(prefix, true) || '') + postfix,
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
