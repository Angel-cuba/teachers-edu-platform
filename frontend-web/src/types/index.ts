export type UserRole = 'TEACHER' | 'STUDENT' | 'ADMIN';

export interface User {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  enrollCode: string;
  isActive: boolean;
  teacherId: string;
  teacherName: string;
  studentCount: number;
  createdAt: string;
}

export interface Exercise {
  id: string;
  courseId: string;
  courseTitle?: string;
  title: string;
  description: string;
  type: 'MULTIPLE_CHOICE' | 'OPEN' | 'CODE';
  correctAnswer?: string;
  attachmentUrl?: string;
  maxScore: number;
  dueDate?: string;
  isPublished: boolean;
  createdAt: string;
  /** Present only for STUDENT callers — "PENDING" | "GRADED" | null (not submitted) */
  mySubmissionStatus?: 'PENDING' | 'GRADED' | null;
}

export interface Submission {
  id: string;
  exerciseId: string;
  exerciseTitle?: string;
  studentId: string;
  studentName: string;
  answer: string;
  status: 'PENDING' | 'GRADED';
  submittedAt: string;
  grade?: Grade;
}

export interface Grade {
  id: string;
  score: number;
  feedback: string;
  gradedAt: string;
}

export type NotificationType = 'GRADE_PUBLISHED' | 'NEW_EXERCISE' | 'SUBMISSION_RECEIVED';

export interface Notification {
  id: string;
  type: NotificationType | string; // union keeps known types explicit; string allows future server additions
  message: string;
  isRead: boolean;
  createdAt: string;
  relatedEntityId?: string;
}
