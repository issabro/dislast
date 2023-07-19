const axios = require('axios');
const fs = require('fs');
//const { google } = require('googleapis');

const GOOGLE_CLOUD_VISION_API_URL = 'https://vision.googleapis.com/v1/images:annotate?key=';
const API_KEY = 'AIzaSyAU_1kRADcIJUg9bFEltjczFxZ-fT-uzZY';
//const CREDENTIALS = require('./privatekey.json');
//const FOLDER_ID = '1p7buhfI3oBbI9TzNvczDPhRC9drCPmJl'; 

/*
const auth = new google.auth.GoogleAuth({
    credentials: CREDENTIALS,
    scopes: ['https://www.googleapis.com/auth/drive'],
});
*/

module.exports = (robot) => {
    robot.respond(/recognize text/i, async (res) => {

        const imagePath = './img.png';

        try {
            //const fileUrl = await downloadImageFromChat(res.message);
            const imgBase64 = await imgToBase64(imagePath);
            const result = await requestCloudVisionAPI(imgBase64);

            if (
                result &&
                result.responses &&
                result.responses.length > 0 &&
                result.responses[0].fullTextAnnotation &&
                result.responses[0].fullTextAnnotation.text
            ) {
                const textResult = result.responses[0].fullTextAnnotation.text;
                res.reply(`認識結果: ${textResult}`);
            } else {
                res.reply('テキストの認識に失敗しました。');
            }
        } catch (error) {
            console.error(error);
            res.reply('Cloud Vision APIの呼び出しに失敗しました。');
        }
    });
};

/*
async function downloadImageFromChat(message) {
    if (message.attachments && message.attachments.length > 0) {
        const attachment = message.attachments[0];
        const fileUrl = attachment.url;

        const response = await axios({
            url: fileUrl,
            method: 'GET',
            responseType: 'stream',
        });
        const filePath = './img.png';
        const writer = fs.createWriteStream(filePath);
        response.data.pipe(writer);

        return new Promise((resolve, reject) => {
            writer.on('finish', () => resolve(filePath));
            writer.on('error', reject);
        });
    } else {
        throw new Error('画像が添付されていません。');
    }
}

async function downloadImageFromDrive(fileUrl) {
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
        { fileId: fileUrl, alt: 'media' },
        { responseType: 'stream' }
    );

    const imageBase64 = await new Promise((resolve, reject) => {
        let imageData = '';
        response.data.on('data', (chunk) => {
            imageData += chunk.toString('base64');
        });
        response.data.on('end', () => {
            resolve(imageData);
        });
        response.data.on('error', (err) => {
            reject(err);
        });
    });

    return imageBase64;
}
*/

async function requestCloudVisionAPI(imageBase64) {
    const apiUrl = GOOGLE_CLOUD_VISION_API_URL + API_KEY;
    const requestBody = {
        requests: [
            {
                image: {
                    content: imageBase64,
                },
                features: [
                    {
                        type: 'TEXT_DETECTION',
                        maxResults: 10,
                    },
                ],
            },
        ],
    };

    try {
        const response = await axios.post(apiUrl, requestBody);
        return response.data;
    } catch (error) {
        console.error(error);
        throw new Error('Cloud Vision APIの呼び出しに失敗しました。');
    }
}

function imgToBase64(filepath) {
    return new Promise((resolve, reject) => {
        fs.readFile(filepath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString('base64'));
            }
        });
    });
}