import express from 'express';
import { Request, Response } from 'express';
import axios, { AxiosInstance } from 'axios';
import multer from 'multer';
import fs from 'fs';
import https from 'https';
import mime from 'mime-types'; 
import path from 'path';
require('dotenv').config();
const cors = require('cors');

const app = express();
const port = 3000;

const username = process.env.ELASTIC_USER;
const password = process.env.ELASTIC_PASSWORD;

// Middleware CORS
app.use(cors({
    origin: 'http://localhost:3001',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
}));

// Configuração do Multer
// Multer é um middleware node.js para manipulação multipart/form-data, que é usado principalmente para fazer upload de arquivos.
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, './uploads'); // Pasta de destino para arquivos carregados
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname); // Usa o nome original do arquivo
    }
});

const upload = multer({ storage: storage });

// Configuração do cliente Elasticsearch
const elasticsearchClient = axios.create({
    baseURL: 'https://localhost:9200', // Adjust URL as needed
    headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`        
    },
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) as any
});


// Rota para upload de arquivos
app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;        
        const data = await readFileBase64(filePath);
        const indexName = 'diof'; // Nome do índice no Elasticsearch
        const documentId = await indexData(data, indexName);        
        res.status(200).json({ message: 'File uploaded and indexed successfully', documentId });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para Recuperação de Arquivos por ID
app.get('/file/:id', async (req: Request, res: Response) => {
    try {
        const fileId = req.params.id;        
        const indexName = 'diof'; 
        const fileData = await getFileData(fileId, indexName);        
        const filePath = path.join(__dirname, `${fileId}.txt`);
        fs.writeFileSync(filePath, fileData);            
        res.status(200).json({ message: `File data exported to ${fileId}.txt` });
    } catch (error) {
        console.error('Erro ao recuperar arquivo:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para pesquisar pela query
app.get('/search', async (req: Request, res: Response) => {
    const { q: query } = req.query;

    if (typeof query !== 'string') {
        return res.status(400).json({ error: 'Query parameter is required' });
    }
    try{
        const indexName = 'diof';
        const results = await findByQuery(query, indexName);
        res.status(200).json({ results });

    } catch (error) {
        console.log('Erro ao pesquisar palavra: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }

})





// ------------------------------------ Funções Auxiliares ---------------------------

// Função que recupera os dados do arquivo do Elasticsearch pelo ID
async function getFileData(fileId: string, indexName: string): Promise<string> {
    try {
        const url = `/${indexName}/_doc/${fileId}`;
        const response = await elasticsearchClient.get(url);
        console.log(response.data._source.content.slice(0, 50))
        return response.data._source.content; // Assuming 'content' field stores base64-encoded file content
    } catch (error: any) {
        console.error('Error retrieving file data:', error.response?.status, error.response?.data);                
        throw error;
    }
}



// Function to read file data
async function readFile(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, 'utf8', (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data);
            }
        });
    });
}

// Função para ler o arquivo e converter para base64
async function readFileBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {                
                  const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                  // Construct data URI with MIME type and base64-encoded data
                  const dataUri = `data:${mimeType};base64,${Buffer.from(data).toString('base64')}`;
                  resolve(dataUri);
            }
        });
    });
}


// Função para Indexar os dados do arquivo no Elasticsearch e retornar o ID do documento
async function indexData(data: string, indexName: string): Promise<void> {
    try {
        const url = `/${indexName}/_doc`; // Adjust index name as needed
        const payload = { content: data }; // Assuming 'content' field is used to store base64 encoded file
        const response = await elasticsearchClient.post(url, payload);
        //await elasticsearchClient.post(url, data);
        const documentId = response.data._id; // Extract document ID from the response
        console.log('Data indexed successfully with ID:', documentId);
        console.log('Data indexed successfully');
        return documentId;        
    } catch (error: any) {
        if (error.response) {
            console.error('Error indexing data:',  (error.response as any).status, (error.response as any).data);
        } else {
            console.error('Error indexing data:', (error as Error).message);

        }
        throw error;
    }
}

// Função para pesquisar pela query no Elasticsearch
async function findByQuery(query: string, indexName: string) {
    try{
        console.log('to aqui no find');
        const url = `/${indexName}/_search`;
        const payload = {
            query: {
              match: {
                content: query
              }
            }
        };
    
        const response = await elasticsearchClient.post(url, payload);
        console.log('response find: ', response.data);
        return response.data.hits.hits;

    } catch (error: any) {
        if (error.response) {
            console.error('Error searching documents:', error.response.status, error.response.data);
        } else {
            console.error('Error searching documents:', error.message);
        }
        throw error;
    }
}

// Start server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

