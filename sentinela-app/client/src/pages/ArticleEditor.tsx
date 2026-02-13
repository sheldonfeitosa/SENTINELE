import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Save, Linkedin, Image as ImageIcon, Type, Tag } from 'lucide-react';

interface ArticleForm {
    title: string;
    content: string;
    imageUrl: string;
    category: string;
    publishToLinkedin: boolean;
}

export const ArticleEditor = () => {
    const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ArticleForm>();
    const navigate = useNavigate();

    const onSubmit = async (data: ArticleForm) => {
        try {
            await axios.post('http://localhost:3001/api/articles', data);
            navigate('/insights');
        } catch (error) {
            console.error(error);
            alert('Erro ao criar artigo.');
        }
    };

    return (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <div className="md:flex md:items-center md:justify-between mb-8">
                <div className="min-w-0 flex-1">
                    <h2 className="text-2xl font-bold leading-7 text-gray-900 sm:truncate sm:text-3xl sm:tracking-tight">
                        Novo Artigo
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">Crie conteúdo relevante para a comunidade hospitalar.</p>
                </div>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-slate-200">

                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    {/* Title */}
                    <div className="sm:col-span-4">
                        <label className="block text-sm font-medium leading-6 text-gray-900">Título do Artigo</label>
                        <div className="mt-2 relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Type className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                {...register('title', { required: 'Título é obrigatório' })}
                                className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="Ex: Protocolos de Segurança em UTIs"
                            />
                        </div>
                        {errors.title && <span className="text-red-500 text-xs mt-1">{errors.title.message}</span>}
                    </div>

                    {/* Category */}
                    <div className="sm:col-span-2">
                        <label className="block text-sm font-medium leading-6 text-gray-900">Categoria</label>
                        <div className="mt-2 relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <Tag className="h-4 w-4 text-gray-400" />
                            </div>
                            <select
                                {...register('category')}
                                className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                            >
                                <option value="Geral">Geral</option>
                                <option value="Segurança do Paciente">Segurança do Paciente</option>
                                <option value="Gestão Hospitalar">Gestão Hospitalar</option>
                                <option value="Tecnologia em Saúde">Tecnologia em Saúde</option>
                                <option value="Estudo de Caso">Estudo de Caso</option>
                                <option value="Notícias">Notícias</option>
                            </select>
                        </div>
                    </div>

                    {/* Image URL */}
                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium leading-6 text-gray-900">URL da Imagem de Capa</label>
                        <div className="mt-2 relative">
                            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                                <ImageIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="url"
                                {...register('imageUrl')}
                                className="block w-full rounded-md border-0 py-3 pl-10 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
                                placeholder="https://..."
                            />
                        </div>
                        <p className="mt-1 text-xs text-gray-500">Recomendado: 1200x630px (Formato padrão LinkedIn).</p>
                    </div>

                    {/* Content */}
                    <div className="sm:col-span-6">
                        <label className="block text-sm font-medium leading-6 text-gray-900">Conteúdo</label>
                        <div className="mt-2 text-sm text-gray-500 mb-2">Dica: Use parágrafos simples. HTML básico é suportado.</div>
                        <textarea
                            {...register('content', { required: 'Conteúdo é obrigatório' })}
                            rows={12}
                            className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6 font-mono"
                            placeholder="Escreva seu artigo aqui..."
                        />
                        {errors.content && <span className="text-red-500 text-xs mt-1">{errors.content.message}</span>}
                    </div>
                </div>

                <div className="border-t border-gray-900/10 pt-8">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-x-3">
                            <input
                                id="publishToLinkedin"
                                type="checkbox"
                                {...register('publishToLinkedin')}
                                className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                            />
                            <label htmlFor="publishToLinkedin" className="block text-sm font-medium leading-6 text-gray-900">
                                Publicar automaticamente no LinkedIn
                                <span className="block font-normal text-gray-500 text-xs">O artigo será postado no seu perfil assim que for salvo.</span>
                            </label>
                            <Linkedin className="h-5 w-5 text-blue-700 ml-auto" />
                        </div>

                        <button
                            type="button"
                            onClick={async () => {
                                try {
                                    const { data } = await axios.get('http://localhost:3001/api/linkedin/auth');
                                    // Open in new window
                                    const width = 600;
                                    const height = 700;
                                    const left = window.screen.width / 2 - width / 2;
                                    const top = window.screen.height / 2 - height / 2;
                                    window.open(data.url, 'Connect LinkedIn', `width=${width},height=${height},left=${left},top=${top}`);

                                    // Listen for success message
                                    window.addEventListener('message', (event) => {
                                        if (event.data.type === 'LINKEDIN_CONNECTED') {
                                            alert('LinkedIn Conectado com Sucesso!');
                                        }
                                    });
                                } catch (e) {
                                    alert('Erro ao iniciar conexão com LinkedIn');
                                }
                            }}
                            className="text-sm text-blue-600 hover:text-blue-800 font-medium underline"
                        >
                            Conectar conta
                        </button>
                    </div>
                </div>

                <div className="flex items-center justify-end gap-x-6">
                    <button type="button" onClick={() => navigate('/insights')} className="text-sm font-semibold leading-6 text-gray-900">
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="rounded-md bg-blue-600 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 flex items-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Publicando...' : 'Publicar Artigo'}
                    </button>
                </div>
            </form>
        </div>
    );
};
