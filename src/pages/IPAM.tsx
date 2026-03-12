import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { canManage } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Plus, Globe, CreditCard as Edit2, Trash2 } from 'lucide-react';

export function IPAM() {
  const { user } = useAuth();
  const [subnets, setSubnets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    cidr: '',
    description: '',
    type: 'CLIENT',
    gateway: '',
    vrf: ''
  });

  useEffect(() => {
    loadSubnets();
  }, []);

  async function loadSubnets() {
    try {
      const { data, error } = await supabase
        .from('subnets')
        .select('*');

      if (error) throw error;
      if (data) setSubnets(data);
    } catch (error) {
      console.error('Error loading subnets:', error);
      showToast('Erro ao carregar sub-redes', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('subnets')
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Sub-rede atualizada com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('subnets')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;


        showToast('Sub-rede criada com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadSubnets();
      resetForm();
    } catch (error) {
      console.error('Error saving subnet:', error);
      showToast('Erro ao salvar sub-rede', 'error');
    }
  }

  function resetForm() {
    setFormData({
      cidr: '',
      description: '',
      type: 'CLIENT',
      gateway: '',
      vrf: ''
    });
  }

  function handleEdit(subnet: any) {
    setFormData({
      cidr: subnet.cidr,
      description: subnet.description || '',
      type: subnet.type,
      gateway: subnet.gateway || '',
      vrf: subnet.vrf || ''
    });
    setIsEditing(true);
    setEditingId(subnet.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('subnets')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Sub-rede excluída com sucesso', 'success');
      setDeleteConfirm(null);
      loadSubnets();
    } catch (error) {
      console.error('Error deleting subnet:', error);
      showToast('Erro ao excluir sub-rede', 'error');
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
    CLIENT: 'success',
    MGMT: 'info',
    BACKBONE: 'warning',
    LOOPBACK: 'default',
    P2P: 'warning'
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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">IPAM</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gerenciamento de endereços IP e sub-redes</p>
        </div>
        {userCanManage && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Nova Sub-rede
          </Button>
        )}
      </div>

      <div className="space-y-3">
        {subnets.map((subnet) => (
          <Card key={subnet.id} className="hover:shadow-lg p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4 flex-1">
                <Globe className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-1">
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100 text-lg">{subnet.cidr}</h3>
                    <Badge variant={typeColors[subnet.type]}>{subnet.type}</Badge>
                  </div>
                  {subnet.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">{subnet.description}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="text-right">
                  {subnet.gateway && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Gateway:</span> {subnet.gateway}
                    </p>
                  )}
                  {subnet.vrf && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">VRF:</span> {subnet.vrf}
                    </p>
                  )}
                </div>

                {userCanManage && (
                  <div className="flex gap-2">
                    <Button
                      variant="secondary"
                      onClick={() => handleEdit(subnet)}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="danger"
                      onClick={() => setDeleteConfirm(subnet.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {subnets.length === 0 && (
        <div className="text-center py-12">
          <Globe className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhuma sub-rede cadastrada</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Sub-rede" : "Nova Sub-rede"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="CIDR"
            value={formData.cidr}
            onChange={(e) => setFormData({ ...formData, cidr: e.target.value })}
            placeholder="192.168.1.0/24"
            required
          />

          <Input
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Rede de clientes - Região A"
          />

          <Select
            label="Tipo"
            options={[
              { value: 'CLIENT', label: 'Cliente' },
              { value: 'MGMT', label: 'Gerência' },
              { value: 'BACKBONE', label: 'Backbone' },
              { value: 'LOOPBACK', label: 'Loopback' },
              { value: 'P2P', label: 'Ponto a Ponto' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Input
            label="Gateway"
            value={formData.gateway}
            onChange={(e) => setFormData({ ...formData, gateway: e.target.value })}
            placeholder="192.168.1.1"
          />

          <Input
            label="VRF"
            value={formData.vrf}
            onChange={(e) => setFormData({ ...formData, vrf: e.target.value })}
            placeholder="management"
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
            Tem certeza que deseja excluir esta sub-rede? Esta ação não pode ser desfeita.
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
