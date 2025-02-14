## Vercel Clone

This is a simple project that is a clone of Vercel.
It can deploy a project to AWS ECS and S3.

## Build Server

The build server is a Docker container that clones a git repository and runs a script to build a project then save build output to S3.

### Tools or Resources

1. [ECR](https://eu-north-1.console.aws.amazon.com/ecr) - Docker image registry
2. [ECS](https://aws.amazon.com/ecs/) - Container Orchestration
3. [S3](https://aws.amazon.com/s3/) - Object Storage

## Reverse Proxy

The reverse proxy is a simple server that proxies requests to the correct subdomain which is a dist folder in S3.

### Tools or Resources

1. [Express](https://expressjs.com/) - Node.js framework
2. [http-proxy](https://www.npmjs.com/package/http-proxy) - Proxy server