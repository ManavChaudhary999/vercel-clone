import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import { generateSlug } from 'random-word-slugs';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import { WebSocket, WebSocketServer } from 'ws';
import db from './db';
import { DeployementStatus } from '@prisma/client';
import { createClient } from '@clickhouse/client'
import { Kafka } from 'kafkajs';
import { v4 as uuidv4 } from 'uuid';


const app = express();
const PORT = 9000;
const wss = new WebSocketServer({ port: 9080 });


app.use(express.json());

// Creating ECS Client
const ecsClient = new ECSClient({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST,
    username: process.env.CLICKHOUSE_USERNAME,
    password: process.env.CLICKHOUSE_PASSWORD,
    database: "default",
})

const kafka = new Kafka({
    clientId: 'api',
    brokers: [process.env.KAFKA_BROKER],
    ssl: {
        ca: [process.env.KAFKA_SSH_KEY],
    },
    sasl: {
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
        mechanism: 'plain'
    }
});

const consumer = kafka.consumer({ groupId: 'api-server-logs-consumer' });

const CHANNELS: Map<string, WebSocket> = new Map();

wss.on('connection', function connection(ws: WebSocket) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data: Buffer) {
        const { channel } = JSON.parse(data.toString());
        CHANNELS.set(channel, ws);
    });
  
    ws.send('Connected to the server');
});

app.post('/project', async (req, res) => {
    const { name, gitURL, customDomain } = req.body;

    const subdomain = generateSlug(1);

    const project = await db.project.create({
        data: {
            name,
            gitURL,
            subDomain: subdomain,
            customDomain,
        }
    });
    
    res.status(201).json({
        message: "Project Created",
        project,
    });
});

app.post('/deploy', async (req, res) => {
    const { projectId } = req.body;
    
    const project = await db.project.findUnique({
        where: {
            id: projectId,
        },
    });

    if (!project) {
        res.status(404).json({
            message: "Project not found",
        });
        return;
    }

    const deployment = await db.deployement.create({
        data: {
            projectId: project.id,
            status: DeployementStatus.QUEUED,
        },
    });
    
    const command = new RunTaskCommand({
        cluster: process.env.AWS_CLUSTER,
        taskDefinition: process.env.AWS_TASK_DEFINITION,
        launchType: 'FARGATE',
        count: 1,
        networkConfiguration: {
            awsvpcConfiguration: {
                subnets: ['subnet-0dd1f8226f43bf998', 'subnet-0048ce89643416df4', 'subnet-058951a884dea3b14'],
                securityGroups: ['sg-022b09e2072d6d0bd'],
                assignPublicIp: 'ENABLED',
            },
        },
        overrides: {
            containerOverrides: [
                {
                    name: 'build_server',
                    environment: [
                        {
                            name: 'PROJECT_ID',
                            value: project.id,
                        },
                        {
                            name: 'DEPLOYMENT_ID',
                            value: deployment.id,
                        },
                        {
                            name: 'GIT_REPO_URL',
                            value: project.gitURL,
                        },
                        {
                            name: 'KAFKA_SSH_KEY',
                            value: process.env.KAFKA_SSH_KEY,
                        },
                    ]
                }
            ]
        }
    });
    
    await ecsClient.send(command);

    res.json({
        message: 'Deployment started',
        deployment,
    });
});

app.get('/logs/:deployment_id', async (req, res) => {
    const { deployment_id } = req.params;

    const logs = await clickhouseClient.query({
        query: `SELECT event_id, deployment_id, log, timestamp from log_events where deployment_id = {deployment_id:String}`,
        query_params: {
            deployment_id: deployment_id
        },
        format: 'JSONEachRow'
    });

    const rawLogs = await logs.json();

    res.json({
        message: 'Logs fetched',
        logs: rawLogs,
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);  
});

wss.on('listening', () => {
    console.log('Socket is running on port 9080');
});

async function initKafkaConsumer() {
    await consumer.connect();
    console.log('Connected to Kafka');
    
    await consumer.subscribe({ topics: ['container-logs'], fromBeginning: true });
    await consumer.run({
        eachBatch: async function ({ batch, heartbeat, commitOffsetsIfNecessary, resolveOffset}) {
            const messages = batch.messages;
            console.log(`Recv. ${messages.length} messages..`)

            for (const message of messages) {
                if (!message.value) continue;

                const stringMessage = message.value.toString();
                const { project_id, deployment_id, log } = JSON.parse(stringMessage)
                console.log({ log, deployment_id });

                try {
                    const { query_id } = await clickhouseClient.insert({
                        table: 'log_events',
                        values: [{ event_id: uuidv4(), deployment_id: deployment_id, log }],
                        format: 'JSONEachRow'
                    });

                    console.log(query_id);
                    resolveOffset(message.offset)
                    // await commitOffsetsIfNecessary();
                    await heartbeat();
                } catch (err) {
                    console.log(err)
                }

            }
        }
    });
}

initKafkaConsumer();