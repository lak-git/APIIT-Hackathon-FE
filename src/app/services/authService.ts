import { supabase } from "../../supabaseClient";
import type { AuthResponse, User } from "@supabase/supabase-js";

interface AuthCredentials {
    email: string;
    password: string;
}

export interface SignupData extends AuthCredentials {
    fullName: string;
    phone: string;
    designation: string;
    region: string;
}

export async function signup(data: SignupData): Promise<AuthResponse['data']> {
    const { email, password, fullName, phone, designation, region } = data;

    // 1. Create auth user
    const { data: authData, error: authError } = await supabase.auth.signUp({ email, password });
    if (authError) throw authError;

    // 2. If user was created, populate the profile
    // A DB trigger may auto-create a blank profile, so we need to update it
    if (authData.user) {
        const profileData = {
            full_name: fullName,
            phone: phone,
            designation: designation,
            region: region,
            is_admin: false,
            verification_status: 'pending',
        };

        console.log('[Signup] Attempting to save profile for user:', authData.user.id);
        console.log('[Signup] Profile data:', profileData);

        // Wait a moment for DB trigger to complete
        await new Promise(resolve => setTimeout(resolve, 500));

        // Try update first (assumes trigger created blank profile)
        const { data: updateData, error: updateError } = await supabase
            .from('user_profiles')
            .update(profileData)
            .eq('id', authData.user.id)
            .select();

        console.log('[Signup] Update result:', { updateData, updateError });

        if (updateError) {
            console.error('[Signup] Update failed:', updateError);
            // Try insert as fallback
            const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({ id: authData.user.id, ...profileData });

            if (insertError) {
                console.error('[Signup] Insert also failed:', insertError);
                throw new Error(`Account created but profile setup failed: ${insertError.message}. Please contact support.`);
            }
        } else if (!updateData || updateData.length === 0) {
            console.log('[Signup] Update returned no rows, trying insert');
            // Update didn't affect any rows, try insert
            const { error: insertError } = await supabase
                .from('user_profiles')
                .insert({ id: authData.user.id, ...profileData });

            if (insertError && insertError.code !== '23505') {
                console.error('[Signup] Insert failed:', insertError);
                throw new Error(`Account created but profile setup failed: ${insertError.message}. Please contact support.`);
            }
        }

        // 3. Sign out the user - they can't use the app until approved
        // Supabase auto-logs in after signup, but we want them to wait for approval
        await supabase.auth.signOut();
        console.log('[Signup] Signed out user after registration - pending approval');
    }

    return authData;
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

export async function getUserProfile(userId: string): Promise<{ is_admin: boolean; verification_status: string } | null> {
    const { data, error } = await supabase
        .from('user_profiles')
        .select('is_admin, verification_status')
        .eq('id', userId)
        .single();

    if (error) {
        console.error('Error fetching user profile:', error);
        return null;
    }
    return data;
}
