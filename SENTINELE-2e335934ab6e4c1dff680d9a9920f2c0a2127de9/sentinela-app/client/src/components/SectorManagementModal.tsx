import React, { useState, useEffect } from 'react';
import { apiService, type Sector } from '../services/ApiService';

interface SectorManagementModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SectorManagementModal({ isOpen, onClose }: SectorManagementModalProps) {
    const [sectors, setSectors] = useState<Sector[]>([]);
    const [newSectorName, setNewSectorName] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (isOpen) {
            loadSectors();
        }
    }, [isOpen]);

    const loadSectors = async () => {
        setLoading(true);
        try {
            const data = await apiService.getSectors();
            setSectors(data);
            setError(null);
        } catch (err) {
            console.error('Failed to load sectors', err);
            setError('Erro ao carregar setores.');
        } finally {
            setLoading(false);
        }
    };

    const handleAddSector = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newSectorName.trim()) return;

        try {
            await apiService.createSector(newSectorName.trim());
            setNewSectorName('');
            loadSectors();
        } catch (err: any) {
            console.error('Failed to create sector', err);
            if (err.response?.status === 400) {
                setError('Setor já existe.');
            } else {
                setError('Erro ao criar setor.');
            }
        }
    };

    const handleDeleteSector = async (id: number) => {
        // Removed window.confirm as it might be blocked
        console.log('Deleting sector:', id);
        try {
            await apiService.deleteSector(id);
            console.log('Sector deleted');
            loadSectors();
        } catch (err) {
            console.error('Failed to delete sector', err);
            setError('Erro ao excluir setor.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-bold text-[#003366]">Gerenciar Setores</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                        [X]
                    </button>
                </div>

                <form onSubmit={handleAddSector} className="flex gap-2 mb-6">
                    <input
                        type="text"
                        value={newSectorName}
                        onChange={(e) => setNewSectorName(e.target.value)}
                        placeholder="Nome do novo setor..."
                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!newSectorName.trim()}
                        className="bg-[#003366] text-white px-4 py-2 rounded-lg hover:bg-[#002244] transition-colors disabled:opacity-50"
                    >
                        Adicionar
                    </button>
                </form>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4 text-sm">
                        {typeof error === 'object' ? (error as any).message || JSON.stringify(error) : error}
                    </div>
                )}

                {loading ? (
                    <div className="text-center py-8">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#003366] mx-auto"></div>
                    </div>
                ) : (
                    <div className="space-y-2">
                        {sectors.length === 0 ? (
                            <p className="text-gray-500 text-center py-4">Nenhum setor cadastrado.</p>
                        ) : (
                            sectors.map((sector) => (
                                <div key={sector.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                                    <span className="font-medium text-gray-700">{sector.name}</span>
                                    <button
                                        onClick={() => handleDeleteSector(sector.id)}
                                        className="text-red-500 hover:text-red-700 text-sm font-bold px-2"
                                        title="Excluir"
                                    >
                                        [Excluir]
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
