import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, addDoc, deleteDoc, doc, updateDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Gateway, Station } from '../types';
import { Router, Activity, AlertCircle, Plus, Search, Filter, Trash2, X, Pencil, Eye, Cpu, Wifi, Globe } from 'lucide-react';
import { useUI } from '../contexts/UIContext';

export function GatewayList() {
  const { showToast, confirm } = useUI();
  const [gateways, setGateways] = useState<Gateway[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<Gateway | null>(null);
  const [editingGateway, setEditingGateway] = useState<Gateway | null>(null);
  
  const [newGateway, setNewGateway] = useState<Partial<Gateway>>({
    name: '',
    type: 'DTU',
    stationId: '',
    serialNumber: '',
    communicationType: 'MQTT',
    config: {
      brokerUrl: 'mqtt://broker.myems.local',
      topic: 'ems/gateway/001',
      pollingInterval: 60,
      protocol: 'ModbusTCP'
    }
  });

  useEffect(() => {
    const qGate = query(collection(db, 'gateways'));
    const unsubscribeGate = onSnapshot(qGate, (snapshot) => {
      setGateways(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Gateway)));
    });

    const qStat = query(collection(db, 'stations'));
    const unsubscribeStat = onSnapshot(qStat, (snapshot) => {
      setStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Station)));
    });

    return () => {
      unsubscribeGate();
      unsubscribeStat();
    };
  }, []);

  const handleAddGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'gateways'), {
        ...newGateway,
        status: 'online',
        lastSeen: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
      setIsAdding(false);
      setNewGateway({
        name: '',
        type: 'DTU',
        stationId: '',
        serialNumber: '',
        communicationType: 'MQTT',
        config: {
          brokerUrl: 'mqtt://broker.myems.local',
          topic: 'ems/gateway/001',
          pollingInterval: 60,
          protocol: 'ModbusTCP'
        }
      });
      showToast('新增接入设备成功');
    } catch (error) {
      console.error("Error adding gateway:", error);
      showToast('新增接入设备失败', 'error');
    }
  };

  const handleDeleteGateway = async (id: string) => {
    if (await confirm('确定要删除该接入设备吗？')) {
      try {
        await deleteDoc(doc(db, 'gateways', id));
        showToast('删除接入设备成功');
      } catch (error) {
        console.error("Error deleting gateway:", error);
        showToast('删除接入设备失败', 'error');
      }
    }
  };

  const handleEditGateway = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingGateway) return;
    try {
      const gateRef = doc(db, 'gateways', editingGateway.id);
      await updateDoc(gateRef, {
        name: editingGateway.name,
        type: editingGateway.type,
        stationId: editingGateway.stationId,
        serialNumber: editingGateway.serialNumber,
        communicationType: editingGateway.communicationType,
        config: editingGateway.config
      });
      setEditingGateway(null);
      showToast('编辑接入设备成功');
    } catch (error) {
      console.error("Error updating gateway:", error);
      showToast('编辑接入设备失败', 'error');
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
              placeholder="搜索网关序列号或名称..." 
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none"
            />
          </div>
        </div>
        <button 
          onClick={() => setIsAdding(true)}
          className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          添加网关
        </button>
      </div>

      {isAdding && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">新增接入设备</h4>
            </div>
            <form onSubmit={handleAddGateway} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">设备名称</label>
                  <input 
                    type="text" 
                    placeholder="例如：1号DTU" 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.name}
                    onChange={e => setNewGateway({...newGateway, name: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">设备类型</label>
                  <select 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.type}
                    onChange={e => setNewGateway({...newGateway, type: e.target.value as any})}
                    required
                  >
                    <option value="DTU">DTU (数据传输单元)</option>
                    <option value="EdgeGateway">边缘网关</option>
                    <option value="SmartDongle">智能棒</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">所属电站</label>
                  <select 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.stationId}
                    onChange={e => setNewGateway({...newGateway, stationId: e.target.value})}
                    required
                  >
                    <option value="">选择电站</option>
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">序列号 (SN)</label>
                  <input 
                    type="text" 
                    placeholder="SN码" 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.serialNumber}
                    onChange={e => setNewGateway({...newGateway, serialNumber: e.target.value})}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">通讯方式</label>
                  <select 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.communicationType}
                    onChange={e => setNewGateway({...newGateway, communicationType: e.target.value as any})}
                    required
                  >
                    <option value="MQTT">MQTT (主动推送)</option>
                    <option value="Polling">轮询 (被动采集)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">采集协议</label>
                  <select 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 focus:border-orange-500 outline-none text-white"
                    value={newGateway.config?.protocol}
                    onChange={e => setNewGateway({...newGateway, config: {...newGateway.config!, protocol: e.target.value as any}})}
                  >
                    <option value="ModbusTCP">Modbus TCP</option>
                    <option value="ModbusRTU">Modbus RTU</option>
                    <option value="IEC60870">IEC 60870-5-104</option>
                  </select>
                </div>
              </div>

              {newGateway.communicationType === 'MQTT' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">Broker URL</label>
                    <input 
                      type="text" 
                      placeholder="mqtt://..." 
                      className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2 outline-none text-white"
                      value={newGateway.config?.brokerUrl}
                      onChange={e => setNewGateway({...newGateway, config: {...newGateway.config!, brokerUrl: e.target.value}})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm text-gray-400">发布主题 (Topic)</label>
                    <input 
                      type="text" 
                      placeholder="ems/data/..." 
                      className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2 outline-none text-white"
                      value={newGateway.config?.topic}
                      onChange={e => setNewGateway({...newGateway, config: {...newGateway.config!, topic: e.target.value}})}
                    />
                  </div>
                </div>
              ) : (
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <div className="space-y-2 max-w-xs">
                    <label className="text-sm text-gray-400">轮询间隔 (秒)</label>
                    <input 
                      type="number" 
                      className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2 outline-none text-white"
                      value={newGateway.config?.pollingInterval}
                      onChange={e => setNewGateway({...newGateway, config: {...newGateway.config!, pollingInterval: Number(e.target.value)}})}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button 
                  type="button" 
                  onClick={() => setIsAdding(false)}
                  className="px-6 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  取消
                </button>
                <button 
                  type="submit" 
                  className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-xl font-bold shadow-lg shadow-orange-500/20"
                >
                  确认添加
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
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">网关名称</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">类型</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">所属电站</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">通讯方式</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">最后在线</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {gateways.map(gate => {
              const station = stations.find(s => s.id === gate.stationId);
              return (
                <tr key={gate.id} className="hover:bg-[#1a1a1a]/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <span className={`w-2 h-2 rounded-full ${
                        gate.status === 'online' ? 'bg-green-500 animate-pulse' : 
                        gate.status === 'offline' ? 'bg-gray-500' : 'bg-red-500'
                      }`}></span>
                      <span className="text-sm">{gate.status === 'online' ? '在线' : '离线'}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="font-medium text-white">{gate.name}</div>
                    <div className="text-xs text-gray-500 font-mono">{gate.serialNumber}</div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="px-2 py-1 bg-blue-500/10 text-blue-400 rounded text-xs border border-blue-500/20">
                      {gate.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-400 text-center">{station?.name || '未知'}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex flex-col items-center">
                      <span className="text-sm">{gate.communicationType}</span>
                      <span className="text-[10px] text-gray-500">{gate.config?.protocol}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 text-center">{new Date(gate.lastSeen).toLocaleString()}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-center gap-2">
                      <button 
                        onClick={() => setSelectedGateway(gate)}
                        className="p-2 text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="详情"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setEditingGateway(gate)}
                        className="p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-500/10 rounded-lg transition-all"
                        title="编辑"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleDeleteGateway(gate.id)}
                        className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all"
                        title="删除"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
            {gateways.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无接入网关设备。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Edit Gateway Modal */}
      {editingGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">编辑网关配置</h4>
            </div>
            <form onSubmit={handleEditGateway} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">名称</label>
                  <input 
                    type="text" 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 text-white"
                    value={editingGateway.name}
                    onChange={e => setEditingGateway({...editingGateway, name: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">所属电站</label>
                  <select 
                    className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-2 text-white"
                    value={editingGateway.stationId}
                    onChange={e => setEditingGateway({...editingGateway, stationId: e.target.value})}
                  >
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6 p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">通讯方式</label>
                  <select 
                    className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2"
                    value={editingGateway.communicationType}
                    onChange={e => setEditingGateway({...editingGateway, communicationType: e.target.value as any})}
                  >
                    <option value="MQTT">MQTT</option>
                    <option value="Polling">轮询</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm text-gray-400">采集协议</label>
                  <select 
                    className="w-full bg-[#141414] border border-[#222] rounded-lg px-4 py-2"
                    value={editingGateway.config.protocol}
                    onChange={e => setEditingGateway({...editingGateway, config: {...editingGateway.config, protocol: e.target.value as any}})}
                  >
                    <option value="ModbusTCP">Modbus TCP</option>
                    <option value="ModbusRTU">Modbus RTU</option>
                    <option value="IEC60870">IEC 60870-5-104</option>
                  </select>
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setEditingGateway(null)} className="px-6 py-2 text-gray-400">取消</button>
                <button type="submit" className="bg-orange-500 text-white px-8 py-2 rounded-xl font-bold">更新配置</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Gateway Details Modal */}
      {selectedGateway && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h4 className="text-xl font-bold text-white">网关运行状态</h4>
              <button onClick={() => setSelectedGateway(null)} className="text-gray-500 hover:text-white">
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="space-y-6">
              <div className="flex items-center gap-4 p-4 bg-orange-500/5 border border-orange-500/10 rounded-2xl">
                <div className="p-3 bg-orange-500/10 rounded-xl">
                  <Cpu className="w-6 h-6 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm text-gray-400">设备名称</p>
                  <p className="text-lg font-bold text-white">{selectedGateway.name}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <p className="text-xs text-gray-500 uppercase mb-1">通讯协议</p>
                  <p className="text-white flex items-center gap-2">
                    <Wifi className="w-4 h-4 text-blue-400" />
                    {selectedGateway.config.protocol}
                  </p>
                </div>
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <p className="text-xs text-gray-500 uppercase mb-1">采集模式</p>
                  <p className="text-white flex items-center gap-2">
                    <Globe className="w-4 h-4 text-purple-400" />
                    {selectedGateway.communicationType}
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-sm font-medium text-gray-400">配置详情</p>
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl font-mono text-xs space-y-2">
                  {selectedGateway.communicationType === 'MQTT' ? (
                    <>
                      <div className="flex justify-between"><span className="text-gray-500">Broker:</span> <span>{selectedGateway.config.brokerUrl}</span></div>
                      <div className="flex justify-between"><span className="text-gray-500">Topic:</span> <span>{selectedGateway.config.topic}</span></div>
                    </>
                  ) : (
                    <div className="flex justify-between"><span className="text-gray-500">Interval:</span> <span>{selectedGateway.config.pollingInterval}s</span></div>
                  )}
                </div>
              </div>

              <button 
                onClick={() => setSelectedGateway(null)}
                className="w-full py-3 bg-[#1a1a1a] text-white rounded-xl font-medium"
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
