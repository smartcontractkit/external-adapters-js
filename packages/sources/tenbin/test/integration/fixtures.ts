import fs from 'fs'
import nock from 'nock'
import path from 'path'

const readFixture = (name: string): unknown =>
  JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'unit', name), 'utf-8'))

const attestResponse = readFixture('attest-response-2026-09-01.json')
const buildJsonResponse = readFixture('github-build-2026-09-03.json')

const headers = [
  'Content-Type',
  'application/json',
  'Connection',
  'close',
  'Vary',
  'Accept-Encoding',
  'Vary',
  'Origin',
]

export const mockPostResponseSuccess = (): nock.Scope =>
  nock('https://api.com')
    .persist()
    .get('/attest')
    .reply(200, () => attestResponse, headers)
    .get('/build.json')
    .reply(200, () => buildJsonResponse, headers)
