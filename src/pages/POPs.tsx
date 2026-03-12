import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { POP } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, MapPin, Edit2, Trash2 } from 'lucide-react';

export function POPs() {
  const { user } = useAuth();
  const [pops, setPops] = useState<POP[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    city: '',
    state: '',
    address: '',
    contact_name: '',
    contact_phone: '',
    observations: ''
  });

  useEffect(() => {
    loadPOPs();
  }, []);

  async function loadPOPs() {
    try {
      const data = await api.get('/pops');
      if (data) setPops(data);
    } catch (error) {
      console.error('Error loading POPs:', error);
      showToast('Erro ao carregar POPs', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const data = await api.put(`/pops/${editingId}`, formData);
        showToast('POP atualizado com sucesso', 'success');
      } else {
        const data = await api.post('/pops', formData);
        showToast('POP criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadPOPs();
      resetForm();
    } catch (error) {
      console.error('Error saving POP:', error);
      showToast('Erro ao salvar POP', 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      city: '',
      state: '',
      address: '',
      contact_name: '',
      contact_phone: '',
      observations: ''
    });
  }

  function handleEdit(pop: POP) {
    setFormData({
      name: pop.name,
      city: pop.city,
      state: pop.state,
      address: pop.address || '',
      contact_name: pop.contact_name || '',
      contact_phone: pop.contact_phone || '',
      observations: pop.observations || ''
    });
    setIsEditing(true);
    setEditingId(pop.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      await api.delete(`/pops/${id}`);
      showToast('POP excluído com sucesso', 'success');
      setDeleteConfirm(null);
      loadPOPs();
    } catch (error) {
      console.error('Error deleting POP:', error);
      showToast('Erro ao excluir POP', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const canManage = user?.role === 'admin';

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div>
      {ToastContainer}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">POPs / Sites</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Pontos de Presença da rede</p>
        </div>
        {canManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo POP
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {pops.map((pop) => (
          <Card key={pop.id} className="hover:shadow-lg p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="bg-orange-100 dark:bg-orange-900/50 p-2 rounded-lg">
                <MapPin className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{pop.name}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{pop.city}, {pop.state}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {pop.address && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Endereço:</span> {pop.address}
                </p>
              )}

              {pop.contact_name && (
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Contato:</span> {pop.contact_name}
                  {pop.contact_phone && ` - ${pop.contact_phone}`}
                </p>
              )}
            </div>

            {canManage(user!.role) && (
              <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(pop)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm(pop.id)}
                  className="flex-1"
                >
                  <Trash2 className="w-4 h-4 mr-1" />
                  Excluir
                </Button>
              </div>
            )}
          </Card>
        ))}
      </div>

      {pops.length === 0 && (
        <div className="text-center py-12">
          <MapPin className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum POP cadastrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar POP" : "Novo POP"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome do POP"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="POP-CENTRO-SP"
            required
          />

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Cidade"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              required
            />
            <Input
              label="Estado (UF)"
              value={formData.state}
              onChange={(e) => setFormData({ ...formData, state: e.target.value })}
              placeholder="SP"
              maxLength={2}
              required
            />
          </div>

          <Input
            label="Endereço"
            value={formData.address}
            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
          />

          <Input
            label="Nome do Contato"
            value={formData.contact_name}
            onChange={(e) => setFormData({ ...formData, contact_name: e.target.value })}
          />

          <Input
            label="Telefone do Contato"
            value={formData.contact_phone}
            onChange={(e) => setFormData({ ...formData, contact_phone: e.target.value })}
            placeholder="(11) 99999-9999"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 dark:text-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{isEditing ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="secondary" onClick={handleCloseModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir este POP? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => handleDelete(deleteConfirm!)} className="flex-1">
              Confirmar
            </Button>
            <Button variant="secondary" onClick={() => setDeleteConfirm(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
