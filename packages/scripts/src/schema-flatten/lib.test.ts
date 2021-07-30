import { mergePropertiesTable } from './fixtures'
import { flattenAllSchemas, mergeProperties } from './lib'

describe('schema-flatten', () => {
  it('should flatten all schemas', async () => {
    expect(await flattenAllSchemas()).toMatchSnapshot()
  })
})

describe('mergeProperties', () => {
  it.each(mergePropertiesTable)('mergeProperties %#', (params, expected) => {
    expect(mergeProperties(...params)).toEqual(expected)
  })
})
