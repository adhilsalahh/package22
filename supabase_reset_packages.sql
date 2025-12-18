-- Reset Packages and Insert Correct Data
-- WARNING: This attempts to handle conflicts by updating. 
-- Ideally, we might want to clear old data, but preserving IDs is safer for existing bookings.

-- 1. Upsert Kolukumalai Package
INSERT INTO public.packages (
  id, title, description, destination, price_per_head, advance_payment, duration_days, max_capacity, image_url, gallery_images, inclusions, itinerary, facilities, contact_info, is_active, updated_at
) VALUES (
  '0f1c68d8-97ea-4dc7-be7a-0dd54f5e1687',
  'Kolukumalai Trekking & Camping Package (Home Stay)',
  'Experience the breathtaking sunrise at Kolukumalai, the world''s highest tea estate, combined with stunning sunset views at Anayirangal Dam. Stay in cozy home stays, enjoy trekking, campfire, music, unlimited food, and an unforgettable offroad jeep safari adventure.',
  'Kolukumalai, Munnar',
  2600.00,
  1000.00,
  2,
  50,
  'https://www.vaorutrippadikkam.com/kolukumalai7.jpg',
  '["https://www.vaorutrippadikkam.com/kolukumalai9.jpg", "https://www.vaorutrippadikkam.com/kolukumalai2.jpg", "https://www.vaorutrippadikkam.com/IMG_9005.JPG", "https://www.vaorutrippadikkam.com/IMG_9007.JPG", "https://www.vaorutrippadikkam.com/kolukumalai4.jpg", "https://www.vaorutrippadikkam.com/kolukumalai5.jpg", "https://www.vaorutrippadikkam.com/IMG_9006.JPG", "https://www.vaorutrippadikkam.com/IMG_9013.JPG", "https://www.vaorutrippadikkam.com/kolukumalai8.jpg", "https://www.vaorutrippadikkam.com/IMG_9019.JPG", "https://www.vaorutrippadikkam.com/IMG_9020.JPG", "https://www.vaorutrippadikkam.com/IMG_9018.JPG", "https://www.vaorutrippadikkam.com/IMG_9016.JPG"]',
  '[{"icon": "🌅", "text": "Phantom Rock or Anayirangal Dam View Sunset Trekking (Depending on Weather Condition)"}, {"icon": "🌄", "text": "Kolukumalai Sunrise Trekking"}, {"icon": "🔥", "text": "Campfire"}, {"icon": "🎶", "text": "Music"}, {"icon": "☕", "text": "Tea"}, {"icon": "🍽", "text": "Dinner"}, {"icon": "🍞", "text": "Breakfast"}, {"icon": "🍗", "text": "Chicken 65"}, {"icon": "🚗", "text": "Offroad Jeep Safari"}]',
  '[{"day": 1, "title": "Day 1 - Sunset Trek & Camp Activities", "activities": [{"time": "02:00 PM", "activity": "Check In"}, {"time": "04:00 PM", "activity": "Welcome Tea"}, {"time": "05:00 PM", "activity": "Evening Sunset Trekking - Aanayirangal Dam View"}, {"time": "07:00 PM", "activity": "Reach Back to Campsite"}, {"time": "07:20 PM", "activity": "Campfire with Music"}, {"time": "09:00 PM", "activity": "Dinner - Unlimited Food 🍲🫓 Chapatti, 🍗 Chicken Gravy, 🍚 Ghee Rice, 🥘 Dal, 🥗 Onion Raita"}]}, {"day": 2, "title": "Day 2 - Sunrise Trek & Return", "activities": [{"time": "04:00 AM", "activity": "Wake-up Call"}, {"time": "04:30 AM", "activity": "Jeep Trek to Kolukumalai"}, {"time": "06:30 AM", "activity": "Visit Sunrise View Point & Jaguar Rock"}, {"time": "07:30 AM", "activity": "Back to Jeep Pickup Point"}, {"time": "08:30 AM", "activity": "Reach Back to Campsite"}, {"time": "09:30 AM", "activity": "Breakfast - Unlimited Food 🍛 Idli, 🥯 Vada, ☕ Tea"}, {"time": "10:00 AM", "activity": "Travel Experience Session"}, {"time": "11:30 AM", "activity": "Check Out"}]}]',
  '[{"icon": "🌿", "text": "Free WiFi"}, {"icon": "🌿", "text": "Trekking Guide"}, {"icon": "🌿", "text": "24 Hours Service Man"}, {"icon": "🌿", "text": "Bike and Car Parking Area"}, {"icon": "🌿", "text": "Mobile Charging Point"}, {"icon": "🌿", "text": "Girls and Boys Separate Washrooms"}]',
  '{"note": "For Booking & More Details Call/WhatsApp", "phone": "7592049934"}',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  destination = EXCLUDED.destination,
  price_per_head = EXCLUDED.price_per_head,
  advance_payment = EXCLUDED.advance_payment,
  gallery_images = EXCLUDED.gallery_images,
  inclusions = EXCLUDED.inclusions,
  itinerary = EXCLUDED.itinerary,
  facilities = EXCLUDED.facilities,
  contact_info = EXCLUDED.contact_info,
  image_url = EXCLUDED.image_url;

-- 2. Upsert Meeshapulimala Package
INSERT INTO public.packages (
  id, title, description, destination, price_per_head, advance_payment, duration_days, max_capacity, image_url, gallery_images, inclusions, itinerary, facilities, contact_info, is_active, updated_at
) VALUES (
  'a618b6e6-e05f-475e-a00f-8f3959164f3b',
  'Meeshapulimala Trekking & Camping Package',
  'Meeshapulimala is South India''s highest trekking point, located in Munnar, Idukki, Kerala. It stands at 2,640 meters (8,661 feet) above sea level, offering stunning views and a peaceful escape into nature. This area is a Reserved Forest under the Kerala Forest Development Corporation (KFDC) and part of a protected biodiversity zone.',
  'Meeshapulimala, Munnar',
  3600.00,
  3600.00,
  2,
  50,
  'https://www.vaorutrippadikkam.com/meeshapulimala_header2.jpg',
  '["https://www.vaorutrippadikkam.com/meeshapulimala_header6.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header2.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala4_header.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header5.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header7.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header8.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header4.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header10.jpg", "https://www.vaorutrippadikkam.com/meeshapulimala_header11.jpg"]',
  '[{"icon": "🎟️", "text": "KFDC Entry Pass"}, {"icon": "🚙", "text": "Jeep Safari (60 km) Up & Down"}, {"icon": "🏞️", "text": "Silent Valley Village Visit"}, {"icon": "💦", "text": "Kurinji Valley Waterfall Trekking 4 km (Up & Down)"}, {"icon": "⛰️", "text": "Meeshapulimala Trekking (7 km Up & Down)"}, {"icon": "☕", "text": "Tea & Snacks"}, {"icon": "⛺", "text": "Tent Stay"}, {"icon": "🔥", "text": "Campfire"}]',
  '[{"day": 1, "title": "Day 1 - Arrival & Camp Activities", "activities": [{"time": "Starting Place", "activity": "Munnar Town"}, {"time": "Jeep Safari", "activity": "To Meeshapulimala base camp through Silent Valley Tea Estate (25 km)"}, {"time": "Check-in", "activity": "At Meeshapulimala Base Camp - Tent Distribution and Settle In"}, {"time": "1:00 PM", "activity": "Lunch"}, {"time": "3:00 PM", "activity": "Kurinji Valley Waterfalls Trek (4 km Up & Down)"}, {"time": "5:30 PM", "activity": "Evening Tea"}, {"time": "7:00 PM", "activity": "Campfire"}, {"time": "8:00 PM", "activity": "Dinner"}, {"time": "Night", "activity": "Tent Stay with Sleeping Bag"}]}, {"day": 2, "title": "Day 2 - Trekking & Return", "activities": [{"time": "5:30 AM", "activity": "Tea with Snacks"}, {"time": "6:00 AM", "activity": "Jeep Trekking to Sunrise Mountain (10 km Up & Down)"}, {"time": "7:00 AM", "activity": "Trek to Meeshapulimala Hilltop (7 km Up & Down)"}, {"time": "10:00 AM", "activity": "Breakfast + Lunch"}, {"time": "1:00 PM", "activity": "Return by Jeep to Munnar Town (25 km)"}, {"time": "3:00 PM", "activity": "Closing Time"}]}]',
  '[{"icon": "🏕️", "text": "Safe Camping Area"}, {"icon": "🥾", "text": "Guided Trekking"}, {"icon": "🔥", "text": "Campfire Activities"}, {"icon": "🍽️", "text": "Meals Included"}]',
  '{"note": "For Booking & More Details Call/WhatsApp", "phone": "7592049934"}',
  true,
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  title = EXCLUDED.title,
  description = EXCLUDED.description,
  destination = EXCLUDED.destination,
  price_per_head = EXCLUDED.price_per_head,
  advance_payment = EXCLUDED.advance_payment,
  gallery_images = EXCLUDED.gallery_images,
  inclusions = EXCLUDED.inclusions,
  itinerary = EXCLUDED.itinerary,
  facilities = EXCLUDED.facilities,
  contact_info = EXCLUDED.contact_info,
  image_url = EXCLUDED.image_url;
