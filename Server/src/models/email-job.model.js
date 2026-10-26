// src/models/email-job.model.js
// Persistent email job and outbox log for transactional notifications.
// Prevents duplicate sends via idempotency keys and tracks delivery attempts.

import mongoose from 'mongoose';

const emailJobSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      required: true,
      enum: ['respondent_receipt', 'owner_notification', 'closing_reminder', 'test_email'],
    },
    to: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    html: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'sent', 'failed'],
      default: 'pending',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    lastError: {
      type: String,
      default: null,
    },
    sentAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform: (_doc, ret) => {
        ret.id = ret._id.toString();
        delete ret._id;
        delete ret.__v;
        return ret;
      },
    },
  }
);

emailJobSchema.index({ status: 1, attempts: 1 });

export const EmailJob = mongoose.model('EmailJob', emailJobSchema);
