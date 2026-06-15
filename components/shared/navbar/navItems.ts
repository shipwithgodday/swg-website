export interface NavItem {
  text: string;
  url?: string;
  subItems?: NavItem[];
}

export const navItems: NavItem[] = [
  // { text: 'Home', url: '/' },
  {
    text: 'About Us',
    url: '/about',
  },
  {
    text: 'Services',
    subItems: [
      { text: 'Procurement Services', url: '/procurement' },
      { text: 'Shipping Solutions', url: '/shipping' },
      { text: 'Payment Facilitation', url: '/payment' },
    ],
  },
  { text: 'Shop', url: '/shop' },
  { text: 'Track Shipment', url: '/track' },
  { text: 'Contact', url: '/contact' },
  { text: 'Schedule a Call', url: '/schedule' },
  // { text: 'Email', url: '/email' },
];
