import React, { createContext, useContext, useState, useEffect } from 'react';
import { useToast } from "@/components/ui/use-toast";
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  signup: (name: string, email: string, password: string) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  connectWallet: (address: string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log("Auth state changed:", event, session);
        setUser(session?.user ?? null);
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      console.log("Initial session check:", session);
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Upsert user profile on login/signup
    const upsertProfile = async () => {
      try {
        await supabase.from('profiles').upsert({
          id: user.id,
          email: user.email
        });
      } catch (err) {
        console.error('Failed to upsert user profile:', err);
      }
    };

    upsertProfile();
  }, [user]);

  const login = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        throw error;
      }
      
      setUser(data.user);
      
      toast({
        title: "Successfully logged in",
        description: `Welcome back, ${data.user.email}!`,
      });
    } catch (error) {
      console.error("Login error:", error);
      toast({
        variant: "destructive",
        title: "Login failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  };

  const signup = async (name: string, email: string, password: string) => {
    try {
      // Sign up the user with Supabase
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name: name,
          },
        },
      });
      
      if (error) {
        throw error;
      }
      
      setUser(data.user);
      
      toast({
        title: "Account created",
        description: `Welcome, ${name}!`,
      });
    } catch (error) {
      console.error("Signup error:", error);
      toast({
        variant: "destructive",
        title: "Signup failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
      throw error;
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch (error) {
      console.error("Logout error:", error);
      toast({
        variant: "destructive",
        title: "Logout failed",
        description: error instanceof Error ? error.message : "An error occurred during logout",
      });
    }
  };

  const updateUser = (data: Partial<User>) => {
    if (user) {
      // In a real implementation with Supabase, you would update the user data
      // For now, we'll just update the local state
      setUser({ ...user, ...data });
    }
  };

  const connectWallet = (address: string) => {
    if (user) {
      // In a real implementation, you would update the user's metadata in Supabase
      toast({
        title: "Wallet connected",
        description: "Your Phantom wallet has been successfully connected.",
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        login,
        logout,
        signup,
        updateUser,
        connectWallet,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
