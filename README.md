## Vercel Clone

This is a simple project that clones a git repository and runs a script to build a project.
After the build is done, it will upload the static files to S3.

## Build Server

The build server is a Docker container that clones a git repository and runs a script to build a project then save build output to S3.

### Tools or Resources

1. [ECR](https://eu-north-1.console.aws.amazon.com/ecr) - Docker image registry
2. [ECS](https://aws.amazon.com/ecs/) - Container Orchestration
3. [S3](https://aws.amazon.com/s3/) - Object Storage
