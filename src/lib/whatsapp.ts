
const ADMIN_WHATSAPP = '918129464465';

interface TravelerInfo {
  name: string;
  phone: string;
  paidAdvance: boolean;
}

export const sendBookingToWhatsApp = (
  packageTitle: string,
  destination: string,
  contactName: string,
  contactPhone: string,
  travelers: TravelerInfo[],
  travelDate: string,
  numberOfPeople: number,
  totalAmount: number,
  advancePayment: number,
  remainingAmount: number,
  groupName?: string
) => {
  const paidTravelers = travelers.filter(t => t.paidAdvance);
  const unpaidTravelers = travelers.filter(t => !t.paidAdvance);

  const paidTravelersText = paidTravelers.length > 0
    ? paidTravelers.map((t, i) => `${i + 1}. ${t.name} - ${t.phone}`).join('%0A')
    : 'None';

  const unpaidTravelersText = unpaidTravelers.length > 0
    ? unpaidTravelers.map((t, i) => `${i + 1}. ${t.name} - ${t.phone}`).join('%0A')
    : 'None';

  const message = `*🌟 New Booking Request! 🌟*%0A%0A` +
    `*📍 Package:* ${packageTitle}%0A` +
    `*🗺 Destination:* ${destination}%0A` +
    `*📅 Date:* ${travelDate}%0A` +
    `*👤 Contact:* ${contactName} (${contactPhone})%0A` +
    (groupName ? `*👥 Group:* ${groupName}%0A` : '') +
    `*🔢 Total People:* ${numberOfPeople}%0A%0A` +
    `*💰 Payment Details:*%0A` +
    `Total Amount: ₹${totalAmount.toLocaleString()}%0A` +
    `Advance Required: ₹${advancePayment.toLocaleString()}%0A` +
    `Remaining Balance: ₹${remainingAmount.toLocaleString()}%0A%0A` +
    `*✅ Paid Advance (${paidTravelers.length}/${numberOfPeople}):*%0A${paidTravelersText}%0A%0A` +
    `*⏳ Pending Advance (${unpaidTravelers.length}/${numberOfPeople}):*%0A${unpaidTravelersText}%0A%0A` +
    `Please confirm this booking! 🙏`;

  const url = `https://wa.me/${ADMIN_WHATSAPP}?text=${message}`;
  window.open(url, '_blank');
};

export const sendDetailedBookingToWhatsApp = (
  packageTitle: string,
  contactName: string,
  contactPhone: string,
  bookingDate: string,
  totalAmount: number,
  demographics: {
    adultMales: number;
    adultFemales: number;
    couples: number;
    childUnder5: number;
    child5to8: number;
  },
  paymentScreenshotUrl?: string
) => {
  const { adultMales, adultFemales, couples, childUnder5, child5to8 } = demographics;
  const totalPeople = adultMales + adultFemales + (couples * 2) + childUnder5 + child5to8;

  let demographicsText = '';
  if (adultMales > 0) demographicsText += `Adult Males: ${adultMales}%0A`;
  if (adultFemales > 0) demographicsText += `Adult Females: ${adultFemales}%0A`;
  if (couples > 0) demographicsText += `Couples: ${couples} (${couples * 2} people)%0A`;
  if (child5to8 > 0) demographicsText += `Children (5-8 yrs): ${child5to8}%0A`;
  if (childUnder5 > 0) demographicsText += `Children (<5 yrs): ${childUnder5}%0A`;

  const message = `*🌟 New Booking Request! 🌟*%0A%0A` +
    `*📍 Package:* ${packageTitle}%0A` +
    `*📅 Date:* ${bookingDate}%0A` +
    `*👤 Contact:* ${contactName} (${contactPhone})%0A` +
    `*🔢 Total People:* ${totalPeople}%0A` +
    `*👥 Group Details:*%0A${demographicsText}%0A` +
    `*💰 Total Amount:* ₹${totalAmount.toLocaleString()}%0A` +
    (paymentScreenshotUrl ? `*📸 Payment Screenshot:* ${paymentScreenshotUrl}%0A` : '') +
    `%0APlease confirm this booking! 🙏`;

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
