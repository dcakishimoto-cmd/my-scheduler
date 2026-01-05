'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null); // 選択された日付
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null); // 選択された時間
  const [clientName, setClientName] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetch('/api/slots').then(res => res.json()).then(data => {
      if (!data.error) {
        setSlots(data);
        // 最初の日付をデフォルトで選択
        if (data.length > 0) {
          const firstDate = new Date(data[0]).toLocaleDateString('ja-JP');
          setSelectedDate(firstDate);
        }
      }
      setLoading(false);
    });
  }, []);

  // 日付ごとにグループ化
  const groupedSlots: { [key: string]: string[] } = {};
  slots.forEach(slot => {
    const date = new Date(slot).toLocaleDateString('ja-JP');
    if (!groupedSlots[date]) groupedSlots[date] = [];
    groupedSlots[date].push(slot);
  });

  const uniqueDates = Object.keys(groupedSlots);

  const handleBooking = async () => {
    if (!clientName || !clientEmail) return alert('名前とメールアドレスを入力してください');
    setIsBooking(true);
    const res = await fetch('/api/slots', {
      method: 'POST',
      body: JSON.stringify({ startTime: selectedSlot, clientName, clientEmail }),
    });
    if (res.ok) {
      alert('予約完了！メールをご確認ください。');
      window.location.reload();
    } else {
      alert('エラーが発生しました。');
    }
    setIsBooking(false);
  };

  return (
    <main className="min-h-screen bg-white pb-20 font-sans text-slate-900">
      <header className="px-6 py-10 text-center">
        <h1 className="text-xl font-bold tracking-tight">打ち合わせ予約</h1>
        <p className="text-sm text-slate-500 mt-2">ご希望の日時を選択してください</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* 日付選択：横スクロール */}
          <div className="sticky top-0 bg-white/80 backdrop-blur-md z-10 border-b border-slate-100 overflow-x-auto no-scrollbar flex px-4 py-4 gap-3">
            {uniqueDates.map(date => {
              const d = new Date(groupedSlots[date][0]);
              const dayName = d.toLocaleDateString('ja-JP', { weekday: 'short' });
              const dayNum = d.getDate();
              const isSelected = selectedDate === date;

              return (
                <button
                  key={date}
                  onClick={() => setSelectedDate(date)}
                  className={`flex-shrink-0 w-16 h-20 rounded-2xl flex flex-col items-center justify-center transition-all ${
                    isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'bg-slate-50 text-slate-400'
                  }`}
                >
                  <span className="text-[10px] font-bold uppercase">{dayName}</span>
                  <span className="text-xl font-black">{dayNum}</span>
                </button>
              );
            })}
          </div>

          {/* 時間枠のリスト */}
          <div className="max-w-md mx-auto px-6 py-8">
            <h2 className="text-sm font-bold text-slate-400 mb-6 uppercase tracking-widest">Available Times</h2>
            <div className="grid grid-cols-2 gap-3">
              {selectedDate && groupedSlots[selectedDate]?.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-4 px-2 rounded-xl border border-slate-100 bg-slate-50 font-bold text-center hover:border-blue-500 transition-colors"
                >
                  {new Date(slot).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })}
                </button>
              ))}
            </div>
          </div>
        </>
      )}

      {/* 予約確認モーダル */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-6 sm:hidden" />
            <h2 className="text-xl font-bold mb-2">予約を確定しますか？</h2>
            <p className="text-slate-500 text-sm mb-6">
              {new Date(selectedSlot).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 〜
            </p>
            
            <div className="space-y-4 mb-8">
              <input 
                type="text" placeholder="お名前" 
                className="w-full bg-slate-50 rounded-xl p-4 outline-none focus:ring-2 ring-blue-500/20 border-none"
                value={clientName} onChange={(e) => setClientName(e.target.value)}
              />
              <input 
                type="email" placeholder="メールアドレス" 
                className="w-full bg-slate-50 rounded-xl p-4 outline-none focus:ring-2 ring-blue-500/20 border-none"
                value={clientEmail} onChange={(e) => setClientEmail(e.target.value)}
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBooking} disabled={isBooking}
                className="w-full bg-blue-600 text-white py-4 rounded-xl font-bold text-lg disabled:bg-slate-300 shadow-xl shadow-blue-100"
              >
                {isBooking ? '処理中...' : 'この内容で予約する'}
              </button>
              <button onClick={() => setSelectedSlot(null)} className="w-full py-4 text-slate-400 font-bold text-sm">戻る</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
