import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          name: string;
          phone: string;
          is_admin: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          phone: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          phone?: string;
          is_admin?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      packages: {
        Row: {
          id: string;
          title: string;
          description: string;
          destination: string;
          price_per_head: number;
          advance_payment: number;
          duration_days: number;
          start_date: string;
          end_date: string;
          max_capacity: number;
          image_url: string | null;
          is_active: boolean;
          inclusions: any;
          itinerary: any;
          facilities: any;
          gallery_images: any;
          contact_info: any;
          created_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description: string;
          destination: string;
          price_per_head: number;
          advance_payment: number;
          duration_days: number;
          start_date: string;
          end_date: string;
          max_capacity: number;
          image_url?: string | null;
          is_active?: boolean;
          inclusions?: any;
          itinerary?: any;
          facilities?: any;
          gallery_images?: any;
          contact_info?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          destination?: string;
          price_per_head?: number;
          advance_payment?: number;
          duration_days?: number;
          start_date?: string;
          end_date?: string;
          max_capacity?: number;
          image_url?: string | null;
          is_active?: boolean;
          inclusions?: any;
          itinerary?: any;
          facilities?: any;
          gallery_images?: any;
          contact_info?: any;
          created_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      bookings: {
        Row: {
          id: string;
          user_id: string;
          package_id: string;
          number_of_people: number;
          user_name: string;
          user_phone: string;
          total_amount: number;
          advance_paid: number;
          remaining_amount: number;
          payment_proof_url: string | null;
          payment_proof_type: string;
          notes: string;
          status: string;
          group_name: string | null;
          travelers: any;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          package_id: string;
          number_of_people: number;
          user_name: string;
          user_phone: string;
          total_amount: number;
          advance_paid: number;
          remaining_amount: number;
          payment_proof_url?: string | null;
          payment_proof_type?: string;
          notes?: string;
          status?: string;
          group_name?: string | null;
          travelers?: any;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          package_id?: string;
          number_of_people?: number;
          user_name?: string;
          user_phone?: string;
          total_amount?: number;
          advance_paid?: number;
          remaining_amount?: number;
          payment_proof_url?: string | null;
          payment_proof_type?: string;
          notes?: string;
          status?: string;
          group_name?: string | null;
          travelers?: any;
          created_at?: string;
          updated_at?: string;
        };
      };
      payments: {
        Row: {
          id: string;
          booking_id: string;
          user_id: string;
          amount: number;
          payment_proof_url: string | null;
          payment_status: 'pending' | 'verified' | 'rejected';
          payment_method: string;
          admin_notes: string;
          verified_at: string | null;
          verified_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          booking_id: string;
          user_id: string;
          amount: number;
          payment_proof_url?: string | null;
          payment_status?: 'pending' | 'verified' | 'rejected';
          payment_method?: string;
          admin_notes?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          booking_id?: string;
          user_id?: string;
          amount?: number;
          payment_proof_url?: string | null;
          payment_status?: 'pending' | 'verified' | 'rejected';
          payment_method?: string;
          admin_notes?: string;
          verified_at?: string | null;
          verified_by?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      package_dates: {
        Row: {
          id: string;
          package_id: string;
          available_date: string;
          max_bookings: number;
          current_bookings: number;
          is_available: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          package_id: string;
          available_date: string;
          max_bookings: number;
          current_bookings?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          package_id?: string;
          available_date?: string;
          max_bookings?: number;
          current_bookings?: number;
          is_available?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
  };
};

export type Package = Database['public']['Tables']['packages']['Row'];
export type PackageInsert = Database['public']['Tables']['packages']['Insert'];
export type PackageUpdate = Database['public']['Tables']['packages']['Update'];
export type PackageDate = Database['public']['Tables']['package_dates']['Row'];
export type Booking = Database['public']['Tables']['bookings']['Row'];
