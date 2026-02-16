import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { canManage } from '../lib/auth';
import { logAudit } from '../lib/audit';
import { Link as LinkIcon, Plus, Edit2, Trash2 } from 'lucide-react';

export function Circuits() {
  const { user } = useAuth();
  const [circuits, setCircuits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'PTP_FIBER',
    provider: '',
    circuit_id: '',
    capacity: '',
    sla: '',
    status: 'ACTIVE'
  });

  useEffect(() => {
    loadCircuits();
  }, []);

  async function loadCircuits() {
    try {
      const { data } = await supabase.from('circuits').select('*').order('name');
      if (data) setCircuits(data);
    } catch (error) {
      console.error('Error loading circuits:', error);
      showToast('Erro ao carregar circuitos', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('circuits')
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;

        await logAudit({
          user_id: user?.id,
          action: 'UPDATE',
          entity_type: 'circuit',
          entity_id: data.id,
          after_data: data
        });

        showToast('Circuito atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('circuits')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;

        await logAudit({
          user_id: user?.id,
          action: 'CREATE',
          entity_type: 'circuit',
          entity_id: data.id,
          after_data: data
        });

        showToast('Circuito criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadCircuits();
      resetForm();
    } catch (error) {
      console.error('Error saving circuit:', error);
      showToast('Erro ao salvar circuito', 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'PTP_FIBER',
      provider: '',
      circuit_id: '',
      capacity: '',
      sla: '',
      status: 'ACTIVE'
    });
  }

  function handleEdit(circuit: any) {
    setFormData({
      name: circuit.name,
      type: circuit.type,
      provider: circuit.provider || '',
      circuit_id: circuit.circuit_id || '',
      capacity: circuit.capacity || '',
      sla: circuit.sla || '',
      status: circuit.status
    });
    setIsEditing(true);
    setEditingId(circuit.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('circuits')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await logAudit({
        user_id: user?.id,
        action: 'DELETE',
        entity_type: 'circuit',
        entity_id: id
      });

      showToast('Circuito excluído com sucesso', 'success');
      setDeleteConfirm(null);
      loadCircuits();
    } catch (error) {
      console.error('Error deleting circuit:', error);
      showToast('Erro ao excluir circuito', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const statusColors: Record<string, 'success' | 'warning' | 'danger' | 'default'> = {
    ACTIVE: 'success',
    MAINTENANCE: 'warning',
    FAILED: 'danger',
    INACTIVE: 'default'
  };

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Circuitos & Enlaces</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestão de circuitos e enlaces de rede</p>
        </div>
        {canManage(user!.role) && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Circuito
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {circuits.map((circuit) => (
          <Card key={circuit.id} className="hover:shadow-lg p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <LinkIcon className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{circuit.name}</h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{circuit.type}</p>
                </div>
              </div>
              <Badge variant={statusColors[circuit.status]}>{circuit.status}</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              {circuit.provider && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Operadora</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{circuit.provider}</p>
                </div>
              )}
              {circuit.circuit_id && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">ID do Circuito</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{circuit.circuit_id}</p>
                </div>
              )}
              {circuit.capacity && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Capacidade</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{circuit.capacity}</p>
                </div>
              )}
              {circuit.sla && (
                <div>
                  <p className="text-gray-500 dark:text-gray-400">SLA</p>
                  <p className="font-medium text-gray-900 dark:text-gray-100">{circuit.sla}</p>
                </div>
              )}
            </div>

            {canManage(user!.role) && (
              <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(circuit)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm(circuit.id)}
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

      {circuits.length === 0 && (
        <div className="text-center py-12">
          <LinkIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum circuito cadastrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Circuito" : "Novo Circuito"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="CIRCUITO-001"
            required
          />

          <Select
            label="Tipo"
            options={[
              { value: 'PTP_FIBER', label: 'Fibra Ponto-a-Ponto' },
              { value: 'TRANSIT_IP', label: 'Trânsito IP' },
              { value: 'IX', label: 'Internet Exchange' },
              { value: 'RADIO', label: 'Rádio Enlace' },
              { value: 'MPLS', label: 'MPLS' },
              { value: 'L2', label: 'Layer 2' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Input
            label="Operadora"
            value={formData.provider}
            onChange={(e) => setFormData({ ...formData, provider: e.target.value })}
            placeholder="Nome da operadora"
          />

          <Input
            label="ID do Circuito"
            value={formData.circuit_id}
            onChange={(e) => setFormData({ ...formData, circuit_id: e.target.value })}
            placeholder="ID fornecido pela operadora"
          />

          <Input
            label="Capacidade"
            value={formData.capacity}
            onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
            placeholder="100Mbps, 1Gbps, etc."
          />

          <Input
            label="SLA"
            value={formData.sla}
            onChange={(e) => setFormData({ ...formData, sla: e.target.value })}
            placeholder="99.9%, 4h, etc."
          />

          <Select
            label="Status"
            options={[
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'MAINTENANCE', label: 'Manutenção' },
              { value: 'INACTIVE', label: 'Inativo' },
              { value: 'FAILED', label: 'Falha' }
            ]}
            value={formData.status}
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          />

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
            Tem certeza que deseja excluir este circuito? Esta ação não pode ser desfeita.
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
