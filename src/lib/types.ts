
export type UserRole = 'Student' | 'Staff' | 'Admin';

export interface Payment {
  id: string;
  studentId: string;
  amount: number;
  status: 'Paid' | 'Pending';
  date: string; // ISO 8601 date string
}

export interface User {
  id: string;
  name: string;
  email: string;
  studentNumber?: string;
  avatarUrl: string;
  classIds: string[];
  role: UserRole;
  paymentStatus: 'Paid' | 'Pending'; // This will be derived from payments now, but keeping for other parts of app
}

export interface Class {
  id:string;
  name: string;
  description: string;
  teacher: string;
  schedule: string;
  studentIds: string[];
  imageUrl: string;
  courseCode: string;
  credits: string;
  courseFee: string;
  registrationFee: string;
  paymentStatus: string;
  intro_url?: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  description: string;
  videoUrl: string;
  youtubeUrl: string;
  classId: string;
  date: string; // ISO 8601 date string
}

export interface Institute {
  id: string;
  name: string;
  adminEmail: string;
}

    