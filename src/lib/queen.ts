import { get, writable } from 'svelte/store';
import { supabase } from './supabase';
import { loadInitialData } from './store';

/** Set when the signed-in user is a spouse viewing someone else's wallet (read-only). */
export const viewer = writable<{ ownerId: string; ownerEmail: string } | null>(null);
/** Email the owner shared with; '' when none. */
export const queenEmail = writable('');

/** A wallet shared with this user; they may switch to it but are never forced into it. */
export const available = writable<{ ownerId: string; ownerEmail: string } | null>(null);

/** Decide owner vs spouse for this login, then load the right data. */
export async function bootstrap(userId: string, email: string): Promise<void> {
  const { data } = await supabase.from('shares').select('owner_id, owner_email').ilike('spouse_email', email).neq('owner_id', userId).limit(1);
  const share = data?.[0] ? { ownerId: data[0].owner_id as string, ownerEmail: data[0].owner_email as string } : null;
  available.set(share);
  const own = await supabase.from('shares').select('spouse_email').eq('owner_id', userId).maybeSingle();
  queenEmail.set(own.data?.spouse_email ?? '');
  // default to the shared wallet only for users with no wallet of their own
  const mine = await supabase.from('accounts').select('id').eq('user_id', userId).limit(1);
  if (share && !mine.data?.length) await switchWallet(true);
  else await switchWallet(false);
}

/** `shared` = read-only view of the owner's wallet; otherwise the user's own. */
export async function switchWallet(shared: boolean): Promise<void> {
  const share = shared ? get(available) : null;
  viewer.set(share);
  await loadInitialData(share?.ownerId);
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
