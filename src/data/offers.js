export const offers = [
    { id: 1, code: 'FIRST50', title: 'Flat 50% OFF', subtitle: 'on your first order', description: 'Get 50% off up to ₹200 on your first MediVue+ order', minOrder: 299, maxDiscount: 200, validTill: '2026-03-31', color: '#0F847E', bgGradient: 'linear-gradient(135deg, #0F847E 0%, #14B8A6 100%)', isNew: true },
    { id: 2, code: 'HEALTH20', title: '20% OFF', subtitle: 'on health supplements', description: 'Get 20% off on all vitamins and supplements', minOrder: 199, maxDiscount: 150, validTill: '2026-03-15', color: '#22C55E', bgGradient: 'linear-gradient(135deg, #22C55E 0%, #4ADE80 100%)', isNew: false },
    { id: 3, code: 'FREEDELIVERY', title: 'FREE Delivery', subtitle: 'on orders above ₹149', description: 'No delivery charge on medicine orders above ₹149', minOrder: 149, maxDiscount: 50, validTill: '2026-04-30', color: '#3B82F6', bgGradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', isNew: false },
    { id: 4, code: 'CHRONIC15', title: '15% OFF', subtitle: 'on chronic medicine refills', description: 'Save on your regular medicines. Auto-applied on refill orders.', minOrder: 0, maxDiscount: 300, validTill: '2026-06-30', color: '#8B5CF6', bgGradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', isNew: true },
    { id: 5, code: 'REFER100', title: '₹100 OFF', subtitle: 'refer a friend', description: 'You and your friend both get ₹100 off when they place their first order', minOrder: 199, maxDiscount: 100, validTill: '2026-12-31', color: '#F59E0B', bgGradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', isNew: false },
];

export const banners = [
    { id: 1, title: 'Flat 50% OFF', subtitle: 'On First Order', cta: 'Order Now', gradient: 'linear-gradient(135deg, #0F847E 0%, #14B8A6 100%)', textColor: '#fff' },
    { id: 2, title: 'Upload Prescription', subtitle: 'Get medicines delivered', cta: 'Upload Now', gradient: 'linear-gradient(135deg, #3B82F6 0%, #60A5FA 100%)', textColor: '#fff' },
    { id: 3, title: 'Health Checkup Packages', subtitle: 'Starting at ₹299', cta: 'Book Now', gradient: 'linear-gradient(135deg, #8B5CF6 0%, #A78BFA 100%)', textColor: '#fff' },
    { id: 4, title: 'Free Delivery', subtitle: 'On orders above ₹149', cta: 'Shop Now', gradient: 'linear-gradient(135deg, #F59E0B 0%, #FBBF24 100%)', textColor: '#fff' },
];

export const notifications = [
    { id: 1, type: 'order', title: 'Order Delivered!', message: 'Your order ORD-2026-0847 has been delivered. Rate your experience!', time: '2 hours ago', read: false, icon: '📦' },
    { id: 2, type: 'price_drop', title: 'Price Drop Alert 🔥', message: 'Dolo 650 price dropped by ₹5 at Frank Ross Pharmacy near you', time: '5 hours ago', read: false, icon: '📉' },
    { id: 3, type: 'refill', title: 'Refill Reminder', message: 'Time to refill Thyronorm 50mcg. Your 30-day supply ends in 3 days.', time: '1 day ago', read: true, icon: '⏰' },
    { id: 4, type: 'stock', title: 'Back in Stock!', message: 'Azithral 500 is now available at Frank Ross Pharmacy (0.5 km away)', time: '1 day ago', read: true, icon: '✅' },
    { id: 5, type: 'offer', title: 'Exclusive Offer', message: 'Get 20% off on all vitamins & supplements. Use code HEALTH20', time: '2 days ago', read: true, icon: '🎉' },
    { id: 6, type: 'order', title: 'Order On The Way', message: 'Your order ORD-2026-0855 is on the way. ETA: 12 mins', time: '10 minutes ago', read: false, icon: '🚴' },
    { id: 7, type: 'reminder', title: 'Medicine Reminder', message: 'Time to take Metformin 500mg (Evening dose)', time: '30 minutes ago', read: false, icon: '💊' },
];
