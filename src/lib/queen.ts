import { writable } from 'svelte/store';
import { supabase } from './supabase';
import { loadInitialData } from './store';

/** Set when the signed-in user is a spouse viewing someone else's wallet (read-only). */
export const viewer = writable<{ ownerId: string; ownerEmail: string } | null>(null);
/** Email the owner shared with; '' when none. */
export const queenEmail = writable('');

/** Decide owner vs spouse for this login, then load the right data. */
export async function bootstrap(userId: string, email: string): Promise<void> {
  const { data } = await supabase.from('shares').select('owner_id, owner_email').ilike('spouse_email', email).neq('owner_id', userId).limit(1);
  const share = data?.[0];
  viewer.set(share ? { ownerId: share.owner_id, ownerEmail: share.owner_email } : null);
  if (!share) {
    const own = await supabase.from('shares').select('spouse_email').eq('owner_id', userId).maybeSingle();
    queenEmail.set(own.data?.spouse_email ?? '');
  }
  await loadInitialData(share?.owner_id);
}

export async function saveQueen(userId: string, email: string): Promise<void> {
  const value = email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) throw new Error('Format email tidak valid.');
  const { error } = await supabase.from('shares').upsert({ owner_id: userId, spouse_email: value }, { onConflict: 'owner_id' });
  if (error) throw new Error('Gagal menyimpan.');
  queenEmail.set(value);
}

export async function removeQueen(userId: string): Promise<void> {
  const { error } = await supabase.from('shares').delete().eq('owner_id', userId);
  if (error) throw new Error('Gagal mencabut akses.');
  queenEmail.set('');
}
