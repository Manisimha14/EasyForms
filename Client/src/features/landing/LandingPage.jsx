import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../auth/AuthProvider';
import { Button } from '../../components/ui/Button';
import {
  Sparkles,
  ArrowRight,
  Check,
  PlayCircle,
  FileText,
  Clock,
  Layers,
  Send,
  Plus,
  HelpCircle,
  BarChart2,
  Share2,
  Calendar,
  Lock,
  ChevronDown,
  ExternalLink,
  QrCode,
  Download,
  Users,
  ShieldCheck,
  Zap,
} from 'lucide-react';

export function LandingPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api/v1';
  const apiDocsUrl = apiBaseUrl.replace(/\/api\/v1\/?$/, '/api-docs');

  // Active option state for hero interactive card
  const [selectedHeroOption, setSelectedHeroOption] = useState(0);

  // FAQ accordion active state
  const [openFaqIndex, setOpenFaqIndex] = useState(0);

  // Header elevation on scroll
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const heroOptions = [
    { label: 'Design Systems Workshop (10:00 AM)', time: '10:00 AM' },
    { label: 'Product Strategy & Scaling (2:00 PM)', time: '2:00 PM' },
  ];

  const faqs = [
    {
      q: 'What is Easy Forms?',
      a: 'Easy Forms is a modern, full-stack form studio and response analytics platform. It lets creators, educators, and teams build polished forms in minutes, schedule availability windows, share via short links or QR codes, and analyze submissions with Formly AI.',
    },
    {
      q: 'How does Formly AI work?',
      a: 'Formly AI powers two core experiences: 1) Form Generation: describe your form in plain English (e.g., "Event registration with name, email, department, and diet preference") to generate editable questions and choices. 2) Response Analyst: an embedded AI chatbot that chats with you over your submitted responses to summarize trends, calculate percentages, and suggest next steps.',
    },
    {
      q: 'How does time-limited availability scheduling work?',
      a: 'You can configure exact start (startAt) and end (endAt) dates for any form. The platform automatically transitions form states between Scheduled, Open, and Closed, and displays a live countdown timer to respondents so they know exactly when the form opens or closes.',
    },
    {
      q: 'Can I view and export responses to CSV?',
      a: 'Yes! Every submission is recorded in real time and viewable in a paginated responses table with single-submission inspect drawers. You can stream download all submitted records directly to CSV with one click.',
    },
    {
      q: 'Do I need any coding or design skills?',
      a: 'None at all. Easy Forms is designed with an intuitive visual editor, 11 drag-and-drop question types, pre-built templates, and a warm orange-and-white SaaS aesthetic that looks professional out of the box.',
    },
    {
      q: 'How does QR code sharing work?',
      a: 'Every published form automatically generates a high-resolution, downloadable QR code. You can print it on event flyers, project it on presentation slides, or share it on social media for instant mobile submissions.',
    },
  ];

  const handleStart = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  return (
    <div className="min-h-full bg-[#FFFDF9] text-stone-800 antialiased flex flex-col noise-bg selection:bg-orange-500 selection:text-white">
      {/* ── STICKY TOP NAVIGATION ── */}
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-[#FFFDF9]/95 backdrop-blur-md shadow-xs border-b border-stone-200/80'
            : 'bg-[#FFFDF9]/80 backdrop-blur-sm border-b border-stone-200/50'
        }`}
      >
        <div className="h-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm shadow-xs shadow-orange-500/20 group-hover:scale-105 transition-transform">
              EF
            </div>
            <div>
              <span className="font-bold text-stone-900 tracking-tight text-base block leading-none">
                Easy Forms
              </span>
              <span className="text-[11px] font-medium text-stone-400 block mt-0.5">
                Form Studio
              </span>
            </div>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-1.5 p-1 rounded-xl bg-stone-100/70 border border-stone-200/60 backdrop-blur-sm">
            <a
              href="#features"
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-all"
            >
              Features
            </a>
            <a
              href="#how-it-works"
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-all"
            >
              How It Works
            </a>
            <a
              href="#templates"
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-all"
            >
              Templates
            </a>
            <a
              href="#faq"
              className="px-3 py-1.5 text-xs font-semibold text-stone-600 hover:text-stone-900 hover:bg-white rounded-lg transition-all"
            >
              FAQ
            </a>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1.5 text-xs font-semibold text-orange-700 hover:text-orange-900 hover:bg-orange-50 rounded-lg transition-all flex items-center gap-1"
            >
              API Docs
              <ExternalLink className="w-3 h-3" />
            </a>
          </nav>

          {/* Right Action Buttons */}
          <div className="flex items-center gap-3">
            {user ? (
              <Button
                variant="primary"
                size="sm"
                icon={ArrowRight}
                onClick={() => navigate('/dashboard')}
                className="shadow-xs"
              >
                Go to Dashboard
              </Button>
            ) : (
              <>
                <Link
                  to="/login"
                  className="hidden sm:inline-block text-xs font-semibold text-stone-600 hover:text-stone-900 px-3 py-2 rounded-lg hover:bg-stone-100/70 transition-colors"
                >
                  Sign in
                </Link>
                <Button
                  variant="primary"
                  size="sm"
                  icon={ArrowRight}
                  onClick={() => navigate('/register')}
                  className="shadow-xs"
                >
                  Get Started Free
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="w-full flex-1 pt-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col w-full">
          {/* ════ HERO SECTION ════ */}
          <section className="py-16 md:py-24 relative overflow-visible">
            {/* Ambient Motion Radial Glows */}
            <div className="absolute -top-32 right-1/4 w-[420px] h-[420px] bg-orange-500/15 rounded-full blur-[90px] pointer-events-none -z-10 animate-orb-1" />
            <div className="absolute top-1/2 -left-20 w-96 h-96 bg-amber-500/15 rounded-full blur-[80px] pointer-events-none -z-10 animate-orb-2" />

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
              {/* Left Column: Copy & Actions */}
              <div className="lg:col-span-5 flex flex-col items-start gap-6">
                {/* Eyebrow Pill */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200/80 shadow-2xs cursor-default">
                  <span className="w-2 h-2 rounded-full bg-orange-500 live-glow-pulse" />
                  <span className="text-2xs tracking-wider uppercase font-bold">
                    The simpler way to collect responses
                  </span>
                </div>

                {/* Main Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-[54px] lg:leading-[60px] text-stone-900 tracking-tight font-extrabold">
                  Create forms.{' '}
                  <span className="text-stone-900 block sm:inline">Collect insights.</span>{' '}
                  <span className="text-orange-600 underline decoration-orange-500/40 decoration-wavy decoration-2 inline-block">
                    Keep it simple.
                  </span>
                </h1>

                {/* Supporting Text */}
                <p className="text-base sm:text-lg text-stone-600 max-w-lg leading-relaxed">
                  Build beautiful forms in minutes, share them anywhere, and turn responses into
                  actionable insights—powered by <strong>Formly AI</strong>, availability scheduling,
                  and real-time analytics.
                </p>

                {/* CTA Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={handleStart}
                    className="magnetic-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-6 py-3.5 rounded-xl shadow-sm hover:shadow-md transition-all active:scale-[0.985] group cursor-pointer"
                  >
                    <span>Create Your First Form</span>
                    <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </button>
                  <a
                    href="#features"
                    className="magnetic-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 border border-stone-200 font-semibold text-sm px-6 py-3.5 rounded-xl shadow-2xs hover:shadow-xs transition-all group"
                  >
                    <PlayCircle className="w-4 h-4 text-orange-500 transition-transform duration-300 group-hover:scale-110" />
                    <span>Explore Features</span>
                  </a>
                </div>

                {/* Confidence Marker */}
                <div className="flex items-center gap-2.5 pt-1 text-stone-500">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shadow-2xs">
                    <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-stone-600">
                    11 question types • Formly AI assistant • 100% free & open
                  </span>
                </div>
              </div>

              {/* Right Column: Realistic 3D Tilt SaaS Canvas Mockup */}
              <div className="lg:col-span-7 relative">
                {/* Visual Backdrop Depth Element */}
                <div className="absolute -inset-2 bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-orange-400/20 rounded-3xl blur-2xl opacity-75" />

                {/* Floating Micro Badge 1 (Top Left) */}
                <div className="hidden sm:flex absolute -top-5 -left-6 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg animate-float-slow text-stone-800 text-xs font-medium">
                  <span className="flex h-6 w-6 rounded-xl bg-orange-100 text-orange-600 items-center justify-center text-xs font-bold">
                    ⚡
                  </span>
                  <span>
                    Formly AI Generation • <strong>&lt; 2 mins</strong>
                  </span>
                </div>

                {/* Floating Micro Badge 2 (Bottom Right) */}
                <div className="hidden sm:flex absolute -bottom-5 -right-5 z-20 items-center gap-2 px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg animate-float-alt text-stone-800 text-xs font-medium">
                  <span className="flex h-6 w-6 rounded-xl bg-emerald-100 text-emerald-700 items-center justify-center text-xs font-bold">
                    ✨
                  </span>
                  <span>
                    Availability Countdown • <strong>Automatic Open/Close</strong>
                  </span>
                </div>

                {/* Editor Window Container with 3D Tilt */}
                <div className="tilt-card relative bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
                  {/* Window Title Bar */}
                  <div className="px-5 py-3.5 bg-stone-50 border-b border-stone-200 flex items-center justify-between backdrop-blur-sm">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                      </div>
                      <span className="h-4 w-px bg-stone-200" />
                      <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-orange-500" />
                        <span className="text-xs font-bold text-stone-800 truncate max-w-[180px] sm:max-w-none">
                          Student Event Registration
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-stone-200/70 text-stone-600 text-2xs font-semibold">
                          Draft
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-stone-100 text-stone-700 text-2xs font-semibold cursor-pointer">
                        <span className="w-2 h-2 rounded-full bg-orange-500 live-glow-pulse" /> Live Preview
                      </span>
                      <button
                        type="button"
                        onClick={handleStart}
                        className="inline-flex items-center gap-1.5 bg-orange-500 hover:bg-orange-600 text-white text-xs px-3.5 py-1.5 rounded-lg shadow-xs transition-all font-semibold cursor-pointer"
                      >
                        <Send className="w-3 h-3" />
                        <span>Publish</span>
                      </button>
                    </div>
                  </div>

                  {/* Secondary Toolbar: Field Types Quick Add */}
                  <div className="px-5 py-2.5 bg-stone-50/70 border-b border-stone-200 flex items-center gap-2 overflow-x-auto scrollbar-none">
                    <span className="text-2xs text-stone-400 uppercase font-bold tracking-wider shrink-0 mr-1">
                      Add Block:
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-stone-700 text-2xs font-semibold border border-stone-200 shadow-2xs">
                        Text
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-stone-700 text-2xs font-semibold border border-stone-200 shadow-2xs">
                        Email
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-orange-50 text-orange-700 border border-orange-200 text-2xs font-bold shadow-2xs">
                        Choice
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-stone-700 text-2xs font-semibold border border-stone-200 shadow-2xs">
                        Rating
                      </span>
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white text-stone-700 text-2xs font-semibold border border-stone-200 shadow-2xs">
                        Date
                      </span>
                    </div>
                  </div>

                  {/* Editor Canvas Substrate */}
                  <div className="p-6 bg-stone-50/40 space-y-3.5">
                    {/* Question 1: Full Name */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                          <span>1. Full Name</span>
                          <span className="text-orange-500">*</span>
                        </label>
                        <span className="text-2xs text-stone-400 font-medium">Required</span>
                      </div>
                      <div className="px-3 py-2 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 text-xs flex items-center justify-between">
                        <span className="flex items-center">
                          e.g., Alex Morgan
                          <span className="typing-cursor ml-0.5 w-[2px] h-3.5 bg-orange-500 inline-block" />
                        </span>
                      </div>
                    </div>

                    {/* Question 2: Email */}
                    <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-2xs">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-semibold text-stone-800 flex items-center gap-1.5">
                          <span>2. Email Address</span>
                          <span className="text-orange-500">*</span>
                        </label>
                        <span className="text-2xs text-stone-400 font-medium">Required</span>
                      </div>
                      <div className="px-3 py-2 bg-stone-50 rounded-lg border border-stone-200 text-stone-600 text-xs flex items-center justify-between">
                        <span>alex@university.edu</span>
                      </div>
                    </div>

                    {/* Question 3: Multiple Choice (Interactive radio) */}
                    <div className="bg-white p-4 rounded-xl border-l-4 border-l-orange-500 border-y border-r border-stone-200 shadow-xs relative">
                      <div className="flex items-center justify-between mb-2.5">
                        <label className="text-xs font-bold text-stone-900 flex items-center gap-1.5">
                          <span>3. Which session do you prefer to attend?</span>
                          <span className="text-orange-500">*</span>
                        </label>
                        <span className="px-2 py-0.5 rounded text-2xs font-bold bg-orange-50 text-orange-700 border border-orange-200">
                          Active Block
                        </span>
                      </div>

                      {/* Interactive radio options */}
                      <div className="space-y-2">
                        {heroOptions.map((opt, idx) => {
                          const isActive = selectedHeroOption === idx;
                          return (
                            <div
                              key={idx}
                              onClick={() => setSelectedHeroOption(idx)}
                              className={`flex items-center gap-2.5 p-2 rounded-lg border cursor-pointer transition-all ${
                                isActive
                                  ? 'border-orange-500 bg-orange-50/50 shadow-2xs'
                                  : 'border-stone-200 bg-white hover:border-orange-300'
                              }`}
                            >
                              <span
                                className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 border ${
                                  isActive
                                    ? 'border-orange-500 border-2'
                                    : 'border-stone-300'
                                }`}
                              >
                                {isActive && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                              </span>
                              <span
                                className={`text-xs ${
                                  isActive ? 'text-stone-900 font-bold' : 'text-stone-600'
                                }`}
                              >
                                {opt.label}
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Status Footer Bar */}
                  <div className="px-5 py-2.5 bg-stone-50 border-t border-stone-200 flex items-center justify-between text-stone-500 text-2xs">
                    <span className="flex items-center gap-1.5 font-semibold text-emerald-700">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      Optimistic Concurrency Locking Enabled
                    </span>
                    <span>3 Questions • Est. time: 45 sec</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════ TRUST BAR / REAL SYSTEM METRICS STRIP ════ */}
          <section className="py-10 border-y border-stone-200/80 bg-stone-50/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8">
            <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-around gap-6 text-center">
              <div className="flex flex-col group cursor-default">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 transition-transform group-hover:scale-105 group-hover:text-orange-600">
                  11
                </span>
                <span className="text-2xs uppercase tracking-wider font-bold text-stone-500 mt-1">
                  Question Field Types
                </span>
              </div>
              <div className="h-8 w-px bg-stone-200 hidden md:block" />

              <div className="flex flex-col group cursor-default">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 transition-transform group-hover:scale-105 group-hover:text-orange-600">
                  177
                </span>
                <span className="text-2xs uppercase tracking-wider font-bold text-stone-500 mt-1">
                  Automated Tests (19 Suites)
                </span>
              </div>
              <div className="h-8 w-px bg-stone-200 hidden md:block" />

              <div className="flex flex-col group cursor-default">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 transition-transform group-hover:scale-105 group-hover:text-orange-600">
                  &lt; 2 mins
                </span>
                <span className="text-2xs uppercase tracking-wider font-bold text-stone-500 mt-1">
                  Average Build Time with Formly AI
                </span>
              </div>
              <div className="h-8 w-px bg-stone-200 hidden md:block" />

              <div className="flex flex-col group cursor-default">
                <span className="text-3xl sm:text-4xl font-extrabold tracking-tight text-stone-900 transition-transform group-hover:scale-105 group-hover:text-orange-600">
                  100%
                </span>
                <span className="text-2xs uppercase tracking-wider font-bold text-stone-500 mt-1">
                  Time-Limited Scheduling Control
                </span>
              </div>
            </div>
          </section>

          {/* ════ FEATURE HIGHLIGHTS SECTION ════ */}
          <section className="py-24" id="features">
            <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
              <span className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
                Designed for Clarity
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                Everything you need to make forms effortless.
              </h2>
              <p className="text-base text-stone-600 mt-3">
                From natural language generation to interactive AI analysis, Easy Forms keeps your
                workflow remarkably clean and fast.
              </p>
            </div>

            {/* 6 Feature Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <FileText className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Visual Form Studio
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Build distraction-free forms with 11 question types, live mobile & desktop preview
                    viewports, drag-and-drop reordering, and customizable placeholder limits.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>11 question types & live preview</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Feature 2 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <Sparkles className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Formly AI Generator
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Describe your form in plain natural language. Formly AI drafts questions,
                    prefills choices, assigns validations, and allows selective question insertion.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>Natural language prompt to form</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Feature 3 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <Clock className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Time-Limited Availability
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Set precise opening and closing timestamps. Forms automatically switch states
                    between Scheduled, Open, and Closed, with live countdown timers for respondents.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>Native startAt & endAt timers</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Feature 4 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <QrCode className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Share Anywhere & QR Codes
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Instantly publish with vanity short URLs (`/f/:slug`), generate downloadable QR
                    codes for print, and collect responses on any smartphone or tablet.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>Short link & auto-generated QR</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Feature 5 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <BarChart2 className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Live Response Analytics
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Visualize daily submission trends with Recharts, inspect question completion
                    rates, review distribution bars, and stream-export full CSV datasets.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>Velocity charts & CSV exports</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>

              {/* Feature 6 */}
              <div className="tilt-card bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-orange-50 text-orange-600 flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-all border border-orange-100 shadow-2xs">
                    <Users className="w-6 h-6" />
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Formly AI Response Analyst
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 leading-relaxed">
                    Chat interactively with Formly AI directly on your responses dashboard to detect
                    patterns, calculate percentages, and receive formatted insights without manual math.
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-stone-100 flex items-center gap-2 text-orange-600 text-xs font-semibold">
                  <span>Conversational survey intelligence</span>
                  <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </div>
          </section>

          {/* ════ HOW IT WORKS SECTION ════ */}
          <section
            className="py-24 bg-stone-50/60 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 border-y border-stone-200/80"
            id="how-it-works"
          >
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col items-center text-center max-w-2xl mx-auto mb-16">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2">
                  Simple 3-Step Flow
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                  From idea to insights in three simple steps.
                </h2>
                <p className="text-base text-stone-600 mt-2">
                  Launch full surveys, events, and feedback forms without technical headaches.
                </p>
              </div>

              {/* 3 Step Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 relative">
                {/* Step 1 */}
                <div className="relative z-10 flex flex-col bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-lg flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    01
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Create & Customize
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-6 flex-1">
                    Add questions with visual controls or prompt Formly AI in natural language to
                    generate the schema and choices automatically.
                  </p>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs space-y-1.5">
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>11 drag-and-drop question types</span>
                    </div>
                    <div className="flex items-center gap-2 text-stone-700">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />
                      <span>Optimistic concurrency revision checks</span>
                    </div>
                  </div>
                </div>

                {/* Step 2 */}
                <div className="relative z-10 flex flex-col bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-lg flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    02
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Schedule & Share
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-6 flex-1">
                    Set availability start and end deadlines, publish with a single click, and share
                    the short URL or printable QR code.
                  </p>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 text-xs flex items-center justify-between">
                    <span className="text-stone-500 font-mono text-2xs truncate">
                      easyforms.local/f/event-2026
                    </span>
                    <span className="px-2 py-0.5 rounded bg-orange-100 text-orange-700 font-bold text-2xs uppercase">
                      Active
                    </span>
                  </div>
                </div>

                {/* Step 3 */}
                <div className="relative z-10 flex flex-col bg-white p-7 rounded-2xl border border-stone-200 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all group">
                  <div className="w-12 h-12 rounded-full bg-orange-50 border border-orange-200 text-orange-600 font-bold text-lg flex items-center justify-center mb-5 group-hover:bg-orange-500 group-hover:text-white transition-colors">
                    03
                  </div>
                  <h3 className="text-lg font-bold text-stone-900 mb-2 group-hover:text-orange-600 transition-colors">
                    Analyze & Chat with Formly AI
                  </h3>
                  <p className="text-xs sm:text-sm text-stone-600 mb-6 flex-1">
                    Watch incoming responses populate in real time, view visual breakdown charts,
                    export to CSV, and chat with Formly AI for deeper insights.
                  </p>
                  <div className="p-3 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 text-emerald-600 font-bold">
                      <Check className="w-3.5 h-3.5" />
                      <span>Instant CSV Export</span>
                    </div>
                    <span className="text-stone-400 font-semibold text-2xs">Formly AI Chatbot</span>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════ PRODUCT SHOWCASE / LIVE RESPONSES HUB PREVIEW ════ */}
          <section className="py-24" id="responses-hub">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Live Response Hub
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mt-1">
                  Your responses, beautifully organized.
                </h2>
                <p className="text-base text-stone-600 mt-2 max-w-xl">
                  Easy Forms unifies form submissions and high-level analytics in one single workspace
                  without third-party plugins.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={handleStart}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-500 text-white font-semibold text-xs hover:bg-orange-600 transition shadow-xs cursor-pointer"
                >
                  <BarChart2 className="w-4 h-4" />
                  <span>Explore Live Analytics</span>
                </button>
              </div>
            </div>

            {/* Dashboard Workspace Mock Container */}
            <div className="bg-white border border-stone-200 rounded-2xl shadow-xl overflow-hidden">
              {/* Metric Strip */}
              <div className="p-6 bg-stone-50/70 border-b border-stone-200 grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-2xs text-stone-500 uppercase tracking-wider font-bold">
                    Total Submissions
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-stone-900">1,428</span>
                    <span className="text-emerald-600 text-xs font-bold flex items-center">
                      +14%
                    </span>
                  </div>
                  <span className="text-2xs text-stone-400 mt-0.5 block">vs. previous 7 days</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-2xs text-stone-500 uppercase tracking-wider font-bold">
                    Active Forms
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-stone-900">8</span>
                    <span className="text-stone-500 text-xs font-medium">All healthy</span>
                  </div>
                  <span className="text-2xs text-stone-400 mt-0.5 block">0 paused</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-2xs text-stone-500 uppercase tracking-wider font-bold">
                    Avg. Completion Rate
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-stone-900">87.4%</span>
                    <span className="text-orange-600 text-xs font-bold">Top 5%</span>
                  </div>
                  <span className="text-2xs text-stone-400 mt-0.5 block">Industry avg: 62%</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-stone-200 shadow-2xs">
                  <span className="text-2xs text-stone-500 uppercase tracking-wider font-bold">
                    Avg. Build Time
                  </span>
                  <div className="flex items-baseline gap-2 mt-1">
                    <span className="text-2xl font-bold text-stone-900">1m 45s</span>
                  </div>
                  <span className="text-2xs text-stone-400 mt-0.5 block">With Formly AI engine</span>
                </div>
              </div>

              {/* Chart & Table Area */}
              <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* Left: Response Velocity Chart with animated draw-in */}
                <div className="lg:col-span-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-bold text-stone-900">
                        Response Velocity
                      </span>
                      <span className="px-2.5 py-0.5 rounded-md bg-stone-100 text-stone-700 text-2xs font-bold">
                        Last 7 Days
                      </span>
                    </div>
                    <p className="text-xs text-stone-500 mb-4">
                      Daily submission count across all published forms.
                    </p>
                  </div>

                  {/* SVG Sparkline */}
                  <div className="w-full bg-stone-50/70 p-4 rounded-xl border border-stone-200 shadow-2xs">
                    <div className="h-44 w-full flex items-end">
                      <svg
                        className="w-full h-full overflow-visible"
                        fill="none"
                        preserveAspectRatio="none"
                        viewBox="0 0 350 120"
                      >
                        <defs>
                          <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                            <stop offset="0%" stopColor="#F97316" stopOpacity="0.32" />
                            <stop offset="100%" stopColor="#F97316" stopOpacity="0.0" />
                          </linearGradient>
                        </defs>
                        <path
                          d="M 0 100 Q 50 85 90 60 T 170 45 T 250 80 T 350 20 L 350 120 L 0 120 Z"
                          fill="url(#chartGradient)"
                        />
                        <path
                          className="chart-path-anim"
                          d="M 0 100 Q 50 85 90 60 T 170 45 T 250 80 T 350 20"
                          stroke="#F97316"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="3.5"
                        />
                        <circle cx="170" cy="45" fill="#FFFFFF" r="4" stroke="#F97316" strokeWidth="2.5" />
                        <circle cx="350" cy="20" fill="#FFFFFF" r="5" stroke="#F97316" strokeWidth="3" />
                      </svg>
                    </div>
                    <div className="flex justify-between items-center text-2xs text-stone-400 mt-3 pt-2 border-t border-stone-200">
                      <span>Mon</span>
                      <span>Tue</span>
                      <span>Wed</span>
                      <span>Thu</span>
                      <span>Fri</span>
                      <span>Sat</span>
                      <span className="text-orange-600 font-bold">Today (+248)</span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between text-xs text-stone-600">
                    <span className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-orange-500 live-glow-pulse" />
                      Peak window: 2:00 PM - 4:00 PM
                    </span>
                    <span className="font-semibold text-stone-800">100% Deliverability</span>
                  </div>
                </div>

                {/* Right: Active Forms Table */}
                <div className="lg:col-span-7 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-sm font-bold text-stone-900">
                      Active Forms Directory
                    </span>
                    <button
                      type="button"
                      onClick={handleStart}
                      className="text-orange-600 hover:text-orange-700 text-xs font-semibold inline-flex items-center gap-1 cursor-pointer"
                    >
                      <span>View all forms</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto border border-stone-200 rounded-xl shadow-2xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-stone-50 border-b border-stone-200 text-2xs font-bold text-stone-500 uppercase tracking-wider">
                          <th className="py-3 px-4">Form Name</th>
                          <th className="py-3 px-4">Status</th>
                          <th className="py-3 px-4">Responses</th>
                          <th className="py-3 px-4 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100 text-xs">
                        <tr className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-stone-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            Student Event Registration
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Live
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-bold">684</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-stone-400 hover:text-orange-600 cursor-pointer">
                              <ExternalLink className="w-4 h-4 inline" />
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-stone-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            Q3 Customer NPS Pulse
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Live
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-bold">412</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-stone-400 hover:text-orange-600 cursor-pointer">
                              <ExternalLink className="w-4 h-4 inline" />
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-stone-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-stone-300" />
                            Campus Scholarship Survey
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-stone-100 text-stone-600 border border-stone-200">
                              Draft
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-bold">32</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-stone-400 hover:text-orange-600 cursor-pointer">
                              <ExternalLink className="w-4 h-4 inline" />
                            </span>
                          </td>
                        </tr>
                        <tr className="hover:bg-stone-50/60 transition-colors">
                          <td className="py-3 px-4 font-semibold text-stone-900 flex items-center gap-2">
                            <span className="w-2 h-2 rounded-full bg-orange-500" />
                            College Symposium RSVP
                          </td>
                          <td className="py-3 px-4">
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Live
                            </span>
                          </td>
                          <td className="py-3 px-4 text-stone-800 font-bold">300</td>
                          <td className="py-3 px-4 text-right">
                            <span className="text-stone-400 hover:text-orange-600 cursor-pointer">
                              <ExternalLink className="w-4 h-4 inline" />
                            </span>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* ════ TEMPLATES PREVIEW SECTION ════ */}
          <section className="py-24 border-t border-stone-200" id="templates">
            <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600">
                  Pre-Built Blueprints
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight mt-1">
                  A head start for every idea.
                </h2>
                <p className="text-base text-stone-600 mt-2 max-w-xl">
                  Pick a battle-tested template or start from a blank canvas. Each template is
                  fully responsive, cleanly styled, and completely customizable.
                </p>
              </div>
              <button
                type="button"
                onClick={handleStart}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 hover:text-orange-700 transition cursor-pointer"
              >
                <span>Browse all ready templates</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

            {/* 4 Template Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Template 1 */}
              <div
                onClick={handleStart}
                className="tilt-card bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-full h-32 bg-orange-50/50 rounded-xl mb-4 p-3 flex flex-col justify-between border border-orange-100 group-hover:bg-orange-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-2 bg-orange-300 rounded-full" />
                      <span className="text-orange-500 text-xs font-bold">Event</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-3/4 h-2 bg-stone-200 rounded" />
                      <div className="w-1/2 h-2 bg-stone-200 rounded" />
                      <div className="w-full h-5 bg-white rounded border border-stone-200" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-orange-600 transition-colors">
                    Event Registration
                  </h3>
                  <p className="text-xs text-stone-500">
                    Collect attendee names, dietary requirements, and session choices.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">5 Questions</span>
                  <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                    Use template <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Template 2 */}
              <div
                onClick={handleStart}
                className="tilt-card bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-full h-32 bg-amber-50/50 rounded-xl mb-4 p-3 flex flex-col justify-between border border-amber-100 group-hover:bg-amber-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-2 bg-amber-300 rounded-full" />
                      <span className="text-amber-600 text-xs font-bold">CSAT</span>
                    </div>
                    <div className="flex justify-center gap-1 my-auto">
                      <span className="text-amber-500 font-bold">★★★★★</span>
                    </div>
                    <div className="w-full h-5 bg-white rounded border border-stone-200" />
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-orange-600 transition-colors">
                    Customer Feedback
                  </h3>
                  <p className="text-xs text-stone-500">
                    Measure CSAT ratings, NPS scales, and open improvement suggestions.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">4 Questions</span>
                  <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                    Use template <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Template 3 */}
              <div
                onClick={handleStart}
                className="tilt-card bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-full h-32 bg-emerald-50/50 rounded-xl mb-4 p-3 flex flex-col justify-between border border-emerald-100 group-hover:bg-emerald-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-2 bg-emerald-300 rounded-full" />
                      <span className="text-emerald-600 text-xs font-bold">Inquiry</span>
                    </div>
                    <div className="space-y-1.5">
                      <div className="w-full h-4 bg-white rounded border border-stone-200" />
                      <div className="w-full h-7 bg-white rounded border border-stone-200" />
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-orange-600 transition-colors">
                    Contact & Inquiries
                  </h3>
                  <p className="text-xs text-stone-500">
                    Inbound project intake for agencies, freelancers, and businesses.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">3 Questions</span>
                  <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                    Use template <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>

              {/* Template 4 */}
              <div
                onClick={handleStart}
                className="tilt-card bg-white rounded-2xl border border-stone-200 p-5 shadow-2xs hover:shadow-lg hover:border-orange-300 transition-all flex flex-col justify-between group cursor-pointer"
              >
                <div>
                  <div className="w-full h-32 bg-blue-50/50 rounded-xl mb-4 p-3 flex flex-col justify-between border border-blue-100 group-hover:bg-blue-100/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <span className="w-8 h-2 bg-blue-300 rounded-full" />
                      <span className="text-blue-600 text-xs font-bold">Academic</span>
                    </div>
                    <div className="space-y-2">
                      <div className="w-3/4 h-2 bg-stone-200 rounded" />
                      <div className="flex gap-2">
                        <span className="w-3 h-3 rounded-full bg-orange-500" />
                        <span className="w-16 h-2 bg-stone-300 rounded my-auto" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-base font-bold text-stone-900 mb-1 group-hover:text-orange-600 transition-colors">
                    Student Survey
                  </h3>
                  <p className="text-xs text-stone-500">
                    Gather academic feedback, course ratings, and classroom evaluations.
                  </p>
                </div>
                <div className="mt-5 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                  <span className="text-stone-400 font-medium">6 Questions</span>
                  <span className="text-orange-600 font-bold inline-flex items-center gap-1">
                    Use template <ArrowRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            </div>
          </section>

          {/* ════ FAQ SECTION ════ */}
          <section className="py-24 border-t border-stone-200" id="faq">
            <div className="max-w-3xl mx-auto">
              <div className="text-center mb-14">
                <span className="text-xs font-bold uppercase tracking-wider text-orange-600 mb-2 block">
                  Got Questions?
                </span>
                <h2 className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight">
                  We've kept things simple.
                </h2>
                <p className="text-base text-stone-600 mt-2">
                  Everything you need to know about Easy Forms, Formly AI, and how your data is
                  protected.
                </p>
              </div>

              {/* Accordion List */}
              <div className="space-y-3.5">
                {faqs.map((faq, idx) => {
                  const isOpen = openFaqIndex === idx;
                  return (
                    <div
                      key={idx}
                      className="bg-white border border-stone-200 rounded-2xl overflow-hidden shadow-2xs transition-all"
                    >
                      <button
                        type="button"
                        onClick={() => setOpenFaqIndex(isOpen ? -1 : idx)}
                        className="w-full text-left p-5 flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-stone-900 select-none group cursor-pointer"
                      >
                        <span className="group-hover:text-orange-600 transition-colors">
                          {faq.q}
                        </span>
                        <ChevronDown
                          className={`w-5 h-5 text-stone-400 transition-transform duration-300 shrink-0 ${
                            isOpen ? 'rotate-180 text-orange-500' : ''
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <div className="px-5 pb-5 pt-0 text-stone-600 text-xs sm:text-sm leading-relaxed border-t border-stone-100">
                          <div className="pt-3">{faq.a}</div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ════ FINAL CALL TO ACTION SECTION ════ */}
          <section className="py-16 pb-28">
            <div className="relative overflow-hidden bg-stone-100/80 border border-stone-200 rounded-3xl p-10 md:p-16 text-center shadow-lg">
              {/* Background Glow Orbs */}
              <div className="absolute -top-24 -right-24 w-80 h-80 bg-orange-500/20 rounded-full blur-[80px] pointer-events-none animate-orb-1" />
              <div className="absolute -bottom-24 -left-24 w-80 h-80 bg-amber-500/20 rounded-full blur-[80px] pointer-events-none animate-orb-2" />

              <div className="relative z-10 max-w-2xl mx-auto flex flex-col items-center">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white border border-stone-200 text-orange-600 text-2xs font-bold mb-5 shadow-2xs">
                  <Zap className="w-3.5 h-3.5 text-orange-500" />
                  Ready in under 2 minutes
                </span>

                <h2 className="text-3xl sm:text-4xl md:text-[42px] md:leading-[50px] text-stone-900 font-extrabold tracking-tight">
                  Your next great form starts here.
                </h2>
                <p className="text-base text-stone-600 mt-3 leading-relaxed">
                  Create a form, share it with the world, and make every response count. Powered by
                  Formly AI and real-time response analytics.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row items-center gap-3">
                  <button
                    type="button"
                    onClick={handleStart}
                    className="magnetic-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold text-sm px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.985] group cursor-pointer"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                  <a
                    href="#templates"
                    className="magnetic-btn w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-stone-50 text-stone-800 font-semibold text-sm px-7 py-4 rounded-xl border border-stone-200 transition shadow-2xs"
                  >
                    <span>Browse Templates</span>
                  </a>
                </div>

                <p className="text-stone-400 text-2xs mt-5 font-semibold">
                  Simple to build • Easy to share • Free & Open Source
                </p>
              </div>
            </div>
          </section>
        </div>
      </main>

      {/* ── FOOTER ── */}
      <footer className="w-full bg-white border-t border-stone-200 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-1 max-w-sm">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center text-white font-bold text-xs shadow-2xs">
                EF
              </div>
              <span className="font-bold text-stone-900 tracking-tight text-sm">
                Easy Forms
              </span>
            </div>
            <p className="text-xs text-stone-500 mt-1">
              Modern full-stack form studio with Formly AI, scheduling, and response analytics.
            </p>
          </div>

          <nav className="flex flex-wrap items-center gap-x-6 gap-y-2 text-xs font-semibold text-stone-600">
            <a href="#features" className="hover:text-stone-900 transition-colors">
              Features
            </a>
            <a href="#how-it-works" className="hover:text-stone-900 transition-colors">
              How It Works
            </a>
            <a href="#templates" className="hover:text-stone-900 transition-colors">
              Templates
            </a>
            <a href="#faq" className="hover:text-stone-900 transition-colors">
              FAQ
            </a>
            <a
              href={apiDocsUrl}
              target="_blank"
              rel="noreferrer"
              className="text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
            >
              Scalar API Docs
              <ExternalLink className="w-3 h-3" />
            </a>
            <Link to="/login" className="hover:text-stone-900 transition-colors">
              Sign in
            </Link>
            <Link to="/register" className="text-orange-600 hover:text-orange-700 transition-colors">
              Get Started
            </Link>
          </nav>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 border-t border-stone-100 flex items-center justify-between text-2xs text-stone-400">
          <p>© 2026 Easy Forms. MIT Licensed. All rights reserved.</p>
          <p>Built with React 19, Express & MongoDB</p>
        </div>
      </footer>
    </div>
  );
}
