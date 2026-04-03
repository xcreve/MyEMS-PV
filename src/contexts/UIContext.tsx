import React, { createContext, useContext, useState, ReactNode } from 'react';

interface UIContextType {
  showToast: (message: string, type?: 'success' | 'error') => void;
  confirm: (message: string) => Promise<boolean>;
}

const UIContext = createContext<UIContextType | null>(null);

export const useUI = () => {
  const context = useContext(UIContext);
  if (!context) throw new Error('useUI must be used within UIProvider');
  return context;
};

export const UIProvider = ({ children }: { children: ReactNode }) => {
  const [toast, setToast] = useState<{ message: string, type: 'success' | 'error' } | null>(null);
  const [confirmState, setConfirmState] = useState<{ message: string, resolve: (val: boolean) => void } | null>(null);

  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const confirm = (message: string): Promise<boolean> => {
    return new Promise((resolve) => {
      setConfirmState({ message, resolve });
    });
  };

  const handleConfirm = (val: boolean) => {
    if (confirmState) {
      confirmState.resolve(val);
      setConfirmState(null);
    }
  };

  return (
    <UIContext.Provider value={{ showToast, confirm }}>
      {children}
      {/* Toast UI */}
      {toast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[100] animate-in slide-in-from-top-4 fade-in duration-300">
          <div className={`px-6 py-3 rounded-xl shadow-lg flex items-center gap-3 ${toast.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
            <span className="font-medium">{toast.message}</span>
          </div>
        </div>
      )}
      {/* Confirm UI */}
      {confirmState && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-bg-card border border-border-strong rounded-2xl p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <h3 className="text-lg font-bold text-text-main mb-4">确认操作</h3>
            <p className="text-text-muted mb-6">{confirmState.message}</p>
            <div className="flex gap-3">
              <button onClick={() => handleConfirm(false)} className="flex-1 px-4 py-2 bg-border-subtle text-text-main hover:bg-border-strong rounded-xl font-medium transition-all">取消</button>
              <button onClick={() => handleConfirm(true)} className="flex-1 px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all">确定</button>
            </div>
          </div>
        </div>
      )}
    </UIContext.Provider>
  );
};
