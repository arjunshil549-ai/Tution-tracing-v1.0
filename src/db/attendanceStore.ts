import { db } from './index.ts';
import { attendance } from './schema.ts';
import { eq, and, desc } from 'drizzle-orm';

export interface AttendanceDbInput {
  tuitionId?: number;
  date: string;
  arrivalTime: string;
  departureTime?: string;
  duration?: number;
  status?: string;
  notes?: string;
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
      status: (a.status as 'completed' | 'in_progress' | 'ignored') || 'completed',
      notes: a.notes || undefined,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getAttendanceByUser:', error);
    throw new Error('Database query failed for attendance.', { cause: error });
  }
}

export async function createAttendance(userUid: string, data: AttendanceDbInput) {
  try {
    const result = await db
      .insert(attendance)
      .values({
        userUid,
        tuitionId: data.tuitionId || null,
        date: data.date,
        arrivalTime: data.arrivalTime,
        departureTime: data.departureTime || null,
        duration: data.duration ?? 0,
        status: data.status || 'completed',
        notes: data.notes || null,
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
      status: (a.status as 'completed' | 'in_progress' | 'ignored') || 'completed',
      notes: a.notes || undefined,
      createdAt: a.createdAt ? a.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in createAttendance:', error);
    throw new Error('Failed to record attendance in database.', { cause: error });
  }
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
