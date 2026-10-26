import React from 'react';

/**
 * Parses inline formatting like **bold**, *italic*, `code`.
 */
function renderInlineFormatting(text) {
  if (!text) return null;

  // Split on **bold**, *italic*, `code`
  // Tokenize regex: (**.*?**|`.*?`|\*.*?\*)
  const tokens = [];
  let remaining = text;

  const regex = /(\*\*.*?\*\*|`.*?`|\*[^*]+\*)/g;
  let lastIndex = 0;
  let match;

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      tokens.push({ type: 'text', val: text.substring(lastIndex, match.index) });
    }

    const token = match[0];
    if (token.startsWith('**') && token.endsWith('**')) {
      tokens.push({ type: 'bold', val: token.slice(2, -2) });
    } else if (token.startsWith('`') && token.endsWith('`')) {
      tokens.push({ type: 'code', val: token.slice(1, -1) });
    } else if (token.startsWith('*') && token.endsWith('*')) {
      tokens.push({ type: 'italic', val: token.slice(1, -1) });
    }

    lastIndex = regex.lastIndex;
  }

  if (lastIndex < text.length) {
    tokens.push({ type: 'text', val: text.substring(lastIndex) });
  }

  return tokens.map((t, idx) => {
    if (t.type === 'bold') {
      return (
        <strong key={idx} className="font-semibold text-stone-900">
          {t.val}
        </strong>
      );
    }
    if (t.type === 'italic') {
      return (
        <em key={idx} className="italic text-stone-700">
          {t.val}
        </em>
      );
    }
    if (t.type === 'code') {
      return (
        <code
          key={idx}
          className="px-1.5 py-0.5 rounded bg-stone-100 text-orange-700 font-mono text-[11px]"
        >
          {t.val}
        </code>
      );
    }
    return <span key={idx}>{t.val}</span>;
  });
}

/**
 * Beautiful, clean Markdown content renderer for Formly AI chat messages.
 */
export function MarkdownContent({ content }) {
  if (!content) return null;

  const lines = content.split('\n');
  const elements = [];
  let listItems = [];
  let listType = null; // 'ul' | 'ol'

  const flushList = () => {
    if (listItems.length > 0) {
      if (listType === 'ol') {
        elements.push(
          <ol key={`ol-${elements.length}`} className="space-y-1 my-1.5 pl-1 list-none">
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-stone-800 leading-relaxed">
                <span className="font-bold text-orange-600 text-[11px] shrink-0 mt-0.5">
                  {item.number}.
                </span>
                <span className="flex-1">{renderInlineFormatting(item.text)}</span>
              </li>
            ))}
          </ol>
        );
      } else {
        elements.push(
          <ul key={`ul-${elements.length}`} className="space-y-1 my-1.5 pl-1 list-none">
            {listItems.map((item, i) => (
              <li key={i} className="flex items-start gap-2 text-stone-800 leading-relaxed">
                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0 mt-2" />
                <span className="flex-1">{renderInlineFormatting(item.text)}</span>
              </li>
            ))}
          </ul>
        );
      }
      listItems = [];
      listType = null;
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();

    // Empty line
    if (!trimmed) {
      flushList();
      continue;
    }

    // Headers
    if (trimmed.startsWith('#### ')) {
      flushList();
      elements.push(
        <h5
          key={`h4-${elements.length}`}
          className="text-xs font-bold text-stone-800 uppercase tracking-wider mt-2.5 mb-1"
        >
          {renderInlineFormatting(trimmed.slice(5))}
        </h5>
      );
      continue;
    }

    if (trimmed.startsWith('### ')) {
      flushList();
      elements.push(
        <h4
          key={`h3-${elements.length}`}
          className="text-sm font-bold text-stone-900 tracking-tight mt-3 mb-1.5 flex items-center gap-1.5"
        >
          {renderInlineFormatting(trimmed.slice(4))}
        </h4>
      );
      continue;
    }

    if (trimmed.startsWith('## ')) {
      flushList();
      elements.push(
        <h3
          key={`h2-${elements.length}`}
          className="text-base font-bold text-stone-900 tracking-tight mt-3 mb-1.5"
        >
          {renderInlineFormatting(trimmed.slice(3))}
        </h3>
      );
      continue;
    }

    // Unordered List (- or *)
    const ulMatch = trimmed.match(/^[-*]\s+(.*)$/);
    if (ulMatch) {
      if (listType && listType !== 'ul') flushList();
      listType = 'ul';
      listItems.push({ text: ulMatch[1] });
      continue;
    }

    // Ordered List (1. 2.)
    const olMatch = trimmed.match(/^(\d+)\.\s+(.*)$/);
    if (olMatch) {
      if (listType && listType !== 'ol') flushList();
      listType = 'ol';
      listItems.push({ number: olMatch[1], text: olMatch[2] });
      continue;
    }

    // Blockquote (> )
    if (trimmed.startsWith('> ')) {
      flushList();
      elements.push(
        <blockquote
          key={`quote-${elements.length}`}
          className="border-l-3 border-orange-400 pl-3 my-2 text-stone-600 italic text-xs"
        >
          {renderInlineFormatting(trimmed.slice(2))}
        </blockquote>
      );
      continue;
    }

    // Regular paragraph
    flushList();
    elements.push(
      <p key={`p-${elements.length}`} className="my-1.5 leading-relaxed text-stone-800">
        {renderInlineFormatting(trimmed)}
      </p>
    );
  }

  flushList();

  return <div className="space-y-1 text-xs">{elements}</div>;
}
