import { generateImageName } from './lib'

describe('generateImageName', () => {
  beforeEach(() => {
    process.env.ADAPTER_NAME = ''
    process.env.BRANCH = ''
    process.env.IMAGE_PREFIX = ''
    process.env.LATEST = ''
  })

  afterAll(() => {
    process.env.ADAPTER_NAME = ''
    process.env.BRANCH = ''
    process.env.IMAGE_PREFIX = ''
    process.env.LATEST = ''
  })

  describe('when no adapter name is provided', () =>
    it('should error and exit', async () => {
      await expect(generateImageName()).rejects.toThrowErrorMatchingInlineSnapshot(
        `"A descoped adapter name must be available as an environment variable under ADAPTER_NAME"`,
      )
    }))

  describe('when an invalid adapter name is provided', () => {
    it('should error and exit', async () => {
      process.env.ADAPTER_NAME = 'invalid-adapter'

      await expect(generateImageName()).rejects.toThrowErrorMatchingInlineSnapshot(
        `"Invalid adapter name provided, no matching adapter name found in workspace packages."`,
      )
    })
  })
  describe('when an adapter name is provided', () => {
    const name = 'coinmarketcap-adapter'
    const prefix = 'aws/'
    const branch = 'develop'
    const latest = 'TRUE'
    const table = [
      { name, branch: '', prefix: '', latest: '' },

      { name, branch, prefix: '', latest: '' },
      { name, branch, prefix, latest: '' },
      { name, branch, prefix, latest },

      { name, branch: '', prefix, latest: '' },
      { name, branch: '', prefix, latest },

      { name, branch: '', prefix: '', latest },
    ]
    it.each(table)(
      'should generate a valid name with name:$name, branch:$branch, prefix:$prefix, latest:$latest',
      async ({ name, branch, prefix, latest }) => {
        process.env.ADAPTER_NAME = name
        process.env.BRANCH = branch
        process.env.IMAGE_PREFIX = prefix
        process.env.LATEST = latest

        expect(await generateImageName()).toMatchSnapshot()
      },
    )
  })
})
