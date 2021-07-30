import { generateFileJSON, ImageNameConfig } from './lib'
describe('docker compose file generation', () => {
  const nullImageNameConfig: ImageNameConfig = {
    prefix: '',
    branch: '',
    useLatest: false,
  }
  describe('image name generation', () => {
    it('should generate base dockerfile images with versions', async () => {
      const output = await generateFileJSON(nullImageNameConfig)
      expect(output).toMatchSnapshot()
    })
    it('should generate base dockerfile images with latest', async () => {
      const output = await generateFileJSON({ ...nullImageNameConfig, useLatest: true })
      expect(output).toMatchSnapshot()
    })
    it('should generate aws ecr dockerfile images', async () => {
      const output = await generateFileJSON({
        prefix: 'public.ecr.aws/chainlink-staging/adapters/',
        branch: 'develop',
        useLatest: false,
      })
      expect(output).toMatchSnapshot()
    })
    it('should generate aws ecr dockerfile images with latest tag', async () => {
      const output = await generateFileJSON({
        prefix: 'public.ecr.aws/chainlink-staging/adapters/',
        branch: 'develop',
        useLatest: true,
      })
      expect(output).toMatchSnapshot()
    })
  })
})
