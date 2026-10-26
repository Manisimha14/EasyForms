import React from 'react';
import { NavLink } from 'react-router-dom';
import { Edit3, Inbox, BarChart2 } from 'lucide-react';

export function FormNavTabs({ formId, responseCount }) {
  if (!formId) return null;

  return (
    <nav className="inline-flex items-center p-1 bg-stone-100 rounded-xl border border-stone-200/80 shadow-2xs">
      <NavLink
        to={`/forms/${formId}/edit`}
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isActive
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`
        }
      >
        <Edit3 className="w-3.5 h-3.5" />
        <span>Builder</span>
      </NavLink>

      <NavLink
        to={`/forms/${formId}/responses`}
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isActive
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`
        }
      >
        <Inbox className="w-3.5 h-3.5" />
        <span>Responses</span>
        {typeof responseCount === 'number' && (
          <span className="ml-1 px-1.5 py-0.2 rounded-full text-2xs font-bold bg-orange-100 text-orange-700">
            {responseCount}
          </span>
        )}
      </NavLink>

      <NavLink
        to={`/forms/${formId}/analytics`}
        className={({ isActive }) =>
          `flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            isActive
              ? 'bg-white text-orange-600 shadow-xs'
              : 'text-stone-600 hover:text-stone-900 hover:bg-stone-50'
          }`
        }
      >
        <BarChart2 className="w-3.5 h-3.5" />
        <span>Analytics</span>
      </NavLink>
    </nav>
  );
}
