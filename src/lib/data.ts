import type { User, Task } from './types';
import { subMonths, subDays, addHours } from 'date-fns';
import { Timestamp } from 'firebase/firestore';

// Note: This mock data is for reference. The app will use live data from Firestore.
// We are converting Date objects to Timestamps to maintain consistency with Firestore's data format.

const toTimestamp = (date: Date): Timestamp => Timestamp.fromDate(date);
const now = new Date();

export const mockUsers: Omit<User, 'id'>[] = [
  {
    uid: 'admin1',
    email: 'admin@cveezy.com',
    name: 'Admin User',
    role: 'admin',
    createdAt: toTimestamp(new Date()),
    isActive: true,
  },
  {
    uid: 'mod1',
    email: 'moderator@cveezy.com',
    name: 'Moderator Ali',
    role: 'moderator',
    createdAt: toTimestamp(new Date()),
    isActive: true,
    photoURL: 'https://picsum.photos/seed/mod1/100/100'
  },
  {
    uid: 'designer1',
    email: 'designer1@cveezy.com',
    name: 'Designer Fatima',
    role: 'designer',
    createdAt: toTimestamp(new Date()),
    isActive: true,
  },
  {
    uid: 'designer2',
    email: 'designer2@cveezy.com',
    name: 'Designer Omar',
    role: 'designer',
    createdAt: toTimestamp(new Date()),
    isActive: true,
  },
  {
    uid: 'client1',
    email: 'client1@example.com',
    name: 'Client Ahmed',
    role: 'client',
    createdAt: toTimestamp(new Date()),
    isActive: true,
  },
];


export const mockTasks: Omit<Task, 'id'>[] = [
  {
    taskId: '1700000000001',
    clientName: 'Nour Mohamed',
    clientPhone: '01012345678',
    services: [{ type: 'سيرة ذاتية (ATS)', language: 'إنجليزي', deliveryTime: '48 ساعة' }],
    designerId: 'designer1',
    moderatorId: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2', // CHANGE THIS TO A REAL UID
    status: 'done',
    financialTotal: 500,
    financialPaid: 500,
    financialRemaining: 0,
    financialCurrency: 'EGP',
    createdAt: toTimestamp(subDays(now, 5)),
    updatedAt: toTimestamp(subDays(now, 2)),
    completedAt: toTimestamp(subDays(now, 2)),
    dueDate: toTimestamp(addHours(subDays(now, 5), 48)),
    createdBy: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2',
    taskDate: toTimestamp(subDays(now, 5)),
  },
  {
    taskId: '1700000000002',
    clientName: 'Youssef Hassan',
    clientPhone: '01123456789',
    services: [{ type: 'تحسين بروفايل لينكدإن', language: 'عربي', deliveryTime: '72 ساعة' }],
    designerId: 'designer2',
    moderatorId: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2', // CHANGE THIS
    status: 'in_progress',
    financialTotal: 300,
    financialPaid: 150,
    financialRemaining: 150,
    financialCurrency: 'EGP',
    createdAt: toTimestamp(subDays(now, 3)),
    updatedAt: toTimestamp(subDays(now, 1)),
    dueDate: toTimestamp(addHours(subDays(now, 3), 72)),
    createdBy: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2',
    taskDate: toTimestamp(subDays(now, 3)),
  },
  {
    taskId: '1700000000003',
    clientName: 'Mariam Adel',
    clientPhone: '01234567890',
    services: [{ type: 'سيرة ذاتية (Standard)', language: 'ثنائي (ع+E)', deliveryTime: '24 ساعة' }],
    designerId: 'designer1',
    moderatorId: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2', // CHANGE THIS
    status: 'to_review',
    financialTotal: 400,
    financialPaid: 400,
    financialRemaining: 0,
    financialCurrency: 'EGP',
    createdAt: toTimestamp(subDays(now, 1)),
    updatedAt: toTimestamp(now),
    dueDate: toTimestamp(addHours(subDays(now, 1), 24)),
    createdBy: 'gUaB6fE0xZcW6e4o9k1lA7s3j5R2',
    taskDate: toTimestamp(subDays(now, 1)),
  },
];

    