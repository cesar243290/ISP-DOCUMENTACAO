import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Equipment, POP } from '../types';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { EquipmentCredentials } from '../components/EquipmentCredentials';
import { Plus, Server, Search, CreditCard as Edit2, Trash2, Key } from 'lucide-react';

export function Equipments() {
  const { user } = useAuth();
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [pops, setPops] = useState<POP[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [popFilter, setPopFilter] = useState('ALL');
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [credentialsModal, setCredentialsModal] = useState<{ equipmentId: string; equipmentName: string } | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    hostname: '',
    type: 'SWITCH',
    manufacturer: '',
    model: '',
    serial_number: '',
    pop_id: '',
    primary_ip: '',
    status: 'ACTIVE',
    criticality: 'P2'
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [equipmentData, popData] = await Promise.all([
        api.get('/equipment'),
        api.get('/pops')
      ]);

      if (equipmentData) setEquipments(equipmentData);
      if (popData) setPops(popData);
    } catch (error) {
      console.error('Error loading data:', error);
      showToast('Erro ao carregar dados', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = {
        ...formData,
        pop_id: formData.pop_id || null
      };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('equipment')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Equipamento atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('equipment')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Equipamento criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadData();
      resetForm();
    } catch (error) {
      console.error('Error saving equipment:', error);
      showToast('Erro ao salvar equipamento', 'error');
    }
  }

  function resetForm() {
    setFormData({
      hostname: '',
      type: 'SWITCH',
      manufacturer: '',
      model: '',
      serial_number: '',
      pop_id: '',
      primary_ip: '',
      status: 'ACTIVE',
      criticality: 'P2'
    });
  }

  function handleEdit(equipment: Equipment) {
    setFormData({
      hostname: equipment.hostname,
      type: equipment.type,
      manufacturer: equipment.manufacturer || '',
      model: equipment.model || '',
      serial_number: equipment.serial_number || '',
      pop_id: equipment.pop_id || '',
      primary_ip: equipment.primary_ip || '',
      status: equipment.status,
      criticality: equipment.criticality
    });
    setIsEditing(true);
    setEditingId(equipment.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('equipment')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Equipamento excluído com sucesso', 'success');
      setDeleteConfirm(null);
      loadData();
    } catch (error) {
      console.error('Error deleting equipment:', error);
      showToast('Erro ao excluir equipamento', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  const filteredEquipments = equipments.filter(eq => {
    const matchesSearch = eq.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
      eq.model?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === 'ALL' || eq.type === typeFilter;
    const matchesStatus = statusFilter === 'ALL' || eq.status === statusFilter;
    const matchesPop = popFilter === 'ALL' || eq.pop_id === popFilter;
    return matchesSearch && matchesType && matchesStatus && matchesPop;
  });

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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Equipamentos</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Inventário completo de equipamentos de rede</p>
        </div>
        {canManage(user!.role) && (
          <Button onClick={() => setShowModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Novo Equipamento
          </Button>
        )}
      </div>

      <Card className="mb-6 p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <div className="md:col-span-2">
            <div className="relative">
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <Input
                placeholder="Buscar por hostname ou modelo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          <Select
            options={[
              { value: 'ALL', label: 'Todos POPs' },
              ...pops.map(pop => ({ value: pop.id, label: pop.name }))
            ]}
            value={popFilter}
            onChange={(e) => setPopFilter(e.target.value)}
          />
          <Select
            options={[
              { value: 'ALL', label: 'Todos os tipos' },
              { value: 'OLT', label: 'OLT' },
              { value: 'SWITCH', label: 'Switch' },
              { value: 'ROUTER', label: 'Router' },
              { value: 'SERVER', label: 'Server' },
              { value: 'FIREWALL', label: 'Firewall' }
            ]}
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          />
          <Select
            options={[
              { value: 'ALL', label: 'Todos os status' },
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'MAINTENANCE', label: 'Manutenção' },
              { value: 'FAILED', label: 'Falha' },
              { value: 'INACTIVE', label: 'Inativo' }
            ]}
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEquipments.map((equipment) => (
          <Card key={equipment.id} className="hover:shadow-lg p-6">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 dark:bg-blue-900/50 p-2 rounded-lg">
                  <Server className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">{equipment.hostname}</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{equipment.type}</p>
                </div>
              </div>
              <Badge variant={statusColors[equipment.status]}>{equipment.status}</Badge>
            </div>

            <div className="space-y-2 text-sm mb-4">
              {equipment.manufacturer && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Fabricante:</span> {equipment.manufacturer}
                </p>
              )}
              {equipment.model && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">Modelo:</span> {equipment.model}
                </p>
              )}
              {equipment.primary_ip && (
                <p className="text-gray-600 dark:text-gray-400">
                  <span className="font-medium">IP:</span> {equipment.primary_ip}
                </p>
              )}
              <div className="pt-2 border-t dark:border-gray-700 flex items-center gap-2 flex-wrap">
                <Badge variant="info">{equipment.criticality}</Badge>
                {equipment.pop_id && (
                  <Badge variant="default">
                    {pops.find(p => p.id === equipment.pop_id)?.name || 'POP não encontrado'}
                  </Badge>
                )}
              </div>
            </div>

            {canManage(user!.role) && (
              <div className="space-y-2 pt-3 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setCredentialsModal({ equipmentId: equipment.id, equipmentName: equipment.hostname })}
                  className="w-full"
                  size="sm"
                >
                  <Key className="w-4 h-4 mr-2" />
                  Credenciais
                </Button>
                <div className="flex gap-2">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(equipment)}
                    className="flex-1"
                    size="sm"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDeleteConfirm(equipment.id)}
                    className="flex-1"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              </div>
            )}
          </Card>
        ))}
      </div>

      {filteredEquipments.length === 0 && (
        <div className="text-center py-12">
          <Server className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum equipamento encontrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Equipamento" : "Novo Equipamento"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Hostname"
            value={formData.hostname}
            onChange={(e) => setFormData({ ...formData, hostname: e.target.value })}
            required
          />

          <Select
            label="Tipo"
            options={[
              { value: 'OLT', label: 'OLT' },
              { value: 'SWITCH', label: 'Switch' },
              { value: 'ROUTER', label: 'Router' },
              { value: 'SERVER', label: 'Server' },
              { value: 'FIREWALL', label: 'Firewall' },
              { value: 'RADIO_LINK', label: 'Radio Link' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Input
            label="Fabricante"
            value={formData.manufacturer}
            onChange={(e) => setFormData({ ...formData, manufacturer: e.target.value })}
          />

          <Input
            label="Modelo"
            value={formData.model}
            onChange={(e) => setFormData({ ...formData, model: e.target.value })}
          />

          <Input
            label="Serial Number"
            value={formData.serial_number}
            onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
          />

          <Select
            label="POP"
            options={[
              { value: '', label: 'Selecione um POP' },
              ...pops.map(pop => ({ value: pop.id, label: pop.name }))
            ]}
            value={formData.pop_id}
            onChange={(e) => setFormData({ ...formData, pop_id: e.target.value })}
          />

          <Input
            label="IP Principal"
            value={formData.primary_ip}
            onChange={(e) => setFormData({ ...formData, primary_ip: e.target.value })}
            placeholder="192.168.1.1"
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

          <Select
            label="Criticidade"
            options={[
              { value: 'P0', label: 'P0 - Crítico' },
              { value: 'P1', label: 'P1 - Alto' },
              { value: 'P2', label: 'P2 - Médio' },
              { value: 'P3', label: 'P3 - Baixo' }
            ]}
            value={formData.criticality}
            onChange={(e) => setFormData({ ...formData, criticality: e.target.value })}
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
            Tem certeza que deseja excluir este equipamento? Esta ação não pode ser desfeita.
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

      {credentialsModal && (
        <EquipmentCredentials
          equipmentId={credentialsModal.equipmentId}
          equipmentName={credentialsModal.equipmentName}
          isOpen={true}
          onClose={() => setCredentialsModal(null)}
        />
      )}
    </div>
  );
}
