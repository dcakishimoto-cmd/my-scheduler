import { google } from 'googleapis';
import { NextResponse } from 'next/server';

// --- ① 空き時間を取得する機能 (GET) ---
export async function GET() {
  try {
    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    // 【重要】日本時間(JST)への変換設定
    const JST_OFFSET = 9 * 60 * 60 * 1000; // 日本はUTC+9時間
    const now = new Date();
    const jstNow = new Date(now.getTime() + JST_OFFSET);

    const BUSINESS_HOUR_START = 10;
    const WEEKDAY_HOUR_END = 19;
    const SATURDAY_HOUR_END = 17;
    const SLOT_DURATION_MIN = 45;
    const LEAD_TIME_HOURS = 3;
    const DAYS_TO_CHECK = 14;

    // 予約可能開始時刻（今から3時間後）
    const leadTimeLimit = new Date(jstNow.getTime() + (LEAD_TIME_HOURS * 60 * 60 * 1000));
    
    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(), // カレンダーAPIにはUTCのまま投げる
      timeMax: new Date(now.getTime() + (DAYS_TO_CHECK * 24 * 60 * 60 * 1000)).toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyEvents = response.data.items || [];
    let availableSlots = [];

    for (let i = 0; i < DAYS_TO_CHECK; i++) {
      let checkDateJST = new Date(jstNow.getTime() + (i * 24 * 60 * 60 * 1000));
      const dayOfWeek = checkDateJST.getUTCDay(); // UTCベースで計算するためgetUTCDay
      
      if (dayOfWeek === 0 || dayOfWeek === 3) continue; // 日・水定休

      const currentEndHour = (dayOfWeek === 6) ? SATURDAY_HOUR_END : WEEKDAY_HOUR_END;

      // 日本時間の「10:00」と「19:00」をUTC基準で作る
      // 10:00 JST は 01:00 UTC / 19:00 JST は 10:00 UTC
      let startTime = new Date(Date.UTC(checkDateJST.getUTCFullYear(), checkDateJST.getUTCMonth(), checkDateJST.getUTCDate(), BUSINESS_HOUR_START - 9, 0, 0));
      let endTime = new Date(Date.UTC(checkDateJST.getUTCFullYear(), checkDateJST.getUTCMonth(), checkDateJST.getUTCDate(), currentEndHour - 9, 0, 0));

      // 3時間前ルール適用
      if (startTime.getTime() < (leadTimeLimit.getTime() - JST_OFFSET)) {
        startTime = new Date(leadTimeLimit.getTime() - JST_OFFSET);
        startTime.setUTCMinutes(Math.ceil(startTime.getUTCMinutes() / 15) * 15, 0, 0);
      }

      while (startTime.getTime() + SLOT_DURATION_MIN * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(startTime.getTime() + SLOT_DURATION_MIN * 60000);
        const isBusy = busyEvents.some(event => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || "");
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || "");
          return (startTime < eventEnd && slotEnd > eventStart);
        });
        
        if (!isBusy) availableSlots.push(startTime.toISOString());
        startTime.setUTCMinutes(startTime.getUTCMinutes() + 15);
      }
    }
    return NextResponse.json(availableSlots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// --- ② 予約を書き込む機能 (POST) ---
export async function POST(request: Request) {
  try {
    const { startTime, clientName } = await request.json();
    const MY_MEET_URL = "https://meet.google.com/nuz-anuz-yrh"; 

    const auth = new google.auth.GoogleAuth({
      credentials: JSON.parse(process.env.GOOGLE_SERVICE_ACCOUNT_KEY || '{}'),
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const end = new Date(new Date(startTime).getTime() + 45 * 60000);

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: {
        summary: `【予約】${clientName} 様 相談`,
        location: MY_MEET_URL,
        description: `予約ありがとうございます。\n時間になりましたら以下のURLよりご参加ください。\n\n参加URL: ${MY_MEET_URL}`,
        start: { dateTime: startTime },
        end: { dateTime: end.toISOString() },
      },
    });

    return NextResponse.json({ message: '予約成功' });
  } catch (error: any) {
    console.error("🚨 予約エラー:", error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}