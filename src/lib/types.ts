export interface Project {
  id: string;
  name: string;
  prompt: string;
  code: string;
  template_type: string;
  created_at: string;
  updated_at: string;
}

export interface ProjectVersion {
  id: string;
  project_id: string;
  version_label: string;
  prompt: string;
  code: string;
  created_at: string;
}

export type SubscriptionTier = 'starter' | 'pro';
export type SubscriptionStatus = 'active' | 'inactive';

export interface Subscription {
  id: string;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  sender_mobile: string | null;
  activated_at: string | null;
  created_at: string;
}

export type TransactionStatus = 'pending' | 'verified' | 'rejected';

export interface Transaction {
  id: string;
  subscription_id: string | null;
  sender_mobile: string;
  receipt_code: string;
  amount: number;
  status: TransactionStatus;
  tier: SubscriptionTier;
  created_at: string;
  reviewed_at: string | null;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  prompt: string;
  category: 'e-commerce' | 'landing-page' | 'dashboard' | 'blank';
}

export const TEMPLATES: Template[] = [
  {
    id: 'ecommerce',
    name: 'E-Commerce Store',
    description: 'Product grid with cart, checkout flow, and product details',
    icon: 'ShoppingBag',
    prompt: 'Create a modern e-commerce store with a product grid, shopping cart, product cards with prices, and a checkout button',
    category: 'e-commerce',
  },
  {
    id: 'landing',
    name: 'Landing Page',
    description: 'Hero section, features, testimonials, and CTA',
    icon: 'Rocket',
    prompt: 'Create a beautiful landing page with a hero section, feature highlights, testimonials, and a call-to-action button',
    category: 'landing-page',
  },
  {
    id: 'dashboard',
    name: 'Analytics Dashboard',
    description: 'Stats cards, charts, data table, and sidebar',
    icon: 'LayoutDashboard',
    prompt: 'Create an analytics dashboard with stat cards, a bar chart, a data table, and a sidebar navigation',
    category: 'dashboard',
  },
  {
    id: 'blank',
    name: 'Blank Canvas',
    description: 'Start from scratch with your own prompt',
    icon: 'Sparkles',
    prompt: '',
    category: 'blank',
  },
];

export const PRICING = {
  starter: { price: 99, currency: 'EGP', name: 'Starter' },
  pro: { price: 199, currency: 'EGP', name: 'PRO' },
};

export const ORANGE_CASH_NUMBER = '01207782741';
