import { createClient } from '@supabase/supabase-js';

export const SUPABASE_URL =
  (import.meta.env.VITE_SUPABASE_URL as string) || 'https://sehquxkqmnrjrutjozzk.supabase.co';

export const SUPABASE_ANON_KEY =
  (import.meta.env.VITE_SUPABASE_ANON_KEY as string) ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNlaHF1eGtxbW5yanJ1dGpvenprIiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTAyNzE4MjIsImV4cCI6MjEwNTg0NzgyMn0.sipqVglHxkfQOutORC0kS70VcQtoxHBbJeQb8C_vKNE';

export const isSupabaseConfigured = Boolean(
  SUPABASE_URL && SUPABASE_ANON_KEY && SUPABASE_ANON_KEY.length > 20
);

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

export interface SupabaseSignUpParams {
  email: string;
  password: string;
  name: string;
  college_url: string;
  course: string;
  branch: string;
  semester: number;
}

export const supabaseAuth = {
  async signUp({ email, password, name, college_url, course, branch, semester }: SupabaseSignUpParams) {
    return await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          college_url,
          course,
          branch,
          semester,
        },
      },
    });
  },

  async signIn(email: string, password: string) {
    return await supabase.auth.signInWithPassword({
      email,
      password,
    });
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getSession() {
    const { data } = await supabase.auth.getSession();
    return data.session;
  },

  async getUser() {
    const { data } = await supabase.auth.getUser();
    return data.user;
  },

  async updateUserProfile(updates: {
    name?: string;
    course?: string;
    branch?: string;
    semester?: number;
  }) {
    return await supabase.auth.updateUser({
      data: updates,
    });
  },
};
