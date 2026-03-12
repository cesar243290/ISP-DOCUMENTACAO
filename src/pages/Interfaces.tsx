import { useEffect, useState } from 'react';
import { api } from '../lib/api';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Select } from '../components/ui/Select';
import { useToast } from '../components/ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Network, Search, Plus, CreditCard as Edit2, Trash2, Link, Cable } from 'lucide-react';

export function Interfaces() {
  const { user } = useAuth();
  const [interfaces, setInterfaces] = useState<any[]>([]);
  const [equipments, setEquipments] = useState<any[]>([]);
  const [links, setLinks] = useState<any[]>([]);
  const [vlans, setVlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingLink, setIsEditingLink] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingLinkId, setEditingLinkId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [deleteLinkConfirm, setDeleteLinkConfirm] = useState<string | null>(null);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    equipment_id: '',
    type: 'ETHERNET',
    description: '',
    speed: '',
    oper_status: 'up'
  });

  const [linkFormData, setLinkFormData] = useState({
    interface_a_id: '',
    interface_b_id: '',
    description: '',
    vlans: [] as string[],
    status: 'ACTIVE',
    bandwidth: ''
  });

  useEffect(() => {
    loadInterfaces();
  }, []);

  async function loadInterfaces() {
    try {
      const [interfaceData, equipmentData, linkData, vlanData] = await Promise.all([
        api.get('/interfaces'),
        api.get('/equipment'),
        api.get('/interface_links'),
        api.get('/vlans')
      ]);

      if (interfaceData) setInterfaces(interfaceData);
      if (equipmentData) setEquipments(equipmentData);
      if (linkData) setLinks(linkData);
      if (vlanData) setVlans(vlanData);
    } catch (error) {
      console.error('Error loading interfaces:', error);
      showToast('Erro ao carregar interfaces', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('interfaces')
          .update(formData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Interface atualizada com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('interfaces')
          .insert([formData])
          .select()
          .single();

        if (error) throw error;


        showToast('Interface criada com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadInterfaces();
      resetForm();
    } catch (error) {
      console.error('Error saving interface:', error);
      showToast('Erro ao salvar interface', 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      equipment_id: '',
      type: 'ETHERNET',
      description: '',
      speed: '',
      oper_status: 'up'
    });
  }

  function handleEdit(iface: any) {
    setFormData({
      name: iface.name,
      equipment_id: iface.equipment_id || '',
      type: iface.type,
      description: iface.description || '',
      speed: iface.speed || '',
      oper_status: iface.oper_status
    });
    setIsEditing(true);
    setEditingId(iface.id);
    setShowModal(true);
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('interfaces')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Interface excluída com sucesso', 'success');
      setDeleteConfirm(null);
      loadInterfaces();
    } catch (error) {
      console.error('Error deleting interface:', error);
      showToast('Erro ao excluir interface', 'error');
    }
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  async function handleLinkSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = {
        ...linkFormData,
        vlans: linkFormData.vlans.length > 0 ? linkFormData.vlans : []
      };

      if (isEditingLink && editingLinkId) {
        const { data, error } = await supabase
          .from('interface_links')
          .update(submitData)
          .eq('id', editingLinkId)
          .select()
          .single();

        if (error) throw error;


        showToast('Enlace atualizado com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('interface_links')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Enlace criado com sucesso', 'success');
      }

      setShowLinkModal(false);
      setIsEditingLink(false);
      setEditingLinkId(null);
      loadInterfaces();
      resetLinkForm();
    } catch (error) {
      console.error('Error saving link:', error);
      showToast('Erro ao salvar enlace', 'error');
    }
  }

  function resetLinkForm() {
    setLinkFormData({
      interface_a_id: '',
      interface_b_id: '',
      description: '',
      vlans: [],
      status: 'ACTIVE',
      bandwidth: ''
    });
  }

  function handleEditLink(link: any) {
    setLinkFormData({
      interface_a_id: link.interface_a_id,
      interface_b_id: link.interface_b_id,
      description: link.description || '',
      vlans: link.vlans || [],
      status: link.status,
      bandwidth: link.bandwidth || ''
    });
    setIsEditingLink(true);
    setEditingLinkId(link.id);
    setShowLinkModal(true);
  }

  async function handleDeleteLink(id: string) {
    try {
      const { error } = await supabase
        .from('interface_links')
        .delete()
        .eq('id', id);

      if (error) throw error;


      showToast('Enlace excluído com sucesso', 'success');
      setDeleteLinkConfirm(null);
      loadInterfaces();
    } catch (error) {
      console.error('Error deleting link:', error);
      showToast('Erro ao excluir enlace', 'error');
    }
  }

  function handleCloseLinkModal() {
    setShowLinkModal(false);
    setIsEditingLink(false);
    setEditingLinkId(null);
    resetLinkForm();
  }

  function getInterfaceLinks(interfaceId: string) {
    return links.filter(
      link => link.interface_a_id === interfaceId || link.interface_b_id === interfaceId
    );
  }

  const filteredInterfaces = interfaces.filter(iface =>
    iface.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iface.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    iface.equipment?.hostname?.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Interfaces</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Interfaces de rede e enlaces entre equipamentos</p>
        </div>
        {canManage(user!.role) && (
          <div className="flex gap-3 flex-wrap">
            <Button variant="secondary" onClick={() => setShowLinkModal(true)}>
              <Cable className="w-4 h-4 mr-2" />
              Novo Enlace
            </Button>
            <Button onClick={() => setShowModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nova Interface
            </Button>
          </div>
        )}
      </div>

      <Card className="mb-6">
        <div className="relative">
          <Search className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
          <Input
            placeholder="Buscar por nome, descrição ou equipamento..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredInterfaces.map((iface) => {
          const interfaceLinks = getInterfaceLinks(iface.id);
          return (
            <Card key={iface.id} className="hover:shadow-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <Network className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                <h3 className="font-semibold text-gray-900 dark:text-gray-100">{iface.name}</h3>
                <Badge variant={iface.oper_status === 'up' ? 'success' : 'danger'}>
                  {iface.oper_status}
                </Badge>
              </div>

              <div className="space-y-2 mb-3">
                {iface.equipment && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Equipamento:</span> {iface.equipment.hostname}
                  </p>
                )}

                {iface.description && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-medium">Descrição:</span> {iface.description}
                  </p>
                )}

                <div className="flex flex-wrap gap-1 mt-2">
                  <Badge variant="info">{iface.type}</Badge>
                  {iface.speed && <Badge variant="default">{iface.speed}</Badge>}
                </div>

                {interfaceLinks.length > 0 && (
                  <div className="mt-3 pt-3 border-t dark:border-gray-700">
                    <div className="flex items-center gap-2 mb-2">
                      <Cable className="w-4 h-4 text-green-600 dark:text-green-400" />
                      <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        Enlaces ({interfaceLinks.length})
                      </span>
                    </div>
                    <div className="space-y-2">
                      {interfaceLinks.map(link => {
                        const isInterfaceA = link.interface_a_id === iface.id;
                        const remoteInterface = isInterfaceA ? link.interface_b_name : link.interface_a_name;
                        const remoteEquipment = isInterfaceA ? link.equipment_b_hostname : link.equipment_a_hostname;
                        return (
                          <div key={link.id} className="text-xs bg-gray-50 dark:bg-gray-800 p-2 rounded">
                            <p className="font-medium text-gray-900 dark:text-gray-100">
                              {remoteEquipment} - {remoteInterface}
                            </p>
                            {link.vlans && link.vlans.length > 0 && (
                              <p className="text-gray-600 dark:text-gray-400 mt-1">
                                VLANs: {link.vlans.join(', ')}
                              </p>
                            )}
                            <Badge variant={link.status === 'ACTIVE' ? 'success' : 'default'} className="mt-1">
                              {link.status}
                            </Badge>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {canManage(user!.role) && (
                <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
                  <Button
                    variant="secondary"
                    onClick={() => handleEdit(iface)}
                    className="flex-1"
                  >
                    <Edit2 className="w-4 h-4 mr-1" />
                    Editar
                  </Button>
                  <Button
                    variant="danger"
                    onClick={() => setDeleteConfirm(iface.id)}
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-1" />
                    Excluir
                  </Button>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredInterfaces.length === 0 && (
        <div className="text-center py-12">
          <Network className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhuma interface encontrada</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Interface" : "Nova Interface"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Nome"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="eth0"
            required
          />

          <Select
            label="Equipamento"
            options={[
              { value: '', label: 'Selecione um equipamento' },
              ...equipments.map(eq => ({ value: eq.id, label: eq.hostname }))
            ]}
            value={formData.equipment_id}
            onChange={(e) => setFormData({ ...formData, equipment_id: e.target.value })}
          />

          <Select
            label="Tipo"
            options={[
              { value: 'ETHERNET', label: 'Ethernet' },
              { value: 'FIBER', label: 'Fibra' },
              { value: 'GPON', label: 'GPON' },
              { value: 'LAG', label: 'LAG' },
              { value: 'LOOPBACK', label: 'Loopback' },
              { value: 'VLAN', label: 'VLAN' }
            ]}
            value={formData.type}
            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
          />

          <Input
            label="Descrição"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Descrição da interface"
          />

          <Input
            label="Velocidade"
            value={formData.speed}
            onChange={(e) => setFormData({ ...formData, speed: e.target.value })}
            placeholder="1Gbps"
          />

          <Select
            label="Status Operacional"
            options={[
              { value: 'up', label: 'Up' },
              { value: 'down', label: 'Down' }
            ]}
            value={formData.oper_status}
            onChange={(e) => setFormData({ ...formData, oper_status: e.target.value })}
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
            Tem certeza que deseja excluir esta interface? Esta ação não pode ser desfeita.
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

      <Modal isOpen={showLinkModal} onClose={handleCloseLinkModal} title={isEditingLink ? "Editar Enlace" : "Novo Enlace"}>
        <form onSubmit={handleLinkSubmit} className="space-y-4">
          <Select
            label="Interface A"
            options={[
              { value: '', label: 'Selecione a primeira interface' },
              ...interfaces.map(iface => ({
                value: iface.id,
                label: `${iface.equipment?.hostname || 'Sem equipamento'} - ${iface.name}`
              }))
            ]}
            value={linkFormData.interface_a_id}
            onChange={(e) => setLinkFormData({ ...linkFormData, interface_a_id: e.target.value })}
            required
          />

          <Select
            label="Interface B"
            options={[
              { value: '', label: 'Selecione a segunda interface' },
              ...interfaces
                .filter(iface => iface.id !== linkFormData.interface_a_id)
                .map(iface => ({
                  value: iface.id,
                  label: `${iface.equipment?.hostname || 'Sem equipamento'} - ${iface.name}`
                }))
            ]}
            value={linkFormData.interface_b_id}
            onChange={(e) => setLinkFormData({ ...linkFormData, interface_b_id: e.target.value })}
            required
          />

          <Input
            label="Descrição"
            value={linkFormData.description}
            onChange={(e) => setLinkFormData({ ...linkFormData, description: e.target.value })}
            placeholder="Descrição do enlace"
          />

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              VLANs (selecione múltiplas)
            </label>
            <select
              multiple
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:ring-blue-500 focus:border-blue-500"
              value={linkFormData.vlans}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, option => option.value);
                setLinkFormData({ ...linkFormData, vlans: selected });
              }}
              size={5}
            >
              {vlans.map(vlan => (
                <option key={vlan.id} value={vlan.vlan_id.toString()}>
                  VLAN {vlan.vlan_id} - {vlan.name}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              Segure Ctrl/Cmd para selecionar múltiplas VLANs
            </p>
          </div>

          <Input
            label="Largura de Banda"
            value={linkFormData.bandwidth}
            onChange={(e) => setLinkFormData({ ...linkFormData, bandwidth: e.target.value })}
            placeholder="10Gbps"
          />

          <Select
            label="Status"
            options={[
              { value: 'ACTIVE', label: 'Ativo' },
              { value: 'INACTIVE', label: 'Inativo' },
              { value: 'MAINTENANCE', label: 'Manutenção' }
            ]}
            value={linkFormData.status}
            onChange={(e) => setLinkFormData({ ...linkFormData, status: e.target.value })}
          />

          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">{isEditingLink ? 'Atualizar' : 'Criar'}</Button>
            <Button type="button" variant="secondary" onClick={handleCloseLinkModal} className="flex-1">
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={!!deleteLinkConfirm}
        onClose={() => setDeleteLinkConfirm(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-600 dark:text-gray-400">
            Tem certeza que deseja excluir este enlace? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3">
            <Button variant="danger" onClick={() => handleDeleteLink(deleteLinkConfirm!)} className="flex-1">
              Confirmar
            </Button>
            <Button variant="secondary" onClick={() => setDeleteLinkConfirm(null)} className="flex-1">
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
