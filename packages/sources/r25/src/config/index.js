'use strict'
Object.defineProperty(exports, '__esModule', { value: true })
exports.config = void 0
const config_1 = require('@chainlink/external-adapter-framework/config')
exports.config = new config_1.AdapterConfig({
  API_KEY: {
    description: 'An API key for R25',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_SECRET: {
    description: 'An API secret for R25 used to sign requests',
    type: 'string',
    required: true,
    sensitive: true,
  },
  API_ENDPOINT: {
    description: 'An API endpoint for R25',
    type: 'string',
    default: 'https://app.r25.xyz',
  },
})
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaW5kZXguanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyJpbmRleC50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7QUFBQSx5RUFBNEU7QUFFL0QsUUFBQSxNQUFNLEdBQUcsSUFBSSxzQkFBYSxDQUFDO0lBQ3RDLE9BQU8sRUFBRTtRQUNQLFdBQVcsRUFBRSxvQkFBb0I7UUFDakMsSUFBSSxFQUFFLFFBQVE7UUFDZCxRQUFRLEVBQUUsSUFBSTtRQUNkLFNBQVMsRUFBRSxJQUFJO0tBQ2hCO0lBQ0QsVUFBVSxFQUFFO1FBQ1YsV0FBVyxFQUFFLDZDQUE2QztRQUMxRCxJQUFJLEVBQUUsUUFBUTtRQUNkLFFBQVEsRUFBRSxJQUFJO1FBQ2QsU0FBUyxFQUFFLElBQUk7S0FDaEI7SUFDRCxZQUFZLEVBQUU7UUFDWixXQUFXLEVBQUUseUJBQXlCO1FBQ3RDLElBQUksRUFBRSxRQUFRO1FBQ2QsT0FBTyxFQUFFLHFCQUFxQjtLQUMvQjtDQUNGLENBQUMsQ0FBQSIsInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IEFkYXB0ZXJDb25maWcgfSBmcm9tICdAY2hhaW5saW5rL2V4dGVybmFsLWFkYXB0ZXItZnJhbWV3b3JrL2NvbmZpZydcblxuZXhwb3J0IGNvbnN0IGNvbmZpZyA9IG5ldyBBZGFwdGVyQ29uZmlnKHtcbiAgQVBJX0tFWToge1xuICAgIGRlc2NyaXB0aW9uOiAnQW4gQVBJIGtleSBmb3IgUjI1JyxcbiAgICB0eXBlOiAnc3RyaW5nJyxcbiAgICByZXF1aXJlZDogdHJ1ZSxcbiAgICBzZW5zaXRpdmU6IHRydWUsXG4gIH0sXG4gIEFQSV9TRUNSRVQ6IHtcbiAgICBkZXNjcmlwdGlvbjogJ0FuIEFQSSBzZWNyZXQgZm9yIFIyNSB1c2VkIHRvIHNpZ24gcmVxdWVzdHMnLFxuICAgIHR5cGU6ICdzdHJpbmcnLFxuICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIHNlbnNpdGl2ZTogdHJ1ZSxcbiAgfSxcbiAgQVBJX0VORFBPSU5UOiB7XG4gICAgZGVzY3JpcHRpb246ICdBbiBBUEkgZW5kcG9pbnQgZm9yIFIyNScsXG4gICAgdHlwZTogJ3N0cmluZycsXG4gICAgZGVmYXVsdDogJ2h0dHBzOi8vYXBwLnIyNS54eXonLFxuICB9LFxufSlcbiJdfQ==
