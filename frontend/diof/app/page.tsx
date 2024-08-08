'use client'

import { useState, ChangeEvent } from 'react';
import axios from 'axios';


export default function Home() {

    const [file, setFile] = useState<File | null>(null);
    const [message, setMessage] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
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

    const handleSearch = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!searchQuery) {
        setMessage('Por favor, insira uma palavra para pesquisar');
        return;
      }
  
      try {
        const response = await axios.get('http://localhost:3000/search', {
          params: { q: searchQuery }
        });
        setSearchResults(response.data.results);
      } catch (error: any) {
        if (error.response) {
          setMessage(`Erro ao pesquisar: ${error.response.data.error}`);
        } else {
          setMessage(`Erro ao pesquisar: ${error.message}`);
        }
        console.error(error);
      }
    };


  return (
    <main className="flex flex-col items-center justify-between p-24">
        <div className='mb-4'>
          <h1>DIOF - Upload PDF</h1>
        </div>
      <div className="w-full items-center">
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
        <h2>Pesquisar nos arquivos PDF</h2>
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
