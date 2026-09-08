import { relations } from 'drizzle-orm';
import { boolean, doublePrecision, integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  email: text('email').notNull(),
  name: text('name'),
  phone: text('phone'),
  institution: text('institution'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const tuitions = pgTable('tuitions', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  name: text('name').notNull(),
  studentName: text('student_name'),
  address: text('address').notNull(),
  latitude: doublePrecision('latitude').notNull(),
  longitude: doublePrecision('longitude').notNull(),
  radius: integer('radius').notNull().default(100),
  expectedStart: text('expected_start').notNull(),
  expectedEnd: text('expected_end').notNull(),
  fee: integer('fee').notNull().default(0),
  expectedClassesPerMonth: integer('expected_classes_per_month').notNull().default(10),
  scheduledDays: text('scheduled_days').notNull().default('[]'), // JSON array string
  minimumStayMinutes: integer('minimum_stay_minutes').notNull().default(30),
  active: boolean('active').notNull().default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const attendance = pgTable('attendance', {
  id: serial('id').primaryKey(),
  userUid: text('user_uid')
    .references(() => users.uid)
    .notNull(),
  tuitionId: integer('tuition_id'),
  date: text('date').notNull(), // YYYY-MM-DD
  arrivalTime: text('arrival_time').notNull(),
  departureTime: text('departure_time'),
  duration: integer('duration').notNull().default(0), // in seconds
  status: text('status').notNull().default('completed'),
  notes: text('notes'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  tuitions: many(tuitions),
  attendance: many(attendance),
}));

export const tuitionsRelations = relations(tuitions, ({ one, many }) => ({
  user: one(users, {
    fields: [tuitions.userUid],
    references: [users.uid],
  }),
  attendances: many(attendance),
}));

export const attendanceRelations = relations(attendance, ({ one }) => ({
  user: one(users, {
    fields: [attendance.userUid],
    references: [users.uid],
  }),
  tuition: one(tuitions, {
    fields: [attendance.tuitionId],
    references: [tuitions.id],
  }),
}));
