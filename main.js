const { Client, LocalAuth, MessageMedia } = require('whatsapp-web.js');
const qrcode = require('qrcode-terminal');
const axios = require('axios');

const client = new Client({
    puppeteer: {
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
    },
    authStrategy: new LocalAuth()
});

client.on('ready', () => {
    console.log('Client is ready!');
});

client.on('qr', qr => {
    qrcode.generate(qr, {small: true});
});

client.initialize();

async function sendWhatsapp(message){
    // console.log(message);

    const data = message.data;
    const status = message.status;

    if(status === 'text'){
        await client.sendMessage(data.to + "@c.us", data.pesan);
    }else if(status === 'media'){
        const media = await MessageMedia.fromUrl(data.media);
        await client.sendMessage(data.to + "@c.us", media, { caption: data.pesan });
    }else if(status === 'video'){
        const http = require('https');
        const fs = require('fs');

        const fileUrl = data.media;
        const destination = "./assets/data-wa-" + Date.now() + ".mp4";

        const file = fs.createWriteStream(destination);

        http.get(fileUrl, (response) => {
            response.pipe(file);
            file.on('finish', () => {
                file.close(async () => {
                    console.log('File downloaded successfully');
                    const media = MessageMedia.fromFilePath(destination);
                    await client.sendMessage(data.to + "@c.us", media, { caption: data.pesan });
                    fs.unlink(destination, () => {
                        console.error('File Berhasil Dihapus');
                    });
                });
            });
        }).on('error', (err) => {
            fs.unlink(destination, () => {
                console.error('Error downloading file:', err);
            });
        });
    }
}

// Listening to all incoming messages
client.on('message_create', message => {
    const apiUrl = 'https://cpipga.com/Webhook_Whatsapp';

    const createPost = async (chatting) => {
        try {
            const response = await axios.post(apiUrl, chatting);
        } catch (error) {
            console.error('Error posting data:', error.message);
        }
    };

    createPost(message);
});

// ========================================== API ======================================

const express = require('express');
const app = express();
const port = 3030;

app.use(express.json());

app.post('/api/sendWhatsapp', (req, res) => {
    const data = req.body;
    res.json(data);
  
    sendWhatsapp(data);
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});