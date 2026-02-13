import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Linkedin } from 'lucide-react';
import { apiService, API_BASE } from '../services/ApiService';
import axios from 'axios';

// We'll fetch directly or extend ApiService. For now, using axios directly for speed, 
// but pointing to the correct API_BASE.

export const InsightsPage = () => {
    const [articles, setArticles] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchArticles().then(data => {
            setArticles(data);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, []);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Insights & Artigos</h1>
                    <p className="mt-2 text-gray-600">Conteúdo estratégico sobre segurança do paciente e gestão de riscos.</p>
                </div>
                <div className="flex items-center gap-3">
                    <select className="block w-full rounded-md border-0 py-2 pl-3 pr-10 text-gray-900 ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-blue-600 sm:text-sm sm:leading-6">
                        <option>Todas as Categorias</option>
                        <option>Segurança do Paciente</option>
                        <option>Gestão Hospitalar</option>
                        <option>Tecnologia</option>
                    </select>
                    <Link
                        to="/insights/novo"
                        className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 transition-colors whitespace-nowrap"
                    >
                        <PlusCircle className="mr-2 h-5 w-5" />
                        Novo Artigo
                    </Link>
                </div>
            </div>

            {loading ? (
                <div className="flex justify-center p-12"><p className="text-gray-500 animate-pulse">Carregando artigos...</p></div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {articles.map((article) => (
                        <Link to={`/insights/${article.id}`} key={article.id} className="group flex flex-col bg-white overflow-hidden shadow-sm rounded-2xl border border-gray-100 hover:shadow-lg hover:border-blue-100 transition-all duration-300">
                            <div className="relative h-56 overflow-hidden">
                                {article.imageUrl ? (
                                    <img src={article.imageUrl} alt={article.title} className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                ) : (
                                    <div className="h-full w-full bg-slate-100 flex items-center justify-center text-slate-400">Sem imagem</div>
                                )}
                                <div className="absolute top-4 left-4">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-white/90 text-blue-800 backdrop-blur-sm shadow-sm">
                                        {article.category || 'Geral'}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <h3 className="text-xl font-bold text-gray-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-3">
                                    {article.title}
                                </h3>
                                <p className="mt-2 text-sm text-gray-500 line-clamp-3 mb-4 flex-1">
                                    {article.content.replace(/<[^>]*>?/gm, '')}
                                </p>
                                <div className="mt-auto pt-4 border-t border-gray-50 flex items-center justify-between text-xs text-gray-400">
                                    <span>{new Date(article.createdAt).toLocaleDateString()}</span>
                                    {article.published && (
                                        <Linkedin className="w-4 h-4 text-blue-600" />
                                    )}
                                </div>
                            </div>
                        </Link>
                    ))}
                    {articles.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-slate-50 rounded-xl border border-dashed border-slate-300">
                            <p className="text-slate-500">Nenhum artigo publicado ainda.</p>
                            <Link to="/insights/novo" className="text-blue-600 hover:underline mt-2 inline-block">Escreva o primeiro!</Link>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};
