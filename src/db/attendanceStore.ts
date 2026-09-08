import { db } from './index.ts';
import { attendance } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface AttendanceDbInput {
  tuitionId?: number;
  date: string;
  arrivalTime: string;
  departureTime?: string;
  duration?: number;
  durationSeconds?: number;
  status?: string;
  notes?: string;
  source?: string;
  clientEventId?: string;
  arrivalLatitude?: number;
  arrivalLongitude?: number;
  arrivalAccuracy?: number;
  departureLatitude?: number;
  departureLongitude?: number;
  departureAccuracy?: number;
}

export async function getAttendanceByUser(userUid: string) {
  try {
    const records = await db
      .select()
      .from(attendance)
      .where(eq(attendance.userUid, userUid))
      .orderBy(desc(attendance.date), desc(attendance.id));

    return records.map((a) => ({
      id: a.id,
      tuitionId: a.tuitionId || 0,
      date: a.date,
      arrivalTime: a.arrivalTime,
      departureTime: a.departureTime || undefined,
      duration: a.duration,
      durationSeconds: a.duration,
      status: (a.status as any) || 'completed',
      notes: a.notes || undefined,
      source: (a.source as any) || 'WEB',
      clientEventId: a.clientEventId || undefined,
      arrivalLatitude: a.arrivalLatitude ?? undefined,
      arrivalLongitude: a.arrivalLongitude ?? undefined,
      arrivalAccuracy: a.arrivalAccuracy ?? undefined,
      departureLatitude: a.departureLatitude ?? undefined,
      departureLongitude: a.departureLongitude ?? undefined,
      departureAccuracy: a.departureAccuracy ?? undefined,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: a.updatedAt ? a.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getAttendanceByUser:', error);
    throw new Error('Database query failed for attendance.', { cause: error });
  }
}

export async function createAttendance(userUid: string, data: AttendanceDbInput) {
  try {
    const duration = data.durationSeconds ?? data.duration ?? 0;
    const result = await db
      .insert(attendance)
      .values({
        userUid,
        tuitionId: data.tuitionId || null,
        date: data.date,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime || null,
        duration,
        status: data.status || 'completed',
        notes: data.notes || null,
        source: data.source || 'WEB',
        clientEventId: data.clientEventId || null,
        arrivalLatitude: data.arrivalLatitude || null,
        arrivalLongitude: data.arrivalLongitude || null,
        arrivalAccuracy: data.arrivalAccuracy || null,
        departureLatitude: data.departureLatitude || null,
        departureLongitude: data.departureLongitude || null,
        departureAccuracy: data.departureAccuracy || null,
      })
      .returning();

    const a = result[0];
    return {
      id: a.id,
      tuitionId: a.tuitionId || 0,
      date: a.date,
      arrivalTime: a.arrivalTime,
      departureTime: a.departureTime || undefined,
      duration: a.duration,
      durationSeconds: a.duration,
      status: a.status as any,
      notes: a.notes || undefined,
      source: (a.source as any) || 'WEB',
      clientEventId: a.clientEventId || undefined,
      arrivalLatitude: a.arrivalLatitude ?? undefined,
      arrivalLongitude: a.arrivalLongitude ?? undefined,
      arrivalAccuracy: a.arrivalAccuracy ?? undefined,
      departureLatitude: a.departureLatitude ?? undefined,
      departureLongitude: a.departureLongitude ?? undefined,
      departureAccuracy: a.departureAccuracy ?? undefined,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in createAttendance:', error);
    throw new Error('Failed to record attendance in database.', { cause: error });
  }
}

/**
 * Batch offline synchronization with idempotency guarantee
 */
export async function syncAttendanceBatch(userUid: string, items: AttendanceDbInput[]) {
  const syncedRecords = [];
  
  for (const item of items) {
    try {
      const duration = item.durationSeconds ?? item.duration ?? 0;

      // Check if clientEventId is provided and already exists for this user
      if (item.clientEventId) {
        const existing = await db
          .select()
          .from(attendance)
          .where(and(eq(attendance.userUid, userUid), eq(attendance.clientEventId, item.clientEventId)));

        if (existing.length > 0) {
          const current = existing[0];
          // If the incoming record has departure time or is completed, update existing
          if (item.departureTime || item.status === 'completed' || item.status === 'COMPLETED') {
            const updated = await db
              .update(attendance)
              .set({
                departureTime: item.departureTime || current.departureTime,
                duration: duration > 0 ? duration : current.duration,
                status: item.status || current.status,
                departureLatitude: item.departureLatitude ?? current.departureLatitude,
                departureLongitude: item.departureLongitude ?? current.departureLongitude,
                departureAccuracy: item.departureAccuracy ?? current.departureAccuracy,
                notes: item.notes || current.notes,
                updatedAt: new Date(),
              })
              .where(eq(attendance.id, current.id))
              .returning();
            syncedRecords.push({ ...updated[0], clientEventId: item.clientEventId });
            continue;
          } else {
            syncedRecords.push({ ...current, clientEventId: item.clientEventId });
            continue;
          }
        }
      }

      // Check if tuitionId + date + arrivalTime already exists (prevent duplicate arrival)
      if (item.tuitionId) {
        const duplicateCheck = await db
          .select()
          .from(attendance)
          .where(
            and(
              eq(attendance.userUid, userUid),
              eq(attendance.tuitionId, item.tuitionId),
              eq(attendance.date, item.date),
              eq(attendance.arrivalTime, item.arrivalTime)
            )
          );

        if (duplicateCheck.length > 0) {
          const current = duplicateCheck[0];
          if (item.departureTime || item.status === 'completed' || item.status === 'COMPLETED') {
            const updated = await db
              .update(attendance)
              .set({
                departureTime: item.departureTime || current.departureTime,
                duration: duration > 0 ? duration : current.duration,
                status: item.status || current.status,
                departureLatitude: item.departureLatitude ?? current.departureLatitude,
                departureLongitude: item.departureLongitude ?? current.departureLongitude,
                departureAccuracy: item.departureAccuracy ?? current.departureAccuracy,
                clientEventId: item.clientEventId || current.clientEventId,
                updatedAt: new Date(),
              })
              .where(eq(attendance.id, current.id))
              .returning();
            syncedRecords.push({ ...updated[0], clientEventId: item.clientEventId });
            continue;
          } else {
            syncedRecords.push({ ...current, clientEventId: item.clientEventId });
            continue;
          }
        }
      }

      // Fresh insert
      const created = await createAttendance(userUid, item);
      syncedRecords.push({ ...created, clientEventId: item.clientEventId });
    } catch (itemErr) {
      console.error('Error syncing individual attendance item:', itemErr);
    }
  }

  return syncedRecords;
}

export async function deleteAttendance(userUid: string, id: number) {
  try {
    await db
      .delete(attendance)
      .where(and(eq(attendance.id, id), eq(attendance.userUid, userUid)));
    return true;
  } catch (error) {
    console.error('Error in deleteAttendance:', error);
    throw new Error('Failed to delete attendance record.', { cause: error });
  }
}

