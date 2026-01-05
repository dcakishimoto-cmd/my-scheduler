'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  // 1. 予約枠の取得
  useEffect(() => {
    fetch('/api/slots').then(res => res.json()).then(data => {
      if (!data.error) {
        setSlots(data);
        if (data.length > 0) {
          const firstDate = new Date(data[0]).toLocaleDateString('ja-JP');
          setSelectedDate(firstDate);
        }
      }
      setLoading(false);
    });
  }, []);

  // 2. 日付ごとに時間をグループ化
  const groupedSlots: { [key: string]: string[] } = {};
  slots.forEach(slot => {
    const date = new Date(slot).toLocaleDateString('ja-JP');
    if (!groupedSlots[date]) groupedSlots[date] = [];
    groupedSlots[date].push(slot);
  });

  const uniqueDates = Object.keys(groupedSlots);

  // 3. 予約実行ボタンを押した時の処理
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
        // ★ご希望のメッセージに変更済み★
        alert('ご予約ありがとうございます。のちほどメールにて会議URLを送付させていただきます。');
        window.location.reload();
      } else {
        alert('エラーが発生しました。時間を置いて再度お試しください。');
      }
    } catch (error) {
      alert('通信エラーが発生しました。');
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <main className="min-h-screen bg-white pb-20 font-sans text-slate-900">
      {/* ヘッダー */}
      <header className="px-6 py-10 text-center">
        <h1 className="text-xl font-bold tracking-tight text-slate-800">打ち合わせ予約</h1>
        <p className="text-sm text-slate-500 mt-2">ご希望の日時を選択してください</p>
      </header>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="animate-spin h-6 w-6 border-4 border-blue-500 rounded-full border-t-transparent"></div>
        </div>
      ) : (
        <>
          {/* 日付選択：PCでは中央揃え、スマホでは横スクロール */}
          <div className="sticky top-0 bg-white/95 backdrop-blur-md z-10 border-b border-slate-100 py-4 shadow-sm">
            <div className="flex px-4 gap-3 overflow-x-auto no-scrollbar sm:justify-center">
              {uniqueDates.map(date => {
                const d = new Date(groupedSlots[date][0]);
                const dateLabel = `${d.getMonth() + 1}月${d.getDate()}日(${d.toLocaleDateString('ja-JP', { weekday: 'short' })})`;
                const isSelected = selectedDate === date;

                return (
                  <button
                    key={date}
                    onClick={() => setSelectedDate(date)}
                    className={`flex-shrink-0 px-5 py-3 rounded-xl flex flex-col items-center justify-center transition-all min-w-[110px] border-2 ${
                      isSelected 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-100' 
                        : 'bg-white border-slate-100 text-slate-600 hover:border-blue-300'
                    }`}
                  >
                    <span className="text-sm font-bold whitespace-nowrap">{dateLabel}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 時間枠のリスト */}
          <div className="max-w-md mx-auto px-6 py-10">
            <h2 className="text-[10px] font-black text-slate-400 mb-6 uppercase tracking-[0.2em] text-center">選択可能な時間</h2>
            <div className="grid grid-cols-2 gap-4">
              {selectedDate && groupedSlots[selectedDate]?.map(slot => (
                <button
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className="py-4 px-2 rounded-2xl border border-slate-100 bg-slate-50 font-bold text-center hover:border-blue-500 hover:bg-white transition-all shadow-sm hover:shadow-md active:scale-95"
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
        <div className="fixed inset-0 bg-slate-900/40 flex items-end sm:items-center justify-center p-0 sm:p-4 z-50 backdrop-blur-sm">
          <div className="bg-white w-full max-w-md rounded-t-[2.5rem] sm:rounded-[2rem] p-8 shadow-2xl animate-in slide-in-from-bottom duration-300">
            <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-8 sm:hidden" />
            
            <div className="text-center mb-8">
              <h2 className="text-xl font-bold mb-2">予約を確定しますか？</h2>
              <div className="inline-block bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-bold">
                {new Date(selectedSlot).toLocaleString('ja-JP', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' })} 〜
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <input 
                type="text" placeholder="お名前を入力してください" 
                className="w-full bg-slate-50 rounded-2xl p-5 outline-none focus:ring-2 ring-blue-500/20 border-none placeholder:text-slate-400 text-lg shadow-inner"
                value={clientName} onChange={(e) => setClientName(e.target.value)}
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-3">
              <button 
                onClick={handleBooking} disabled={isBooking}
                className="w-full bg-blue-600 text-white py-4 rounded-2xl font-bold text-lg disabled:bg-slate-300 shadow-xl shadow-blue-200 hover:bg-blue-700 transition-colors active:scale-95"
              >
                {isBooking ? '予約処理中...' : '予約を確定する'}
              </button>
              <button onClick={() => setSelectedSlot(null)} className="w-full py-4 text-slate-400 font-bold text-sm">戻る</button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
