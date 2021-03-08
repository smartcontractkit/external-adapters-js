import { nanoid } from '@reduxjs/toolkit'

export const toActionPayload = <A extends ActionBase>(data: any): A => ({
  id: nanoid(),
  createdAt: new Date().toISOString(),
  ...data,
})

export interface ActionBase {
  id: string
  createdAt: string
}
