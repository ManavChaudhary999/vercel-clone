# Vercel Clone

This is a simple project that is a clone of Vercel.
It can deploy a project just like Vercel and return the deployed url.

## Version 1

### Build Server

The build server is a Docker container that clones a git repository and runs a script to build a project then save build output to S3.

#### Tools or Resources

1. [Docker Hub](https://hub.docker.com/) - Docker image registry
2. [ECS](https://aws.amazon.com/ecs/) - Container Orchestration
3. [@aws-sdk/client-s3](https://www.npmjs.com/package/@aws-sdk/client-s3) - AWS SDK for S3
4. [mime-types](https://www.npmjs.com/package/mime-types) - MIME types

### Reverse Proxy

The reverse proxy is a simple server that proxies requests to the correct subdomain which is just a dist folder in S3.

#### Tools or Resources

1. [Express](https://expressjs.com/) - Node.js framework
2. [http-proxy](https://www.npmjs.com/package/http-proxy) - Proxy server

### API

The API is a simple server that provides an endpoint for build which is used to build a project and return the url of the project.

#### Tools or Resources

1. [Express](https://expressjs.com/) - Node.js framework
2. [random-word-slugs](https://www.npmjs.com/package/random-word-slugs) - Generate random subdomains
3. [@aws-sdk/client-ecs](https://www.npmjs.com/package/@aws-sdk/client-ecs) - AWS SDK for ECS

## Version 2

### API

- Add a new endpoint to create a project
- Add a new endpoint to deploy a project
- Add a new endpoint to get the logs of a deployment
- Consuming logs from Kafka and saving to ClickHouse

#### Tools or Resources

1. [Prisma](https://www.prisma.io/) - ORM
2. [Kafka](https://kafka.apache.org/) - Messaging Queue
3. [ClickHouse](https://clickhouse.com/) - Time Series Database

### Build Server

- Replace redis with kafka to produce logs

#### Tools or Resources

1. [Kafka](https://kafka.apache.org/) - Messaging Queue
