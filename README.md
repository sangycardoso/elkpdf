# Projeto: Upload de Arquivos no Elasticsearch

## Descrição
Este projeto realiza os seguintes processos:

- Criação de índice com analyzer (stop words _brazilian_)

- Upload de arquivos pdf usando o ingest attachment, que nessa versão do ELK (8.7.1) é tratada como módulo nativo e nao como um plugin que deve ser instalado. Ao realizar o ingest do documento, é guardado o nome do arquivo e o seu conteudo é guardado em attachment.content

- Pesquisa de nomes/palavras nos documentos indexados, retornando o ID do arquivo no elk e o seu nome. A pesquisa é feita usando match_phrase e match.

O Elasticsearch é uma ferramenta poderosa para armazenamento e busca de dados em grande escala. Ao indexar arquivos no Elasticsearch, é possível realizar pesquisas avançadas e análises sobre o conteúdo desses arquivos de forma eficiente e rápida.

Este projeto inclui um servidor Node.js que aceita uploads de arquivos e os envia para o Elasticsearch para indexação. Inclui um front-end em NextJS onde o usuario informa o nome do índice que será criado, envia arquivos um a um e realiza pesquisa de palavras nesses arquivos.


## Docker
No docker rodará os containers do ElasticSearch 8.7.1 e do Kibana 8.7.1. Nessa versão, é obrigatório fazer uso do certificado.

O arquivo docker-compose.yml e o .env estão dentro da pasta backend. 

Ao subir os containers com o comando docker-compose up, um certificado 'ca.crt' será gerado dentro da pasta 'certs' no container do elasticsearch. Esse certificado deverá ser copiado de dentro do container para uma pasta de certificados no backend, da seguinte maneira:

- Crie a pasta 'certs' na raiz da pasta 'backend'
- no terminal, dentro da pasta 'backend', dê o seguinte comando para copiar o certificado:

    docker cp 0bf:/usr/share/elasticsearch/config/certs/ca/ca.crt ./certs

    *0bf é o ID do container do elastic. Altere pelo ID que o Docker gerou para o seu container

- Acesse no navegador: 'localhost:5601' e faça o login no kibana (usuario e senha estão definidos no .env)

- Se tudo estiver funcionando, passe para a execução do NodeJs e NextJS (nessa ordem)

## Backend e Frontend

## Instalação
Para instalar as dependências do projeto, execute o seguinte comando no backend e depois no frontend:

npm install

- O backend rodará na porta 3000. Caso queira outra porta, modifique no arquivo index.ts
- O frontend rodará na porta que estiver disponível


## Execução
Para executar o projeto, utilize o seguinte comando:

npm run start (backend)
npm run dev (frontend)


## TODO
A próxima etapa do projeto é realizar a integração com o storage Minio. A ideia é subir os pdfs para o Minio e depois indexa-los no elasticsearch através da Hash gerada pelo Minio
