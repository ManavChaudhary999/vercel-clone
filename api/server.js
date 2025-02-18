require('dotenv').config();

const express = require("express");
const { generateSlug } = require('random-word-slugs');
const { ECSClient, RunTaskCommand } = require('@aws-sdk/client-ecs');
const Redis = require("ioredis");
const { WebSocketServer } = require('ws');


const app = express();
const PORT = 9000;
const wss = new WebSocketServer({ port: 9080 });
const subscriber = new Redis(process.env.REDIS_SERVICE_URI);    


app.use(express.json());

// Creating ECS Client
const ecsClient = new ECSClient({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const CHANNELS = new Map();
wss.on('connection', function connection(ws) {
    ws.on('error', console.error);
  
    ws.on('message', function message(data) {
      const {channel} = JSON.parse(data);
      CHANNELS.set(channel, ws);
    });
  
    ws.send('Connected to the server');
});


app.post('/build', async(req, res) => {
    const { projectName, repoUrl } = req.body;
    
    const subdomain = projectName || generateSlug(1);
    
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
                            value: subdomain,
                        },
                        {
                            name: 'GIT_REPO_URL',
                            value: repoUrl,
                        },
                    ]
                }
            ]
        }
    });
    
    await ecsClient.send(command);

    return res.json({
        message: 'Build started',
        data: {
            projectId: subdomain,
            url: `http://${subdomain}.localhost:8000`,
        },
    });
});


app.listen(PORT, () => {
    console.log(`Server running on port: ${PORT}`);  
});

wss.on('listening', () => {
    console.log('Socket is running on port 9080');
});


async function initRedisSubscribe() {
    console.log('Subscribed to logs....')
    subscriber.psubscribe('logs:*')
    subscriber.on('pmessage', (pattern, channel, message) => {
        wss.clients.forEach(function each(client) {
            if (client === CHANNELS.get(channel) && client.readyState === WebSocket.OPEN) {
              client.send(message);
            }
        });
    })
}


initRedisSubscribe();