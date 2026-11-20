import nock from 'nock'
import {
  BAD_TOKEN_RESPONSE,
  LOGIN_RESPONSE,
  MISSING_APIKEY_RESPONSE,
  SSA_SCORES_RESPONSE,
} from '../fixtures/provider'

export const AUTH_ORIGIN = 'http://auth.test'
export const AUTH_ENDPOINT = `${AUTH_ORIGIN}/gettoken/token`
export const API_ORIGIN = 'http://api.test'
export const API_ENDPOINT = API_ORIGIN
export const SCORES_PATH = '/api/v1/ssa/getAllScores'
export const CLIENT_ID = 'test-client-id'
export const API_KEY = 'test-apikey'
export const ACCESS_TOKEN = LOGIN_RESPONSE.access_token

const JSON_HEADERS = ['Content-Type', 'application/json']

export const mockLoginSuccess = (): nock.Scope =>
  nock(AUTH_ORIGIN)
    .post('/gettoken/token')
    .matchHeader('authorization', `Basic ${CLIENT_ID}`)
    .reply(200, LOGIN_RESPONSE, JSON_HEADERS)

export const mockLoginSuccessPersisted = (): nock.Scope => mockLoginSuccess().persist()

export const mockLoginResponsePersisted = (
  status: number,
  body: Record<string, any> | any[],
): nock.Scope =>
  nock(AUTH_ORIGIN).post('/gettoken/token').reply(status, body, JSON_HEADERS).persist()

export const mockScoresSuccess = (
  body: Record<string, any> | any[] = SSA_SCORES_RESPONSE,
  times = 1,
): nock.Scope =>
  nock(API_ORIGIN)
    .get(SCORES_PATH)
    .matchHeader('authorization', `Bearer ${ACCESS_TOKEN}`)
    .matchHeader('apikey', API_KEY)
    .matchHeader('accept', 'application/json')
    .times(times)
    .reply(200, body, JSON_HEADERS)

export const mockScoresSuccessPersisted = (
  body: Record<string, any> | any[] = SSA_SCORES_RESPONSE,
): nock.Scope =>
  nock(API_ORIGIN)
    .get(SCORES_PATH)
    .matchHeader('authorization', `Bearer ${ACCESS_TOKEN}`)
    .matchHeader('apikey', API_KEY)
    .matchHeader('accept', 'application/json')
    .reply(200, body, JSON_HEADERS)
    .persist()

export const mockScoresErrorPersisted = (
  status: number,
  body: Record<string, any> | any[],
): nock.Scope =>
  nock(API_ORIGIN)
    .get(SCORES_PATH)
    .matchHeader('authorization', `Bearer ${ACCESS_TOKEN}`)
    .matchHeader('apikey', API_KEY)
    .reply(status, body, JSON_HEADERS)
    .persist()

export const mockBadTokenErrorPersisted = (): nock.Scope =>
  mockScoresErrorPersisted(401, BAD_TOKEN_RESPONSE)

export const mockMissingApiKeyErrorPersisted = (): nock.Scope =>
  mockScoresErrorPersisted(401, MISSING_APIKEY_RESPONSE)
