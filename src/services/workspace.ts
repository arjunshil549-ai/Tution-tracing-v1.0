import { Tuition, Attendance } from '../types';

/**
 * Base64 url-safe encoder for Gmail raw message
 */
function base64UrlEncode(str: string): string {
  return btoa(unescape(encodeURIComponent(str)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * GOOGLE SHEETS SERVICE
 */
export interface SheetExportResult {
  spreadsheetId: string;
  spreadsheetUrl: string;
  title: string;
}

export async function exportTuitionReportToSheets(
  accessToken: string,
  monthName: string,
  year: number,
  tuitions: Tuition[],
  attendanceLogs: Attendance[]
): Promise<SheetExportResult> {
  // 1. Create a new Spreadsheet via Google Sheets API
  const createResp = await fetch('https://sheets.googleapis.com/v4/spreadsheets', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      properties: {
        title: `TuitionTrack - Monthly Report ${monthName} ${year}`,
      },
    }),
  });

  if (!createResp.ok) {
    const err = await createResp.text();
    throw new Error(`Failed to create Google Sheet: ${err}`);
  }

  const sheetData = await createResp.json();
  const spreadsheetId = sheetData.spreadsheetId;
  const spreadsheetUrl = sheetData.spreadsheetUrl || `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;

  // 2. Prepare Rows for Summary and Attendance
  const totalDays = attendanceLogs.length;
  const totalDurationSeconds = attendanceLogs.reduce((acc, log) => acc + (log.duration || 0), 0);
  const totalHours = Math.floor(totalDurationSeconds / 3600);
  const totalMins = Math.floor((totalDurationSeconds % 3600) / 60);

  let totalEarned = 0;
  tuitions.forEach((t) => {
    const count = attendanceLogs.filter((a) => a.tuitionId === t.id && a.status === 'completed').length;
    const expected = t.expectedClassesPerMonth || 10;
    const earned = expected > 0 ? Math.round((t.fee / expected) * count) : t.fee;
    totalEarned += earned;
  });

  const values: any[][] = [
    ['TUITIONTRACK - MONTHLY ATTENDANCE & EARNINGS REPORT'],
    [`Period: ${monthName} ${year}`, '', `Generated: ${new Date().toLocaleDateString()}`],
    [],
    ['SUMMARY OVERVIEW'],
    ['Total Tuition Sessions', totalDays],
    ['Total Hours Taught', `${totalHours}h ${totalMins}m`],
    ['Estimated Total Earnings', `৳${totalEarned.toLocaleString()}`],
    [],
    ['TUITIONS BREAKDOWN'],
    ['Tuition Name', 'Student Name', 'Location', 'Monthly Fee', 'Expected Classes', 'Classes Done', 'Est. Earned'],
  ];

  tuitions.forEach((t) => {
    const done = attendanceLogs.filter((a) => a.tuitionId === t.id && a.status === 'completed').length;
    const expected = t.expectedClassesPerMonth || 10;
    const earned = expected > 0 ? Math.round((t.fee / expected) * done) : t.fee;
    values.push([
      t.name,
      t.studentName || 'N/A',
      t.address,
      `৳${t.fee.toLocaleString()}`,
      expected,
      done,
      `৳${earned.toLocaleString()}`,
    ]);
  });

  values.push([]);
  values.push(['DETAILED ATTENDANCE LOGS']);
  values.push(['Date', 'Tuition', 'Student', 'Arrival', 'Departure', 'Duration', 'Status', 'Notes']);

  attendanceLogs.forEach((log) => {
    const tuition = tuitions.find((t) => t.id === log.tuitionId);
    const durH = Math.floor(log.duration / 3600);
    const durM = Math.floor((log.duration % 3600) / 60);
    values.push([
      log.date,
      tuition ? tuition.name : `Tuition #${log.tuitionId}`,
      tuition?.studentName || 'N/A',
      log.arrivalTime,
      log.departureTime || 'Ongoing',
      `${durH > 0 ? durH + 'h ' : ''}${durM}m`,
      log.status,
      log.notes || '',
    ]);
  });

  // 3. Write data into Sheet
  const updateResp = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/Sheet1!A1:H${values.length}?valueInputOption=USER_ENTERED`,
    {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        range: `Sheet1!A1:H${values.length}`,
        majorDimension: 'ROWS',
        values,
      }),
    }
  );

  if (!updateResp.ok) {
    const err = await updateResp.text();
    throw new Error(`Failed to write rows to Google Sheet: ${err}`);
  }

  return {
    spreadsheetId,
    spreadsheetUrl,
    title: `TuitionTrack - Monthly Report ${monthName} ${year}`,
  };
}

/**
 * GMAIL SERVICE
 */
export interface SendEmailParams {
  to: string;
  subject: string;
  bodyText: string;
}

export async function sendEmailViaGmail(
  accessToken: string,
  params: SendEmailParams
): Promise<{ messageId: string }> {
  const emailLines = [
    `To: ${params.to}`,
    `Subject: =?utf-8?B?${btoa(unescape(encodeURIComponent(params.subject)))}?=`,
    'MIME-Version: 1.0',
    'Content-Type: text/plain; charset=UTF-8',
    'Content-Transfer-Encoding: 7bit',
    '',
    params.bodyText,
  ];

  const rawMessage = base64UrlEncode(emailLines.join('\r\n'));

  const resp = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      raw: rawMessage,
    }),
  });

  if (!resp.ok) {
    const errorData = await resp.text();
    throw new Error(`Gmail API error: ${errorData}`);
  }

  const result = await resp.json();
  return { messageId: result.id };
}

/**
 * GOOGLE CALENDAR SERVICE
 */
export interface CalendarEventItem {
  id: string;
  summary: string;
  location?: string;
  start: { dateTime?: string; date?: string };
  end: { dateTime?: string; date?: string };
  htmlLink?: string;
}

export async function listUpcomingTuitionCalendarEvents(
  accessToken: string
): Promise<CalendarEventItem[]> {
  const nowIso = new Date().toISOString();
  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events');
  url.searchParams.set('timeMin', nowIso);
  url.searchParams.set('maxResults', '15');
  url.searchParams.set('singleEvents', 'true');
  url.searchParams.set('orderBy', 'startTime');
  url.searchParams.set('q', 'Tuition');

  const resp = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${accessToken}` },
  });

  if (!resp.ok) {
    throw new Error('Failed to retrieve calendar events');
  }

  const data = await resp.json();
  return (data.items || []).map((item: any) => ({
    id: item.id,
    summary: item.summary,
    location: item.location,
    start: item.start,
    end: item.end,
    htmlLink: item.htmlLink,
  }));
}

export async function addTuitionToCalendar(
  accessToken: string,
  tuition: Tuition
): Promise<{ eventId: string; htmlLink: string }> {
  // Determine next occurrence date for this tuition's scheduled days
  const now = new Date();
  let targetDate = new Date();
  
  // Find closest day in scheduledDays
  // 1 = Mon ... 7 = Sun
  const jsDay = now.getDay() === 0 ? 7 : now.getDay();
  let daysAhead = 0;
  if (tuition.scheduledDays && tuition.scheduledDays.length > 0) {
    const sorted = [...tuition.scheduledDays].sort();
    const upcoming = sorted.find((d) => d >= jsDay);
    if (upcoming !== undefined) {
      daysAhead = upcoming - jsDay;
    } else {
      daysAhead = 7 - jsDay + sorted[0];
    }
  }
  targetDate.setDate(now.getDate() + daysAhead);

  const yyyy = targetDate.getFullYear();
  const mm = (targetDate.getMonth() + 1).toString().padStart(2, '0');
  const dd = targetDate.getDate().toString().padStart(2, '0');
  const datePrefix = `${yyyy}-${mm}-${dd}`;

  const startTime = tuition.expectedStart || '16:00';
  const endTime = tuition.expectedEnd || '18:00';

  const startDateTime = `${datePrefix}T${startTime}:00`;
  const endDateTime = `${datePrefix}T${endTime}:00`;

  // Map scheduledDays to RRULE BYDAY (e.g. MO,WE,FR)
  const dayCodeMap: Record<number, string> = {
    1: 'MO',
    2: 'TU',
    3: 'WE',
    4: 'TH',
    5: 'FR',
    6: 'SA',
    7: 'SU',
  };
  const byDays = (tuition.scheduledDays || []).map((d) => dayCodeMap[d]).filter(Boolean);
  const recurrence = byDays.length > 0 ? [`RRULE:FREQ=WEEKLY;BYDAY=${byDays.join(',')}`] : undefined;

  const eventPayload = {
    summary: `Tuition: ${tuition.name}${tuition.studentName ? ` (${tuition.studentName})` : ''}`,
    description: `Automated schedule synced from TuitionTrack.\nStudent: ${tuition.studentName || 'N/A'}\nFee: ৳${tuition.fee.toLocaleString()} / month\nExpected Classes: ${tuition.expectedClassesPerMonth || 10}/mo\nGeofence Radius: ${tuition.radius}m`,
    location: tuition.address,
    start: {
      dateTime: new Date(startDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    end: {
      dateTime: new Date(endDateTime).toISOString(),
      timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    },
    recurrence,
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'popup', minutes: 30 },
        { method: 'popup', minutes: 10 },
      ],
    },
  };

  const resp = await fetch('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(eventPayload),
  });

  if (!resp.ok) {
    const err = await resp.text();
    throw new Error(`Failed to create Google Calendar event: ${err}`);
  }

  const result = await resp.json();
  return {
    eventId: result.id,
    htmlLink: result.htmlLink,
  };
}
