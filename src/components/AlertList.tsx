import React, { useState, useEffect } from 'react';
import { AlertTriangle, Info, AlertCircle, CheckCircle2, Search, Filter } from 'lucide-react';
import { collection, query, onSnapshot, updateDoc, doc, addDoc, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Alert } from '../types';
import { useUI } from '../contexts/UIContext';

type AlertLevel = 'critical' | 'warning' | 'info';
type AlertStatus = 'active' | 'resolved';

const mockAlerts: Omit<Alert, 'id'>[] = [
  { level: 'critical', content: '逆变器 1号 (#INV-001) 通讯中断', source: '1号电站', time: new Date(Date.now() - 1000 * 60 * 5).toISOString(), status: 'active' },
  { level: 'warning', content: '网关 DTU-A (#GW-001) 信号微弱', source: '2号电站', time: new Date(Date.now() - 1000 * 60 * 30).toISOString(), status: 'active' },
  { level: 'info', content: '系统自动备份完成', source: '系统', time: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(), status: 'resolved', resolvedAt: new Date(Date.now() - 1000 * 60 * 50).toISOString(), resolvedBy: '系统' },
  { level: 'critical', content: '电网电压异常偏高', source: '1号电站', time: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(), status: 'active' },
  { level: 'warning', content: '逆变器 3号 (#INV-003) 温度过高', source: '3号电站', time: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(), status: 'resolved', resolvedAt: new Date(Date.now() - 1000 * 60 * 60 * 23).toISOString(), resolvedBy: '管理员' },
];

export function AlertList() {
  const { showToast } = useUI();
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [levelFilter, setLevelFilter] = useState<AlertLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<AlertStatus | 'all'>('all');

  useEffect(() => {
    const seedAlerts = async () => {
      const snapshot = await getDocs(collection(db, 'alerts'));
      if (snapshot.empty) {
        for (const alert of mockAlerts) {
          await addDoc(collection(db, 'alerts'), alert);
        }
      }
    };
    seedAlerts();

    const q = query(collection(db, 'alerts'), orderBy('time', 'desc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setAlerts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert)));
    });

    return () => unsubscribe();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const userStr = localStorage.getItem('myems_user');
      let operator = '管理员';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          operator = user.username || user.email || '管理员';
        } catch (e) {}
      }
      
      await updateDoc(doc(db, 'alerts', id), {
        status: 'resolved',
        resolvedAt: new Date().toISOString(),
        resolvedBy: operator
      });
      showToast('告警已处理');
    } catch (error) {
      console.error("Error resolving alert:", error);
      showToast('处理告警失败', 'error');
    }
  };

  const filteredAlerts = alerts.filter(alert => {
    const matchesSearch = alert.content.toLowerCase().includes(searchQuery.toLowerCase()) || alert.source.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLevel = levelFilter === 'all' || alert.level === levelFilter;
    const matchesStatus = statusFilter === 'all' || alert.status === statusFilter;
    return matchesSearch && matchesLevel && matchesStatus;
  });

  const getLevelIcon = (level: AlertLevel) => {
    switch (level) {
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
      case 'info': return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  const getLevelLabel = (level: AlertLevel) => {
    switch (level) {
      case 'critical': return <span className="text-red-500 bg-red-500/10 px-2 py-1 rounded border border-red-500/20 text-xs">严重</span>;
      case 'warning': return <span className="text-orange-500 bg-orange-500/10 px-2 py-1 rounded border border-orange-500/20 text-xs">警告</span>;
      case 'info': return <span className="text-blue-500 bg-blue-500/10 px-2 py-1 rounded border border-blue-500/20 text-xs">提示</span>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="搜索告警内容或来源..." 
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white appearance-none"
              value={levelFilter}
              onChange={(e) => setLevelFilter(e.target.value as any)}
            >
              <option value="all">所有级别</option>
              <option value="critical">严重告警</option>
              <option value="warning">一般警告</option>
              <option value="info">系统提示</option>
            </select>
          </div>
          <div className="relative max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as any)}
            >
              <option value="all">所有状态</option>
              <option value="active">未处理</option>
              <option value="resolved">已解决</option>
            </select>
          </div>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center w-24">级别</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">告警内容</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">来源</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">发生时间</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">状态</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">处理信息</th>
              <th className="px-6 py-4 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a1a]">
            {filteredAlerts.map(alert => (
              <tr key={alert.id} className="hover:bg-[#1a1a1a]/30 transition-colors group">
                <td className="px-6 py-4 text-center">
                  <div className="flex justify-center">
                    {getLevelLabel(alert.level)}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {getLevelIcon(alert.level)}
                    <span className="font-medium text-white">{alert.content}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-400 text-center">{alert.source}</td>
                <td className="px-6 py-4 text-sm text-gray-500 text-center font-mono">{new Date(alert.time).toLocaleString()}</td>
                <td className="px-6 py-4 text-center">
                  {alert.status === 'active' ? (
                    <span className="text-orange-500 text-sm flex items-center justify-center gap-1">
                      <AlertCircle className="w-4 h-4" /> 未处理
                    </span>
                  ) : (
                    <span className="text-green-500 text-sm flex items-center justify-center gap-1">
                      <CheckCircle2 className="w-4 h-4" /> 已解决
                    </span>
                  )}
                </td>
                <td className="px-6 py-4 text-center">
                  {alert.status === 'resolved' ? (
                    <div className="flex flex-col items-center justify-center text-xs text-gray-500">
                      <span>{alert.resolvedBy}</span>
                      <span className="font-mono">{alert.resolvedAt ? new Date(alert.resolvedAt).toLocaleString() : '-'}</span>
                    </div>
                  ) : (
                    <span className="text-gray-600">-</span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    {alert.status === 'active' && (
                      <button 
                        onClick={() => handleResolve(alert.id)}
                        className="px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg text-sm transition-all"
                      >
                        标记已解决
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredAlerts.length === 0 && (
              <tr>
                <td colSpan={7} className="px-6 py-12 text-center text-gray-500">
                  暂无匹配的告警数据。
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
