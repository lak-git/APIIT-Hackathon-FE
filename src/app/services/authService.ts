import { supabase } from "../../supabaseClient";
import type { AuthResponse, User } from "@supabase/supabase-js";

interface AuthCredentials {
    email: string;
    password: string;
}

export async function signup({ email, password }: AuthCredentials): Promise<AuthResponse['data']> {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data;
}

export async function login({ email, password }: AuthCredentials): Promise<AuthResponse['data']> {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

export async function logout(): Promise<void> {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

export async function getCurrentUser(): Promise<User | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
}

export async function getUserProfile(userId: string): Promise<{ is_admin: boolean } | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
}
