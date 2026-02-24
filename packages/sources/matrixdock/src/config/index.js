'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.config = void 0
const config_1 = require('@chainlink/external-adapter-framework/config')
exports.config = new config_1.AdapterConfig({
  API_KEY: {
    description: 'An API key for Matrixdock',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'An API secret for Matrixdock used to sign requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for Matrixdock',
    type: 'string',
    default: 'https://mapi.matrixport.com',
  },
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5RUFBNEU7QUFFL0QsUUFBQSxNQUFNLEdBQUcsSUFBSSxzQkFBYSxDQUFDO0lBQ3RDLE9BQU8sRUFBRTtRQUNQLFdBQVcsRUFBRSwyQkFBMkI7UUFDeEMsSUFBSSxFQUFFLFFBQVE7UUFDZCxRQUFRLEVBQUUsSUFBSTtRQUNkLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsV0FBVyxFQUFFLG9EQUFvRDtRQUNqRSxJQUFJLEVBQUUsUUFBUTtRQUNkLFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7S0FDaEI7SUFDRCxZQUFZLEVBQUU7UUFDWixXQUFXLEVBQUUsZ0NBQWdDO1FBQzdDLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLDZCQUE2QjtLQUN2QztDQUNGLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXJDb25maWcgfSBmcm9tICdAY2hhaW5saW5rL2V4dGVybmFsLWFkYXB0ZXItZnJhbWV3b3JrL2NvbmZpZydcblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IG5ldyBBZGFwdGVyQ29uZmlnKHtcbiAgQVBJX0tFWToge1xuICAgIGRlc2NyaXB0aW9uOiAnQW4gQVBJIGtleSBmb3IgTWF0cml4ZG9jaycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgc2Vuc2l0aXZlOiB0cnVlLFxuICB9LFxuICBBUElfU0VDUkVUOiB7XG4gICAgZGVzY3JpcHRpb246ICdBbiBBUEkgc2VjcmV0IGZvciBNYXRyaXhkb2NrIHVzZWQgdG8gc2lnbiByZXF1ZXN0cycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgc2Vuc2l0aXZlOiB0cnVlLFxuICB9LFxuICBBUElfRU5EUE9JTlQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ0FuIEFQSSBlbmRwb2ludCBmb3IgTWF0cml4ZG9jaycsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ2h0dHBzOi8vbWFwaS5tYXRyaXhwb3J0LmNvbScsXG4gIH0sXG59KVxuIl19
