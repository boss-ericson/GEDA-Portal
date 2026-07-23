export type Role = 'Admin' | 'Staff' | 'Teacher' | 'SuperAdmin';

export interface School {
  id: string;
  name: string;
  slug: string;
  region: string;
  district: string;
  email?: string;
  password?: string;
  createdAt: string;
  logo?: string;
  primaryColor?: string;
  emisCode?: string;
  motto?: string;
  yearOfEstablishment?: string;
  headTeacherName?: string;
  headTeacherStaffId?: string;
  headTeacherPhone?: string;
  academicYear?: string;
  academicTerm?: string;
  reopeningDate?: string;
  vacationDate?: string;
  status?: 'Active' | 'Deactivated';
  accessLevel?: 'Restricted' | 'Full';
  paidStudentCount?: number;
  billingNotice?: string;
}

export interface Student {
  id: string;
  schoolId: string;
  admissionNo: string;
  fullName: string;
  dob: string;
  gender: 'Male' | 'Female';
  classLevel: string;
  boardingStatus: 'Day' | 'Boarding';
  guardianName: string;
  guardianPhone: string;
  admissionStatus: 'Pending' | 'Admitted' | 'Rejected';
  feePaid: number;
  passportPicture?: string;
  feeTotal: number;
  paymentStatus: 'Unpaid' | 'Partial' | 'Paid';
  syncStatus: 'synced' | 'pending';
  remarks?: string;
  attendancePresent?: number;
  attendanceTotal?: number;
  examScore?: number;
  sbaScore?: number;
  createdAt: string;
}

export interface Payment {
  id: string;
  studentId: string;
  schoolId: string;
  amount: number;
  method: 'MTN MoMo' | 'Telecel Cash' | 'AT Money' | 'Bank' | 'Cash';
  transactionId: string;
  status: 'Pending' | 'Success' | 'Failed';
  timestamp: string;
}

export interface BackupLog {
  id: string;
  schoolId: string;
  timestamp: string;
  recordsCount: number;
  fileName: string;
  status: 'Completed' | 'Failed';
  type: 'Automatic' | 'Manual';
}

export interface ApiKey {
  id: string;
  schoolId: string;
  token: string;
  name: string;
  createdAt: string;
  status: 'Active' | 'Revoked';
}

export interface SubjectScore {
  subject: string;
  cat1?: number;
  groupWork?: number;
  cat2?: number;
  projectWork?: number;
  exam?: number;
}

export interface AcademicRecord {
  id: string;
  studentId: string;
  schoolId: string;
  academicYear: string;
  academicTerm: string;
  classLevel: string;
  scores: SubjectScore[];
  attitude?: string;
  conduct?: string;
  interest?: string;
  teacherRemarks?: string;
  updatedAt: string;
}

export interface AttendanceRecord {
  id: string;
  schoolId: string;
  studentId: string;
  date: string;
  status: 'Present' | 'Absent' | 'Late';
  academicYear: string;
  academicTerm: string;
}

export interface BeceSubjectScore {
  subject: string;
  isCore: boolean;
  score: number; // 0 - 100
  grade: number; // 1 - 9
  gradeRemarks?: string;
}

export interface BeceMockRecord {
  id: string;
  studentId: string;
  schoolId: string;
  mockName: string; // e.g. "School Mock 1", "Municipal Mock 1", "National Mock"
  academicYear: string;
  classLevel: string;
  scores: BeceSubjectScore[];
  actualAggregate: number; // 4 Core + 2 Best Electives
  best6Aggregate: number; // Top 6 overall
  coreAggregate: number; // Sum of 4 Core
  best2ElectiveAggregate: number; // Sum of 2 Best Electives
  overallRemark?: string;
  teacherRemarks?: string;
  headteacherRemarks?: string;
  updatedAt: string;
}
