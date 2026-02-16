import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { canManage } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { CheckSquare, Plus, Edit2, Trash2 } from 'lucide-react';

export function Checklists() {
  const { user } = useAuth();
  const [checklists, setChecklists] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'NETWORK'
  });

  useEffect(() => {
    loadChecklists();
  }, []);

  async function loadChecklists() {
    try {
      const { data } = await supabase.from('checklists').select('*').order('title');
      if (data) setChecklists(data);
    } catch (error) {
      console.error('Error loading checklists:', error);
      showToast('Erro ao carregar checklists', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('checklists')
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;

        await logAudit({
          user_id: user?.id,
          action: 'UPDATE',
          entity_type: 'checklist',
          entity_id: data.id,
          after_data: data
        });

        showToast('Checklist atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('checklists')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        await logAudit({
          user_id: user?.id,
          action: 'CREATE',
          entity_type: 'checklist',
          entity_id: data.id,
          after_data: data
        });

        showToast('Checklist criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadChecklists();
      resetForm();
    } catch (error) {
      console.error('Error saving checklist:', error);
      showToast('Erro ao salvar checklist', 'error');
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      description: '',
      category: 'NETWORK'
    });
  }

  function handleEdit(checklist: any) {
    setFormData({
      title: checklist.title,
      description: checklist.description || '',
      category: checklist.category || 'NETWORK'
    });
    setIsEditing(true);
    setEditingId(checklist.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('checklists')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAudit({
        user_id: user?.id,
        action: 'DELETE',
        entity_type: 'checklist',
        entity_id: id
      });

      showToast('Checklist excluído com sucesso', 'success');
      setDeleteConfirm(null);
      loadChecklists();
    } catch (error) {
      console.error('Error deleting checklist:', error);
      showToast('Erro ao excluir checklist', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Checklists</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Checklists operacionais e procedimentos</p>
        </div>
        {canManage(user!.role) && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Checklist
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {checklists.map((checklist) => (
          <Card key={checklist.id} className="hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <CheckSquare className="w-6 h-6 text-green-600 dark:text-green-400 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{checklist.title}</h3>
                  {checklist.category && (
                    <Badge variant="info">{checklist.category}</Badge>
                  )}
                </div>
              </div>

              {checklist.description && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{checklist.description}</p>
              )}

              {canManage(user!.role) && (
                <div className="flex gap-2 pt-3 mt-3 border-t dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(checklist)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDeleteConfirm(checklist.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {checklists.length === 0 && (
        <div className="text-center py-12">
          <CheckSquare className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum checklist cadastrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Checklist" : "Novo Checklist"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Categoria
            </label>
            <select
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              value={formData.category}
              onChange={(e) => setFormData({ ...formData, category: e.target.value })}
              required
            >
              <option value="NETWORK">Network</option>
              <option value="INFRASTRUCTURE">Infrastructure</option>
              <option value="SECURITY">Security</option>
              <option value="INCIDENT">Incident Response</option>
              <option value="MAINTENANCE">Maintenance</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Descrição
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              rows={4}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              required
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
            Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.
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
