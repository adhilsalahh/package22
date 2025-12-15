import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "../lib/supabase";
import { Profile } from "../types";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (identifier: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, fullName: string, phone: string) => Promise<void>;
  signOut: () => Promise<void>;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Load Profile
  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (!error && data) setProfile(data);
  };

  // Load Session
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchProfile(session.user.id);
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
        if (session?.user) fetchProfile(session.user.id);
        else setProfile(null);
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // LOGIN
  const signIn = async (identifier: string, password: string) => {
    let email = identifier;

    // If identifier doesn't look like an email, try to find the email via RPC
    if (!identifier.includes('@')) {
      const { data, error } = await supabase.rpc('get_email_by_identifier', {
        identifier_input: identifier
      });

      if (error) {
        console.error("User lookup failed:", error);
        throw new Error("Failed to verify user details. Please use email.");
      }

      if (!data) {
        throw new Error("No account found with this Name/Phone.");
      }

      email = data as string;
    }

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  // SIGNUP (RLS SAFE — Insert Allowed)
  const signUp = async (email: string, password: string, fullName: string, phone: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName },
      },
    });

    if (error) throw error;

    const newUser = data.user;
    if (!newUser) return;

    const { error: profileError } = await supabase.from("profiles").upsert({
      id: newUser.id,
      email: email,
      full_name: fullName,
      phone: phone,
      is_admin: false,
    });

    if (profileError) {
      throw new Error(`Failed to create profile: ${profileError.message}`);
    }
  };

  // LOGOUT — FIXED (No AuthSessionMissingError)
  const signOut = async () => {
    const { error } = await supabase.auth.signOut({ scope: "local" });
    if (error) console.warn("Logout warning:", error.message);
    setUser(null);
    setProfile(null);
  };

  const isAdmin = profile?.is_admin ?? false;

  return (
    <AuthContext.Provider
      value={{ user, profile, loading, signIn, signUp, signOut, isAdmin }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};

