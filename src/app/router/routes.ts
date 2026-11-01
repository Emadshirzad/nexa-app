import type { RouteRecordRaw } from 'vue-router';
import MainLayout from '@/presentation/layouts/MainLayout.vue';
import AuthLayout from '@/presentation/layouts/AuthLayout.vue';

export const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/dashboard'
  },
  {
    path: '/onboarding',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'onboarding',
        component: () => import('@/presentation/pages/OnboardingPage.vue')
      }
    ]
  },
  {
    path: '/lock',
    component: AuthLayout,
    children: [
      {
        path: '',
        name: 'lock',
        component: () => import('@/presentation/pages/LockPage.vue')
      }
    ]
  },
  {
    path: '/',
    component: MainLayout,
    children: [
      {
        path: 'dashboard',
        name: 'dashboard',
        component: () => import('@/presentation/pages/DashboardPage.vue')
      },
      {
        path: 'customers',
        name: 'customers',
        component: () => import('@/presentation/pages/CustomersPage.vue')
      },
      {
        path: 'customers/new',
        name: 'customer-new',
        component: () => import('@/presentation/pages/CustomersPage.vue')
      },
      {
        path: 'customers/:id',
        name: 'customer-detail',
        component: () => import('@/presentation/pages/CustomersPage.vue')
      },
      {
        path: 'invoices',
        name: 'invoices',
        component: () => import('@/presentation/pages/InvoicesPage.vue')
      },
      {
        path: 'invoices/new',
        name: 'invoice-new',
        component: () => import('@/presentation/pages/InvoicesPage.vue')
      },
      {
        path: 'invoices/:id',
        name: 'invoice-detail',
        component: () => import('@/presentation/pages/InvoicesPage.vue')
      },
      {
        path: 'tasks',
        name: 'tasks',
        component: () => import('@/presentation/pages/TasksPage.vue')
      },
      {
        path: 'more',
        name: 'more',
        component: () => import('@/presentation/pages/MorePage.vue')
      },
      {
        path: 'products',
        name: 'products',
        component: () => import('@/presentation/pages/ProductsPage.vue')
      },
      {
        path: 'products/new',
        name: 'product-new',
        component: () => import('@/presentation/pages/ProductsPage.vue')
      },
      {
        path: 'products/:id',
        name: 'product-detail',
        component: () => import('@/presentation/pages/ProductsPage.vue')
      },
      {
        path: 'inventory',
        name: 'inventory',
        component: () => import('@/presentation/pages/ProductsPage.vue')
      },
      {
        path: 'leads',
        name: 'leads',
        component: () => import('@/presentation/pages/LeadsPage.vue')
      },
      {
        path: 'finance',
        name: 'finance',
        component: () => import('@/presentation/pages/FinancePage.vue')
      },
      {
        path: 'reports',
        name: 'reports',
        component: () => import('@/presentation/pages/ReportsPage.vue')
      },
      {
        path: 'settings',
        name: 'settings',
        component: () => import('@/presentation/pages/SettingsPage.vue')
      }
    ]
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard'
  }
];
