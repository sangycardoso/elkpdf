'use client'

import { useState, ChangeEvent } from 'react';
import axios from 'axios';


export default function Home() {

    const [file, setFile] = useState<File | null>(null);
    const [messageIndex, setMessageIndex] = useState('');
    const [message, setMessage] = useState('');
    const [messageSearch, setMessageSearch] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [createIndex, setCreateIndex] = useState('');
    const [searchResults, setSearchResults] = useState([]);
  
    const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
      if(event.target.files) {

        setFile(event.target.files[0]);
      }
    };

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!file) {
        setMessage('Por favor, escolha um arquivo para enviar');
        return;
      }
      const formData = new FormData();
      formData.append('file', file);
  
      try {
        const response = await axios.post('http://localhost:3000/upload', formData, {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        });
        setMessage('Arquivo enviado com sucesso!!');
      } catch (error: any) {
          if (error.response) {
            setMessage(`Erro ao enviar arquivo: ${error.response.data.error}`);
          } else {
            setMessage(`Erro ao enviar arquivo: ${error.message}`);
          }
          console.error(error);
      }
    };

    const stopWords = ["de", "a", "o", "e", "do", "da", "em", "um", "para", "com"]; 

    function isStopWord(query: string): boolean {
      return stopWords.includes(query.toLowerCase());
    }
    
    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();

      setMessageSearch('');
      
      if (!searchQuery) {
        setMessageSearch('Por favor, insira uma palavra para pesquisar');
        return;
      }

      if (isStopWord(searchQuery)) {
        setMessageSearch(`A palavra "${searchQuery}" é muito comum e não retornará resultados.`);
        return;
      }
  
      try {
        const response = await axios.get('http://localhost:3000/search', {
          params: { q: searchQuery }
        });

        if (response.data.results.length === 0) {
          setMessageSearch(`Nenhum resultado encontrado para a busca "${searchQuery}".`);
        } else {
          setSearchResults(response.data.results);
        }


      } catch (error: any) {
        if (error.response) {
          setMessage(`Erro ao pesquisar: ${error.response.data.error}`);
        } else {
          setMessage(`Erro ao pesquisar: ${error.message}`);
        }
        console.error(error);
      }
    };

    const handleIndex = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!createIndex) {
        setMessageIndex('Por favor, digite o nome do índice');
        return;
      }
  
      try {
        const response = await axios.get('http://localhost:3000/createIndex', {
          params: { indexName: createIndex }
        });
        setMessageIndex('Índice criado com sucesso!!');
      } catch (error: any) {
        if (error.response) {
          setMessageIndex(`Erro ao pesquisar: ${error.response.data.error}`);
        } else {
          setMessageIndex(`Erro ao pesquisar: ${error.message}`);
        }
        console.error(error);
      }
    };


  return (
    <main className="flex flex-col items-center justify-between p-24">
        <div className='mb-4'>
          <h1 className='font-black'>DIOF - Upload PDF</h1>
        </div>
      
        <div className="w-full items-center">
          <h2 className='my-4 font-semibold'>Criar índice</h2>
          <form onSubmit={handleIndex}>
            <div className='flex'>
              <input 
                type="text" 
                value={createIndex} 
                onChange={(e) => setCreateIndex(e.target.value)}
                className="block w-full text-sm text-slate-500 border border-slate-300 rounded-md py-2 px-4"
                placeholder="Digite o nome do índice" 
              />
              <button type="submit"
                className='ml-4 px-4 py-2 font-semibold text-sm bg-violet-500 text-white rounded-full shadow-sm'
              >
                Criar
              </button>
            </div>
          </form>
          {messageIndex && <p>{messageIndex}</p>}
      </div>


      <div className="w-full items-center">
        <h2 className='my-4 font-semibold'>Enviar arquivo PDF para indexar</h2>
        <form onSubmit={handleSubmit}>
          <div className='flex'>
            <div>
              <input 
              type="file" 
              accept="application/pdf" 
              onChange={handleFileChange}
              className="block w-full text-sm text-slate-500
                file:mr-4 file:py-2 file:px-4
                file:rounded-full file:border-0
                file:text-sm file:font-semibold
                file:bg-violet-50 file:text-violet-700
                hover:file:bg-violet-100
              " 
              />
            </div>

            <div>
              <button type="submit"
                className='px-4 py-2 font-semibold text-sm bg-violet-500 text-white rounded-full shadow-sm'
              >
                Enviar
              </button>
            </div>
          </div>
          
        </form>
        {message && <p>{message}</p>}
      </div>

      <div className="w-full items-center mt-8">
        <h2 className='font-semibold mb-4'>Pesquisar nos arquivos PDF</h2>
        <form onSubmit={handleSearch}>
          <div className='flex'>
            <input 
              type="text" 
              value={searchQuery} 
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full text-sm text-slate-500 border border-slate-300 rounded-md py-2 px-4"
              placeholder="Digite a palavra para pesquisar" 
            />
            <button type="submit"
              className='ml-4 px-4 py-2 font-semibold text-sm bg-violet-500 text-white rounded-full shadow-sm'
            >
              Pesquisar
            </button>
          </div>
        </form>
        {messageSearch && <p>{messageSearch}</p>}
        {searchResults.length > 0 && (

          <div className="mt-4">
            <h3>Resultados da Pesquisa:</h3>
            <ul>
              {searchResults.map((result: any, index: number) => (
                <li key={index}>
                  <p>ID: {result.id}</p>
                  <p>Filename: {result.filename}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

    </main>
  );
}
