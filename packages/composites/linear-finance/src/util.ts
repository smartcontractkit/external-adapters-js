import { Requester } from '@chainlink/ea-bootstrap'
import { AxiosResponse } from 'axios'
import * as fs from 'fs'

export const getCsvFile = (csvURL: string): string => fs.readFileSync(csvURL, 'utf-8')

export const requestCsvFile = async (csvURL: string): Promise<string> => {
  const response = (await Requester.request(csvURL)) as AxiosResponse<unknown>
  return response.data as string
}
