import { writable } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { accounts, categories, transactions } from './store';

/** `undefined` until the stored session has been read. */
export const session = writable<Session | null | undefined>(undefined);

supabase.auth.getSession().then(({ data }) => session.set(data.session));
supabase.auth.onAuthStateChange((_event, next) => session.set(next));

/** Invite and password-reset links land with `type=invite|recovery` in the hash; read it before supabase-js strips it. */
const hashType = typeof location === 'undefined' ? null : new URLSearchParams(location.hash.slice(1)).get('type');
export const needsPassword = writable(hashType === 'invite' || hashType === 'recovery');

export async function signIn(email: string, password: string): Promise<void> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) throw new Error('Email atau kata sandi salah.');
}

export async function signOut(): Promise<void> {
  await supabase.auth.signOut();
  accounts.set([]);
  categories.set([]);
  transactions.set([]);
}

export async function resetPassword(email: string): Promise<void> {
  const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: location.origin });
  if (error) throw new Error('Gagal mengirim tautan. Coba lagi sebentar lagi.');
}

export async function setPassword(password: string): Promise<void> {
  const { error } = await supabase.auth.updateUser({ password });
  if (error) throw new Error(error.message);
  needsPassword.set(false);
}
