import type { User, Class, Lesson, Institute, Payment } from './types';

export const users: User[] = [
  { id: '1', name: 'Alice Johnson', email: 'alice@example.com', studentNumber: 'STU001', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Paid', classIds: ['c1', 'c3'], role: 'Student' },
  { id: '2', name: 'Bob Williams', email: 'bob@example.com', studentNumber: 'STU002', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Pending', classIds: ['c1', 'c2'], role: 'Student' },
  { id: '3', name: 'Charlie Brown', email: 'charlie@example.com', studentNumber: 'STU003', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Paid', classIds: ['c2'], role: 'Student' },
  { id: '4', name: 'Diana Miller', email: 'diana@example.com', studentNumber: 'STU004', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Paid', classIds: ['c3'], role: 'Student' },
  { id: '5', name: 'Ethan Davis', email: 'ethan@example.com', studentNumber: 'STU005', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Pending', classIds: ['c1'], role: 'Student' },
  { id: '6', name: 'Fiona Garcia', email: 'fiona@example.com', studentNumber: 'STU006', avatarUrl: 'https://placehold.co/100x100.png', paymentStatus: 'Paid', classIds: ['c2', 'c3'], role: 'Student' },
];

export const payments: Payment[] = [
    { id: 'p1', studentId: '1', amount: 150, status: 'Paid', date: '2024-07-15T10:00:00Z' },
    { id: 'p2', studentId: '2', amount: 150, status: 'Pending', date: '2024-07-16T11:30:00Z' },
    { id: 'p3', studentId: '3', amount: 200, status: 'Paid', date: '2024-07-12T14:00:00Z' },
    { id: 'p4', studentId: '4', amount: 180, status: 'Paid', date: '2024-07-11T09:20:00Z' },
    { id: 'p5', studentId: '5', amount: 150, status: 'Pending', date: '2024-07-18T16:00:00Z' },
    { id: 'p6', studentId: '6', amount: 200, status: 'Paid', date: '2024-07-10T13:45:00Z' },
    { id: 'p7', studentId: '1', amount: 180, status: 'Paid', date: '2024-06-15T10:00:00Z' },
    { id: 'p8', studentId: '2', amount: 200, status: 'Paid', date: '2024-06-14T11:30:00Z' },
];


export const classes: Class[] = [
  { id: 'c1', name: 'Introduction to Web Development', description: 'Learn the fundamentals of HTML, CSS, and JavaScript.', teacher: 'Dr. Smith', schedule: 'Mon, Wed, Fri 10:00 AM', studentIds: ['1', '2', '5'], imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'c2', name: 'Advanced React Patterns', description: 'Deep dive into React hooks, state management, and performance.', teacher: 'Prof. Jones', schedule: 'Tue, Thu 2:00 PM', studentIds: ['2', '3', '6'], imageUrl: 'https://placehold.co/600x400.png' },
  { id: 'c3', name: 'UI/UX Design Principles', description: 'Explore the principles of user-centric design and create beautiful interfaces.', teacher: 'Ms. Taylor', schedule: 'Mon, Wed 1:00 PM', studentIds: ['1', '4', '6'], imageUrl: 'https://placehold.co/600x400.png' },
];

export const lessons: Lesson[] = [
  { id: 'l1', classId: 'c1', title: 'Lesson 1: The Basics of HTML', description: 'An introduction to HTML tags and document structure.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/pQN-pnXPaVg', date: '2024-07-05T10:00:00Z' },
  { id: 'l2', classId: 'c1', title: 'Lesson 2: Styling with CSS', description: 'Learn how to use CSS to style your web pages.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/OEV8gMkCHXQ', date: '2024-07-12T10:00:00Z' },
  { id: 'l10', classId: 'c1', title: 'Lesson 3: Intro to JavaScript', description: 'Getting started with variables and functions.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/W6NZfCO5SIk', date: '2024-08-02T10:00:00Z' },
  { id: 'l3', classId: 'c2', title: 'Lesson 1: Understanding Hooks', description: 'A deep dive into useState and useEffect.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/TNhaISOUy6Q', date: '2024-07-02T14:00:00Z' },
  { id: 'l4', classId: 'c2', title: 'Lesson 2: State Management with Context', description: 'How to manage global state with the Context API.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/5LrDIWkK_Bc', date: '2024-07-09T14:00:00Z' },
  { id: 'l5', classId: 'c3', title: 'Lesson 1: The Principles of Design', description: 'Learn about color theory, typography, and layout.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/s_i_FPx9k-Q', date: '2024-06-03T13:00:00Z' },
  { id: 'l6', classId: 'c3', title: 'Lesson 2: Prototyping in Figma', description: 'A hands-on guide to creating interactive prototypes.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/5i_i_h5gS7M4I', date: '2024-06-10T13:00:00Z' },
  { id: 'l7', classId: 'c3', title: 'Lesson 3: Advanced Figma Techniques', description: 'Components, variants, and auto layout.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/e_l6y4QZAPo', date: '2024-07-01T13:00:00Z' },
  { id: 'l8', classId: 'c3', title: 'Lesson 4: User Testing', description: 'Learn how to conduct effective user testing sessions.', videoUrl: 'placeholder', youtubeUrl: 'https://www.youtube.com/embed/T4J9t-A0P_E', date: '2024-07-08T13:00:00Z' },
];


export const institutes: Institute[] = [
  { id: 'i1', name: 'Grand University', adminEmail: 'admin@grand.edu' }
];
