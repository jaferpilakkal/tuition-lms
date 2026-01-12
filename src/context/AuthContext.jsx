import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Fetch user profile from profiles table
    const fetchProfile = async (userId) => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (error) {
                console.error('[Auth] Error fetching profile:', error);
                return null;
            }

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
            try {
                const { data: { session } } = await supabase.auth.getSession();

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
                    setLoading(false);
                }
            }
        };

        initializeAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
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
        setLoading(true);

        try {
            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            if (error) {
                console.error('[Auth] Supabase auth error:', error);
                throw error;
            }

            if (data.user) {
                setUser(data.user);

                const userProfile = await fetchProfile(data.user.id);

                if (!userProfile) {
                    console.error('[Auth] Profile not found!');
                    throw new Error('User profile not found. Please contact admin.');
                }

                if (!userProfile.is_active) {
                    console.error('[Auth] User is deactivated');
                    await supabase.auth.signOut();
                    throw new Error('Your account has been deactivated. Please contact admin.');
                }

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
        try {
            const { error } = await supabase.auth.signOut();
            if (error) throw error;

            setUser(null);
            setProfile(null);
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
