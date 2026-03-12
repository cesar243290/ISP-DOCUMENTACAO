import { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { User } from '../../types';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { useToast } from '../../components/ui/Toast';
import { useAuth } from '../../contexts/AuthContext';
import { Plus, Users as UsersIcon, Trash2, CreditCard as Edit2, Key } from 'lucide-react';

export function Users() {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteUserId, setDeleteUserId] = useState<string | null>(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordUserId, setPasswordUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const { showToast, ToastContainer } = useToast();

  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    full_name: '',
    role: 'VIEWER',
    phone: ''
  });

  useEffect(() => {
    loadUsers();
  }, []);

  async function loadUsers() {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*');

      if (error) throw error;
      if (data) setUsers(data);
    } catch (error) {
      console.error('Error loading users:', error);
      showToast('Erro ao carregar usuários', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (isEditing && editingId) {
        const { password, ...userDataWithoutPassword } = formData;

        const { data, error } = await supabase
          .from('users')
          .update(userDataWithoutPassword)
          .eq('id', editingId)
          .select()
          .single();

        if (error) throw error;


        showToast('Usuário atualizado com sucesso', 'success');
      } else {
        const { data: authData, error: authError } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            data: {
              full_name: formData.full_name,
              role: formData.role
            }
          }
        });

        if (authError) throw authError;

        if (authData.user) {
          const { password, ...userDataWithoutPassword } = formData;

          const { error: insertError } = await supabase
            .from('users')
            .insert([{
              id: authData.user.id,
              ...userDataWithoutPassword,
              is_active: true
            }]);

          if (insertError) throw insertError;
        }

        showToast('Usuário criado com sucesso', 'success');
      }

      setShowModal(false);
      setIsEditing(false);
      setEditingId(null);
      loadUsers();
      resetForm();
    } catch (error) {
      console.error('Error saving user:', error);
      showToast('Erro ao salvar usuário', 'error');
    }
  }

  function resetForm() {
    setFormData({
      email: '',
      username: '',
      password: '',
      full_name: '',
      role: 'VIEWER',
      phone: ''
    });
  }

  function handleEdit(user: User) {
    setFormData({
      email: user.email,
      username: user.username,
      password: '',
      full_name: user.full_name || '',
      role: user.role,
      phone: user.phone || ''
    });
    setIsEditing(true);
    setEditingId(user.id);
    setShowModal(true);
  }

  function handleCloseModal() {
    setShowModal(false);
    setIsEditing(false);
    setEditingId(null);
    resetForm();
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    if (!passwordUserId || !newPassword) return;

    try {
      const { error } = await supabase.auth.admin.updateUserById(
        passwordUserId,
        { password: newPassword }
      );

      if (error && error.message.includes('admin')) {
        showToast('Funcionalidade requer acesso admin. Use o Supabase Dashboard para alterar senhas.', 'error');
        return;
      }

      if (updateError) throw updateError;


      showToast('Senha alterada com sucesso', 'success');
      setShowPasswordModal(false);
      setPasswordUserId(null);
      setNewPassword('');
    } catch (error) {
      console.error('Error changing password:', error);
      showToast('Erro ao alterar senha', 'error');
    }
  }

  async function handleDelete(userId: string) {
    if (userId === currentUser?.id) {
      showToast('Você não pode deletar seu próprio usuário', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;


      showToast('Usuário deletado com sucesso', 'success');
      setDeleteUserId(null);
      loadUsers();
    } catch (error) {
      console.error('Error deleting user:', error);
      showToast('Erro ao deletar usuário', 'error');
    }
  }

  const roleColors: Record<string, 'success' | 'info' | 'warning' | 'default'> = {
    ADMIN: 'danger',
    NOC: 'success',
    NOC_READONLY: 'info',
    FIELD_TECH: 'warning',
    VIEWER: 'default'
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
          <h1 className="text-3xl font-semibold text-gray-900 dark:text-gray-100">Usuários</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">Gestão de usuários e permissões</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Novo Usuário
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {users.map((user) => (
          <Card key={user.id} className="hover:shadow-lg">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/50 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-semibold text-lg">
                    {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                    {user.full_name || user.username}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{user.email}</p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <Badge variant={roleColors[user.role]}>{user.role}</Badge>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user.is_active ? 'Ativo' : 'Inativo'}
                </p>
              </div>

              <div className="flex gap-2 pt-3 border-t dark:border-gray-700">
                <Button
                  variant="secondary"
                  onClick={() => handleEdit(user)}
                  className="flex-1 text-xs"
                >
                  <Edit2 className="w-3 h-3 mr-1" />
                  Editar
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => {
                    setPasswordUserId(user.id);
                    setShowPasswordModal(true);
                  }}
                  className="flex-1 text-xs"
                >
                  <Key className="w-3 h-3 mr-1" />
                  Senha
                </Button>
                {user.id !== currentUser?.id && (
                  <Button
                    variant="danger"
                    onClick={() => setDeleteUserId(user.id)}
                    className="flex-1 text-xs"
                  >
                    <Trash2 className="w-3 h-3 mr-1" />
                    Excluir
                  </Button>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>

      {users.length === 0 && (
        <div className="text-center py-12">
          <UsersIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">Nenhum usuário cadastrado</p>
        </div>
      )}

      <Modal isOpen={showModal} onClose={handleCloseModal} title={isEditing ? "Editar Usuário" : "Novo Usuário"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />

          <Input
            label="Nome de Usuário"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            required
          />

          <Input
            label="Nome Completo"
            value={formData.full_name}
            onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
          />

          <Input
            label="Telefone"
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />

          {!isEditing && (
            <Input
              label="Senha"
              type="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              required
            />
          )}

          {isEditing && (
            <p className="text-sm text-gray-600 dark:text-gray-400 bg-blue-50 dark:bg-blue-900/30 p-3 rounded-lg">
              Para alterar a senha, use o botão "Trocar Senha" no card do usuário.
            </p>
          )}

          <Select
            label="Role"
            options={[
              { value: 'VIEWER', label: 'Viewer (Somente Leitura)' },
              { value: 'FIELD_TECH', label: 'Field Tech (Técnico de Campo)' },
              { value: 'NOC_READONLY', label: 'NOC Read-Only' },
              { value: 'NOC', label: 'NOC (Operador)' },
              { value: 'ADMIN', label: 'Admin (Administrador)' }
            ]}
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
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
        isOpen={showPasswordModal}
        onClose={() => {
          setShowPasswordModal(false);
          setPasswordUserId(null);
          setNewPassword('');
        }}
        title="Trocar Senha"
      >
        <form onSubmit={handleChangePassword} className="space-y-4">
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Digite a nova senha para o usuário.
          </p>
          <Input
            label="Nova Senha"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
            placeholder="Mínimo 6 caracteres"
            minLength={6}
          />
          <div className="flex gap-3 pt-4">
            <Button type="submit" className="flex-1">Alterar Senha</Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                setShowPasswordModal(false);
                setPasswordUserId(null);
                setNewPassword('');
              }}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </Modal>

      <Modal
        isOpen={deleteUserId !== null}
        onClose={() => setDeleteUserId(null)}
        title="Confirmar Exclusão"
      >
        <div className="space-y-4">
          <p className="text-gray-700 dark:text-gray-300">
            Tem certeza que deseja deletar este usuário? Esta ação não pode ser desfeita.
          </p>
          <div className="flex gap-3 pt-4">
            <Button
              variant="danger"
              onClick={() => handleDelete(deleteUserId!)}
              className="flex-1"
            >
              Deletar
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => setDeleteUserId(null)}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
