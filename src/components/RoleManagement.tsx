import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Role } from '../types';
import { Plus, Edit2, Trash2, X, Shield, CheckCircle2, ChevronRight, ChevronDown, Minus } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

const PERMISSION_TREE = [
  { id: 'dashboard', label: '仪表盘' },
  { id: 'stations', label: '电站管理' },
  { id: 'data_analysis', label: '数据分析' },
  { id: 'alerts', label: '系统告警' },
  { 
    id: 'devices', 
    label: '设备管理',
    children: [
      { id: 'gateways', label: '接入网关' },
      { id: 'inverters', label: '逆变器' },
      { id: 'basic_data', label: '基础资料' }
    ]
  },
  {
    id: 'system',
    label: '系统管理',
    children: [
      { id: 'roles', label: '角色管理' },
      { id: 'users', label: '用户管理' }
    ]
  }
];

export function RoleManagement() {
  const { showToast, confirm } = useUI();
  const [roles, setRoles] = useState<Role[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    permissions: [] as string[]
  });

  useEffect(() => {
    const q = query(collection(db, 'roles'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRoles(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Role)));
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (role?: Role) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        description: role.description,
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({ name: '', description: '', permissions: [] });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
  };

  const togglePermission = (permId: string, children?: {id: string}[]) => {
    setFormData(prev => {
      const isSelected = prev.permissions.includes(permId);
      let newPerms = new Set(prev.permissions);

      if (isSelected) {
        // Deselect
        newPerms.delete(permId);
        if (children) {
          children.forEach(c => newPerms.delete(c.id));
        }
        // Also check if we need to deselect parent
        PERMISSION_TREE.forEach(parent => {
          if (parent.children && parent.children.some(c => c.id === permId)) {
            newPerms.delete(parent.id);
          }
        });
      } else {
        // Select
        newPerms.add(permId);
        if (children) {
          children.forEach(c => newPerms.add(c.id));
        }
        // Check if all children are selected to select parent
        PERMISSION_TREE.forEach(parent => {
          if (parent.children && parent.children.some(c => c.id === permId)) {
            const allChildrenSelected = parent.children.every(c => newPerms.has(c.id) || c.id === permId);
            if (allChildrenSelected) {
              newPerms.add(parent.id);
            }
          }
        });
      }

      return { ...prev, permissions: Array.from(newPerms) };
    });
  };

  const isPermissionSelected = (permId: string) => formData.permissions.includes(permId);
  
  const getPermissionState = (node: any) => {
    if (!node.children) {
      return isPermissionSelected(node.id) ? 'checked' : 'unchecked';
    }
    const selectedChildren = node.children.filter((c: any) => isPermissionSelected(c.id)).length;
    if (selectedChildren === 0) return 'unchecked';
    if (selectedChildren === node.children.length) return 'checked';
    return 'indeterminate';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingRole) {
        await updateDoc(doc(db, 'roles', editingRole.id), {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions
        });
        showToast('编辑角色成功');
      } else {
        await addDoc(collection(db, 'roles'), {
          name: formData.name,
          description: formData.description,
          permissions: formData.permissions,
          createdAt: new Date().toISOString()
        });
        showToast('新增角色成功');
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving role:", error);
      showToast('保存角色失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('确定要删除该角色吗？')) {
      try {
        await deleteDoc(doc(db, 'roles', id));
        showToast('删除角色成功');
      } catch (error) {
        console.error("Error deleting role:", error);
        showToast('删除角色失败', 'error');
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Shield className="w-5 h-5 text-orange-500" />
          角色列表
        </h3>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" />
          新增角色
        </button>
      </div>

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">角色名称</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">描述</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">权限数量</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">创建时间</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {roles.map(role => (
              <tr key={role.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                <td className="px-6 py-4 font-medium text-white">{role.name}</td>
                <td className="px-6 py-4 text-gray-400">{role.description}</td>
                <td className="px-6 py-4 text-orange-500">{role.permissions?.length || 0} 项权限</td>
                <td className="px-6 py-4 text-center text-gray-500 font-mono">{new Date(role.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(role)}
                      className="p-2 bg-blue-500/10 text-blue-500 hover:bg-blue-500 hover:text-white rounded-lg transition-all"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(role.id)}
                      className="p-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {roles.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  暂无角色数据，请点击右上角添加。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl w-full max-w-2xl overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
              <h3 className="text-xl font-bold">{editingRole ? '编辑角色' : '新增角色'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">角色名称</label>
                  <input 
                    type="text" 
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                    placeholder="例如：系统管理员"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-400">角色描述</label>
                  <input 
                    type="text" 
                    value={formData.description}
                    onChange={e => setFormData({...formData, description: e.target.value})}
                    className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                    placeholder="简短描述该角色的职责"
                  />
                </div>
              </div>

              <div className="space-y-4">
                <label className="text-sm font-medium text-gray-400">权限分配</label>
                <div className="bg-[#1a1a1a] border border-[#222] rounded-xl p-4 space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                  {PERMISSION_TREE.map(node => {
                    const state = getPermissionState(node);
                    return (
                      <div key={node.id} className="space-y-2">
                        <label className="flex items-center gap-3 p-2 hover:bg-[#222] rounded-lg cursor-pointer transition-colors">
                          <div 
                            className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${
                              state === 'checked' ? 'bg-orange-500 border-orange-500' : 
                              state === 'indeterminate' ? 'bg-orange-500/20 border-orange-500' : 
                              'border-gray-500 bg-transparent'
                            }`}
                            onClick={(e) => {
                              e.preventDefault();
                              togglePermission(node.id, node.children);
                            }}
                          >
                            {state === 'checked' && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                            {state === 'indeterminate' && <Minus className="w-3.5 h-3.5 text-orange-500" />}
                          </div>
                          <span className={`text-sm font-medium ${state !== 'unchecked' ? 'text-orange-500' : 'text-gray-300'}`}>
                            {node.label}
                          </span>
                        </label>
                        
                        {node.children && (
                          <div className="pl-8 space-y-1 border-l border-[#333] ml-2.5">
                            {node.children.map(child => {
                              const childState = getPermissionState(child);
                              return (
                                <label key={child.id} className="flex items-center gap-3 p-2 hover:bg-[#222] rounded-lg cursor-pointer transition-colors">
                                  <div 
                                    className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                                      childState === 'checked' ? 'bg-orange-500 border-orange-500' : 'border-gray-500 bg-transparent'
                                    }`}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      togglePermission(child.id);
                                    }}
                                  >
                                    {childState === 'checked' && <CheckCircle2 className="w-3 h-3 text-white" />}
                                  </div>
                                  <span className={`text-sm ${childState === 'checked' ? 'text-orange-400' : 'text-gray-400'}`}>
                                    {child.label}
                                  </span>
                                </label>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="flex justify-end gap-4 pt-6 border-t border-[#1a1a1a]">
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
                  {editingRole ? '保存修改' : '确认新增'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
