import { useEffect, useState } from 'react';
import { collection, addDoc, onSnapshot, query, where, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { Station } from '../types';
import { Search, Plus, MapPin, Zap, Calendar, Trash2, Pencil, X, Eye } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export function StationList() {
  const { showToast, confirm } = useUI();
  const [stations, setStations] = useState<Station[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  const [newStation, setNewStation] = useState({ name: '', location: '', capacity: 0, group: '' });
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    const q = query(collection(db, 'stations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Station)));
    });
    return () => unsubscribe();
  }, []);

  const handleAddStation = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'stations'), {
        ...newStation,
        ownerId: 'admin-uid',
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewStation({ name: '', location: '', capacity: 0, group: '' });
      showToast('添加电站成功');
    } catch (error) {
      console.error("Error adding station:", error);
      showToast('添加电站失败', 'error');
    }
  };

  const handleEditStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStation) return;
    try {
      const stationRef = doc(db, 'stations', editingStation.id);
      await updateDoc(stationRef, {
        name: editingStation.name,
        location: editingStation.location,
        capacity: editingStation.capacity,
        group: editingStation.group || ''
      });
      setEditingStation(null);
      showToast('编辑电站成功');
    } catch (error) {
      console.error("Error updating station:", error);
      showToast('编辑电站失败', 'error');
    }
  };

  const handleDeleteStation = async (id: string) => {
    if (await confirm('确定要删除该电站吗？这将同时移除关联的数据。')) {
      try {
        await deleteDoc(doc(db, 'stations', id));
        showToast('删除电站成功');
      } catch (error) {
        console.error("Error deleting station:", error);
        showToast('删除电站失败', 'error');
      }
    }
  };

  const filteredStations = stations.filter(station => 
    station.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (station.group && station.group.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="搜索电站名称或分组..." 
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          添加电站
        </button>
      </div>

      {/* Add Station Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">添加新电站</h4>
            </div>

            <form onSubmit={handleAddStation} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">电站名称</label>
                <input 
                  type="text" 
                  placeholder="请输入电站名称" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newStation.name}
                  onChange={e => setNewStation({...newStation, name: e.target.value})}
                  required
                  autoFocus
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">地理位置</label>
                <input 
                  type="text" 
                  placeholder="请输入地理位置" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newStation.location}
                  onChange={e => setNewStation({...newStation, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">分组标签</label>
                <input 
                  type="text" 
                  placeholder="例如：华东区、一期工程" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newStation.group}
                  onChange={e => setNewStation({...newStation, group: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">装机容量 (MW)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="请输入装机容量" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={newStation.capacity || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setNewStation({...newStation, capacity: Number(val)});
                  }}
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
                  保存电站
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Station Modal */}
      {editingStation && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div 
            className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">编辑电站</h4>
            </div>

            <form onSubmit={handleEditStation} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">电站名称</label>
                <input 
                  type="text" 
                  placeholder="请输入电站名称" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingStation.name}
                  onChange={e => setEditingStation({...editingStation, name: e.target.value})}
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">地理位置</label>
                <input 
                  type="text" 
                  placeholder="请输入地理位置" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingStation.location}
                  onChange={e => setEditingStation({...editingStation, location: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">分组标签</label>
                <input 
                  type="text" 
                  placeholder="例如：华东区、一期工程" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingStation.group || ''}
                  onChange={e => setEditingStation({...editingStation, group: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">装机容量 (MW)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="请输入装机容量" 
                  className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white transition-all"
                  value={editingStation.capacity || ''}
                  onChange={e => {
                    const val = e.target.value.replace(/[^0-9.]/g, '');
                    setEditingStation({...editingStation, capacity: Number(val)});
                  }}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setEditingStation(null)}
                  className="flex-1 px-4 py-3 bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] rounded-xl font-medium transition-all"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
                >
                  更新电站
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
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">电站名称</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">地理位置</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">分组</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">装机容量</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">创建日期</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {filteredStations.map(station => (
              <tr key={station.id} className="hover:bg-[#1a1a1a]/30 transition-colors group">
                <td className="px-6 py-4 font-medium text-white text-center">{station.name}</td>
                <td className="px-6 py-4 text-sm text-gray-400 text-center">{station.location}</td>
                <td className="px-6 py-4 text-center">
                  {station.group ? (
                    <span className="text-[10px] px-2 py-0.5 bg-blue-500/10 text-blue-400 border border-blue-500/20 rounded-full font-medium">
                      {station.group}
                    </span>
                  ) : '-'}
                </td>
                <td className="px-6 py-4 text-sm font-mono text-center">{station.capacity} MW</td>
                <td className="px-6 py-4 text-sm text-gray-500 text-center">{new Date(station.createdAt).toLocaleDateString()}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-1">
                    <button 
                      onClick={() => setEditingStation(station)}
                      className="p-1.5 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                      title="编辑"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteStation(station.id)}
                      className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredStations.length === 0 && (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                  暂无匹配的电站数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
