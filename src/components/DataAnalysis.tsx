import React, { useState, useEffect } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { Station } from '../types';
import { Download, Search, Filter, Calendar as CalendarIcon } from 'lucide-react';
import * as XLSX from 'xlsx';

export function DataAnalysis() {
  const [stations, setStations] = useState<Station[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [groupFilter, setGroupFilter] = useState('');
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [tableData, setTableData] = useState<any[]>([]);

  useEffect(() => {
    const q = query(collection(db, 'stations'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setStations(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Station)));
    });
    return () => unsubscribe();
  }, []);

  // Generate mock hourly data for the selected date
  useEffect(() => {
    const filteredStations = stations.filter(station => 
      station.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
      (groupFilter === '' || station.group === groupFilter)
    );

    const newData = filteredStations.map(station => {
      const row: any = { stationName: station.name, group: station.group || '-' };
      let total = 0;
      
      for (let i = 0; i < 24; i++) {
        row[`h${i}`] = 0;
      }

      const start = new Date(startDate);
      const end = new Date(endDate);
      const days = Math.max(1, Math.floor((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1);

      for (let d = 0; d < days; d++) {
        const currentDate = new Date(start.getTime() + d * 24 * 60 * 60 * 1000);
        const seed = station.id.charCodeAt(0) + currentDate.getDate();
        
        for (let i = 0; i < 24; i++) {
          let power = 0;
          if (i >= 6 && i <= 18) {
            const peak = (station.capacity || 100) * 0.8;
            const x = (i - 12) / 6;
            power = Math.max(0, peak * (1 - x * x) * (0.8 + (seed % 10) * 0.04));
          }
          row[`h${i}`] += power;
        }
      }

      for (let i = 0; i < 24; i++) {
        const val = Number(row[`h${i}`].toFixed(2));
        row[`h${i}`] = val;
        total += val;
      }

      row.total = Number(total.toFixed(2));
      return row;
    });

    setTableData(newData);
  }, [stations, searchQuery, groupFilter, startDate, endDate]);

  const setQuickDate = (type: 'month' | 'year') => {
    const now = new Date();
    if (type === 'month') {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    } else {
      const start = new Date(now.getFullYear(), 0, 1);
      const end = new Date(now.getFullYear(), 11, 31);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
    }
  };

  const handleExportExcel = () => {
    if (tableData.length === 0) return;
    
    // Format data for Excel
    const exportData = tableData.map(row => {
      const formatted: any = {
        '电站名称': row.stationName,
        '分组': row.group,
      };
      for (let i = 0; i < 24; i++) {
        formatted[`${i}时`] = row[`h${i}`];
      }
      formatted['总计 (kWh)'] = row.total;
      return formatted;
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "发电量统计");
    XLSX.writeFile(wb, `发电量统计_${startDate}_至_${endDate}.xlsx`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex items-center gap-4 flex-1 w-full">
          <div className="relative flex-1 max-w-xs">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <input 
              type="text" 
              placeholder="搜索电站名称..." 
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="relative max-w-xs">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
            <select
              className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white appearance-none"
              value={groupFilter}
              onChange={(e) => setGroupFilter(e.target.value)}
            >
              <option value="">全部分组</option>
              {uniqueGroups.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </div>
          <div className="relative max-w-xs flex items-center gap-2">
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="date" 
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <span className="text-gray-500">至</span>
            <div className="relative">
              <CalendarIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
              <input 
                type="date" 
                className="w-full bg-[#141414] border border-[#1a1a1a] rounded-xl pl-10 pr-4 py-2 focus:border-orange-500 outline-none text-white"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-1 ml-2">
              <button 
                onClick={() => setQuickDate('month')}
                className="px-3 py-1.5 text-sm bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] rounded-lg transition-colors whitespace-nowrap"
              >
                本月
              </button>
              <button 
                onClick={() => setQuickDate('year')}
                className="px-3 py-1.5 text-sm bg-[#1a1a1a] text-gray-300 hover:text-white hover:bg-[#222] rounded-lg transition-colors whitespace-nowrap"
              >
                本年
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <button 
            onClick={handleExportExcel}
            className="bg-[#141414] border border-[#1a1a1a] hover:border-orange-500 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">导出 Excel</span>
          </button>
        </div>
      </div>

      <div className="bg-[#141414] border border-[#1a1a1a] rounded-2xl overflow-hidden">
        <div className="p-6 border-b border-[#1a1a1a] flex items-center gap-2">
          <h3 className="text-lg font-bold">发电量统计 (kWh)</h3>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <table className="w-full border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-[#1a1a1a] bg-[#1a1a1a]/50">
                <th className="px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-widest text-center sticky left-0 bg-[#1a1a1a] z-10">电站名称</th>
                {Array.from({length: 24}).map((_, i) => (
                  <th key={i} className="px-4 py-3 text-xs font-mono text-gray-500 uppercase tracking-widest text-center">{i}时</th>
                ))}
                <th className="px-4 py-3 text-xs font-mono text-orange-500 uppercase tracking-widest text-center sticky right-0 bg-[#1a1a1a] z-10">总计</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a1a]">
              {tableData.map((row, idx) => (
                <tr key={idx} className="hover:bg-[#1a1a1a]/30 transition-colors group">
                  <td className="px-4 py-3 font-medium text-white text-center sticky left-0 bg-[#141414] group-hover:bg-[#1a1a1a] z-10">{row.stationName}</td>
                  {Array.from({length: 24}).map((_, i) => (
                    <td key={i} className="px-4 py-3 text-sm text-gray-400 text-center font-mono">{row[`h${i}`]}</td>
                  ))}
                  <td className="px-4 py-3 text-sm text-orange-500 font-bold text-center font-mono sticky right-0 bg-[#141414] group-hover:bg-[#1a1a1a] z-10">{row.total}</td>
                </tr>
              ))}
              {tableData.length === 0 && (
                <tr>
                  <td colSpan={26} className="px-6 py-12 text-center text-gray-500">
                    暂无数据，请检查筛选条件或添加电站
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
