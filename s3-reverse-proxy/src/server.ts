import express from 'express';
import httpProxy from 'http-proxy';
import db from './db';

const app = express();
var proxy = httpProxy.createProxyServer({});

const PORT = 8000;
const BASE_URL = 'https://vercel-clone-999.s3.eu-north-1.amazonaws.com/__outputs';

app.use(async (req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    const project = await db.project.findFirst({
        where: {
            subdomain: subdomain
        }
    });

    proxy.web(req, res, {
        target: `${BASE_URL}/${project?.id}`,
        changeOrigin: true,
    });
});

proxy.on('proxyReq', (proxyReq, req, res) => {
    const url = req.url;
    if (url === '/') proxyReq.path += 'index.html'
});

app.listen(PORT, () => {
    console.log(`Reverse Proxy running on port: ${PORT}`);
});

async function init() {
    const projects = await db.project.findMany();
    console.log(projects);
}

init();