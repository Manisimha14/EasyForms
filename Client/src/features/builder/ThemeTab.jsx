import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Input } from '../../components/ui/Input';
import { ALLOWED_FONT_FAMILIES, PRESET_THEMES } from '../../lib/constants';
import { getContrastTextColor } from '../../lib/format';
import { Palette, Check, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

export function ThemeTab({ theme, onSaveTheme, isSaving }) {
  const [currentTheme, setCurrentTheme] = useState({
    name: theme?.name || 'default',
    primaryColor: theme?.primaryColor || '#F97316',
    backgroundColor: theme?.backgroundColor || '#FFFFFF',
    fontFamily: theme?.fontFamily || 'Inter',
  });

  const contrastColor = getContrastTextColor(currentTheme.backgroundColor);

  const applyPreset = (preset) => {
    setCurrentTheme({
      name: preset.name,
      primaryColor: preset.primaryColor,
      backgroundColor: preset.backgroundColor,
      fontFamily: preset.fontFamily,
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSaveTheme(currentTheme);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
      {/* Theme Settings Form */}
      <div className="lg:col-span-5 space-y-6">
        <Card>
          <div className="flex items-center gap-2.5 pb-4 mb-4 border-b border-slate-100">
            <Palette className="w-5 h-5 text-primary-600" />
            <div>
              <h3 className="font-semibold text-slate-900 text-base">
                Theme Customization
              </h3>
              <p className="text-xs text-slate-500">
                Customise colors and typography for your public form
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Presets */}
            <div>
              <label className="text-xs font-semibold text-slate-700 uppercase tracking-wider block mb-2">
                Curated Presets
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PRESET_THEMES.map((p) => {
                  const isSelected =
                    currentTheme.primaryColor === p.primaryColor &&
                    currentTheme.backgroundColor === p.backgroundColor;
                  return (
                    <button
                      key={p.name}
                      type="button"
                      onClick={() => applyPreset(p)}
                      className={`flex items-center gap-2.5 p-2 rounded-lg border text-left transition-all ${
                        isSelected
                          ? 'border-primary-500 bg-primary-50/50 ring-1 ring-primary-500'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div className="flex items-center -space-x-1 shrink-0">
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: p.primaryColor }}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: p.backgroundColor }}
                        />
                      </div>
                      <span className="text-xs font-medium text-slate-700 truncate">
                        {p.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Primary Color */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Primary Brand Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentTheme.primaryColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 cursor-pointer shrink-0"
                />
                <Input
                  value={currentTheme.primaryColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, primaryColor: e.target.value })
                  }
                  placeholder="#F97316"
                  maxLength={7}
                  className="font-mono text-sm uppercase"
                />
              </div>
            </div>

            {/* Background Color */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Background Canvas Color
              </label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  value={currentTheme.backgroundColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, backgroundColor: e.target.value })
                  }
                  className="w-10 h-10 rounded-lg border border-slate-200 p-0.5 cursor-pointer shrink-0"
                />
                <Input
                  value={currentTheme.backgroundColor}
                  onChange={(e) =>
                    setCurrentTheme({ ...currentTheme, backgroundColor: e.target.value })
                  }
                  placeholder="#FFFFFF"
                  maxLength={7}
                  className="font-mono text-sm uppercase"
                />
              </div>
            </div>

            {/* Font Family Allowlist */}
            <div>
              <label className="text-sm font-medium text-slate-700 block mb-1.5">
                Typography Font
              </label>
              <select
                value={currentTheme.fontFamily}
                onChange={(e) =>
                  setCurrentTheme({ ...currentTheme, fontFamily: e.target.value })
                }
                className="w-full px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:border-primary-500"
              >
                {ALLOWED_FONT_FAMILIES.map((font) => (
                  <option key={font} value={font} style={{ fontFamily: font }}>
                    {font}
                  </option>
                ))}
              </select>
            </div>

            <Button
              type="submit"
              variant="primary"
              className="w-full"
              isLoading={isSaving}
            >
              Save Theme Changes
            </Button>
          </form>
        </Card>
      </div>

      {/* Live Preview Container */}
      <div className="lg:col-span-7">
        <div className="sticky top-6 space-y-2">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-500 uppercase tracking-wider">
            <span>Live Respondent Preview</span>
            <span>Contrast: {contrastColor === '#FFFFFF' ? 'Light on Dark' : 'Dark on Light'}</span>
          </div>

          <div
            className="rounded-2xl border border-slate-300/80 p-8 shadow-card transition-all min-h-[460px] flex flex-col justify-between"
            style={{
              backgroundColor: currentTheme.backgroundColor,
              fontFamily: currentTheme.fontFamily,
              color: contrastColor,
            }}
          >
            <div className="space-y-6 max-w-lg mx-auto w-full">
              {/* Form Title */}
              <div className="space-y-1">
                <h1 className="text-2xl font-bold tracking-tight">
                  Customer Experience Survey
                </h1>
                <p className="text-sm opacity-80">
                  Please share your thoughts with us.
                </p>
              </div>

              {/* Sample Short Text Question */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium flex items-center gap-1">
                  What is your name?
                  <span style={{ color: currentTheme.primaryColor }}>*</span>
                </label>
                <input
                  type="text"
                  placeholder="Jane Doe"
                  disabled
                  className="w-full px-3.5 py-2 text-sm rounded-lg border bg-white/90 text-slate-900 border-slate-300"
                />
              </div>

              {/* Sample Rating Question */}
              <div className="space-y-1.5">
                <label className="text-sm font-medium">
                  How would you rate your overall experience?
                </label>
                <div className="flex items-center gap-2 pt-1">
                  {[1, 2, 3, 4, 5].map((num) => (
                    <button
                      key={num}
                      type="button"
                      disabled
                      className="w-10 h-10 rounded-lg font-bold text-sm flex items-center justify-center transition-all"
                      style={
                        num === 5
                          ? { backgroundColor: currentTheme.primaryColor, color: '#FFFFFF' }
                          : { backgroundColor: 'rgba(0,0,0,0.06)', color: contrastColor }
                      }
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="button"
                  disabled
                  className="px-6 py-2.5 rounded-lg font-medium text-white text-sm shadow-sm"
                  style={{ backgroundColor: currentTheme.primaryColor }}
                >
                  Submit Response
                </button>
              </div>
            </div>

            <div className="text-center pt-8 text-xs opacity-50">
              Powered by Easy Forms
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
