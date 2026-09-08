import { Tuition, Attendance, UserProfile } from '../types';

export async function syncUserWithCloudSql(idToken: string, profile: { name?: string; phone?: string; institution?: string; email?: string }) {
  try {
    const res = await fetch('/api/users/sync', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(profile),
    });
    if (!res.ok) throw new Error('Failed to sync user');
    return await res.json();
  } catch (err) {
    console.warn('Cloud SQL user sync error (offline fallback active):', err);
    return null;
  }
}

export async function fetchTuitionsFromCloudSql(idToken: string): Promise<Tuition[] | null> {
  try {
    const res = await fetch('/api/tuitions', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Cloud SQL fetch tuitions error:', err);
    return null;
  }
}

export async function saveTuitionToCloudSql(
  idToken: string,
  data: Omit<Tuition, 'id' | 'createdAt'>,
  id?: number
): Promise<Tuition | null> {
  try {
    const url = id ? `/api/tuitions/${id}` : '/api/tuitions';
    const method = id ? 'PUT' : 'POST';
    const res = await fetch(url, {
      method,
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error('Failed to persist tuition to Cloud SQL');
    return await res.json();
  } catch (err) {
    console.warn('Cloud SQL save tuition error:', err);
    return null;
  }
}

export async function deleteTuitionFromCloudSql(idToken: string, id: number): Promise<boolean> {
  try {
    const res = await fetch(`/api/tuitions/${id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    return res.ok;
  } catch (err) {
    console.warn('Cloud SQL delete tuition error:', err);
    return false;
  }
}

export async function fetchAttendanceFromCloudSql(idToken: string): Promise<Attendance[] | null> {
  try {
    const res = await fetch('/api/attendance', {
      headers: {
        Authorization: `Bearer ${idToken}`,
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn('Cloud SQL fetch attendance error:', err);
    return null;
  }
}

export async function recordAttendanceInCloudSql(
  idToken: string,
  log: Omit<Attendance, 'id' | 'createdAt'>
): Promise<Attendance | null> {
  try {
    const res = await fetch('/api/attendance', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(log),
    });
    if (!res.ok) throw new Error('Failed to save attendance in Cloud SQL');
    return await res.json();
  } catch (err) {
    console.warn('Cloud SQL attendance log error:', err);
    return null;
  }
}
