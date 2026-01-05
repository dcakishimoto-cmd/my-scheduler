'use client';
import { useEffect, useState } from 'react';

export default function Home() {
  const [slots, setSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [clientName, setClientName] = useState('');
  const [isBooking, setIsBooking] = useState(false);

  useEffect(() => {
    fetch('/api/slots').then(res => res.json()).then(data => {
      if (!data.error) setSlots(data);
      setLoading(false);
    });
  }, []);

  const handleBooking = async () => {
    if (!clientName) return alert('お名前を入力してください');
    setIsBooking(true);

    const res = await fetch('/api/slots', {
      method: 'POST',
      body: JSON.stringify({ startTime: selectedSlot, clientName }),
    });

    if (res.ok) {
      alert('予約が完了しました！のちほど会議URLをメールまたはCWにてお知らせいたします');
      window.location.reload(); // 画面を更新して最新の空き状況にする
    } else {
      alert('エラーが発生しました。');
    }
    setIsBooking(false);
  };

  return (
    <main className="min-h-screen bg-slate-50 pb-20 font-sans text-slate-900">
      <header className="bg-white border-b border-slate-200 px-6 py-8 mb-8">
        <div className="max-w-xl mx-auto text-center">
          <h1 className="text-2xl font-bold">オンライン相談 予約</h1>
          <p className="text-slate-500 text-sm mt-1">ご希望の日時を選択してください</p>
        </div>
      </header>

      <div className="max-w-xl mx-auto px-4">
        {loading ? (
          <p className="text-center py-20 text-slate-400">読み込み中...</p>
        ) : (
          <div className="grid grid-cols-1 gap-3">
            {slots.map(slot => (
              <button 
                key={slot} 
                onClick={() => setSelectedSlot(slot)}
                className="flex items-center justify-between w-full bg-white border border-slate-200 p-5 rounded-2xl shadow-sm hover:border-blue-500 transition-all active:scale-95"
              >
                <div className="flex flex-col text-left">
                  <span className="text-xs font-bold text-blue-600 mb-1">
                    {new Date(slot).toLocaleDateString('ja-JP', { month: 'short', day: 'numeric', weekday: 'short' })}
                  </span>
                  <span className="text-xl font-bold text-slate-700">
                    {new Date(slot).toLocaleTimeString('ja-JP', { hour: '2-digit', minute: '2-digit' })} 〜
                  </span>
                </div>
                <div className="text-blue-500 font-bold">選択</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 予約入力モーダル風（簡易版） */}
      {selectedSlot && (
        <div className="fixed inset-0 bg-slate-900/60 flex items-end sm:items-center justify-center p-4 z-50">
          <div className="bg-white w-full max-w-md rounded-t-3xl sm:rounded-3xl p-8 shadow-2xl animate-in fade-in slide-in-from-bottom-10">
            <h2 className="text-xl font-bold mb-4 text-slate-800">予約の確認</h2>
            <p className="text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl">
              日時：<strong>{new Date(selectedSlot).toLocaleString('ja-JP')} 〜</strong>
            </p>
            <div className="mb-6">
              <label className="block text-sm font-bold text-slate-700 mb-2">お名前（会社名）</label>
              <input 
                type="text" 
                className="w-full border-2 border-slate-100 rounded-xl p-4 focus:border-blue-500 outline-none transition-all"
                placeholder="例：株式会社〇〇 山田"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
              />
            </div>
            <div className="flex gap-3">
              <button 
                onClick={() => setSelectedSlot(null)}
                className="flex-1 py-4 font-bold text-slate-400"
              >
                キャンセル
              </button>
              <button 
                onClick={handleBooking}
                disabled={isBooking}
                className="flex-[2] bg-blue-600 text-white py-4 rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all disabled:bg-slate-300"
              >
                {isBooking ? '予約中...' : '予約を確定する'}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
