import { Member } from './supabase';

const ADMIN_WHATSAPP = '918129464465';

export const sendBookingToWhatsApp = (
  packageTitle: string,
  name: string,
  phone: string,
  members: Member[],
  bookingDate: string,
  totalPrice: number
) => {
  const membersText = members
    .map((m, i) => `${i + 1}. ${m.name} (Age: ${m.age})`)
    .join('%0A');

  const message = `*New Booking Request*%0A%0A` +
    `📦 Package: ${packageTitle}%0A` +
    `👤 Name: ${name}%0A` +
    `📱 Phone: ${phone}%0A` +
    `📅 Booking Date: ${bookingDate}%0A` +
    `👥 Number of Members: ${members.length}%0A%0A` +
    `*Member Details:*%0A${membersText}%0A%0A` +
    `💰 Total Price: ₹${totalPrice}%0A%0A` +
    `Please confirm this booking.`;

  const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;
  window.open(url, '_blank');
};

export const sendConfirmationToUser = (
  phone: string,
  packageTitle: string,
  bookingDate: string
) => {
  const cleanPhone = phone.replace(/\D/g, '');
  const message = `*Booking Confirmed!*%0A%0A` +
    `Your booking for ${packageTitle} on ${bookingDate} has been confirmed.%0A%0A` +
    `Thank you for choosing us! 🎉%0A%0A` +
    `For any queries:%0A` +
    `📞 +91 7592049934%0A` +
    `📞 +91 9495919934`;

  const url = `https://wa.me/91${cleanPhone}?text=${message}`;
  window.open(url, '_blank');
};
