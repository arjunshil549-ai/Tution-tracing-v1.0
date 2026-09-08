import { db } from './index.ts';
import { users, tuitions, attendance } from './schema.ts';
import { eq } from 'drizzle-orm';

export async function getOrCreateUser(uid: string, email: string, name?: string, phone?: string, institution?: string) {
  try {
    const result = await db
      .insert(users)
      .values({
        uid,
        email,
        name: name || null,
        phone: phone || null,
        institution: institution || null,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: {
          email,
          ...(name ? { name } : {}),
          ...(phone ? { phone } : {}),
          ...(institution ? { institution } : {}),
        },
      })
      .returning();

    return result[0];
  } catch (error) {
    console.error('Error in getOrCreateUser:', error);
    throw new Error('Failed to synchronize user profile with database.', { cause: error });
  }
}

export async function getUserByUid(uid: string) {
  try {
    const rows = await db.select().from(users).where(eq(users.uid, uid)).limit(1);
    return rows[0] || null;
  } catch (error) {
    console.error('Error fetching user:', error);
    throw new Error('Failed to retrieve user record.', { cause: error });
  }
}

export async function getAllUsers() {
  try {
    const rows = await db.select().from(users);
    return rows;
  } catch (error) {
    console.error('Error fetching all users from Cloud SQL:', error);
    return [];
  }
}

export async function deleteUserByUid(uid: string) {
  try {
    // Delete associated attendance first
    await db.delete(attendance).where(eq(attendance.userUid, uid));
    // Delete associated tuitions
    await db.delete(tuitions).where(eq(tuitions.userUid, uid));
    // Delete user record
    await db.delete(users).where(eq(users.uid, uid));
    return true;
  } catch (error) {
    console.error('Error deleting user by uid:', error);
    throw new Error('Failed to delete user record.', { cause: error });
  }
}
