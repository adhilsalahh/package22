// bookingService.ts
import { supabase } from '../lib/supabase';

export const bookingService = {
  createBooking: async (bookingData: {
    user_id: string;
    package_id: string;
    booking_date: string;
    travel_group_name: string;
    number_of_members: number;
    total_price: number;
    advance_paid: number;
    status: string;
    members: { member_name: string; member_phone: string }[];
  }) => {
    // Insert booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        user_id: bookingData.user_id,
        package_id: bookingData.package_id,
        booking_date: bookingData.booking_date,
        travel_group_name: bookingData.travel_group_name,
        number_of_members: bookingData.number_of_members,
        total_price: bookingData.total_price,
        advance_paid: bookingData.advance_paid,
        status: bookingData.status,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Insert members
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

  getUserBookings: async () => {
    const { data, error } = await supabase
      .from('bookings')
      .select(`
        *,
        package:packages(id, title, price_per_head, image_url),
        members:booking_members(id, member_name, member_phone)
      `)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },
};
