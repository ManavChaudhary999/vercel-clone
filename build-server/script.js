const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');
const Redis = require("ioredis");


const publisher = new Redis(process.env.REDIS_SERVICE_URI);

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function publish(message) {
    await publisher.publish(`logs:${process.env.PROJECT_ID}`, message);
}

async function main() {
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
                Key: `__outputs/${process.env.PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
            await publish(`Uploaded ${file}`);
        }

        console.log('Done...');
        await publish('Done...');
        publisher.quit();
    });
};

main();