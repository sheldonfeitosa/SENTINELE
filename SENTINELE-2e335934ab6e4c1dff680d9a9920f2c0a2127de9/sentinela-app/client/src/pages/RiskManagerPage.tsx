import React, { useEffect, useState } from 'react';
import { apiService, type RiskManager, type Sector } from '../services/ApiService';
import { ConfirmationModal } from '../components/ui/ConfirmationModal';
import { SectorManagementModal } from '../components/SectorManagementModal';

export function RiskManagerPage() {
    const [managers, setManagers] = useState<RiskManager[]>([]);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentManager, setCurrentManager] = useState<Partial<RiskManager>>({});
    const [newSector, setNewSector] = useState('');

    // Sector Management State
    const [showSectorModal, setShowSectorModal] = useState(false);
    const [availableSectors, setAvailableSectors] = useState<Sector[]>([]);

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [managerToDelete, setManagerToDelete] = useState<number | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Save Modal State
    const [saveModalOpen, setSaveModalOpen] = useState(false);

    useEffect(() => {
        loadManagers();
        loadSectors();
    }, []);

    const loadManagers = async () => {
        try {
            const data = await apiService.getManagers();
            setManagers(data);
        } catch (error) {
            console.error('Failed to load managers', error);
            // alert('Falha ao carregar gestores.'); // Optional: Alert on load failure
        } finally {
            setLoading(false);
        }
    };

    const loadSectors = async () => {
        try {
            const data = await apiService.getSectors();
            setAvailableSectors(data);
        } catch (error) {
            console.error('Failed to load sectors', error);
        }
    };

    const resetForm = () => {
        setCurrentManager({
            name: '',
            email: '',
            sectors: [],
            role: 'GESTOR_SETOR'
        });
        setNewSector('');
    };

    const handleSaveClick = async (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Save button clicked - bypassing modal');
        // Direct call to save, bypassing the potentially broken modal flow
        await confirmSave();
    };

    const confirmSave = async () => {
        console.log('Confirm Save called');
        setIsSaving(true);
        console.log('Payload:', currentManager);
        try {
            // Basic validation
            if (!currentManager.name || !currentManager.email) {
                alert('Nome e Email são obrigatórios.');
                setIsSaving(false);
                return;
            }

            // Check for duplicate email (Client-side)
            const isDuplicate = managers.some(m => m.email === currentManager.email && m.id !== currentManager.id);
            if (isDuplicate) {
                alert('Este email já está cadastrado para outro gestor.');
                setIsSaving(false);
                return;
            }

            if (currentManager.id) {
                console.log('Updating manager...', currentManager.id);
                await apiService.updateManager(currentManager.id, currentManager);
            } else {
                console.log('Creating manager...');
                await apiService.createManager(currentManager as any);
            }
            console.log('Save success');

            // Success feedback
            alert('Gestor salvo com sucesso!');

            setIsEditing(false);
            setSaveModalOpen(false);
            resetForm();
            loadManagers();
        } catch (error: any) {
            console.error('Failed to save manager', error);
            const errorMessage = error.response?.data?.details || error.response?.data?.error || error.message || 'Erro desconhecido';

            if (errorMessage.includes('Failed to create manager') || errorMessage.includes('Unique constraint')) {
                alert(`Erro ao salvar: Possível email duplicado! O email informado já existe no sistema.`);
            } else {
                alert(`Erro ao salvar gestor: ${errorMessage}`);
            }
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteClick = (id: number) => {
        setManagerToDelete(id);
        setDeleteModalOpen(true);
    };

    const confirmDelete = async () => {
        if (!managerToDelete) return;

        setIsDeleting(true);
        try {
            await apiService.deleteManager(managerToDelete);
            loadManagers();
            setDeleteModalOpen(false);
            setManagerToDelete(null);
            alert('Gestor excluído com sucesso!');
        } catch (error: any) {
            console.error('Failed to delete manager', error);
            alert(`Erro ao excluir gestor: ${error.message || 'Erro desconhecido'}`);
        } finally {
            setIsDeleting(false);
        }
    };

    const addSector = (sectorName?: string) => {
        const sectorToAdd = sectorName || newSector;
        if (sectorToAdd.trim()) {
            const sectors = currentManager.sectors || [];
            if (!sectors.includes(sectorToAdd.trim())) {
                setCurrentManager({
                    ...currentManager,
                    sectors: [...sectors, sectorToAdd.trim()]
                });
            }
            setNewSector('');
        }
    };

    const removeSector = (sectorToRemove: string) => {
        const sectors = currentManager.sectors || [];
        setCurrentManager({
            ...currentManager,
            sectors: sectors.filter(s => s !== sectorToRemove)
        });
    };

    return (
        <div className="p-8 max-w-7xl mx-auto">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-[#003366]">Gestores de Risco</h1>
                    <p className="text-gray-500">Gerencie os acessos e responsabilidades</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={() => { setShowSectorModal(true); loadSectors(); }}
                        className="bg-white border border-[#003366] text-[#003366] px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-50 transition-colors font-medium"
                    >
                        Gerenciar Setores
                    </button>
                    <button
                        onClick={() => { setIsEditing(true); resetForm(); }}
                        className="bg-[#003366] text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-[#002244] transition-colors"
                    >
                        [+] Novo Gestor
                    </button>
                </div>
            </div>

            {/* Sector Management Modal */}
            <SectorManagementModal
                isOpen={showSectorModal}
                onClose={() => { setShowSectorModal(false); loadSectors(); }}
            />

            {/* Edit/Create Modal */}
            {isEditing && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 m-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-bold text-[#003366]">
                                {currentManager.id ? 'Editar Gestor' : 'Novo Gestor'}
                            </h2>
                            <button onClick={() => setIsEditing(false)} className="text-gray-400 hover:text-gray-600">
                                [X]
                            </button>
                        </div>

                        <form className="space-y-4">
                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome Completo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">[U]</span>
                                    <input
                                        type="text"
                                        required
                                        value={currentManager.name || ''}
                                        onChange={e => setCurrentManager({ ...currentManager, name: e.target.value })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                            </div>

                            {/* Email */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Email Corporativo</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">[@]</span>
                                    <input
                                        type="email"
                                        required
                                        value={currentManager.email || ''}
                                        onChange={e => setCurrentManager({ ...currentManager, email: e.target.value })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                                        placeholder="Ex: joao.silva@hospital.com"
                                    />
                                </div>
                            </div>

                            {/* Função (Role) */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Função no Sistema</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">[S]</span>
                                    <select
                                        value={currentManager.role || 'GESTOR_SETOR'}
                                        onChange={e => setCurrentManager({ ...currentManager, role: e.target.value as any })}
                                        className="w-full pl-10 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none bg-white"
                                    >
                                        <option value="GESTOR_SETOR">Gestor de Setor</option>
                                        <option value="ADMIN">Gerente de Risco (Admin)</option>
                                        <option value="ALTA_GESTAO">Alta Gestão</option>
                                    </select>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">
                                    Admins têm acesso total. Gestores de setor veem apenas suas áreas.
                                </p>
                            </div>

                            {/* Setores Dinâmicos */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Setores de Responsabilidade</label>

                                {/* Dropdown de Setores Cadastrados */}
                                {availableSectors.length > 0 && (
                                    <div className="mb-3">
                                        <select
                                            onChange={(e) => {
                                                if (e.target.value) {
                                                    addSector(e.target.value);
                                                    e.target.value = ''; // Reset select
                                                }
                                            }}
                                            className="w-full p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none bg-white"
                                        >
                                            <option value="">Selecione um setor cadastrado...</option>
                                            {availableSectors.map(sector => (
                                                <option key={sector.id} value={sector.name}>{sector.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="flex gap-2 mb-3">
                                    <input
                                        type="text"
                                        value={newSector}
                                        onChange={e => setNewSector(e.target.value)}
                                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addSector())}
                                        className="flex-1 p-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#003366] outline-none"
                                        placeholder="Ou digite um novo setor..."
                                    />
                                    <button
                                        type="button"
                                        onClick={() => addSector()}
                                        className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors"
                                    >
                                        [+]
                                    </button>
                                </div>

                                <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100 min-h-[60px]">
                                    {currentManager.sectors?.length === 0 && (
                                        <span className="text-sm text-gray-400 italic">Nenhum setor atribuído</span>
                                    )}
                                    {currentManager.sectors?.map(sector => (
                                        <span key={sector} className="bg-white border border-gray-200 text-gray-700 px-3 py-1 rounded-full text-sm flex items-center gap-2 shadow-sm">
                                            {sector}
                                            <button
                                                type="button"
                                                onClick={() => removeSector(sector)}
                                                className="text-gray-400 hover:text-red-500"
                                            >
                                                [x]
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4 border-t">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                                    disabled={isSaving}
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSaveClick}
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-[#003366] text-white rounded-lg hover:bg-[#002244] transition-colors flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? 'Salvando...' : '[Salvar]'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Save Confirmation Modal */}
            <ConfirmationModal
                isOpen={saveModalOpen}
                onClose={() => setSaveModalOpen(false)}
                onConfirm={confirmSave}
                title="Salvar Alterações"
                message="Tem certeza que deseja salvar as alterações deste gestor?"
                confirmText="Sim, Salvar"
                cancelText="Cancelar"
                type="info"
                isLoading={isSaving}
            />

            {/* Delete Confirmation Modal */}
            <ConfirmationModal
                isOpen={deleteModalOpen}
                onClose={() => setDeleteModalOpen(false)}
                onConfirm={confirmDelete}
                title="Excluir Gestor"
                message="Tem certeza que deseja excluir este gestor? Esta ação não pode ser desfeita."
                confirmText="Sim, Excluir"
                cancelText="Cancelar"
                type="danger"
                isLoading={isDeleting}
            />

            {loading ? (
                <div className="text-center py-12">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#003366] mx-auto"></div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Array.isArray(managers) && managers.map(manager => (
                        <div key={manager.id} className={`p-6 rounded-xl shadow-sm border hover:shadow-md transition-shadow relative overflow-hidden ${manager.role === 'ADMIN' ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
                            }`}>
                            {/* Badge de Função */}
                            <div className={`absolute top-0 right-0 px-3 py-1 text-xs font-bold rounded-bl-xl ${manager.role === 'ADMIN' ? 'bg-[#003366] text-white' :
                                manager.role === 'ALTA_GESTAO' ? 'bg-purple-900 text-white' :
                                    'bg-gray-100 text-gray-600'
                                }`}>
                                {manager.role === 'ADMIN' ? 'ADMIN' :
                                    manager.role === 'ALTA_GESTAO' ? 'ALTA GESTÃO' : 'GESTOR'}
                            </div>

                            <div className="flex justify-between items-start mb-4 mt-2">
                                <div className="flex items-center gap-3">
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold ${manager.role === 'ADMIN' ? 'bg-blue-100 text-[#003366]' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {manager.name ? manager.name.charAt(0) : '?'}
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-gray-900">{manager.name}</h3>
                                        <p className="text-sm text-gray-500">{manager.email}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="mb-4">
                                <div className="flex items-center gap-2 mb-2 text-xs font-bold text-gray-400 uppercase">
                                    <span>[Setores]</span> ({manager.sectors ? manager.sectors.length : 0})
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {manager.sectors && manager.sectors.map(sector => (
                                        <span key={sector} className="bg-gray-50 text-gray-600 px-2 py-1 rounded text-xs font-medium border border-gray-100">
                                            {sector}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="flex justify-end gap-2 pt-4 border-t border-gray-50">
                                <button
                                    onClick={() => { setCurrentManager(manager); setIsEditing(true); }}
                                    className="p-2 text-gray-400 hover:text-[#003366] hover:bg-blue-50 rounded-lg transition-colors"
                                    title="Editar"
                                >
                                    [Editar]
                                </button>
                                <button
                                    onClick={() => handleDeleteClick(manager.id)}
                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                    title="Excluir"
                                >
                                    [Excluir]
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
