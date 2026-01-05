import { google } from 'googleapis';
import { NextResponse } from 'next/server';
import path from 'path';

// ==========================================
// 1. 空き時間を取得する機能 (GET)
// ==========================================
export async function GET() {
  try {
    const keyFilePath = path.join(process.cwd(), 'key.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/calendar.readonly'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    // ビジネスルール（45分、土曜17時、3時間前締切）
    const BUSINESS_HOUR_START = 10;
    const WEEKDAY_HOUR_END = 19;
    const SATURDAY_HOUR_END = 17;
    const SLOT_DURATION_MIN = 45;
    const LEAD_TIME_HOURS = 3;
    const DAYS_TO_CHECK = 14;

    const now = new Date();
    const leadTimeLimit = new Date(now.getTime() + (LEAD_TIME_HOURS * 60 * 60 * 1000));
    const endRange = new Date();
    endRange.setDate(now.getDate() + DAYS_TO_CHECK);

    const response = await calendar.events.list({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      timeMin: now.toISOString(),
      timeMax: endRange.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const busyEvents = response.data.items || [];
    let availableSlots = [];

    for (let i = 0; i < DAYS_TO_CHECK; i++) {
      let checkDate = new Date();
      checkDate.setDate(now.getDate() + i);
      const dayOfWeek = checkDate.getDay();
      if (dayOfWeek === 0 || dayOfWeek === 3) continue;

      const currentEndHour = (dayOfWeek === 6) ? SATURDAY_HOUR_END : WEEKDAY_HOUR_END;
      let startTime = new Date(checkDate);
      startTime.setHours(BUSINESS_HOUR_START, 0, 0, 0);
      let endTime = new Date(checkDate);
      endTime.setHours(currentEndHour, 0, 0, 0);

      if (startTime < leadTimeLimit) {
        startTime = new Date(leadTimeLimit);
        startTime.setMinutes(Math.ceil(startTime.getMinutes() / 15) * 15, 0, 0);
      }

      while (startTime.getTime() + SLOT_DURATION_MIN * 60000 <= endTime.getTime()) {
        const slotEnd = new Date(startTime.getTime() + SLOT_DURATION_MIN * 60000);
        const isBusy = busyEvents.some(event => {
          const eventStart = new Date(event.start?.dateTime || event.start?.date || "");
          const eventEnd = new Date(event.end?.dateTime || event.end?.date || "");
          return (startTime < eventEnd && slotEnd > eventStart);
        });
        if (!isBusy) availableSlots.push(new Date(startTime).toISOString());
        startTime.setMinutes(startTime.getMinutes() + 15);
      }
    }
    return NextResponse.json(availableSlots);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// ==========================================
// 2. 予約を書き込む機能 (POST) - 固定URL版
// ==========================================
export async function POST(request: Request) {
  try {
    const { startTime, clientName } = await request.json();
    
    // 【★ここを自分のMeet URLに書き換えてください★】
    const MY_MEET_URL = "https://meet.google.com/nuz-anuz-yrh"; 

    const keyFilePath = path.join(process.cwd(), 'key.json');
    const auth = new google.auth.GoogleAuth({
      keyFile: keyFilePath,
      scopes: ['https://www.googleapis.com/auth/calendar'],
    });
    const calendar = google.calendar({ version: 'v3', auth });

    const end = new Date(new Date(startTime).getTime() + 45 * 60000);

    const event = {
      summary: `【予約】${clientName} 様 相談`,
      location: MY_MEET_URL, // 場所にMeet URLを入れる
      description: `予約ありがとうございます。\n時間になりましたら以下のURLよりご参加ください。\n\n参加URL: ${MY_MEET_URL}`,
      start: { dateTime: startTime },
      end: { dateTime: end.toISOString() },
    };

    await calendar.events.insert({
      calendarId: process.env.GOOGLE_CALENDAR_ID,
      requestBody: event,
    });

    return NextResponse.json({ message: '予約成功' });
  } catch (error: any) {
    console.error("🚨 予約エラー:", error.response?.data || error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}