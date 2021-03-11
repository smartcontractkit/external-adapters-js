import { CONTENT_TYPE_APPLICATION_JSON, CONTENT_TYPE_TEXT_PLAIN } from './server'
import {
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE,
  HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE,
} from './errors'
import { ExecuteSync } from '@chainlink/types'
import { toObjectWithNumbers } from './util'

export const initHandler = (execute: ExecuteSync) => (req: any, res: any) => {
  if (!req.is(CONTENT_TYPE_APPLICATION_JSON)) {
    return res
      .type(CONTENT_TYPE_TEXT_PLAIN)
      .status(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE)
      .send(HTTP_ERROR_UNSUPPORTED_MEDIA_TYPE_MESSAGE)
  }
  req.body.data = {
    ...(req.body.data || {}),
    ...toObjectWithNumbers(req.query),
  }
  execute(req.body, (statusCode, data) => {
    res.type('json').status(statusCode).send(data)
  })
}
