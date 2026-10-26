// src/modules/forms/form.service.js
// Business logic for form CRUD operations with strict ownership enforcement,
// atomic revision updates, and paginated summary listing.

import { Form } from '../../models/form.model.js';
import { Response } from '../../models/response.model.js';
import {
  NotFoundError,
  ConflictError,
  PreconditionFailedError,
  PreconditionRequiredError,
  UnprocessableError,
} from '../../utils/app-error.js';
import { generateSlug } from '../../utils/slug.js';
import { generateFieldId } from '../../utils/field-id.js';
import { getPaginationParams, formatPagination } from '../../utils/pagination.js';
import { SELECTION_TYPES } from '../../constants/form.constants.js';
import { getAvailabilityStatus } from '../../utils/availability.js';

/**
 * Escape special regex characters in user search input.
 * @param {string} str
 * @returns {string}
 */
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/**
 * Generate a unique slug with up to 5 collision retries.
 * @returns {Promise<string>}
 */
async function generateUniqueSlug() {
  const MAX_RETRIES = 5;
  for (let attempt = 0; attempt < MAX_RETRIES; attempt += 1) {
    const candidate = generateSlug();
    const existing = await Form.findOne({ slug: candidate });
    if (!existing) {
      return candidate;
    }
  }
  throw new ConflictError('Could not generate a unique form link. Please try again.');
}

/**
 * Create a new draft form for the authenticated user.
 * @param {string} userId
 * @param {{ title: string, description?: string }} data
 */
export async function createForm(userId, { title, description }) {
  const slug = await generateUniqueSlug();

  const form = await Form.create({
    title,
    description: description || '',
    ownerId: userId,
    slug,
    revision: 1,
    status: 'draft',
    visibility: 'unlisted',
    fields: [],
  });

  return form.toJSON();
}

/**
 * List forms owned by the user with pagination, filtering, search, and response counts.
 * Uses a single aggregation for response counts across the paginated form IDs.
 * @param {string} userId
 * @param {object} query
 */
export async function listForms(userId, query) {
  const { page, limit, skip } = getPaginationParams(query.page, query.limit);

  const filter = { ownerId: userId };

  if (query.status) {
    filter.status = query.status;
  }

  if (query.search && query.search.trim()) {
    filter.title = { $regex: escapeRegex(query.search.trim()), $options: 'i' };
  }

  const total = await Form.countDocuments(filter);

  const sortOrder = query.order === 'asc' ? 1 : -1;
  const sort = { [query.sortBy]: sortOrder };

  const forms = await Form.find(filter)
    .select('title description status visibility slug fields revision startAt endAt maxResponses notifications createdAt updatedAt publishedAt')
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .lean();

  // Aggregate response counts in one query for all forms on this page
  const formIds = forms.map((f) => f._id);
  const countMap = new Map();

  if (formIds.length > 0) {
    const counts = await Response.aggregate([
      { $match: { formId: { $in: formIds } } },
      { $group: { _id: '$formId', count: { $sum: 1 } } },
    ]);
    for (const c of counts) {
      countMap.set(c._id.toString(), c.count);
    }
  }

  const data = forms.map((f) => {
    const responseCount = countMap.get(f._id.toString()) || 0;
    return {
      id: f._id.toString(),
      title: f.title,
      description: f.description,
      status: f.status,
      visibility: f.visibility,
      slug: f.slug,
      fieldCount: f.fields ? f.fields.length : 0,
      responseCount,
      startAt: f.startAt || null,
      endAt: f.endAt || null,
      maxResponses: f.maxResponses || null,
      notifications: f.notifications || { respondentReceipt: false, ownerNotification: false, respondentEmailFieldId: null },
      availabilityStatus: getAvailabilityStatus(f, responseCount),
      revision: f.revision,
      createdAt: f.createdAt,
      updatedAt: f.updatedAt,
      publishedAt: f.publishedAt,
    };
  });

  return {
    data,
    pagination: formatPagination(page, limit, total),
  };
}

/**
 * Retrieve a single form by ID with ownership check.
 * Fields are returned sorted by their order attribute.
 * @param {string} userId
 * @param {string} formId
 */
export async function getFormById(userId, formId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  const json = form.toJSON();
  if (json.fields && Array.isArray(json.fields)) {
    json.fields.sort((a, b) => a.order - b.order);
  }

  const responseCount = await Response.countDocuments({ formId: form._id });
  json.responseCount = responseCount;
  json.availabilityStatus = getAvailabilityStatus(json, responseCount);

  return json;
}

/**
 * Update form metadata (title, description, visibility) with optional If-Match concurrency check.
 * Increments revision on write.
 * @param {string} userId
 * @param {string} formId
 * @param {object} updates
 * @param {string|number} [ifMatch]
 */
export async function updateFormMetadata(userId, formId, updates, ifMatch) {
  // If If-Match header is provided, parse and match revision
  let expectedRevision;
  if (ifMatch !== undefined) {
    // Strip possible quotes e.g. "1" or W/"1"
    const cleaned = String(ifMatch).replace(/^W\//, '').replace(/^"|"$/g, '');
    expectedRevision = parseInt(cleaned, 10);
  }

  const query = { _id: formId, ownerId: userId };
  if (expectedRevision !== undefined && !Number.isNaN(expectedRevision)) {
    query.revision = expectedRevision;
  }

  // Normalize date updates
  const setPayload = { ...updates };
  if (setPayload.startAt !== undefined) {
    setPayload.startAt = setPayload.startAt ? new Date(setPayload.startAt) : null;
  }
  if (setPayload.endAt !== undefined) {
    setPayload.endAt = setPayload.endAt ? new Date(setPayload.endAt) : null;
  }

  const updatedForm = await Form.findOneAndUpdate(
    query,
    {
      $set: setPayload,
      $inc: { revision: 1 },
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedForm) {
    // Check if the form exists at all for this user
    const existing = await Form.findOne({ _id: formId, ownerId: userId });
    if (!existing) {
      throw new NotFoundError('Form not found.');
    }
    // Form exists, so failure was caused by stale If-Match revision
    throw new PreconditionFailedError(
      'The form has been modified by another request. Please reload and try again.',
      [{ currentRevision: existing.revision }]
    );
  }

  const result = updatedForm.toJSON();
  const responseCount = await Response.countDocuments({ formId: updatedForm._id });
  result.responseCount = responseCount;
  result.availabilityStatus = getAvailabilityStatus(result, responseCount);

  return result;
}

/**
 * Permanently delete a form and all its responses.
 * @param {string} userId
 * @param {string} formId
 */
export async function deleteForm(userId, formId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  // Delete responses first, then the form
  await Response.deleteMany({ formId });
  await Form.deleteOne({ _id: formId, ownerId: userId });
}

/**
 * Replace the entire fields list for a form.
 * Enforces If-Match header requirement. Preserves IDs, generates missing ones,
 * renumbers order 0..n-1, and generates warnings if fields with existing responses are removed or change type.
 * @param {string} userId
 * @param {string} formId
 * @param {Array} fields
 * @param {string} ifMatch
 * @returns {Promise<{ form: object, warnings: string[] }>}
 */
export async function replaceFields(userId, formId, fields, ifMatch) {
  if (ifMatch === undefined || ifMatch === null || ifMatch === '') {
    throw new PreconditionRequiredError('The If-Match header is required for updating form fields.');
  }

  const cleaned = String(ifMatch).replace(/^W\//, '').replace(/^"|"$/g, '');
  const expectedRevision = parseInt(cleaned, 10);
  if (Number.isNaN(expectedRevision)) {
    throw new PreconditionRequiredError('Invalid If-Match revision header.');
  }

  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  if (form.revision !== expectedRevision) {
    throw new PreconditionFailedError(
      'The form has been modified by another request. Please reload and try again.',
      [{ currentRevision: form.revision }]
    );
  }

  // Sort incoming fields by order, then renumber 0..n-1 and generate missing IDs
  const sorted = [...fields].sort((a, b) => a.order - b.order);
  const normalizedFields = sorted.map((field, idx) => ({
    ...field,
    id: field.id && field.id.trim() ? field.id.trim() : generateFieldId(),
    order: idx,
  }));

  // Ensure unique IDs in normalized fields
  const idSet = new Set();
  for (const f of normalizedFields) {
    if (idSet.has(f.id)) {
      throw new ConflictError(`Duplicate field ID '${f.id}' within form.`);
    }
    idSet.add(f.id);
  }

  // Generate warnings if existing responses had answers for removed fields or fields that changed type
  const warnings = [];
  const responsesCount = await Response.countDocuments({ formId });
  if (responsesCount > 0 && form.fields.length > 0) {
    const answeredFieldIds = await Response.distinct('answers.fieldId', { formId });
    const answeredSet = new Set(answeredFieldIds);

    for (const oldField of form.fields) {
      if (answeredSet.has(oldField.id)) {
        const matchingNewField = normalizedFields.find((f) => f.id === oldField.id);
        if (!matchingNewField) {
          warnings.push(`Field '${oldField.label}' (${oldField.id}) had existing responses but was removed.`);
        } else if (matchingNewField.type !== oldField.type) {
          warnings.push(
            `Field '${oldField.label}' (${oldField.id}) had existing responses and its type was changed from '${oldField.type}' to '${matchingNewField.type}'.`
          );
        }
      }
    }
  }

  const updatedForm = await Form.findOneAndUpdate(
    { _id: formId, ownerId: userId, revision: expectedRevision },
    {
      $set: { fields: normalizedFields },
      $inc: { revision: 1 },
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedForm) {
    const current = await Form.findOne({ _id: formId, ownerId: userId });
    if (!current) throw new NotFoundError('Form not found.');
    throw new PreconditionFailedError(
      'The form has been modified by another request. Please reload and try again.',
      [{ currentRevision: current.revision }]
    );
  }

  return {
    form: updatedForm.toJSON(),
    warnings,
  };
}

/**
 * Replace the entire theme of a form.
 * Enforces If-Match header requirement.
 * @param {string} userId
 * @param {string} formId
 * @param {object} theme
 * @param {string} ifMatch
 * @returns {Promise<{ theme: object, revision: number }>}
 */
export async function updateTheme(userId, formId, theme, ifMatch) {
  if (ifMatch === undefined || ifMatch === null || ifMatch === '') {
    throw new PreconditionRequiredError('The If-Match header is required for updating form theme.');
  }

  const cleaned = String(ifMatch).replace(/^W\//, '').replace(/^"|"$/g, '');
  const expectedRevision = parseInt(cleaned, 10);
  if (Number.isNaN(expectedRevision)) {
    throw new PreconditionRequiredError('Invalid If-Match revision header.');
  }

  const updatedForm = await Form.findOneAndUpdate(
    { _id: formId, ownerId: userId, revision: expectedRevision },
    {
      $set: { theme },
      $inc: { revision: 1 },
    },
    { returnDocument: 'after', runValidators: true }
  );

  if (!updatedForm) {
    const current = await Form.findOne({ _id: formId, ownerId: userId });
    if (!current) throw new NotFoundError('Form not found.');
    throw new PreconditionFailedError(
      'The form has been modified by another request. Please reload and try again.',
      [{ currentRevision: current.revision }]
    );
  }

  return {
    theme: updatedForm.theme,
    revision: updatedForm.revision,
  };
}

/**
 * Verify form meets all publication prerequisites.
 * Checks title, non-empty fields, valid selection options.
 * @param {object} form
 * @returns {{ isValid: boolean, issues: Array<{ path: string, message: string }> }}
 */
export function checkPublishPrerequisites(form) {
  const issues = [];

  if (!form.title || !form.title.trim()) {
    issues.push({ path: 'title', message: 'Form must have a non-empty title.' });
  }

  if (!form.fields || form.fields.length === 0) {
    issues.push({ path: 'fields', message: 'Form must have at least one field to be published.' });
  } else {
    for (let i = 0; i < form.fields.length; i += 1) {
      const field = form.fields[i];
      if (!field.label || !field.label.trim()) {
        issues.push({ path: `fields[${i}].label`, message: `Field at position ${i} must have a label.` });
      }
      if (SELECTION_TYPES.includes(field.type)) {
        if (!field.options || !Array.isArray(field.options) || field.options.length === 0) {
          issues.push({
            path: `fields[${i}].options`,
            message: `Selection field '${field.label || i}' must have at least one option.`,
          });
        }
      }
    }
  }

  return {
    isValid: issues.length === 0,
    issues,
  };
}

/**
 * Publish a form. Validates publication prerequisites.
 * Idempotent if form is already published.
 * @param {string} userId
 * @param {string} formId
 */
export async function publishForm(userId, formId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  // Idempotent: return existing publication details if already published
  if (form.status === 'published') {
    return {
      id: form._id.toString(),
      status: form.status,
      visibility: form.visibility,
      slug: form.slug,
      publicPath: `/f/${form.slug}`,
      publishedAt: form.publishedAt,
    };
  }

  const { isValid, issues } = checkPublishPrerequisites(form);
  if (!isValid) {
    throw new UnprocessableError(
      'Form does not meet publication prerequisites.',
      issues
    );
  }

  form.status = 'published';
  if (!form.publishedAt) {
    form.publishedAt = new Date();
  }
  await form.save();

  return {
    id: form._id.toString(),
    status: form.status,
    visibility: form.visibility,
    slug: form.slug,
    publicPath: `/f/${form.slug}`,
    publishedAt: form.publishedAt,
  };
}

/**
 * Unpublish a form (sets status back to draft).
 * Blocks future submissions immediately.
 * Idempotent if form is already draft.
 * @param {string} userId
 * @param {string} formId
 */
export async function unpublishForm(userId, formId) {
  const form = await Form.findOne({ _id: formId, ownerId: userId });
  if (!form) {
    throw new NotFoundError('Form not found.');
  }

  if (form.status === 'draft') {
    return {
      id: form._id.toString(),
      status: 'draft',
    };
  }

  form.status = 'draft';
  await form.save();

  return {
    id: form._id.toString(),
    status: 'draft',
  };
}


