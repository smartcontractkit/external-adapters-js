import { AdapterInputError } from '@chainlink/external-adapter-framework/validation/error'

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/ // 24-hour HH:mm:ss

export const validateTime = (startTime: string, endTime: string): AdapterInputError | undefined => {
  if (!TIME_REGEX.test(startTime) || !TIME_REGEX.test(endTime)) {
    throw new AdapterInputError({
      statusCode: 400,
      message: 'Input param startTime or endTime must be a time in HH:mm:ss format',
    })
  }
  if (startTime >= endTime) {
    throw new AdapterInputError({
      statusCode: 400,
      message: `Input param "startTime" (${startTime}) must be before "endTime" (${endTime})`,
    })
  }
  return
}
