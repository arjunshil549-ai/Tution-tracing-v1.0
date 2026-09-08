import { db } from './index.ts';
import { tuitions } from './schema.ts';
import { eq, and } from 'drizzle-orm';

export interface TuitionDbInput {
  name: string;
  studentName?: string;
  address: string;
  latitude: number;
  longitude: number;
  radius?: number;
  expectedStart: string;
  expectedEnd: string;
  fee?: number;
  expectedClassesPerMonth?: number;
  scheduledDays?: number[];
  minimumStayMinutes?: number;
  active?: boolean;
}

export async function getTuitionsByUser(userUid: string) {
  try {
    const list = await db
      .select()
      .from(tuitions)
      .where(eq(tuitions.userUid, userUid));

    return list.map((t) => ({
      id: t.id,
      name: t.name,
      studentName: t.studentName || undefined,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      radius: t.radius,
      radiusMeters: t.radius,
      expectedStart: t.expectedStart,
      expectedEnd: t.expectedEnd,
      fee: t.fee,
      expectedClassesPerMonth: t.expectedClassesPerMonth,
      scheduledDays: JSON.parse(t.scheduledDays || '[]') as number[],
      minimumStayMinutes: t.minimumStayMinutes,
      active: t.active,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getTuitionsByUser:', error);
    throw new Error('Database query failed for tuitions.', { cause: error });
  }
}

export async function getActiveTuitionsByUser(userUid: string) {
  try {
    const list = await db
      .select()
      .from(tuitions)
      .where(and(eq(tuitions.userUid, userUid), eq(tuitions.active, true)));

    return list.map((t) => ({
      id: t.id,
      name: t.name,
      studentName: t.studentName || undefined,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      radius: t.radius,
      radiusMeters: t.radius,
      expectedStart: t.expectedStart,
      expectedEnd: t.expectedEnd,
      fee: t.fee,
      expectedClassesPerMonth: t.expectedClassesPerMonth,
      scheduledDays: JSON.parse(t.scheduledDays || '[]') as number[],
      minimumStayMinutes: t.minimumStayMinutes,
      active: t.active,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
      updatedAt: t.updatedAt ? t.updatedAt.toISOString() : new Date().toISOString(),
    }));
  } catch (error) {
    console.error('Error in getActiveTuitionsByUser:', error);
    throw new Error('Database query failed for active tuitions.', { cause: error });
  }
}


export async function createTuition(userUid: string, data: TuitionDbInput) {
  try {
    const result = await db
      .insert(tuitions)
      .values({
        userUid,
        name: data.name,
        studentName: data.studentName || null,
        address: data.address,
        latitude: data.latitude,
        longitude: data.longitude,
        radius: data.radius ?? 100,
        expectedStart: data.expectedStart,
        expectedEnd: data.expectedEnd,
        fee: data.fee ?? 0,
        expectedClassesPerMonth: data.expectedClassesPerMonth ?? 10,
        scheduledDays: JSON.stringify(data.scheduledDays ?? []),
        minimumStayMinutes: data.minimumStayMinutes ?? 30,
        active: data.active ?? true,
      })
      .returning();

    const t = result[0];
    return {
      id: t.id,
      name: t.name,
      studentName: t.studentName || undefined,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      radius: t.radius,
      expectedStart: t.expectedStart,
      expectedEnd: t.expectedEnd,
      fee: t.fee,
      expectedClassesPerMonth: t.expectedClassesPerMonth,
      scheduledDays: JSON.parse(t.scheduledDays || '[]') as number[],
      minimumStayMinutes: t.minimumStayMinutes,
      active: t.active,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in createTuition:', error);
    throw new Error('Failed to create tuition in database.', { cause: error });
  }
}

export async function updateTuition(userUid: string, id: number, data: Partial<TuitionDbInput>) {
  try {
    const updateValues: Record<string, any> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.studentName !== undefined) updateValues.studentName = data.studentName;
    if (data.address !== undefined) updateValues.address = data.address;
    if (data.latitude !== undefined) updateValues.latitude = data.latitude;
    if (data.longitude !== undefined) updateValues.longitude = data.longitude;
    if (data.radius !== undefined) updateValues.radius = data.radius;
    if (data.expectedStart !== undefined) updateValues.expectedStart = data.expectedStart;
    if (data.expectedEnd !== undefined) updateValues.expectedEnd = data.expectedEnd;
    if (data.fee !== undefined) updateValues.fee = data.fee;
    if (data.expectedClassesPerMonth !== undefined) updateValues.expectedClassesPerMonth = data.expectedClassesPerMonth;
    if (data.scheduledDays !== undefined) updateValues.scheduledDays = JSON.stringify(data.scheduledDays);
    if (data.minimumStayMinutes !== undefined) updateValues.minimumStayMinutes = data.minimumStayMinutes;
    if (data.active !== undefined) updateValues.active = data.active;

    const result = await db
      .update(tuitions)
      .set(updateValues)
      .where(and(eq(tuitions.id, id), eq(tuitions.userUid, userUid)))
      .returning();

    if (!result.length) return null;
    const t = result[0];
    return {
      id: t.id,
      name: t.name,
      studentName: t.studentName || undefined,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      radius: t.radius,
      expectedStart: t.expectedStart,
      expectedEnd: t.expectedEnd,
      fee: t.fee,
      expectedClassesPerMonth: t.expectedClassesPerMonth,
      scheduledDays: JSON.parse(t.scheduledDays || '[]') as number[],
      minimumStayMinutes: t.minimumStayMinutes,
      active: t.active,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in updateTuition:', error);
    throw new Error('Failed to update tuition.', { cause: error });
  }
}

export async function deleteTuition(userUid: string, id: number) {
  try {
    await db
      .delete(tuitions)
      .where(and(eq(tuitions.id, id), eq(tuitions.userUid, userUid)));
    return true;
  } catch (error) {
    console.error('Error in deleteTuition:', error);
    throw new Error('Failed to delete tuition.', { cause: error });
  }
}

export async function updateTuitionAsAdmin(id: number, data: Partial<TuitionDbInput>) {
  try {
    const updateValues: Record<string, any> = {};
    if (data.name !== undefined) updateValues.name = data.name;
    if (data.studentName !== undefined) updateValues.studentName = data.studentName;
    if (data.address !== undefined) updateValues.address = data.address;
    if (data.latitude !== undefined) updateValues.latitude = data.latitude;
    if (data.longitude !== undefined) updateValues.longitude = data.longitude;
    if (data.radius !== undefined) updateValues.radius = data.radius;
    if (data.expectedStart !== undefined) updateValues.expectedStart = data.expectedStart;
    if (data.expectedEnd !== undefined) updateValues.expectedEnd = data.expectedEnd;
    if (data.fee !== undefined) updateValues.fee = data.fee;
    if (data.expectedClassesPerMonth !== undefined) updateValues.expectedClassesPerMonth = data.expectedClassesPerMonth;
    if (data.scheduledDays !== undefined) updateValues.scheduledDays = JSON.stringify(data.scheduledDays);
    if (data.minimumStayMinutes !== undefined) updateValues.minimumStayMinutes = data.minimumStayMinutes;
    if (data.active !== undefined) updateValues.active = data.active;

    const result = await db
      .update(tuitions)
      .set(updateValues)
      .where(eq(tuitions.id, id))
      .returning();

    if (!result.length) return null;
    const t = result[0];
    return {
      id: t.id,
      name: t.name,
      studentName: t.studentName || undefined,
      address: t.address,
      latitude: t.latitude,
      longitude: t.longitude,
      radius: t.radius,
      expectedStart: t.expectedStart,
      expectedEnd: t.expectedEnd,
      fee: t.fee,
      expectedClassesPerMonth: t.expectedClassesPerMonth,
      scheduledDays: JSON.parse(t.scheduledDays || '[]') as number[],
      minimumStayMinutes: t.minimumStayMinutes,
      active: t.active,
      createdAt: t.createdAt ? t.createdAt.toISOString() : new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error in updateTuitionAsAdmin:', error);
    throw new Error('Failed to update tuition as admin.', { cause: error });
  }
}

export async function deleteTuitionAsAdmin(id: number) {
  try {
    await db.delete(tuitions).where(eq(tuitions.id, id));
    return true;
  } catch (error) {
    console.error('Error in deleteTuitionAsAdmin:', error);
    throw new Error('Failed to delete tuition as admin.', { cause: error });
  }
}

