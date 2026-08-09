import { relations } from 'drizzle-orm';
import { integer, pgTable, serial, text, timestamp } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(),
  email: text('email').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const wikiComments = pgTable('wiki_comments', {
  id: serial('id').primaryKey(),
  userId: integer('user_id')
    .references(() => users.id)
    .notNull(),
  pageId: text('page_id').notNull(),
  comment: text('comment').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const usersRelations = relations(users, ({ many }) => ({
  comments: many(wikiComments),
}));

export const wikiCommentsRelations = relations(wikiComments, ({ one }) => ({
  author: one(users, {
    fields: [wikiComments.userId],
    references: [users.id],
  }),
}));
