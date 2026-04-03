import { useEffect, useState } from 'react';
import { collection, query, onSnapshot, limit, orderBy, updateDoc, doc, where } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Station, Inverter, Telemetry, Alert } from '../types';
import { 
  Zap, 
  TrendingUp, 
  Activity, 
  AlertTriangle,
  Sun,
  ArrowUpRight,
  ArrowDownRight,
  CheckCircle2,
  CheckCircle
} from 'lucide-react';
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from 'recharts';
import { useUI } from '../contexts/UIContext';

export function Dashboard() {
  const { showToast } = useUI();
  const [stations, setStations] = useState<Station[]>([]);
  const [inverters, setInverters] = useState<Inverter[]>([]);
  const [recentTelemetry, setRecentTelemetry] = useState<Telemetry[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);

  useEffect(() => {
    const qStations = query(collection(db, 'stations'));
    const unsubscribeStations = onSnapshot(qStations, (snapshot) => {
      setStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Station)));
    });

    const qInverters = query(collection(db, 'inverters'));
    const unsubscribeInverters = onSnapshot(qInverters, (snapshot) => {
      setInverters(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Inverter)));
    });

    const qTelemetry = query(collection(db, 'telemetry'), orderBy('timestamp', 'desc'), limit(20));
    const unsubscribeTelemetry = onSnapshot(qTelemetry, (snapshot) => {
      setRecentTelemetry(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Telemetry)));
    });

    const qAlerts = query(collection(db, 'alerts'), orderBy('time', 'desc'));
    const unsubscribeAlerts = onSnapshot(qAlerts, (snapshot) => {
      const allAlerts = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Alert));
      setAlerts(allAlerts.filter(a => a.status === 'active').slice(0, 3));
    });

    return () => {
      unsubscribeStations();
      unsubscribeInverters();
      unsubscribeTelemetry();
      unsubscribeAlerts();
    };
  }, []);

  const handleResolveAlert = async (id: string) => {
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

  const handleResolveAllAlerts = async () => {
    try {
      const userStr = localStorage.getItem('myems_user');
      let operator = '管理员';
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          operator = user.username || user.email || '管理员';
        } catch (e) {}
      }
      
      const activeAlerts = alerts.filter(a => a.status === 'active');
      for (const alert of activeAlerts) {
        await updateDoc(doc(db, 'alerts', alert.id), {
          status: 'resolved',
          resolvedAt: new Date().toISOString(),
          resolvedBy: operator
        });
      }
      showToast('所有告警已处理');
    } catch (error) {
      console.error("Error resolving all alerts:", error);
      showToast('处理告警失败', 'error');
    }
  };

  const totalCapacity = stations.reduce((acc, s) => acc + (s.capacity || 0), 0);
  const onlineInverters = inverters.filter(i => i.status === 'online').length;
  const currentPower = recentTelemetry.length > 0 ? recentTelemetry[0].activePower : 0;
  const dailyYield = recentTelemetry.length > 0 ? recentTelemetry[0].dailyYield : 0;

  // Mock data for charts if no real data exists
  const chartData = [
    { time: '06:00', power: 0 },
    { time: '08:00', power: 12 },
    { time: '10:00', power: 45 },
    { time: '12:00', power: 88 },
    { time: '14:00', power: 76 },
    { time: '16:00', power: 34 },
    { time: '18:00', power: 5 },
    { time: '20:00', power: 0 },
  ];

  const weeklyData = [
    { day: '周一', yield: 450 },
    { day: '周二', yield: 520 },
    { day: '周三', yield: 380 },
    { day: '周四', yield: 610 },
    { day: '周五', yield: 590 },
    { day: '周六', yield: 420 },
    { day: '周日', yield: 310 },
  ];

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="实时功率" 
          value={`${currentPower.toFixed(2)} kW`} 
          icon={<Zap className="w-5 h-5 text-yellow-500" />}
          trend="较上一小时 +12%"
          trendUp={true}
        />
        <StatCard 
          title="当日发电量" 
          value={`${dailyYield.toFixed(1)} kWh`} 
          icon={<Sun className="w-5 h-5 text-orange-500" />}
          trend="较昨日 +5%"
          trendUp={true}
        />
        <StatCard 
          title="在线逆变器" 
          value={`${onlineInverters}/${inverters.length}`} 
          icon={<Activity className="w-5 h-5 text-green-500" />}
          trend="所有系统运行正常"
          trendUp={true}
        />
        <StatCard 
          title="总装机容量" 
          value={`${totalCapacity} MW`} 
          icon={<TrendingUp className="w-5 h-5 text-blue-500" />}
          trend="分布在 12 个电站"
          trendUp={true}
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-[#141414] border border-[#1a1a1a] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold">实时功率曲线</h3>
            <div className="flex items-center gap-4">
              <button 
                onClick={async () => {
                  try {
                    const res = await fetch('/api/simulate', { method: 'POST' });
                    const data = await res.json();
                    if (data.success) alert(`成功模拟 ${data.simulated} 台逆变器的数据`);
                  } catch (e) {
                    console.error(e);
                  }
                }}
                className="text-xs bg-orange-500/10 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-full hover:bg-orange-500/20 transition-colors"
              >
                触发模拟数据
              </button>
              <div className="flex items-center gap-2 text-xs font-mono text-gray-500">
                <span className="w-2 h-2 rounded-full bg-orange-500"></span>
                有功功率 (kW)
              </div>
            </div>
          </div>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorPower" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="time" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                  itemStyle={{ color: '#f97316' }}
                />
                <Area type="monotone" dataKey="power" stroke="#f97316" fillOpacity={1} fill="url(#colorPower)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl p-6">
          <h3 className="text-lg font-semibold mb-6">每周发电统计</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weeklyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                <XAxis dataKey="day" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                />
                <Bar dataKey="yield" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Alerts */}
      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">系统告警</h3>
          {alerts.length > 0 && (
            <button 
              onClick={handleResolveAllAlerts}
              className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
            >
              <CheckCircle className="w-4 h-4" />
              一键处理
            </button>
          )}
        </div>
        <div className="space-y-4">
          {alerts.length > 0 ? (
            alerts.map(alert => (
              <AlertItem 
                key={alert.id}
                type={alert.level === 'critical' ? 'warning' : alert.level === 'warning' ? 'warning' : 'info'} 
                message={alert.content} 
                time={new Date(alert.time).toLocaleString()} 
                onResolve={() => handleResolveAlert(alert.id)}
              />
            ))
          ) : (
            <div className="text-center text-gray-500 py-4">
              当前无未处理的系统告警
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value, icon, trend, trendUp }: any) {
  return (
    <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl p-6 hover:border-orange-500/30 transition-all group">
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-[#1a1a1a] rounded-xl group-hover:bg-orange-500/10 transition-colors">
          {icon}
        </div>
        {trendUp ? (
          <ArrowUpRight className="w-4 h-4 text-green-500" />
        ) : (
          <ArrowDownRight className="w-4 h-4 text-red-500" />
        )}
      </div>
      <p className="text-sm text-gray-500 font-medium mb-1">{title}</p>
      <h4 className="text-2xl font-bold text-white mb-2">{value}</h4>
      <p className={`text-xs ${trendUp ? 'text-green-500/70' : 'text-red-500/70'}`}>{trend}</p>
    </div>
  );
}

function AlertItem({ type, message, time, onResolve }: any) {
  const icons = {
    warning: <AlertTriangle className="w-4 h-4 text-yellow-500" />,
    info: <Activity className="w-4 h-4 text-blue-500" />,
    success: <Sun className="w-4 h-4 text-green-500" />
  };

  const bgColors = {
    warning: 'bg-yellow-500/10 border-yellow-500/20',
    info: 'bg-blue-500/10 border-blue-500/20',
    success: 'bg-green-500/10 border-green-500/20'
  };

  return (
    <div className={`flex items-center gap-4 p-4 rounded-xl border ${bgColors[type as keyof typeof bgColors]}`}>
      <div className="p-2 bg-black/20 rounded-lg shrink-0">
        {icons[type as keyof typeof icons]}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-white truncate">{message}</p>
        <p className="text-xs text-gray-500">{time}</p>
      </div>
      {onResolve && (
        <button 
          onClick={onResolve}
          className="shrink-0 px-3 py-1.5 bg-orange-500/10 text-orange-500 hover:bg-orange-500 hover:text-white rounded-lg text-sm transition-all flex items-center gap-1"
        >
          <CheckCircle2 className="w-4 h-4" />
          <span className="hidden sm:inline">已处理</span>
        </button>
      )}
    </div>
  );
}
