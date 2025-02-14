const { exec } = require("child_process");
const fs = require("fs");
const path = require("path");
const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const mime = require('mime-types');

const s3Client = new S3Client({
    region: 'eu-north-1',
    credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
});

async function main() {
    console.log("Executing script");

    const outDirPath = path.join(__dirname, "output");

    const p = exec(`cd ${outDirPath} && npm install && npm run build`);

    p.stdout.on("data", (data) => {
        console.log(data);
    });

    p.stderr.on("data", (data) => {
        console.error(data);
    });

    p.on("close", async (code) => {
        console.log('Build Complete');

        const distDirPath = path.join(outDirPath, "dist");
        const files = fs.readdirSync(distDirPath);

        console.log(`Uploading ${files.length} files to S3`);

        for(const file of files) {
            const filePath = path.join(distDirPath, file);
            const stats = fs.statSync(filePath);

            if(stats.isDirectory()) continue;

            const command = new PutObjectCommand({
                Bucket: 'vercel-clone-999',
                Key: `__outputs/${process.env.PROJECT_ID}/${file}`,
                Body: fs.createReadStream(filePath),
                ContentType: mime.lookup(filePath),
            });

            await s3Client.send(command);
            console.log('Done...');
        }
    });
};

main();