import dotenv from 'dotenv';
dotenv.config();
import express, { Request, Response } from 'express';
import { generateSlug } from 'random-word-slugs';
import { ECSClient, RunTaskCommand } from '@aws-sdk/client-ecs';
import Redis from 'ioredis';
import { WebSocket, WebSocketServer } from 'ws';
import db from './db';
import { DeployementStatus } from '@prisma/client';


const app = express();
const PORT = 9000;
const wss = new WebSocketServer({ port: 9080 });
const subscriber = new Redis(process.env.REDIS_SERVICE_URI || '');


app.use(express.json());

// Creating ECS Client
const ecsClient = new ECSClient({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

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


app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);  
});

wss.on('listening', () => {
    console.log('Socket is running on port 9080');
});


async function initRedisSubscribe(): Promise<void> {
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
        wss.clients.forEach(function each(client: WebSocket) {
            if (client === CHANNELS.get(channel) && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
        });
    })
}


initRedisSubscribe();