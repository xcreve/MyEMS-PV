import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Inverter, Gateway } from '../types';
import { Zap, Activity, AlertCircle, Plus, Search, Filter, Trash2, X, Pencil, Eye, Router } from 'lucide-react';
import { InverterModel } from './BasicData';
import { useUI } from '../contexts/UIContext';

export function InverterList() {
  const { showToast, confirm } = useUI();
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [inverterModels, setInverterModels] = useState<InverterModel[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedInverter, setSelectedInverter] = useState<Inverter | null>(null);
  const [editingInverter, setEditingInverter] = useState<Inverter | null>(null);
  const [newInverter, setNewInverter] = useState({ gatewayId: '', model: '', serialNumber: '', inverterNumber: '' });

  useEffect(() => {
    const qInv = query(collection(db, 'inverters'));
    const unsubscribeInv = onSnapshot(qInv, (snapshot) => {
      setInverters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inverter)));
    });

    const qGate = query(collection(db, 'gateways'));
    const unsubscribeGate = onSnapshot(qGate, (snapshot) => {
      setGateways(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gateway)));
    });

    const qModels = query(collection(db, 'inverterModels'));
    const unsubscribeModels = onSnapshot(qModels, (snapshot) => {
      setInverterModels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InverterModel)));
    });

    return () => {
      unsubscribeInv();
      unsubscribeGate();
      unsubscribeModels();
    };
  }, []);

  // Group models by brand
  const modelsByBrand = inverterModels.reduce((acc, model) => {
    if (!acc[model.brand]) {
      acc[model.brand] = [];
    }
    acc[model.brand].push(model);
    return acc;
  }, {} as Record<string, InverterModel[]>);

  const handleAddInverter = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'inverters'), {
        ...newInverter,
        status: 'online',
        lastSeen: new Date().toISOString()
      });
      setIsAdding(false);
      setNewInverter({ gatewayId: '', model: '', serialNumber: '', inverterNumber: '' });
      showToast('添加逆变器成功');
    } catch (error) {
      console.error("Error adding inverter:", error);
      showToast('添加逆变器失败', 'error');
    }
  };

  const handleDeleteInverter = async (id: string) => {
    if (await confirm('确定要删除该逆变器吗？')) {
      try {
        await deleteDoc(doc(db, 'inverters', id));
        showToast('删除逆变器成功');
      } catch (error) {
        console.error("Error deleting inverter:", error);
        showToast('删除逆变器失败', 'error');
      }
    }
  };

  const handleEditInverter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingInverter) return;
    try {
      const invRef = doc(db, 'inverters', editingInverter.id);
      await updateDoc(invRef, {
        gatewayId: editingInverter.gatewayId,
        model: editingInverter.model,
        serialNumber: editingInverter.serialNumber,
        inverterNumber: editingInverter.inverterNumber || ''
      });
      setEditingInverter(null);
      showToast('编辑逆变器成功');
    } catch (error) {
      console.error("Error updating inverter:", error);
      showToast('编辑逆变器失败', 'error');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="通过序列号搜索..." 
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加逆变器
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">添加逆变器</h4>
            </div>
            <form onSubmit={handleAddInverter} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">所属网关</label>
                <select 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newInverter.gatewayId}
                  onChange={e => setNewInverter({...newInverter, gatewayId: e.target.value})}
                  required
                >
                  <option value="">选择接入网关</option>
                  {gateways.map(g => (
                    <option key={g.id} value={g.id}>{g.name} ({g.serialNumber})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">型号</label>
                <select 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newInverter.model}
                  onChange={e => setNewInverter({...newInverter, model: e.target.value})}
                  required
                >
                  <option value="">选择逆变器型号</option>
                  {Object.entries(modelsByBrand).map(([brand, models]) => (
                    <optgroup key={brand} label={brand}>
                      {models.map(m => (
                        <option key={m.id} value={m.model}>{m.model}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">编号</label>
                <input 
                  type="text" 
                  placeholder="逆变器编号" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newInverter.inverterNumber}
                  onChange={e => setNewInverter({...newInverter, inverterNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">序列号</label>
                <input 
                  type="text" 
                  placeholder="序列号" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newInverter.serialNumber}
                  onChange={e => setNewInverter({...newInverter, serialNumber: e.target.value})}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] rounded-xl font-medium transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  注册逆变器
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">编号</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">序列号</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">型号</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">所属网关</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">最后在线</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {inverters.map(inv => {
              const gateway = gateways.find(g => g.id === inv.gatewayId);
              const statusMap = {
                online: '在线',
                offline: '离线',
                fault: '故障'
              };
              return (
                <tr key={inv.id} className="hover:bg-[#1a1a1a]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        inv.status === 'online' ? 'bg-green-500' : 
                        inv.status === 'offline' ? 'bg-gray-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm capitalize">{statusMap[inv.status as keyof typeof statusMap]}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-center">{inv.inverterNumber || '-'}</td>
                  <td className="px-6 py-4 font-mono text-sm text-center">{inv.serialNumber}</td>
                  <td className="px-6 py-4 text-sm text-center">{inv.model}</td>
                  <td className="px-6 py-4 text-sm text-gray-400 text-center">{gateway?.name || '未知网关'}</td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{new Date(inv.lastSeen).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-1">
                      <button 
                        onClick={() => setSelectedInverter(inv)}
                        className="p-1.5 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="查看详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingInverter(inv)}
                        className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteInverter(inv.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {inverters.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无注册的逆变器。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Inverter Modal */}
      {editingInverter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">编辑逆变器</h4>
            </div>

            <form onSubmit={handleEditInverter} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">所属网关</label>
                <select 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingInverter.gatewayId}
                  onChange={e => setEditingInverter({...editingInverter, gatewayId: e.target.value})}
                  required
                >
                  <option value="">选择接入网关</option>
                  {gateways.map(g => (
                    <option key={g.id} value={g.id}>{g.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">型号</label>
                <select 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingInverter.model}
                  onChange={e => setEditingInverter({...editingInverter, model: e.target.value})}
                  required
                >
                  <option value="">选择逆变器型号</option>
                  {Object.entries(modelsByBrand).map(([brand, models]) => (
                    <optgroup key={brand} label={brand}>
                      {models.map(m => (
                        <option key={m.id} value={m.model}>{m.model}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">编号</label>
                <input 
                  type="text" 
                  placeholder="逆变器编号" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingInverter.inverterNumber || ''}
                  onChange={e => setEditingInverter({...editingInverter, inverterNumber: e.target.value})}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">序列号</label>
                <input 
                  type="text" 
                  placeholder="序列号" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingInverter.serialNumber}
                  onChange={e => setEditingInverter({...editingInverter, serialNumber: e.target.value})}
                  required
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingInverter(null)}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] rounded-xl font-medium transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  更新设备
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Inverter Details Modal */}
      {selectedInverter && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">逆变器详情</h4>
              <button 
                onClick={() => setSelectedInverter(null)}
                className="text-gray-500 hover:text-white transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">序列号</p>
                  <p className="text-lg font-mono text-white">{selectedInverter.serialNumber}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">当前状态</p>
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full ${
                      selectedInverter.status === 'online' ? 'bg-green-500' : 
                      selectedInverter.status === 'offline' ? 'bg-gray-500' : 'bg-red-500'
                    }`}></span>
                    <p className="text-lg text-white">
                      {selectedInverter.status === 'online' ? '在线' : 
                       selectedInverter.status === 'offline' ? '离线' : '故障'}
                    </p>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">型号</p>
                  <p className="text-lg text-white">{selectedInverter.model}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-gray-500 uppercase font-mono tracking-wider">所属网关</p>
                  <p className="text-lg text-white">
                    {gateways.find(g => g.id === selectedInverter.gatewayId)?.name || '未知'}
                  </p>
                </div>
              </div>

              <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Activity className="w-4 h-4" />
                    <span className="text-sm">最后通讯时间</span>
                  </div>
                  <span className="text-sm text-white">{new Date(selectedInverter.lastSeen).toLocaleString()}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Zap className="w-4 h-4" />
                    <span className="text-sm">当前功率</span>
                  </div>
                  <span className="text-sm text-white">{selectedInverter.currentPower || 0} kW</span>
                </div>
              </div>

              <button 
                onClick={() => setSelectedInverter(null)}
                className="w-full py-3 bg-[#1a1a1a] text-white hover:bg-[#222] rounded-xl font-medium transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
