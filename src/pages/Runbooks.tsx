import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { canManage } from '../lib/utils';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';

export function Runbooks() {
  const { user } = useAuth();
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    title: '',
    category: 'NETWORK',
    content: '',
    version: '1.0'
  });

  useEffect(() => {
    loadRunbooks();
  }, []);

  async function loadRunbooks() {
    try {
      const { data, error } = await supabase
        .from('runbooks')
        .select('*');

      if (error) throw error;
      if (data) setRunbooks(data);
    } catch (error) {
      console.error('Error loading runbooks:', error);
      showToast('Erro ao carregar runbooks', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        last_revision: new Date().toISOString()
      };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('runbooks')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Runbook atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('runbooks')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Runbook criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadRunbooks();
      resetForm();
    } catch (error) {
      console.error('Error saving runbook:', error);
      showToast('Erro ao salvar runbook', 'error');
    }
  }

  function resetForm() {
    setFormData({
      title: '',
      category: 'NETWORK',
      content: '',
      version: '1.0'
    });
  }

  function handleEdit(runbook: any) {
    setFormData({
      title: runbook.title,
      category: runbook.category || 'NETWORK',
      content: runbook.content || '',
      version: runbook.version || '1.0'
    });
    setIsEditing(true);
    setEditingId(runbook.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('runbooks')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Runbook excluído com sucesso', 'success');
      setDeleteConfirm(null);
      loadRunbooks();
    } catch (error) {
      console.error('Error deleting runbook:', error);
      showToast('Erro ao excluir runbook', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const userCanManage = user ? canManage(user.role) : false;

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Runbooks</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Procedimentos e documentação técnica</p>
        </div>
        {userCanManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Runbook
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {runbooks.map((runbook) => (
          <Card key={runbook.id} className="hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-start gap-3 mb-3">
                <FileText className="w-6 h-6 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-1" />
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">{runbook.title}</h3>
                  {runbook.category && (
                    <Badge variant="info">{runbook.category}</Badge>
                  )}
                </div>
              </div>

              {runbook.content && (
                <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-3 mt-3">
                  {runbook.content.substring(0, 150)}...
                </p>
              )}

              <div className="mt-4 flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Versão {runbook.version}</span>
                <span>
                  {new Date(runbook.last_revision).toLocaleDateString('pt-BR')}
                </span>
              </div>

              {userCanManage && (
                <div className="flex gap-2 pt-3 mt-3 border-t dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(runbook)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDeleteConfirm(runbook.id)}
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

      {runbooks.length === 0 && (
        <div className="text-center py-12">
          <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum runbook cadastrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Runbook" : "Novo Runbook"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Título"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            required
          />

          <Select
            label="Categoria"
            options={[
              { value: 'NETWORK', label: 'Network' },
              { value: 'INFRASTRUCTURE', label: 'Infrastructure' },
              { value: 'SECURITY', label: 'Security' },
              { value: 'INCIDENT', label: 'Incident Response' },
              { value: 'MAINTENANCE', label: 'Maintenance' }
            ]}
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
          />

          <Input
            label="Versão"
            value={formData.version}
            onChange={(e) => setFormData({ ...formData, version: e.target.value })}
            placeholder="1.0"
            required
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Conteúdo
            </label>
            <textarea
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:bg-gray-700 dark:text-gray-100"
              rows={8}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
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
            Tem certeza que deseja excluir este runbook? Esta ação não pode ser desfeita.
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
