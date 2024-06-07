import { AdapterConfig } from '@chainlink/external-adapter-framework/config'

export const config = new AdapterConfig({
  // AWS_CONFIG_FILE: {
  //   description:
  //     'Path to local AWS config file',
  //   type: 'string',
  //   default: '~/.aws/config',
  // },
  // AWS_PROFILE: {
  //   description:
  //     'Profile name with access to S3',
  //   type: 'string',
  //   default: 'prod',
  // },
  // AWS_SDK_LOAD_CONFIG: {
  //   description:
  //     '???', // TODO: is this needed?
  //   type: 'number',
  //   default: 1,
  // },
  // AWS_DEFAULT_REGION: {
  //   description:
  //     'Default Region of AWS profile with access to S3',
  //   type: 'string',
  //   default: 'us-west-2',
  // },
  BACKGROUND_EXECUTE_MS: {
    description:
      'The amount of time the background execute should sleep before performing the next request',
    type: 'number',
    default: 10_000,
  },
})
