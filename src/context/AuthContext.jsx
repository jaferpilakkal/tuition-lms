import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from profiles table - simplified version
    const fetchProfile = async (userId) => {
        console.log('[Auth] Fetching profile for user:', userId);

        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            console.log('[Auth] Profile query complete. Data:', data, 'Error:', error);

            if (error) {
                console.error('[Auth] Error fetching profile:', error);
                return null;
            }

            console.log('[Auth] Profile fetched successfully:', data);
            return data;
        } catch (error) {
            console.error('[Auth] Exception fetching profile:', error);
            return null;
        }
    };

    useEffect(() => {
        let isMounted = true;

        // Get initial session
        const initializeAuth = async () => {
            console.log('[Auth] Initializing auth...');
            try {
                const { data: { session } } = await supabase.auth.getSession();
                console.log('[Auth] Session check complete:', session ? 'exists' : 'none');

                if (session?.user && isMounted) {
                    setUser(session.user);
                    const userProfile = await fetchProfile(session.user.id);
                    if (isMounted) {
                        setProfile(userProfile);
                    }
                }
            } catch (error) {
                console.error('[Auth] Auth initialization error:', error);
            } finally {
                if (isMounted) {
                    console.log('[Auth] Setting loading to false');
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log('[Auth] Auth state changed:', event);

                if (!isMounted) return;

                if (event === 'SIGNED_IN' && session?.user) {
                    setUser(session.user);
                    // Don't fetch profile here - let login() handle it
                } else if (event === 'SIGNED_OUT') {
                    setUser(null);
                    setProfile(null);
                }
            }
        );

        return () => {
            isMounted = false;
            subscription?.unsubscribe();
        };
    }, []);

    // Login function with better error handling
    const login = async (email, password) => {
        console.log('[Auth] Login attempt for:', email);
        setLoading(true);

        try {
            console.log('[Auth] Calling Supabase signInWithPassword...');
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Auth] Supabase auth error:', error);
                throw error;
            }

            console.log('[Auth] Supabase auth successful, user:', data.user?.id);

            if (data.user) {
                setUser(data.user);
                console.log('[Auth] Now fetching profile...');

                const userProfile = await fetchProfile(data.user.id);
                console.log('[Auth] Profile result:', userProfile);

                if (!userProfile) {
                    console.error('[Auth] Profile not found!');
                    throw new Error('User profile not found. Please contact admin.');
                }

                if (!userProfile.is_active) {
                    console.error('[Auth] User is deactivated');
                    await supabase.auth.signOut();
                    throw new Error('Your account has been deactivated. Please contact admin.');
                }

                console.log('[Auth] Login complete, role:', userProfile.role);
                setProfile(userProfile);
                setLoading(false);
                return { user: data.user, profile: userProfile };
            }
        } catch (error) {
            console.error('[Auth] Login error:', error);
            setLoading(false);
            throw error;
        }
    };

    // Logout function
    const logout = async () => {
        console.log('[Auth] Logging out...');
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            setProfile(null);
            console.log('[Auth] Logged out successfully');
        } catch (error) {
            console.error('[Auth] Logout error:', error);
            throw error;
        }
    };

    const value = {
        user,
        profile,
        loading,
        login,
        logout,
        isAuthenticated: !!user && !!profile,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

export default AuthContext;
