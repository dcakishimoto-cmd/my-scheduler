'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 最初は未選択
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetch('/api/slots').then(res => res.json()).then(data => {
      if (!data.error) {
        setSlots(data);
        // ★自動選択をあえてせず、ユーザーに選んでもらう形にします
      }
      setLoading(false);
    });
  }, []);

  const groupedSlots: { [key: string]: string[] } = {};
  slots.forEach(slot => {
    const date = new Date(slot).toLocaleDateString('ja-JP');
    if (!groupedSlots[date]) groupedSlots[date] = [];
    groupedSlots[date].push(slot);
  });

  const uniqueDates = Object.keys(groupedSlots);

  const handleBooking = async () => {
    if (!clientName) return alert('お名前を入力してください');
    setIsBooking(true);
    try {
      const res = await fetch('/api/slots', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ startTime: selectedSlot, clientName }),
      });
      if (res.ok) {
        alert('ご予約ありがとうございます。のちほどメールにて会議URLを送付させていただきます。');
        window.location.reload();
      } else {
        alert('エラーが発生しました。');
      }
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      <header className="px-6 py-12 text-center bg-white border-b border-slate-100">
        <h1 className="text-2xl font-black tracking-tight text-slate-800">打ち合わせ予約</h1>
        <p className="text-sm text-slate-400 mt-2 font-medium text-balance">ご都合の良い日程をステップに沿って選択してください</p>
      </header>

      <div className="max-w-2xl mx-auto px-4 py-8">
        
        {/* STEP 1: 日付選択 */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full">1</span>
            <h2 className="font-bold text-slate-700">日程を選択</h2>
          </div>
          
          {loading ? (
            <div className="flex justify-center py-10"><div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent"></div></div>
          ) : (
            <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar sm:flex-wrap sm:justify-center">
              {uniqueDates.map(date => {
                const d = new Date(groupedSlots[date][0]);
                const month = d.getMonth() + 1;
                const day = d.getDate();
                const week = d.toLocaleDateString('ja-JP', { weekday: 'short' });
                const isSelected = selectedDate === date;

                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setSelectedSlot(null); // 日付を変えたら時間はリセット
                    }}
                    className={`flex-shrink-0 w-24 h-24 rounded-2xl flex flex-col items-center justify-center transition-all border-2 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-xl shadow-blue-100 scale-105' 
                        : 'bg-white border-white text-slate-500 hover:border-blue-200 shadow-sm'
                    }`}
                  >
                    <span className="text-[10px] font-bold opacity-80 mb-1">{month}月</span>
                    <span className="text-2xl font-black mb-1">{day}</span>
                    <span className="text-[10px] font-bold">({week})</span>
                  </button>
                );
              })}
            </div>
          )}
        </section>

        {/* STEP 2: 時間選択（日程が選ばれた時だけ表示） */}
        {selectedDate && (
          <section className="animate-in fade-in slide-in-from-top-4 duration-500">
            <div className="flex items-center gap-2 mb-6">
              <span className="flex items-center justify-center w-6 h-6 bg-blue-600 text-white text-[10px] font-black rounded-full">2</span>
              <h2 className="font-bold text-slate-700">時間を選択</h2>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {groupedSlots[selectedDate]?.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-5 rounded-2xl border-2 border-white bg-white font-black text-center text-slate-700 shadow-sm hover:border-blue-500 hover:text-blue-600 transition-all active:scale-95"
                >
                  {new Date(slot).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* 予約確認モーダル（時間を選んだら出現） */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />
            
            <div className="text-center mb-8">
              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2 block">Confirm Reservation</span>
              <h2 className="text-xl font-bold mb-4">予約を確定しますか？</h2>
              <div className="inline-flex flex-col bg-slate-50 px-8 py-4 rounded-3xl border border-slate-100">
                <span className="text-xs text-slate-400 font-bold mb-1 uppercase">Selected Time</span>
                <span className="text-lg font-black text-blue-600">
                  {new Date(selectedSlot).toLocaleString('ja-JP', { month: 'long', day: 'numeric', weekday: 'short', hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
            
            <div className="mb-8">
              <input 
                type="text" placeholder="お名前を入力してください" 
                className="w-full bg-slate-50 rounded-2xl p-5 outline-none focus:ring-4 ring-blue-500/10 border-2 border-transparent focus:border-blue-500 transition-all placeholder:text-slate-300 text-lg font-bold"
                value={clientName} onChange={(e) => setClientName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBooking} disabled={isBooking}
                className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black text-lg disabled:bg-slate-200 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
              >
                {isBooking ? '処理中...' : '予約を確定する'}
              </button>
              <button onClick={() => setSelectedSlot(null)} className="w-full py-4 text-slate-400 font-bold text-sm hover:text-slate-600 transition-colors">選び直す</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
