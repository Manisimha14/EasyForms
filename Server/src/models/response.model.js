// src/models/response.model.js
// Stores submissions submitted by respondents for a published form.
// No IP address, device fingerprints or user agent are stored.

import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    fieldId: {
      type: String,
      required: true,
    },
    value: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },
  },
  { _id: false }
);

const responseSchema = new mongoose.Schema(
  {
    formId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Form',
      required: true,
      index: true,
    },
    answers: {
      type: [answerSchema],
      default: [],
    },
    submittedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
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

responseSchema.index({ formId: 1, submittedAt: -1 });

export const Response = mongoose.model('Response', responseSchema);
