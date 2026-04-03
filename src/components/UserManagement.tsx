import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { SystemUser, Role } from '../types';
import { Plus, Edit2, Trash2, X, Users, KeyRound } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export function UserManagement() {
  const { showToast, confirm } = useUI();
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<SystemUser | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    phone: '',
    roleId: '',
    status: 'active' as 'active' | 'disabled'
  });
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    const qUsers = query(collection(db, 'users'));
    const unsubscribeUsers = onSnapshot(qUsers, (snapshot) => {
      setUsers(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as SystemUser)));
    });

    const qRoles = query(collection(db, 'roles'));
    const unsubscribeRoles = onSnapshot(qRoles, (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role)));
    });

    return () => {
      unsubscribeUsers();
      unsubscribeRoles();
    };
  }, []);

  const handleOpenModal = (user?: SystemUser) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        username: user.username,
        password: '', // Don't show password on edit
        phone: user.phone,
        roleId: user.roleId,
        status: user.status
      });
    } else {
      setEditingUser(null);
      setFormData({ username: '', password: '', phone: '', roleId: roles[0]?.id || '', status: 'active' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await updateDoc(doc(db, 'users', editingUser.id), {
          username: formData.username,
          phone: formData.phone,
          roleId: formData.roleId,
          status: formData.status
        });
        showToast('编辑用户成功');
      } else {
        await addDoc(collection(db, 'users'), {
          username: formData.username,
          password: formData.password, // In a real app, hash this!
          phone: formData.phone,
          roleId: formData.roleId,
          status: formData.status,
          createdAt: new Date().toISOString()
        });
        showToast('新增用户成功');
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving user:", error);
      showToast('保存用户失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('确定要删除该用户吗？')) {
      try {
        await deleteDoc(doc(db, 'users', id));
        showToast('删除用户成功');
      } catch (error) {
        console.error("Error deleting user:", error);
        showToast('删除用户失败', 'error');
      }
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;
    try {
      await updateDoc(doc(db, 'users', editingUser.id), {
        password: newPassword // In a real app, hash this!
      });
      setIsResetPasswordOpen(false);
      setNewPassword('');
      showToast('密码重置成功');
    } catch (error) {
      console.error("Error resetting password:", error);
      showToast('密码重置失败', 'error');
    }
  };

  const getRoleName = (roleId: string) => {
    return roles.find(r => r.id === roleId)?.name || '未知角色';
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Users className="w-5 h-5 text-orange-500" />
          用户列表
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          新增用户
        </button>
      </div>

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">用户名</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">手机号码</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">所属角色</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">创建时间</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {users.map(user => (
              <tr key={user.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{user.username}</td>
                <td className="px-6 py-4 text-gray-400 font-mono">{user.phone}</td>
                <td className="px-6 py-4 text-gray-400">
                  <span className="bg-[#1a1a1a] px-2 py-1 rounded text-xs border border-[#222]">
                    {getRoleName(user.roleId)}
                  </span>
                </td>
                <td className="px-6 py-4 text-center">
                  {user.status === 'active' ? (
                    <span className="text-green-500 bg-green-500/10 px-2 py-1 rounded border border-green-500/20 text-xs">启用</span>
                  ) : (
                    <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-xs">禁用</span>
                  )}
                </td>
                <td className="px-6 py-4 text-center text-gray-500 font-mono">{new Date(user.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => { setEditingUser(user); setIsResetPasswordOpen(true); }}
                      className="p-2 bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white rounded-lg transition-all"
                      title="重置密码"
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleOpenModal(user)}
                      className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(user.id)}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无用户数据，请点击右上角添加。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
              <h3 className="text-xl font-bold">{editingUser ? '编辑用户' : '新增用户'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">用户名</label>
                <input 
                  type="text" 
                  required
                  value={formData.username}
                  onChange={e => setFormData({...formData, username: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                  placeholder="登录账号"
                />
              </div>

              {!editingUser && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">初始密码</label>
                  <input 
                    type="password" 
                    required
                    value={formData.password}
                    onChange={e => setFormData({...formData, password: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                    placeholder="设置登录密码"
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">手机号码</label>
                <input 
                  type="tel" 
                  required
                  value={formData.phone}
                  onChange={e => setFormData({...formData, phone: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                  placeholder="联系电话"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">分配角色</label>
                <select
                  required
                  value={formData.roleId}
                  onChange={e => setFormData({...formData, roleId: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white appearance-none"
                >
                  <option value="" disabled>请选择角色</option>
                  {roles.map(role => (
                    <option key={role.id} value={role.id}>{role.name}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">账号状态</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({...formData, status: e.target.value as 'active' | 'disabled'})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white appearance-none"
                >
                  <option value="active">启用</option>
                  <option value="disabled">禁用</option>
                </select>
              </div>

              <div className="flex justify-end gap-4 pt-6 mt-6 border-t border-[#1a1a1a]">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-6 py-3 rounded-xl border border-[#222] hover:bg-[#1a1a1a] transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                >
                  {editingUser ? '保存修改' : '确认新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordOpen && editingUser && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
              <h3 className="text-xl font-bold">重置密码</h3>
            </div>
            
            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">为用户 <span className="text-white">{editingUser.username}</span> 设置新密码</label>
                <input 
                  type="password" 
                  required
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                  placeholder="输入新密码"
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#222] hover:bg-[#1a1a1a] transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-yellow-500 hover:bg-yellow-600 text-white font-medium transition-colors"
                >
                  确认重置
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
