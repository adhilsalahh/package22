// bookingService.ts
import { supabase } from '../lib/supabase';

export interface BookingMember {
  member_name: string;
  member_phone: string;
}

export interface CreateBookingData {
  user_id: string;
  package_id: string;
  booking_date: string;
  travel_group_name: string;
  number_of_members: number;
  total_price: number;
  advance_paid: number;
  status: string;
  members: BookingMember[];
}

export const bookingService = {
  // Create a new booking with members
  createBooking: async (bookingData: CreateBookingData) => {
    // Insert main booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.user_id,
        package_id: bookingData.package_id,
        booking_date: bookingData.booking_date,
        travel_group_name: bookingData.travel_group_name,
        number_of_members: bookingData.number_of_members,
        total_price: bookingData.total_price,
        advance_paid: bookingData.advance_paid, // must be number
        advance_amount: bookingData.advance_paid, // if you track separately
        status: bookingData.status,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert booking members
    const membersToInsert = bookingData.members.map((m) => ({
      booking_id: booking.id,
      member_name: m.member_name,
      member_phone: m.member_phone,
    }));

    const { error: membersError } = await supabase
      .from('booking_members')
      .insert(membersToInsert);

    if (membersError) throw membersError;

    return booking;
  },

  // Fetch all bookings for a user with nested package and members
  getUserBookings: async (userId: string) => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        package:packages(
          id,
          title,
          price_per_head,
          image_url,
          advance_payment
        ),
        members:booking_members(
          id,
          member_name,
          member_phone
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Ensure safe access in case package or members are null
    return (data || []).map((b) => ({
      ...b,
      advance_paid: b.advance_paid ?? 0,
      total_price: b.total_price ?? 0,
      package: b.package ?? { title: 'Unknown', image_url: '', price_per_head: 0 },
      members: b.members ?? [],
    }));
  },
};
