import { Timestamp } from 'firebase/firestore';

/**
 * تحويل Timestamp إلى Date بشكل آمن
 * يتعامل مع null/undefined والأنواع المختلفة
 */
export function toDate(timestamp: Timestamp | Date | string | number | null | undefined): Date {
  if (!timestamp) {
    return new Date();
  }

  if (timestamp instanceof Date) {
    return timestamp;
  }

  if (timestamp instanceof Timestamp) {
    return timestamp.toDate();
  }

  if (typeof timestamp === 'object' && 'toDate' in timestamp) {
    try {
      return timestamp.toDate();
    } catch {
      return new Date();
    }
  }

  // محاولة تحويل string أو number
  try {
    return new Date(timestamp);
  } catch {
    return new Date();
  }
}
