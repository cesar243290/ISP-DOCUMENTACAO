import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { useToast } from './ui/Toast';
import { useAuth } from '../contexts/AuthContext';
import { Key, Eye, EyeOff, Plus, CreditCard as Edit2, Trash2 } from 'lucide-react';

interface Credential {
  id: string;
  name: string;
  username: string | null;
  password_encrypted: string | null;
  enable_encrypted: string | null;
  snmp_community_encrypted: string | null;
  api_key_encrypted: string | null;
  notes: string | null;
}

interface EquipmentCredentialsProps {
  equipmentId: string;
  equipmentName: string;
  isOpen: boolean;
  onClose: () => void;
}

export function EquipmentCredentials({ equipmentId, equipmentName, isOpen, onClose }: EquipmentCredentialsProps) {
  const { user } = useAuth();
  const [credentials, setCredentials] = useState<Credential[]>([]);
  const [loading, setLoading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [showEnable, setShowEnable] = useState(false);
  const [showSnmp, setShowSnmp] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    name: '',
    username: '',
    password: '',
    enable: '',
    snmp_community: '',
    api_key: '',
    notes: ''
  });

  useEffect(() => {
    if (isOpen) {
      loadCredentials();
    }
  }, [isOpen, equipmentId]);

  async function loadCredentials() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('credentials')
        .select('*')
        .eq('equipment_id', equipmentId)
        .order('name');

      if (error) throw error;
      if (data) setCredentials(data);
    } catch (error) {
      console.error('Error loading credentials:', error);
      showToast('Erro ao carregar credenciais', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      const submitData = {
        equipment_id: equipmentId,
        name: formData.name,
        username: formData.username || null,
        password_encrypted: formData.password ? await encrypt(formData.password) : null,
        enable_encrypted: formData.enable ? await encrypt(formData.enable) : null,
        snmp_community_encrypted: formData.snmp_community ? await encrypt(formData.snmp_community) : null,
        api_key_encrypted: formData.api_key ? await encrypt(formData.api_key) : null,
        notes: formData.notes || null,
        created_by: user?.id
      };

      if (isEditing && editingId) {
        const { data, error } = await supabase
          .from('credentials')
          .update(submitData)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Credencial atualizada com sucesso', 'success');
      } else {
        const { data, error } = await supabase
          .from('credentials')
          .insert([submitData])
          .select()
          .single();

        if (error) throw error;


        showToast('Credencial criada com sucesso', 'success');
      }

      setShowForm(false);
      setIsEditing(false);
      setEditingId(null);
      loadCredentials();
      resetForm();
    } catch (error: any) {
      console.error('Error saving credential:', error);
      showToast(`Erro ao salvar credencial: ${error.message}`, 'error');
    }
  }

  function resetForm() {
    setFormData({
      name: '',
      username: '',
      password: '',
      enable: '',
      snmp_community: '',
      api_key: '',
      notes: ''
    });
    setShowPassword(false);
    setShowEnable(false);
    setShowSnmp(false);
    setShowApiKey(false);
  }

  async function handleEdit(credential: Credential) {
    try {
      setFormData({
        name: credential.name,
        username: credential.username || '',
        password: credential.password_encrypted ? await decrypt(credential.password_encrypted) : '',
        enable: credential.enable_encrypted ? await decrypt(credential.enable_encrypted) : '',
        snmp_community: credential.snmp_community_encrypted ? await decrypt(credential.snmp_community_encrypted) : '',
        api_key: credential.api_key_encrypted ? await decrypt(credential.api_key_encrypted) : '',
        notes: credential.notes || ''
      });
      setEditingId(credential.id);
      setIsEditing(true);
      setShowForm(true);
    } catch (error) {
      showToast('Erro ao carregar credencial', 'error');
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await api.delete();
      if (error) throw error;


      showToast('Credencial excluída com sucesso', 'success');
      loadCredentials();
      setDeleteConfirm(null);
    } catch (error: any) {
      console.error('Error deleting credential:', error);
      showToast(`Erro ao excluir credencial: ${error.message}`, 'error');
    }
  }

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={`Credenciais - ${equipmentName}`}
      >
        {ToastContainer}

        {!showForm && (
          <div>
            <div className="mb-4">
              <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
                <Plus className="w-4 h-4 mr-2" />
                Adicionar Credencial
              </Button>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : credentials.length === 0 ? (
              <div className="text-center py-8">
                <Key className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-600 dark:text-gray-400 text-sm">
                  Nenhuma credencial cadastrada
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {credentials.map((cred) => (
                  <div
                    key={cred.id}
                    className="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Key className="w-4 h-4 text-blue-600" />
                        <h4 className="font-semibold text-gray-900 dark:text-gray-100">
                          {cred.name}
                        </h4>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEdit(cred)}
                          className="p-1 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/50 rounded"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(cred.id)}
                          className="p-1 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/50 rounded"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {cred.username && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        <strong>Usuário:</strong> {cred.username}
                      </p>
                    )}

                    {cred.notes && (
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                        {cred.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {showForm && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Nome da Credencial"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Admin Principal"
              required
            />

            <Input
              label="Usuário"
              value={formData.username}
              onChange={(e) => setFormData({ ...formData, username: e.target.value })}
              placeholder="admin"
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Senha Enable (opcional)
              </label>
              <div className="relative">
                <input
                  type={showEnable ? 'text' : 'password'}
                  value={formData.enable}
                  onChange={(e) => setFormData({ ...formData, enable: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowEnable(!showEnable)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showEnable ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                SNMP Community (opcional)
              </label>
              <div className="relative">
                <input
                  type={showSnmp ? 'text' : 'password'}
                  value={formData.snmp_community}
                  onChange={(e) => setFormData({ ...formData, snmp_community: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowSnmp(!showSnmp)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showSnmp ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                API Key (opcional)
              </label>
              <div className="relative">
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={formData.api_key}
                  onChange={(e) => setFormData({ ...formData, api_key: e.target.value })}
                  className="w-full px-3 py-2 pr-10 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKey(!showApiKey)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-500 hover:text-gray-700"
                >
                  {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notas
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-gray-100"
                rows={2}
                placeholder="Informações adicionais..."
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
                  setShowForm(false);
                  setIsEditing(false);
                  setEditingId(null);
                  resetForm();
                }}
                className="flex-1"
              >
                Voltar
              </Button>
            </div>
          </form>
        )}
      </Modal>

      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title="Confirmar Exclusão"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Tem certeza que deseja excluir esta credencial? Esta ação não pode ser desfeita.
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
    </>
  );
}
