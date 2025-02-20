const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const { Kafka } = require('kafkajs');

const PROJECT_ID = process.env.PROJECT_ID;
const DEPLOYMENT_ID = process.env.DEPLOYMENT_ID;

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

const kafka = new Kafka({
    clientId: `build-server-${DEPLOYMENT_ID}`,
    brokers: [process.env.KAFKA_BROKER],
    ssl: {
        ca: [fs.readFileSync(path.join(__dirname, 'ca.pem'), 'utf-8')]
    },
    sasl: {
        username: process.env.KAFKA_USERNAME,
        password: process.env.KAFKA_PASSWORD,
        mechanism: 'plain'
    },
    connectionTimeout: 10000,
    retry: {
        initialRetryTime: 100,
        retries: 8
    }
});

const producer = kafka.producer();

async function publish(message) {
    await producer.send({
        topic: 'container-logs',
        messages: [{
            key: 'log',
            value: JSON.stringify({
                project_id: PROJECT_ID,
                deployment_id: DEPLOYMENT_ID,
                log: message,
            }),
        }],
    });
}

async function main() {
    await producer.connect();

    console.log("Executing script");
    await publish("Build started...");

    const outDirPath = path.join(__dirname, "output");

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on("data", async (data) => {
        await publish(data.toString());
        console.log(data.toString());
    });

    p.stderr.on("data", async (data) => {
        await publish(data.toString());
        console.error(data.toString());
    });

    p.on("close", async (code) => {
        console.log('Build Complete');
        await publish('Build Complete');

        const distDirPath = path.join(outDirPath, "dist");
        const files = fs.readdirSync(distDirPath, { recursive: true });

        console.log(`Uploading ${files.length} files to S3`);

        for(const file of files) {
            const filePath = path.join(distDirPath, file);
            const stats = fs.lstatSync(filePath);

            if(stats.isDirectory()) continue;

            await publish(`Uploading ${file}`);

            const command = new PutObjectCommand({
                Bucket: 'vercel-clone-999',
                Key: `__outputs/${PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
            await publish(`Uploaded ${file}`);
        }

        console.log('Done...');
        await publish('Done...');
        process.exit(0);
    });
};

main();