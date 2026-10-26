// src/services/ai.service.js
// AI Form Generation & Response Analysis Service
// Supports Google Gemini as primary, Groq as fallback, and smart offline heuristics when keys are not configured.

import { env } from '../config/env.js';
import { logger } from '../config/logger.js';
import { nanoid } from 'nanoid';

const SUPPORTED_FIELD_TYPES = [
  'short_text',
  'long_text',
  'number',
  'yes_no',
  'email',
  'single_select',
  'multi_select',
  'checkbox',
  'dropdown',
  'rating',
  'date',
];

/**
 * Clean and parse raw JSON string from an AI model response.
 */
function extractJsonFromText(rawText) {
  if (!rawText) return null;
  let text = rawText.trim();
  // Strip markdown code fence if present
  if (text.startsWith('```')) {
    text = text.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }
  try {
    return JSON.parse(text);
  } catch {
    // Try to find first '{' and last '}'
    const start = text.indexOf('{');
    const end = text.lastIndexOf('}');
    if (start !== -1 && end !== -1 && end > start) {
      try {
        return JSON.parse(text.slice(start, end + 1));
      } catch {
        return null;
      }
    }
    return null;
  }
}

/**
 * Validate and sanitize generated fields to match Easy Forms schema.
 */
function sanitizeGeneratedFields(fields) {
  if (!Array.isArray(fields)) return [];

  return fields
    .map((f, index) => {
      let type = typeof f.type === 'string' ? f.type.toLowerCase().trim() : 'short_text';
      if (!SUPPORTED_FIELD_TYPES.includes(type)) {
        if (type.includes('choice') || type.includes('radio') || type.includes('select')) {
          type = 'single_select';
        } else if (type.includes('check') || type.includes('multi')) {
          type = 'multi_select';
        } else if (type.includes('text') || type.includes('string')) {
          type = 'short_text';
        } else if (type.includes('number') || type.includes('int') || type.includes('age')) {
          type = 'number';
        } else if (type.includes('mail')) {
          type = 'email';
        } else if (type.includes('bool') || type.includes('yes')) {
          type = 'yes_no';
        } else if (type.includes('star') || type.includes('rate')) {
          type = 'rating';
        } else if (type.includes('time') || type.includes('date')) {
          type = 'date';
        } else {
          type = 'short_text';
        }
      }

      const label = (f.label || `Question ${index + 1}`).trim().slice(0, 100);
      const placeholder = (f.placeholder || '').trim().slice(0, 200);
      const description = (f.description || '').trim().slice(0, 500);

      const fieldObj = {
        id: `fld_${nanoid(8)}`,
        label,
        type,
        required: Boolean(f.required),
        placeholder,
        description,
        order: index,
      };

      if (['single_select', 'multi_select', 'dropdown'].includes(type)) {
        const options = Array.isArray(f.options)
          ? f.options.map((o) => String(o).trim()).filter((o) => o.length > 0)
          : ['Option 1', 'Option 2', 'Option 3'];
        fieldObj.options = options.length > 0 ? options.slice(0, 20) : ['Option 1', 'Option 2'];
      }

      if (type === 'rating') {
        fieldObj.validation = { min: 1, max: 5 };
      }

      return fieldObj;
    })
    .slice(0, 50);
}

/**
 * Offline smart generator: generates realistic forms when neither Gemini nor Groq keys are configured.
 */
function generateOfflineForm(prompt) {
  const p = prompt.toLowerCase();
  let title = 'Custom Form';
  let description = 'Please complete the questions below.';
  const fields = [];

  // 1. Food & Dietary Preferences
  if (
    p.includes('food') ||
    p.includes('diet') ||
    p.includes('eat') ||
    p.includes('meal') ||
    p.includes('cuisine') ||
    p.includes('catering') ||
    p.includes('restaurant') ||
    p.includes('nutrition') ||
    p.includes('allergy') ||
    p.includes('allergies')
  ) {
    title = 'Food & Dietary Preferences Survey';
    description = 'Help us plan your meals by sharing your dietary requirements, food preferences, and any allergies.';
    fields.push(
      { label: 'Full Name', type: 'short_text', required: true, placeholder: 'e.g. Alex Johnson' },
      {
        label: 'Primary Dietary Preference',
        type: 'single_select',
        required: true,
        options: [
          'Vegetarian',
          'Vegan (Plant-Based)',
          'Non-Vegetarian',
          'Pescatarian (Fish & Seafood)',
          'Halal',
          'Kosher',
          'Gluten-Free',
          'No Restrictions (Anything)',
        ],
      },
      {
        label: 'Food Allergies & Intolerances (Select all that apply)',
        type: 'multi_select',
        required: true,
        options: [
          'Peanuts & Tree Nuts',
          'Dairy & Lactose',
          'Shellfish & Crustaceans',
          'Gluten / Celiac',
          'Eggs',
          'Soy',
          'None / No Allergies',
        ],
      },
      {
        label: 'Preferred Spice Tolerance Level',
        type: 'single_select',
        required: true,
        options: ['Mild (Little to no spice)', 'Medium (Balanced flavor)', 'Hot & Spicy', 'Extra Hot / Fiery'],
      },
      {
        label: 'Favorite Cuisines',
        type: 'multi_select',
        required: false,
        options: [
          'Italian (Pasta, Pizza)',
          'Mexican & Tex-Mex',
          'Indian & South Asian',
          'Chinese & Pan-Asian',
          'Mediterranean & Greek',
          'Japanese (Sushi, Ramen)',
          'American & Continental',
        ],
      },
      {
        label: 'Ingredients or foods you strongly dislike or avoid',
        type: 'short_text',
        required: false,
        placeholder: 'e.g. Cilantro, mushrooms, bell peppers, olives',
      },
      {
        label: 'Preferred Beverage / Drink Options',
        type: 'single_select',
        required: false,
        options: ['Sparkling / Still Water', 'Fresh Fruit Juice', 'Coffee / Espresso', 'Herbal Tea', 'Soda / Soft Drinks'],
      },
      {
        label: 'Additional catering notes or special preparation requests',
        type: 'long_text',
        required: false,
        placeholder: 'Any other kitchen or preparation guidelines...',
      }
    );
  } else if (p.includes('college') || p.includes('event') || p.includes('registration') || p.includes('symposium') || p.includes('hackathon')) {
    title = p.includes('college') ? 'College Event Registration' : 'Event Registration Form';
    description = 'Register your attendance and details for the upcoming event.';
    fields.push(
      { label: 'Full Name', type: 'short_text', required: true, placeholder: 'e.g. John Doe' },
      { label: 'College / Institute Email', type: 'email', required: true, placeholder: 'student@college.edu' },
      {
        label: 'Department / Major',
        type: 'dropdown',
        required: true,
        options: ['Computer Science', 'Information Technology', 'Electrical & Electronics', 'Mechanical Engineering', 'Business & Management', 'Other'],
      },
      {
        label: 'Year of Study',
        type: 'single_select',
        required: true,
        options: ['1st Year', '2nd Year', '3rd Year', 'Final Year', 'Postgraduate'],
      },
      {
        label: 'Attendance Preference',
        type: 'single_select',
        required: true,
        options: ['In-Person on Campus', 'Virtual / Online'],
      },
      {
        label: 'Do you require lunch or refreshments?',
        type: 'yes_no',
        required: true,
      },
      {
        label: 'Special Dietary or Accessibility Needs',
        type: 'short_text',
        required: false,
        placeholder: 'e.g. Vegetarian, wheelchair access',
      },
      {
        label: 'Any questions or topics you hope to cover?',
        type: 'long_text',
        required: false,
        placeholder: 'Share your expectations for the session...',
      }
    );
  } else if (p.includes('feedback') || p.includes('satisfaction') || p.includes('nps')) {
    title = 'Customer Feedback & Satisfaction Survey';
    description = 'Help us improve our service by sharing your honest feedback.';
    fields.push(
      { label: 'Overall Experience Rating', type: 'rating', required: true },
      {
        label: 'How easy was it to use our product/service?',
        type: 'single_select',
        required: true,
        options: ['Very Easy', 'Somewhat Easy', 'Neutral', 'Difficult', 'Very Difficult'],
      },
      { label: 'What feature did you find most valuable?', type: 'short_text', required: true },
      { label: 'What could we improve or add in the future?', type: 'long_text', required: false },
      { label: 'Would you recommend us to a colleague or friend?', type: 'yes_no', required: true },
      { label: 'Email for follow-up (optional)', type: 'email', required: false, placeholder: 'you@example.com' }
    );
  } else if (p.includes('job') || p.includes('application') || p.includes('career') || p.includes('hiring')) {
    title = 'Job Application Form';
    description = 'Apply to join our team. We review submissions within 3 business days.';
    fields.push(
      { label: 'Full Legal Name', type: 'short_text', required: true, placeholder: 'e.g. Jane Smith' },
      { label: 'Email Address', type: 'email', required: true, placeholder: 'jane@example.com' },
      { label: 'Phone Number', type: 'short_text', required: true, placeholder: '+1 234 567 8900' },
      {
        label: 'Role Applied For',
        type: 'dropdown',
        required: true,
        options: ['Full Stack Developer', 'Frontend Engineer', 'Backend Engineer', 'Product Designer', 'DevOps / Cloud Specialist'],
      },
      { label: 'Portfolio or GitHub Profile URL', type: 'short_text', required: false, placeholder: 'https://...' },
      { label: 'Years of Relevant Experience', type: 'number', required: true, placeholder: '3' },
      { label: 'Earliest Available Start Date', type: 'date', required: true },
      { label: 'Brief introduction / Cover note', type: 'long_text', required: true, placeholder: 'Tell us about your background and why you are excited for this role...' }
    );
  } else if (p.includes('quiz') || p.includes('assessment') || p.includes('test')) {
    title = 'Knowledge Check & Quiz';
    description = 'Test your understanding with these questions.';
    fields.push(
      { label: 'Participant Name', type: 'short_text', required: true },
      { label: 'Student / Employee ID', type: 'short_text', required: true },
      {
        label: 'Question 1: What is the main purpose of an index in a database?',
        type: 'single_select',
        required: true,
        options: ['Speed up data retrieval queries', 'Encrypt sensitive fields', 'Compress image assets', 'Enforce user authentication'],
      },
      {
        label: 'Question 2: Select all protocols that use TLS/SSL for secure transport:',
        type: 'multi_select',
        required: true,
        options: ['HTTPS (Port 443)', 'SMTPS (Port 465)', 'Plain HTTP (Port 80)', 'FTP (Port 21)'],
      },
      { label: 'Explain the difference between authentication and authorization in one paragraph:', type: 'long_text', required: true },
      { label: 'Rate your confidence in today’s material:', type: 'rating', required: true }
    );
  } else {
    // Dynamic entity and requirement extraction
    title = prompt.length > 50 ? prompt.slice(0, 50) + '...' : prompt;
    description = `Please fill out this form regarding ${prompt}.`;
    
    // Always start with Name and Email
    fields.push(
      { label: 'Full Name', type: 'short_text', required: true, placeholder: 'Your full name' },
      { label: 'Email Address', type: 'email', required: true, placeholder: 'name@example.com' }
    );

    // Check for specific requested attributes in prompt
    if (p.includes('department') || p.includes('major') || p.includes('role') || p.includes('category')) {
      fields.push({
        label: 'Department / Category',
        type: 'dropdown',
        required: true,
        options: ['Engineering', 'Design & Creative', 'Marketing & Sales', 'Operations & Support', 'Management', 'Other'],
      });
    }

    if (p.includes('preference') || p.includes('attendance') || p.includes('choice') || p.includes('option')) {
      fields.push({
        label: 'Primary Preference / Selection',
        type: 'single_select',
        required: true,
        options: ['Option A (Standard)', 'Option B (Enhanced)', 'Option C (Custom / Flexible)'],
      });
    }

    if (p.includes('date') || p.includes('time') || p.includes('schedule') || p.includes('when')) {
      fields.push({
        label: 'Preferred Date or Availability',
        type: 'date',
        required: false,
      });
    }

    if (p.includes('rating') || p.includes('score') || p.includes('experience') || p.includes('satisfaction')) {
      fields.push({
        label: 'Overall Experience Rating',
        type: 'rating',
        required: true,
        validation: { min: 1, max: 5 },
      });
    }

    // Always finish with details / feedback
    fields.push({
      label: 'Additional Comments or Notes',
      type: 'long_text',
      required: false,
      placeholder: 'Please share any specific details or notes here...',
    });
  }

  return {
    title,
    description,
    theme: {
      primaryColor: '#F97316',
      backgroundColor: '#FFFDF9',
      fontFamily: 'Inter',
    },
    fields: sanitizeGeneratedFields(fields),
  };
}

/**
 * Generate a form using Google Gemini API.
 */
async function callGeminiForForm(prompt, apiKey) {
  const systemPrompt = `You are an expert form designer for Easy Forms.
Generate a high quality form matching the user prompt.
Respond ONLY with a valid JSON object with the following structure:
{
  "title": "Short descriptive form title",
  "description": "Clear helpful instructions for respondents",
  "theme": {
    "primaryColor": "#F97316",
    "backgroundColor": "#FFFDF9",
    "fontFamily": "Inter"
  },
  "fields": [
    {
      "label": "Question Label",
      "type": "short_text | long_text | number | yes_no | email | single_select | multi_select | checkbox | dropdown | rating | date",
      "required": true,
      "placeholder": "Optional input placeholder",
      "description": "Optional helper text",
      "options": ["Option 1", "Option 2"] // only for single_select, multi_select, dropdown
    }
  ]
}
Supported question types are strictly: short_text, long_text, number, yes_no, email, single_select, multi_select, checkbox, dropdown, rating, date.
Do not output markdown code blocks. Output raw JSON only.`;

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: controller.signal,
      body: JSON.stringify({
        contents: [
          {
            role: 'user',
            parts: [
              { text: `${systemPrompt}\n\nUser Prompt: ${prompt}` },
            ],
          },
        ],
        generationConfig: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      }),
    });

    clearTimeout(timeoutId);

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`Gemini API error (${res.status}): ${errorText}`);
    }

    const data = await res.json();
    const textContent = data.candidates?.[0]?.content?.parts?.[0]?.text;
    const parsed = extractJsonFromText(textContent);
    if (!parsed || !Array.isArray(parsed.fields)) {
      throw new Error('Gemini output could not be parsed as valid form JSON');
    }

    return {
      title: parsed.title || 'AI Generated Form',
      description: parsed.description || '',
      theme: {
        primaryColor: parsed.theme?.primaryColor || '#F97316',
        backgroundColor: parsed.theme?.backgroundColor || '#FFFDF9',
        fontFamily: parsed.theme?.fontFamily || 'Inter',
      },
      fields: sanitizeGeneratedFields(parsed.fields),
    };
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

/**
 * Generate a form using Groq API (Fallback).
 */
async function callGroqForForm(prompt, apiKey) {
  const url = 'https://api.groq.com/openai/v1/chat/completions';

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'openai/gpt-oss-120b',
      response_format: { type: 'json_object' },
      messages: [
        {
          role: 'system',
          content: `You are an expert form designer. Generate valid JSON only with keys: "title", "description", "theme", "fields". Supported field types: short_text, long_text, number, yes_no, email, single_select, multi_select, checkbox, dropdown, rating, date.`,
        },
        {
          role: 'user',
          content: `Generate an editable form for: ${prompt}`,
        },
      ],
      temperature: 0.3,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Groq API error (${res.status}): ${errorText}`);
  }

  const data = await res.json();
  const textContent = data.choices?.[0]?.message?.content;
  const parsed = extractJsonFromText(textContent);
  if (!parsed || !Array.isArray(parsed.fields)) {
    throw new Error('Groq output could not be parsed as valid form JSON');
  }

  return {
    title: parsed.title || 'AI Generated Form',
    description: parsed.description || '',
    theme: {
      primaryColor: parsed.theme?.primaryColor || '#F97316',
      backgroundColor: parsed.theme?.backgroundColor || '#FFFDF9',
      fontFamily: parsed.theme?.fontFamily || 'Inter',
    },
    fields: sanitizeGeneratedFields(parsed.fields),
  };
}

/**
 * Main service method: Generate form with Gemini -> Groq fallback -> Offline heuristic.
 */
export async function generateFormWithAI(userPrompt) {
  const prompt = (userPrompt || '').trim();
  if (!prompt) {
    throw new Error('Please provide a prompt describing the form you wish to create.');
  }

  // 1. Try Gemini
  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      logger.info({ prompt }, 'Calling Google Gemini for AI form generation');
      const form = await callGeminiForForm(prompt, geminiKey);
      return { form, provider: 'gemini' };
    } catch (err) {
      logger.warn({ error: err.message }, 'Gemini form generation failed, checking Groq fallback');
    }
  }

  // 2. Try Groq
  const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      logger.info({ prompt }, 'Calling Groq fallback for AI form generation');
      const form = await callGroqForForm(prompt, groqKey);
      return { form, provider: 'groq' };
    } catch (err) {
      logger.warn({ error: err.message }, 'Groq form generation failed, falling back to smart heuristic');
    }
  }

  // 3. Fallback Smart Rule Engine
  logger.info({ prompt }, 'Generating form using intelligent offline generator');
  const form = generateOfflineForm(prompt);
  return { form, provider: 'offline_engine' };
}

/**
 * Chat with AI about form responses (Gemini with Groq fallback).
 */
export async function chatWithResponsesAI({ form, responses, stats, messages }) {
  // Build concise summary of the dataset for the LLM
  const fieldsContext = (form.fields || []).map((f) => ({
    id: f.id,
    label: f.label,
    type: f.type,
    options: f.options,
  }));

  const sampleResponses = (responses || []).slice(0, 30).map((r, i) => {
    const answersMap = {};
    (r.answers || []).forEach((a) => {
      const field = (form.fields || []).find((f) => f.id === a.fieldId);
      const label = field ? field.label : a.fieldId;
      answersMap[label] = a.value;
    });
    return { responseNumber: i + 1, submittedAt: r.submittedAt, answers: answersMap };
  });

  const datasetContext = JSON.stringify({
    formTitle: form.title,
    formDescription: form.description,
    totalResponsesCount: responses.length,
    questions: fieldsContext,
    statisticsOverview: stats || {},
    sampleResponses,
  });

  const systemInstructions = `You are "Formly AI", an expert data insights and customer experience specialist.
You are assisting the form creator in analyzing the responses received for their form titled "${form.title}".
Analyze the dataset accurately, highlight trends, identify patterns, calculate percentages or averages where relevant, and offer practical, actionable recommendations.
Format your responses using clear GitHub-flavored markdown: bold key metrics, bullet points, headers, and quote highlights where appropriate.
Be encouraging, insightful, and concise.

Dataset:
${datasetContext}`;

  const geminiKey = env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;
  if (geminiKey) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);
    try {
      const contents = [
        {
          role: 'user',
          parts: [{ text: systemInstructions }],
        },
        ...messages.map((m) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        })),
      ];

      const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${geminiKey}`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          contents,
          generationConfig: { temperature: 0.3, maxOutputTokens: 1000 },
        }),
      });

      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (reply) {
          return { reply, provider: 'gemini' };
        }
      }
    } catch (err) {
      clearTimeout(timeoutId);
      logger.warn({ error: err.message }, 'Gemini responses chat failed, trying Groq fallback');
    }
  }

  const groqKey = env.GROQ_API_KEY || process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${groqKey}`,
        },
        body: JSON.stringify({
          model: 'openai/gpt-oss-120b',
          messages: [
            { role: 'system', content: systemInstructions },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          temperature: 0.3,
          max_tokens: 1000,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const reply = data.choices?.[0]?.message?.content;
        if (reply) {
          return { reply, provider: 'groq' };
        }
      }
    } catch (err) {
      logger.warn({ error: err.message }, 'Groq responses chat failed, falling back to local analysis');
    }
  }

  // Fallback Rule-Based Insights Engine
  const totalCount = responses.length;

  if (totalCount === 0) {
    return {
      reply: `### 📊 Response Overview for **${form.title}**\n\nNo responses have been submitted to this form yet.\n\n**Suggestions to get started:**\n- Ensure the form is published and set to *Open* under Availability.\n- Share the form URL or QR code with respondents via email or social links.\n- Test submitting a response using the *Live Preview* or public form link to verify submission recording.`,
      provider: 'insights_engine',
    };
  }

  let summaryReply = `### 📊 AI Response Analysis for **${form.title}**\n\n`;
  summaryReply += `- **Total Submissions:** ${totalCount} responses recorded.\n`;
  summaryReply += `- **Questions Configured:** ${form.fields?.length || 0} questions.\n\n`;

  // Compute breakdown on key fields
  const choiceBreakdowns = [];
  (form.fields || []).forEach((f) => {
    if (['single_select', 'multi_select', 'dropdown', 'yes_no'].includes(f.type)) {
      const counts = {};
      responses.forEach((r) => {
        const a = (r.answers || []).find((ans) => ans.fieldId === f.id);
        if (a && a.value !== undefined) {
          if (Array.isArray(a.value)) {
            a.value.forEach((v) => {
              counts[v] = (counts[v] || 0) + 1;
            });
          } else {
            const strVal = String(a.value);
            counts[strVal] = (counts[strVal] || 0) + 1;
          }
        }
      });
      choiceBreakdowns.push({ label: f.label, counts });
    }
  });

  if (choiceBreakdowns.length > 0) {
    summaryReply += `#### 📌 Key Distribution Breakdown:\n`;
    choiceBreakdowns.slice(0, 3).forEach((item) => {
      summaryReply += `**${item.label}:**\n`;
      const entries = Object.entries(item.counts);
      if (entries.length === 0) {
        summaryReply += `  - *No selections recorded yet.*\n`;
      } else {
        entries.forEach(([opt, count]) => {
          const pct = Math.round((count / totalCount) * 100);
          summaryReply += `  - **${opt}**: ${count} (${pct}%)\n`;
        });
      }
    });
    summaryReply += `\n`;
  }

  summaryReply += `#### 💡 Recommended Actions:\n`;
  summaryReply += `1. **Monitor High-Volume Options:** Focus resources on the most frequently selected preferences above.\n`;
  summaryReply += `2. **Address Open Text Feedback:** Review any specific suggestions submitted in text questions.\n`;
  summaryReply += `3. **Export to CSV:** Use the *Export CSV* action in the responses table to integrate with your reporting pipeline.\n`;

  return { reply: summaryReply, provider: 'insights_engine' };
}
