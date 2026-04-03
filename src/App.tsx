import { useEffect, useState } from 'react';
import { 
  onAuthStateChanged, 
  signInWithPopup, 
  GoogleAuthProvider, 
  signOut,
  User
} from 'firebase/auth';
import { auth } from './lib/firebase';
import { 
  Sun, 
  LayoutDashboard, 
  Zap, 
  Settings, 
  LogOut, 
  Plus,
  AlertCircle,
  Activity,
  Battery,
  MapPin
} from 'lucide-react';
import { Dashboard } from './components/Dashboard';
import { StationList } from './components/StationList';
import { InverterList } from './components/InverterList';
import { GatewayList } from './components/GatewayList';
import { DataAnalysis } from './components/DataAnalysis';
import { AlertList } from './components/AlertList';
import { RoleManagement } from './components/RoleManagement';
import { UserManagement } from './components/UserManagement';
import { BasicData } from './components/BasicData';
import { ChevronDown, ChevronRight, Router, X, BarChart2, Bell, Database } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'stations' | 'analysis' | 'alerts' | 'basicData' | 'gateways' | 'inverters' | 'roles' | 'users'>('dashboard');
  const [isDeviceMenuOpen, setIsDeviceMenuOpen] = useState(true);
  const [isSystemMenuOpen, setIsSystemMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    // 检查本地存储是否有登录状态
    const savedUser = localStorage.getItem('myems_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (username === 'admin' && password === 'admin123') {
      const adminUser = { uid: 'admin-uid', displayName: '管理员', email: 'admin@myems.local' };
      setUser(adminUser);
      localStorage.setItem('myems_user', JSON.stringify(adminUser));
    } else {
      setError('用户名或密码错误');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('myems_user');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
        <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-orange-500/10 rounded-2xl flex items-center justify-center border border-orange-500/20">
              <Sun className="w-10 h-10 text-orange-500" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white text-center mb-2">MyEMS 太阳能</h1>
          <p className="text-gray-400 text-center mb-8">分布式光伏电站管理系统</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">用户名</label>
              <input 
                type="text" 
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="请输入用户名"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">密码</label>
              <input 
                type="password" 
                className="w-full bg-[#0a0a0a] border border-[#222] rounded-xl px-4 py-3 focus:border-orange-500 outline-none text-white"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                required
              />
            </div>
            
            {error && (
              <div className="flex items-center gap-2 text-red-500 text-sm bg-red-500/10 p-3 rounded-xl border border-red-500/20">
                <AlertCircle className="w-4 h-4" />
                {error}
              </div>
            )}

            <button 
              type="submit"
              className="w-full bg-orange-500 text-white font-semibold py-3 rounded-xl hover:bg-orange-600 transition-colors"
            >
              登录
            </button>
          </form>
          
          <div className="mt-8 pt-8 border-t border-[#222] text-center">
            <p className="text-xs text-gray-500 uppercase tracking-widest font-mono">由 MyEMS 开源项目驱动</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-[#1a1a1a] flex flex-col">
        <div className="p-6 flex items-center gap-3">
          <Sun className="w-8 h-8 text-orange-500" />
          <span className="text-xl font-bold tracking-tight">MyEMS 太阳能</span>
        </div>
        
        <nav className="flex-1 px-4 space-y-1">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'dashboard' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#141414] hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            <span className="font-medium">仪 表 盘</span>
          </button>
          <button 
            onClick={() => setActiveTab('stations')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'stations' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#141414] hover:text-white'}`}
          >
            <MapPin className="w-5 h-5 shrink-0" />
            <span className="font-medium">电站管理</span>
          </button>
          <button 
            onClick={() => setActiveTab('analysis')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'analysis' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#141414] hover:text-white'}`}
          >
            <BarChart2 className="w-5 h-5 shrink-0" />
            <span className="font-medium">数据分析</span>
          </button>
          <button 
            onClick={() => setActiveTab('alerts')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === 'alerts' ? 'bg-orange-500 text-white' : 'text-gray-400 hover:bg-[#141414] hover:text-white'}`}
          >
            <Bell className="w-5 h-5 shrink-0" />
            <span className="font-medium">系统告警</span>
          </button>

          <div className="space-y-1">
            <button 
              onClick={() => setIsDeviceMenuOpen(!isDeviceMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:bg-[#141414] hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <Router className="w-5 h-5 shrink-0" />
                <span className="font-medium">设备管理</span>
              </div>
              {isDeviceMenuOpen ? <ChevronDown className="w-4 h-4 shrink-0" /> : <ChevronRight className="w-4 h-4 shrink-0" />}
            </button>
            
            {isDeviceMenuOpen && (
              <div className="pl-9 space-y-1 animate-in slide-in-from-top-2 duration-200">
                <button 
                  onClick={() => setActiveTab('basicData')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'basicData' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-white'}`}
                >
                  <Database className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">基础资料</span>
                </button>
                <button 
                  onClick={() => setActiveTab('gateways')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'gateways' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-white'}`}
                >
                  <Router className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">接入网关</span>
                </button>
                <button 
                  onClick={() => setActiveTab('inverters')}
                  className={`w-full flex items-center gap-3 px-4 py-2 rounded-lg transition-all ${activeTab === 'inverters' ? 'text-orange-500 bg-orange-500/10' : 'text-gray-500 hover:text-white'}`}
                >
                  <Zap className="w-4 h-4 shrink-0" />
                  <span className="text-sm font-medium">逆 变 器</span>
                </button>
              </div>
            )}
          </div>

          <div className="space-y-1">
            <button 
              onClick={() => setIsSystemMenuOpen(!isSystemMenuOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-xl text-gray-400 hover:bg-[#141414] hover:text-white transition-all"
            >
              <div className="flex items-center gap-3">
                <Settings className="w-5 h-5 shrink-0" />
                <span className="font-medium">系统管理</span>
              </div>
              {isSystemMenuOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
            
            {isSystemMenuOpen && (
              <div className="pl-12 pr-4 space-y-1">
                <button 
                  onClick={() => setActiveTab('roles')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'roles' ? 'bg-orange-500/10 text-orange-500' : 'text-gray-400 hover:text-white hover:bg-[#141414]'}`}
                >
                  角色管理
                </button>
                <button 
                  onClick={() => setActiveTab('users')}
                  className={`w-full text-left px-4 py-2 rounded-lg text-sm transition-all ${activeTab === 'users' ? 'bg-orange-500/10 text-orange-500' : 'text-gray-400 hover:text-white hover:bg-[#141414]'}`}
                >
                  用户管理
                </button>
              </div>
            )}
          </div>
        </nav>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <header className="h-16 border-b border-[#1a1a1a] flex items-center justify-between px-8 bg-[#0a0a0a]/80 backdrop-blur-md sticky top-0 z-10">
          <h2 className="text-lg font-semibold capitalize">
            {activeTab === 'dashboard' ? '仪 表 盘' : 
             activeTab === 'stations' ? '电站管理' : 
             activeTab === 'analysis' ? '数据分析' : 
             activeTab === 'alerts' ? '系统告警' : 
             activeTab === 'basicData' ? '基础资料' : 
             activeTab === 'gateways' ? '接入网关' : 
             activeTab === 'inverters' ? '逆 变 器' : 
             activeTab === 'roles' ? '角色管理' : '用户管理'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-xs font-mono text-green-500 bg-green-500/10 px-3 py-1 rounded-full border border-green-500/20">
              <Activity className="w-3 h-3" />
              系统在线
            </div>
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-gray-400 hover:text-white transition-colors"
              title="系统设置"
            >
              <Settings className="w-5 h-5" />
            </button>
            
            <div className="relative">
              <button 
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-2 hover:bg-[#1a1a1a] p-1.5 pr-3 rounded-xl transition-colors border border-transparent hover:border-[#222]"
              >
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center font-bold text-white text-sm">A</div>
                <div className="hidden md:block text-left">
                  <p className="text-sm font-medium text-white leading-tight">管理员</p>
                  <p className="text-xs text-gray-500 leading-tight">admin@myems.local</p>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-500 ml-1" />
              </button>
              
              {isUserMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40"
                    onClick={() => setIsUserMenuOpen(false)}
                  ></div>
                  <div className="absolute right-0 mt-2 w-48 bg-[#141414] border border-[#222] rounded-xl shadow-2xl py-1 z-50 animate-in fade-in slide-in-from-top-2">
                    <button 
                      onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">退出登录</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </header>

        {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-md bg-[#141414] border border-[#222] rounded-2xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-xl font-bold text-white">系统设置</h4>
                <button 
                  onClick={() => setIsSettingsOpen(false)}
                  className="text-gray-500 hover:text-white transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">主题设置</p>
                  <div className="flex items-center justify-between">
                    <span className="text-white">深色模式</span>
                    <div className="w-10 h-6 bg-orange-500 rounded-full flex items-center p-1 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                    </div>
                  </div>
                </div>
                <div className="p-4 bg-[#0a0a0a] border border-[#222] rounded-xl">
                  <p className="text-sm text-gray-400 mb-2">系统版本</p>
                  <p className="text-white font-mono">v1.0.0 (Build 20260402)</p>
                </div>
              </div>
              <button 
                onClick={() => setIsSettingsOpen(false)}
                className="w-full mt-6 py-3 bg-[#1a1a1a] text-white hover:bg-[#222] rounded-xl font-medium transition-all"
              >
                关闭
              </button>
            </div>
          </div>
        )}

        <div className="p-8">
          {activeTab === 'dashboard' && <Dashboard />}
          {activeTab === 'stations' && <StationList />}
          {activeTab === 'analysis' && <DataAnalysis />}
          {activeTab === 'alerts' && <AlertList />}
          {activeTab === 'basicData' && <BasicData />}
          {activeTab === 'gateways' && <GatewayList />}
          {activeTab === 'inverters' && <InverterList />}
          {activeTab === 'roles' && <RoleManagement />}
          {activeTab === 'users' && <UserManagement />}
        </div>
      </main>
    </div>
  );
}
