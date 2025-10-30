export interface User {
  uid: string;
  email: string;
  name: string;
  role: 'admin' | 'moderator' | 'designer' | 'client';
  createdAt: Date;
  lastLoginAt?: Date;
  isActive: boolean;
  phoneNumber?: string;
  photoURL?: string;
}

export interface Experience {
  companyName: string;
  jobTitle: string;
  startMonth: string;
  startYear: string;
  endMonth?: string;
  endYear?: string;
  isCurrent: boolean;
  notes?: string;
}

export type ServiceType = 
  | 'سيرة ذاتية (ATS)'
  | 'سيرة ذاتية (Standard)'
  | 'تحسين بروفايل لينكدإن'
  | 'سيرة ذاتية بنمط Europass'
  | 'بورتفوليو أعمال'
  | 'التقديم على 1000 وظيفة'
  | 'تعديل/تحسين السيرة'
  | 'سيرة ذاتية بنمط الخليج';

export type LanguageType = 
  | 'عربي'
  | 'إنجليزي'
  | 'ثنائي (ع+E)'
  | 'فرنسي'
  | 'ألماني'
  | 'صيني'
  | 'ياباني'
  | 'روسي'
  | 'برتغالي';

export type DeliveryTimeType = 
  | '3 ساعات'
  | '6 ساعات'
  | '12 ساعة'
  | '24 ساعة'
  | '48 ساعة'
  | '72 ساعة';

export interface Service {
  type: ServiceType;
  language: LanguageType;
  deliveryTime: DeliveryTimeType;
  notes?: string;
}

export type TaskStatus = 'new' | 'in_progress' | 'submitted' | 'to_review' | 'done' | 'cancelled' | 'overdue';

export interface Task {
  id: string;
  taskId: string;
  
  clientName: string;
  clientJobTitle?: string;
  clientPhone: string;
  clientEmail?: string;
  clientWhatsapp?: string;
  clientAddress?: string;
  clientEducation?: string;
  clientSkills?: string;
  clientSkillsList?: string[];
  clientExperience?: string;
  clientExperienceList?: Experience[];
  
  services: Service[];
  
  designerId: string;
  moderatorId: string;
  
  status: TaskStatus;
  
  financialTotal: number;
  financialPaid: number;
  financialRemaining: number;
  financialCurrency: 'EGP';
  whatsappSource?: string;
  paymentMethod?: string;
  
  oldCvUrls?: string[];
  certificatesUrls?: string[];
  imagesUrls?: string[];
  payment1Urls?: string[];
  payment2Urls?: string[];
  deliveryUrls?: string[];
  
  notes?: string;
  deliveryLink?: string;
  taskDate: Date;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  completedAt?: Date;
  
  dueDate: Date;
}

export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  body?: string;
  isRead: boolean;
  link?: string;
  createdAt: Date;
  type?: 'task' | 'system' | 'payment';
  taskId?: string;
}
