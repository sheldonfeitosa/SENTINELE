import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { Share2, ArrowLeft, Calendar, User, Tag } from 'lucide-react';

export const ArticleReader = () => {
    const { id } = useParams();
    const [article, setArticle] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        axios.get(`http://localhost:3001/api/articles/${id}`)
            .then(res => setArticle(res.data))
            .catch(err => console.error(err))
            .finally(() => setLoading(false));
    }, [id]);

    if (loading) return <div className="p-8 text-center">Carregando artigo...</div>;
    if (!article) return <div className="p-8 text-center">Artigo não encontrado.</div>;

    const shareOnLinkedin = () => {
        const url = window.location.href; // In prod this would be the actual public URL
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    };

    return (
        <div className="max-w-4xl mx-auto px-4 py-8">
            <Link to="/insights" className="flex items-center text-blue-600 hover:text-blue-800 mb-6">
                <ArrowLeft className="w-4 h-4 mr-1" />
                Voltar para Insights
            </Link>

            <div className="bg-white rounded-xl shadow-sm border border-slate-100 overflow-hidden">
                {article.imageUrl && (
                    <img
                        src={article.imageUrl}
                        alt={article.title}
                        className="w-full h-80 object-cover"
                    />
                )}

                <div className="p-8">
                    <div className="flex items-center gap-4 text-sm text-slate-500 mb-4">
                        <span className="flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded-full text-xs font-semibold uppercase">
                            <Tag className="w-3 h-3" />
                            {article.category || 'Geral'}
                        </span>
                        <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {new Date(article.createdAt).toLocaleDateString()}
                        </span>
                        <span className="flex items-center gap-1">
                            <User className="w-4 h-4" />
                            {article.author?.name || 'Autor Sentinela'}
                        </span>
                    </div>

                    <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-6 leading-tight">
                        {article.title}
                    </h1>

                    <div className="prose prose-blue max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                        {article.content}
                    </div>

                    <hr className="my-8 border-slate-100" />

                    <div className="flex justify-between items-center">
                        <p className="text-slate-500 italic text-sm">Escrito por {article.author?.name}</p>
                        <button
                            onClick={shareOnLinkedin}
                            className="flex items-center gap-2 text-blue-700 hover:bg-blue-50 px-4 py-2 rounded-lg transition-colors font-medium"
                        >
                            <Share2 className="w-4 h-4" />
                            Compartilhar no LinkedIn
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};
