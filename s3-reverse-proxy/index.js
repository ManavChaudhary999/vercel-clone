const express = require("express");
const httpProxy = require('http-proxy');

const app = express();
var proxy = httpProxy.createProxyServer({});

const PORT = 8000;
const BASE_URL = 'https://vercel-clone-999.s3.eu-north-1.amazonaws.com/__outputs';

app.use((req, res) => {
    const hostname = req.hostname;
    const subdomain = hostname.split('.')[0];

    proxy.web(req, res, {
        target: `${BASE_URL}/${subdomain}`,
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