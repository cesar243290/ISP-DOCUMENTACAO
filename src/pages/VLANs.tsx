import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { canManage } from '../lib/utils';
import { VLAN } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { Badge } from '../components/ui/Badge';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Activity, CreditCard as Edit2, Trash2 } from 'lucide-react';

export function VLANs() {
  const { user } = useAuth();
  const [vlans, setVlans] = useState<VLAN[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    vlan_id: '',
    name: '',
    type: 'MANAGEMENT',
    scope: 'global',
    observations: ''
  });

  useEffect(() => {
    loadVLANs();
  }, []);

  async function loadVLANs() {
    try {
      const { data, error } = await supabase
        .from('vlans')
        .select('*');

      if (error) throw error;
      if (data) setVlans(data);
    } catch (error) {
      console.error('Error loading VLANs:', error);
      showToast('Erro ao carregar VLANs', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = { ...formData, vlan_id: parseInt(formData.vlan_id) };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('vlans')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('VLAN atualizada com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('vlans')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('VLAN criada com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadVLANs();
      resetForm();
    } catch (error) {
      console.error('Error saving VLAN:', error);
      showToast('Erro ao salvar VLAN', 'error');
    }
  }

  function resetForm() {
    setFormData({
      vlan_id: '',
      name: '',
      type: 'MANAGEMENT',
      scope: 'global',
      observations: ''
    });
  }

  function handleEdit(vlan: VLAN) {
    setFormData({
      vlan_id: vlan.vlan_id.toString(),
      name: vlan.name,
      type: vlan.type,
      scope: vlan.scope,
      observations: vlan.observations || ''
    });
    setIsEditing(true);
    setEditingId(vlan.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('vlans')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('VLAN excluída com sucesso', 'success');
      setDeleteConfirm(null);
      loadVLANs();
    } catch (error) {
      console.error('Error deleting VLAN:', error);
      showToast('Erro ao excluir VLAN', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const userCanManage = user ? canManage(user.role) : false;

  const typeColors: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    PPPOE: 'success',
    MANAGEMENT: 'info',
    TR069: 'warning',
    CORPORATE: 'default',
    IPTV: 'info',
    VOIP: 'success',
    BACKBONE: 'warning'
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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">VLAN Registry</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Registro de VLANs da rede</p>
        </div>
        {userCanManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova VLAN
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {vlans.map((vlan) => (
          <Card key={vlan.id} className="hover:shadow-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                <span className="text-2xl font-bold text-gray-900 dark:text-gray-100">{vlan.vlan_id}</span>
              </div>
              <Badge variant={typeColors[vlan.type]}>{vlan.type}</Badge>
            </div>

            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">{vlan.name}</h3>

            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Escopo: {vlan.scope}</p>

            {userCanManage && (
              <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(vlan)}
                  className="flex-1"
                >
                  <Edit2 className="w-4 h-4 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="danger"
                  onClick={() => setDeleteConfirm(vlan.id)}
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

      {vlans.length === 0 && (
        <div className="text-center py-12">
          <Activity className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhuma VLAN cadastrada</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar VLAN" : "Nova VLAN"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="VLAN ID"
            type="number"
            value={formData.vlan_id}
            onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value })}
            min="1"
            max="4094"
            required
          />

          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="VLAN-PPPOE-100"
            required
          />

          <Select
            label="Tipo"
            options={[
              { value: 'PPPOE', label: 'PPPoE' },
              { value: 'CORPORATE', label: 'Corporativo' },
              { value: 'TR069', label: 'TR-069' },
              { value: 'MANAGEMENT', label: 'Gerência' },
              { value: 'IPTV', label: 'IPTV' },
              { value: 'VOIP', label: 'VoIP' },
              { value: 'BACKBONE', label: 'Backbone' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Select
            label="Escopo"
            options={[
              { value: 'global', label: 'Global' },
              { value: 'local', label: 'Local' }
            ]}
            value={formData.scope}
            onChange={(e) => setFormData({ ...formData, scope: e.target.value })}
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
            Tem certeza que deseja excluir esta VLAN? Esta ação não pode ser desfeita.
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
