import { writable } from 'svelte/store';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';
import { accounts, categories, transactions } from './store';

/** `undefined` until the stored session has been read. */
export const session = writable<Session | null | undefined>(undefined);

supabase.auth.getSession().then(({ data }) => session.set(data.session));
supabase.auth.onAuthStateChange((_event, next) => session.set(next));

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
