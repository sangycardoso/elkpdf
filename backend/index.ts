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
const { Client } = require('@elastic/elasticsearch');

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


// Configuração do cliente Elasticsearch com Elasticsearch Node.js client
const client = new Client({
    node: 'https://localhost:9200',
    auth: {
        username: username,
        password: password,
    },
    tls: {
        ca: fs.readFileSync( "./certs/ca.crt" ),
        rejectUnauthorized: false
    }
})


// Criar o pipeline de ingestão
async function createIngestPipeline() {
    try {
        await client.ingest.putPipeline({
            id: 'attachment',
            body: {
                description: 'Extract attachment information',
                processors: [
                    {
                        attachment: {
                            field: 'data',
                            remove_binary: true, // Definindo explicitamente o valor de remove_binary
                        },
                    },
                ],
            },
        });
        console.log('Pipeline created successfully');
    } catch (error) {
        console.error('Error creating pipeline:', error);
    }
}

createIngestPipeline();



// Rota para criar o índice
app.get('/createIndex', async (req: Request, res: Response) => {
    const indexName = req.query.indexName as string;

    try{
        await createIndexWithAnalyzer(indexName);
        console.log(`Index ${indexName} created with custom analyzer.`);
        res.status(200).json({ message: 'Índice criado com sucesso' });

    } catch (error) {
        console.log('Erro ao criar índice: ', error);
        res.status(500).json({ error: 'Internal server error' });
    }

})




// Rota para upload de arquivos
app.post('/upload', upload.single('file'), async (req: Request, res: Response) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: 'No file uploaded' });
        }

        const filePath = req.file.path;        
        const data = await readFileBase64(filePath);
        const indexName = 'diof'; // Nome do índice no Elasticsearch
        const documentId = await indexData(req.file.filename, data, indexName);        
        res.status(200).json({ message: 'File uploaded and indexed successfully', documentId });

    } catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Rota para Recuperação de Arquivos por ID
// app.get('/file/:id', async (req: Request, res: Response) => {
//     try {
//         const fileId = req.params.id;        
//         const indexName = 'diof'; 
//         const fileData = await getFileData(fileId, indexName);        
//         const filePath = path.join(__dirname, `${fileId}.txt`);
//         fs.writeFileSync(filePath, fileData);            
//         res.status(200).json({ message: `File data exported to ${fileId}.txt` });
//     } catch (error) {
//         console.error('Erro ao recuperar arquivo:', error);
//         res.status(500).json({ error: 'Internal server error' });
//     }
// });

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
// async function getFileData(fileId: string, indexName: string): Promise<string> {
//     try {
//         const url = `/${indexName}/_doc/${fileId}`;
//         const response = await elasticsearchClient.get(url);
//         console.log(response.data._source.content.slice(0, 50))
//         return response.data._source.content; // Assuming 'content' field stores base64-encoded file content
//     } catch (error: any) {
//         console.error('Error retrieving file data:', error.response?.status, error.response?.data);                
//         throw error;
//     }
// }


// Função para criar índice com analyzer stop words
async function createIndexWithAnalyzer(indexName: string) {
    await client.indices.create({
        index: indexName,
        body: {
            settings: {
                analysis: {
                    filter: {
                        portuguese_stop: {
                            type: "stop",
                            stopwords: "_brazilian_" // ou "_portuguese_"
                        }
                    },
                    analyzer: {
                        custom_portuguese_analyzer: {
                            type: "custom",
                            tokenizer: "standard",
                            filter: ["lowercase", "portuguese_stop"]
                        }
                    }
                }
            },
            mappings: {
                properties: {
                    attachment: {
                        type: "object",
                        properties: {
                            content: {
                                type: "text",
                                analyzer: "custom_portuguese_analyzer"
                            },
                            filename: {
                                type: "keyword"
                            }
                        }
                    },
                    data: {
                        type: "binary"
                    }
                }
            }
        }
    });
    console.log(`Índice ${indexName} criado com custom analyzer.`);
}



// Função para ler o arquivo e converter para base64
async function readFileBase64(filePath: string): Promise<string> {
    return new Promise((resolve, reject) => {
        fs.readFile(filePath, (err, data) => {
            if (err) {
                reject(err);
            } else {
                resolve(data.toString('base64'));               
                //   const mimeType = mime.lookup(filePath) || 'application/octet-stream';
                //   // Construct data URI with MIME type and base64-encoded data
                //   const dataUri = `data:${mimeType};base64,${Buffer.from(data).toString('base64')}`;
                //   resolve(dataUri);
            }
        });
    });
}


// Função para Indexar os dados do arquivo no Elasticsearch e retornar o ID do documento
async function indexData(filename: string, data: string, indexName: string): Promise<string> {
    try {
        
        const response = await client.index({
            index: indexName,
            pipeline: 'attachment',
            body: {
                filename: filename, // Adiciona o nome do arquivo ao documento
                data: data,
            },
          });
        
          console.log("response from elasticsearch: ", response);
            return response._id;       
    } catch (error: any) {
        if (error.meta && error.meta.body) {
            console.error('Error indexing data:',  error.meta.body.error);
        } else {
            console.error('Error indexing data:', error);

        }
        throw error;
    }
}

// Função para pesquisar pela query no Elasticsearch

// match: permite encontrar documentos onde as palavras da query estão presentes, mas não necessariamente na mesma ordem ou juntas.
// match_phrase: exige que as palavras da query apareçam exatamente na ordem e juntas no texto.
// Boosting Relevance: Se você quiser dar mais relevância a documentos onde as palavras estão juntas, mas ainda permitir que resultados com as palavras separadas apareçam, você pode usar uma combinação de match e match_phrase com uma consulta bool e configurar os boost

async function findByQuery(query: string, indexName: string) {
    try{

        console.log('query: ', query);
        const result = await client.search({
            index: indexName,

            query: {
                bool: {
                    should: [
                        {
                            match_phrase: {
                                "attachment.content": query
                            }
                        },
                        {
                            match: {
                                "attachment.content": {
                                    query: query,
                                    operator: "and",
                                    boost: 0.5
                                }
                            }
                        }
                    ]
                }
            },
            size: 10

        })

        if (result.hits.hits.length === 0) {
            return { message: "Nenhum resultado encontrado." };
        }

        // Extrair apenas os IDs e nomes de arquivos dos hits
        const hits = result.hits.hits.map((hit: 
                { 
                    _id: any; 
                    _source: { filename: any; }; 
                }) => ({
            id: hit._id,
            filename: hit._source.filename
        }));

        return hits;

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

