import React, { useState, useEffect } from 'react';
import { collection, query, onSnapshot, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Plus, Edit2, Trash2, Search } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export interface InverterModel {
  id: string;
  brand: string;
  model: string;
  mqttProtocol: string;
  createdAt: string;
}

export function BasicData() {
  const { showToast, confirm } = useUI();
  const [models, setModels] = useState<InverterModel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<InverterModel | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    brand: '',
    model: '',
    mqttProtocol: ''
  });

  useEffect(() => {
    const q = query(collection(db, 'inverterModels'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setModels(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as InverterModel)));
    });
    return () => unsubscribe();
  }, []);

  const handleOpenModal = (model?: InverterModel) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        brand: model.brand,
        model: model.model,
        mqttProtocol: model.mqttProtocol || ''
      });
    } else {
      setEditingModel(null);
      setFormData({ brand: '', model: '', mqttProtocol: '' });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
    setFormData({ brand: '', model: '', mqttProtocol: '' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingModel) {
        await updateDoc(doc(db, 'inverterModels', editingModel.id), {
          ...formData
        });
        showToast('编辑型号成功');
      } else {
        await addDoc(collection(db, 'inverterModels'), {
          ...formData,
          createdAt: new Date().toISOString()
        });
        showToast('新增型号成功');
      }
      handleCloseModal();
    } catch (error) {
      console.error("Error saving model:", error);
      showToast('保存型号失败', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (await confirm('确定要删除该型号吗？')) {
      try {
        await deleteDoc(doc(db, 'inverterModels', id));
        showToast('删除型号成功');
      } catch (error) {
        console.error("Error deleting model:", error);
        showToast('删除型号失败', 'error');
      }
    }
  };

  const filteredModels = models.filter(m => 
    m.brand.toLowerCase().includes(searchQuery.toLowerCase()) || 
    m.model.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
          <input 
            type="text" 
            placeholder="搜索品牌或型号..." 
            className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <button 
          onClick={() => handleOpenModal()}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors shrink-0"
        >
          <Plus className="w-4 h-4" />
          新增型号
        </button>
      </div>

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">品牌</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">型号</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">MQTT协议</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">创建时间</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {filteredModels.map(model => (
              <tr key={model.id} className="hover:bg-[#1a1a1a]/30 transition-colors">
                <td className="px-6 py-4 text-center font-medium text-white">{model.brand}</td>
                <td className="px-6 py-4 text-center text-gray-300">{model.model}</td>
                <td className="px-6 py-4 text-center text-gray-400 text-sm max-w-xs truncate" title={model.mqttProtocol}>
                  {model.mqttProtocol || '-'}
                </td>
                <td className="px-6 py-4 text-center text-gray-500 text-sm">
                  {new Date(model.createdAt).toLocaleDateString()}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <button 
                      onClick={() => handleOpenModal(model)}
                      className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                      title="编辑"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDelete(model.id)}
                      className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredModels.length === 0 && (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                  暂无基础资料数据，请点击右上角新增。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl w-full max-w-md overflow-hidden shadow-2xl">
            <div className="flex items-center justify-between p-6 border-b border-[#1a1a1a]">
              <h3 className="text-xl font-bold">{editingModel ? '编辑型号' : '新增型号'}</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">品牌</label>
                <input 
                  type="text" 
                  required
                  value={formData.brand}
                  onChange={e => setFormData({...formData, brand: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                  placeholder="例如：华为"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">型号</label>
                <input 
                  type="text" 
                  required
                  value={formData.model}
                  onChange={e => setFormData({...formData, model: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                  placeholder="例如：SUN2000-50KTL"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-400">MQTT协议配置</label>
                <textarea 
                  value={formData.mqttProtocol}
                  onChange={e => setFormData({...formData, mqttProtocol: e.target.value})}
                  className="w-full bg-[#1a1a1a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white min-h-[100px] resize-y"
                  placeholder="输入该型号的MQTT协议相关配置或说明..."
                />
              </div>

              <div className="flex justify-end gap-4 pt-4">
                <button 
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-2 rounded-xl border border-[#222] hover:bg-[#1a1a1a] transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-medium transition-colors"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
