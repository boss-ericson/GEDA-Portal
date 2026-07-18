import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const schools = pgTable('schools', {
  id: text('id').primaryKey(), // Using text ID to match existing format
  name: text('name').notNull(),
  region: text('region').notNull(),
  district: text('district').notNull(),
  headTeacherName: text('head_teacher_name').notNull(),
  email: text('email').notNull(),
  slug: text('slug').notNull(),
  status: text('status').default('Pending'),
  userId: integer('user_id').references(() => users.id),
  createdAt: timestamp('created_at').defaultNow(),
});

export const students = pgTable('students', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  fullName: text('full_name').notNull(),
  dob: text('dob'),
  gender: text('gender'),
  classLevel: text('class_level'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  admissionNo: text('admission_no'),
  status: text('status').default('Active'),
  feeTotal: integer('fee_total').default(0),
  feePaid: integer('fee_paid').default(0),
  paymentStatus: text('payment_status').default('Unpaid'),
  admissionStatus: text('admission_status').default('Pending'),
  healthConditions: text('health_conditions'),
  attendanceTotal: integer('attendance_total').default(0),
  examScore: integer('exam_score'),
  sbaScore: integer('sba_score'),
  syncStatus: text('sync_status').default('synced'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const payments = pgTable('payments', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  studentId: text('student_id').notNull().references(() => students.id),
  amount: integer('amount').notNull(),
  method: text('method').notNull(),
  transactionId: text('transaction_id').notNull(),
  status: text('status').default('Success'),
  timestamp: timestamp('timestamp').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  token: text('token').notNull(),
  name: text('name').notNull(),
  status: text('status').default('Active'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const backupLogs = pgTable('backup_logs', {
  id: text('id').primaryKey(),
  schoolId: text('school_id').notNull().references(() => schools.id),
  recordsCount: integer('records_count').notNull(),
  fileName: text('file_name').notNull(),
  status: text('status').default('Completed'),
  type: text('type').default('Manual'),
  timestamp: timestamp('timestamp').defaultNow(),
});

// Relations
export const usersRelations = relations(users, ({ many }) => ({
  schools: many(schools),
}));

export const schoolsRelations = relations(schools, ({ one, many }) => ({
  user: one(users, {
    fields: [schools.userId],
    references: [users.id],
  }),
  students: many(students),
  payments: many(payments),
  apiKeys: many(apiKeys),
  backupLogs: many(backupLogs),
}));

export const studentsRelations = relations(students, ({ one, many }) => ({
  school: one(schools, {
    fields: [students.schoolId],
    references: [schools.id],
  }),
  payments: many(payments),
}));

export const paymentsRelations = relations(payments, ({ one }) => ({
  school: one(schools, {
    fields: [payments.schoolId],
    references: [schools.id],
  }),
  student: one(students, {
    fields: [payments.studentId],
    references: [students.id],
  }),
}));
