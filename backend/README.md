# Projeto: Upload de Arquivos no Elasticsearch

## Descrição
Este projeto realiza os seguintes processos:

- Criação de índice com analyzer (stop words _brazilian_)

- Upload de arquivos pdf usando o ingest attachment, que nessa versão do ELK (8.7.1) é tratada como módulo nativo e nao como um plugin que deve ser instalado. Ao realizar o ingest do documento, é guardado o nome do arquivo e o seu conteudo é guardado em attachment.content

- Pesquisa de nomes/palavras nos documentos indexados, retornando o ID do arquivo no elk e o seu nome. A pesquisa é feita usando match_phrase e match.

O Elasticsearch é uma ferramenta poderosa para armazenamento e busca de dados em grande escala. Ao indexar arquivos no Elasticsearch, é possível realizar pesquisas avançadas e análises sobre o conteúdo desses arquivos de forma eficiente e rápida.

Este projeto inclui um servidor Node.js que aceita uploads de arquivos e os envia para o Elasticsearch para indexação. Inclui um front-end em NextJS onde o usuario informa o nome do índice que será criado, envia arquivos um a um e realiza pesquisa de palavras nesses arquivos.

## Instalação
Para instalar as dependências do projeto, execute o seguinte comando no backend e no frontend:

npm install


## Execução
Para executar o projeto, utilize o seguinte comando:

npm run start
