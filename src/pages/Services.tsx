import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Select } from '../components/ui/Select';
import { Modal } from '../components/ui/Modal';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Settings, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';

export function Services() {
  const { user } = useAuth();
  const [services, setServices] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [vlans, setVlans] = useState<any[]>([]);
  const [runbooks, setRunbooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    type: 'PPPOE',
    equipment_id: '',
    vlan_id: '',
    vrf: '',
    observations: '',
    runbook_id: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [servicesData, equipmentsData, vlansData, runbooksData] = await Promise.all([
        supabase.from('services').select('*, equipment:equipment_id(hostname), vlan:vlan_id(name)').order('name'),
        supabase.from('equipment').select('id, hostname').order('hostname'),
        supabase.from('vlans').select('id, name, vlan_id').order('name'),
        supabase.from('runbooks').select('id, title').order('title')
      ]);

      if (servicesData.data) setServices(servicesData.data);
      if (equipmentsData.data) setEquipments(equipmentsData.data);
      if (vlansData.data) setVlans(vlansData.data);
      if (runbooksData.data) setRunbooks(runbooksData.data);
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
        equipment_id: formData.equipment_id || null,
        vlan_id: formData.vlan_id || null,
        runbook_id: formData.runbook_id || null,
        created_by: user?.id
      };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('services')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Serviço atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('services')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Serviço criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadData();
      resetForm();
    } catch (error: any) {
      console.error('Error saving service:', error);
      showToast(`Erro ao salvar serviço: ${error.message}`, 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      type: 'PPPOE',
      equipment_id: '',
      vlan_id: '',
      vrf: '',
      observations: '',
      runbook_id: ''
    });
  }

  function handleEdit(service: any) {
    setFormData({
      name: service.name,
      type: service.type,
      equipment_id: service.equipment_id || '',
      vlan_id: service.vlan_id || '',
      vrf: service.vrf || '',
      observations: service.observations || '',
      runbook_id: service.runbook_id || ''
    });
    setEditingId(service.id);
    setIsEditing(true);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await api.delete();
      if (error) throw error;


      showToast('Serviço excluído com sucesso', 'success');
      loadData();
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting service:', error);
      showToast(`Erro ao excluir serviço: ${error.message}`, 'error');
    }
  }

  const typeColors: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    PPPOE: 'success',
    TR069: 'warning',
    DHCP: 'info',
    DNS: 'info',
    RADIUS: 'success',
    ZABBIX: 'warning',
    SYSLOG: 'default',
    NTP: 'info',
    GRAFANA: 'warning'
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

      <div className="mb-6 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Serviços</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Serviços NOC (PPPoE, RADIUS, DNS, etc)</p>
        </div>
        {canManage(user?.role || 'VIEWER') && (
          <Button onClick={() => { resetForm(); setShowModal(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Adicionar Serviço
          </Button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {services.map((service) => (
          <Card key={service.id} className="hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <Settings className="w-6 h-6 text-blue-600" />
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">{service.name}</h3>
                    <Badge variant={typeColors[service.type]} className="mt-1">
                      {service.type}
                    </Badge>
                  </div>
                </div>
              </div>

              {service.equipment && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                  <strong>Equipamento:</strong> {service.equipment.hostname}
                </p>
              )}

              {service.vlan && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  <strong>VLAN:</strong> {service.vlan.name}
                </p>
              )}

              {service.observations && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3">{service.observations}</p>
              )}

              {canManage(user?.role || 'VIEWER') && (
                <div className="flex gap-2 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <button
                    onClick={() => handleEdit(service)}
                    className="flex-1 px-3 py-2 text-sm text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Edit2 className="w-4 h-4" />
                    Editar
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(service.id)}
                    className="flex-1 px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Trash2 className="w-4 h-4" />
                    Excluir
                  </button>
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <div className="text-center py-12">
          <Settings className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum serviço cadastrado</p>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => {
          setShowModal(false);
          setIsEditing(false);
          setEditingId(null);
          resetForm();
        }}
        title={isEditing ? 'Editar Serviço' : 'Adicionar Serviço'}
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="PPPoE Principal"
            required
          />

          <Select
            label="Tipo"
            options={[
              { value: 'PPPOE', label: 'PPPoE' },
              { value: 'TR069', label: 'TR-069' },
              { value: 'DHCP', label: 'DHCP' },
              { value: 'DNS', label: 'DNS' },
              { value: 'RADIUS', label: 'RADIUS' },
              { value: 'ZABBIX', label: 'Zabbix' },
              { value: 'SYSLOG', label: 'Syslog' },
              { value: 'NTP', label: 'NTP' },
              { value: 'GRAFANA', label: 'Grafana' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Select
            label="Equipamento (opcional)"
            options={[
              { value: '', label: 'Selecione...' },
              ...equipments.map(eq => ({ value: eq.id, label: eq.hostname }))
            ]}
            value={formData.equipment_id}
            onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
          />

          <Select
            label="VLAN (opcional)"
            options={[
              { value: '', label: 'Selecione...' },
              ...vlans.map(vlan => ({ value: vlan.id, label: `${vlan.name} (${vlan.vlan_id})` }))
            ]}
            value={formData.vlan_id}
            onChange={(e) => setFormData({ ...formData, vlan_id: e.target.value })}
          />

          <Input
            label="VRF (opcional)"
            value={formData.vrf}
            onChange={(e) => setFormData({ ...formData, vrf: e.target.value })}
            placeholder="MGMT"
          />

          <Select
            label="Runbook (opcional)"
            options={[
              { value: '', label: 'Selecione...' },
              ...runbooks.map(rb => ({ value: rb.id, label: rb.title }))
            ]}
            value={formData.runbook_id}
            onChange={(e) => setFormData({ ...formData, runbook_id: e.target.value })}
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Observações
            </label>
            <textarea
              value={formData.observations}
              onChange={(e) => setFormData({ ...formData, observations: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
              rows={3}
              placeholder="Notas adicionais..."
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">
              {isEditing ? 'Atualizar' : 'Criar'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setShowModal(false);
                setIsEditing(false);
                setEditingId(null);
                resetForm();
              }}
              className="flex-1"
            >
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
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir este serviço? Esta ação não pode ser desfeita.
        </p>
        <div className="flex gap-3">
          <Button
            onClick={() => handleDelete(deleteConfirm!)}
            variant="outline"
            className="flex-1 !text-red-600 !border-red-600 hover:!bg-red-50"
          >
            Excluir
          </Button>
          <Button
            onClick={() => setDeleteConfirm(null)}
            className="flex-1"
          >
            Cancelar
          </Button>
        </div>
      </Modal>
    </div>
  );
}
