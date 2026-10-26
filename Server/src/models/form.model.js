// src/models/form.model.js
// Form document schema including field definitions, themes, and publication metadata.
// Supports optimistic concurrency via a numeric revision field.

import mongoose from 'mongoose';
import { FORM_STATUS, FORM_VISIBILITY, QUESTION_TYPES, LIMITS } from '../constants/form.constants.js';
import { DEFAULT_THEME } from '../constants/theme.constants.js';

const fieldSchema = new mongoose.Schema(
  {
    id: {
      type: String,
      required: true,
    },
    label: {
      type: String,
      required: true,
      trim: true,
      maxlength: LIMITS.FIELD_LABEL_MAX,
    },
    type: {
      type: String,
      required: true,
      enum: QUESTION_TYPES,
    },
    required: {
      type: Boolean,
      default: false,
    },
    placeholder: {
      type: String,
      trim: true,
      maxlength: LIMITS.FIELD_PLACEHOLDER_MAX,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      maxlength: LIMITS.FIELD_DESCRIPTION_MAX,
      default: '',
    },
    options: {
      type: [String],
      default: undefined,
    },
    order: {
      type: Number,
      required: true,
      default: 0,
    },
    validation: {
      type: mongoose.Schema.Types.Mixed,
      default: () => ({}),
    },
  },
  { _id: false }
);

const themeSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      default: DEFAULT_THEME.name,
      trim: true,
      maxlength: 40,
    },
    primaryColor: {
      type: String,
      default: DEFAULT_THEME.primaryColor,
    },
    backgroundColor: {
      type: String,
      default: DEFAULT_THEME.backgroundColor,
    },
    fontFamily: {
      type: String,
      default: DEFAULT_THEME.fontFamily,
    },
  },
  { _id: false }
);

const formSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
      minlength: LIMITS.FORM_TITLE_MIN,
      maxlength: LIMITS.FORM_TITLE_MAX,
    },
    description: {
      type: String,
      trim: true,
      maxlength: LIMITS.FORM_DESCRIPTION_MAX,
      default: '',
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      trim: true,
    },
    status: {
      type: String,
      enum: Object.values(FORM_STATUS),
      default: FORM_STATUS.DRAFT,
    },
    visibility: {
      type: String,
      enum: Object.values(FORM_VISIBILITY),
      default: FORM_VISIBILITY.UNLISTED,
    },
    revision: {
      type: Number,
      default: 1,
      min: 1,
    },
    fields: {
      type: [fieldSchema],
      default: [],
      validate: [
        (val) => val.length <= LIMITS.MAX_FIELDS_PER_FORM,
        `A form cannot exceed ${LIMITS.MAX_FIELDS_PER_FORM} fields`,
      ],
    },
    theme: {
      type: themeSchema,
      default: () => ({ ...DEFAULT_THEME }),
    },
    publishedAt: {
      type: Date,
      default: null,
    },
    startAt: {
      type: Date,
      default: null,
    },
    endAt: {
      type: Date,
      default: null,
    },
    maxResponses: {
      type: Number,
      default: null,
      min: 1,
    },
    notifications: {
      respondentReceipt: {
        type: Boolean,
        default: false,
      },
      ownerNotification: {
        type: Boolean,
        default: false,
      },
      respondentEmailFieldId: {
        type: String,
        default: null,
      },
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

// Compound indexes for optimal queries
formSchema.index({ ownerId: 1, createdAt: -1 });
formSchema.index({ ownerId: 1, status: 1 });

export const Form = mongoose.model('Form', formSchema);
