"use client";

import React, { useState } from 'react';
import { useAppState, GEO_LOCALES } from '@/context/state-context';

const CATEGORY_TAG_MAP: Record<string, string[]> = {
  'Entertainment & Comedy': [
    'Relatable Daily Skits', 'POV & Rants', 'Hostel & College Life Banter',
    'Street & Public Reactions', 'Meme Edits & Lip-Syncs', 'Couple & Friendship Comedy',
    'Bollywood & Cinema Memes', 'Movie & Web Series Reviews', 'Cricket & Sports Banter',
    'Food & Street Food Vlogs', 'Pet Chaos & Funny Animals', 'Roasts & Parodies',
    'Aesthetic Mini-Vlogs', 'Life Hacks & Relatable Fails', 'Gaming Moments & Clips',
    'Late Night Thoughts'
  ],
  'Tech & Startups': [
    'AI Tools & Prompting', 'Software Engineering & Coding', 'No-Code & Automation',
    'Productivity & Notion Systems', 'SaaS & Startup Growth', 'Gadget & Smartphone Reviews',
    'Cybersecurity & Ethical Hacking', 'Web3 & Crypto Insights', 'Developer Humor & Tech Fails'
  ],
  'Finance & Wealth': [
    'Personal Finance & Budgeting', 'Stock Market & Trading', 'Side Hustles & Freelancing',
    'E-Commerce & Dropshipping', 'Career Hacks & Salary Negotiation', 'Real Estate & Property',
    'Crypto & Bitcoin', 'Money Myths & Scams'
  ],
  'Fitness & Health': [
    'Fat Loss & Transformation', 'Quick Home Workouts', 'Healthy Meal Prep & Nutrition',
    'Gym Motivation & Form Tips', 'Mental Health & Meditation', 'Biohacking & Sleep Optimization',
    'Grooming & Daily Style'
  ],
  'Design & Creativity': [
    'UX/UI Design Tips', 'Video Editing & CapCut Hacks', 'Graphic Design & Branding',
    'Photography & Camera Angles', '3D & Motion Graphics', 'Creative Freelancing'
  ],
  'Education & Career': [
    'English Fluency & Communication', 'Job Interview Prep & Resumes', 'Study Hacks & Exam Motivation',
    'Remote Work & Freelancing', 'Book Summaries & Wisdom', 'Public Speaking & Leadership'
  ]
};

const CATEGORIES = [
  { id: 'entertainment', name: 'Entertainment & Comedy', icon: '🎭', desc: 'Mass viral, skits, memes, rants, banter' },
  { id: 'tech', name: 'Tech & Startups', icon: '💻', desc: 'AI, coding, SaaS, gadgets, automation' },
  { id: 'finance', name: 'Finance & Wealth', icon: '📈', desc: 'Investing, trading, side hustles, budgeting' },
  { id: 'fitness', name: 'Fitness & Health', icon: '💪', desc: 'Workouts, fat loss, diet, biohacking' },
  { id: 'design', name: 'Design & Creativity', icon: '🎨', desc: 'UX/UI, editing, motion, branding' },
  { id: 'education', name: 'Education & Career', icon: '📚', desc: 'Job hacks, speaking, study tips' }
];

export function Onboarding() {
  const { state, setTab, updateProfile } = useAppState();
  const profile = state.creatorProfile;
  const locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;

  const [currentStep, setCurrentStep] = useState(1);
  const [activeCategory, setActiveCategory] = useState(profile.selectedVibe || 'Entertainment & Comedy');
  const [selectedMicroTags, setSelectedMicroTags] = useState<string[]>(profile.microTags || []);
  const [localName, setLocalName] = useState(profile.name || '');
  const [localHandle, setLocalHandle] = useState(profile.handle || '');

  const getStepLabel = (step: number) => {
    switch (step) {
      case 1: return 'Basic Info';
      case 2: return 'Niche Details';
      case 3: return 'Use Case';
      case 4: return 'Content Style';
      default: return '';
    }
  };

  const handleTagToggle = (tag: string) => {
    if (selectedMicroTags.includes(tag)) {
      setSelectedMicroTags(selectedMicroTags.filter(t => t !== tag));
    } else if (selectedMicroTags.length < 5) {
      setSelectedMicroTags([...selectedMicroTags, tag]);
    }
  };

  const handleFinish = async () => {
    await updateProfile({
      name: localName,
      handle: localHandle,
      selectedVibe: activeCategory,
      microTags: selectedMicroTags,
      onboarding_completed: true
    });
    setTab('dashboard');
  };

  return (
    <div style={{ maxWidth: '860px', margin: '0 auto', paddingTop: '1rem' }}>
      <div className="card neo-raised" style={{ borderRadius: '24px', padding: '2.5rem 2rem' }}>
        
        {/* Step Indicator */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--accent-primary)' }}>
            Step {currentStep} of 4 — {getStepLabel(currentStep)}
          </div>
          <div style={{ display: 'flex', gap: '6px', width: '140px' }}>
            {[1, 2, 3, 4].map(step => (
              <div key={step} style={{ height: '4px', flex: 1, borderRadius: '4px', background: currentStep >= step ? 'var(--accent-primary)' : 'var(--border-subtle)' }} />
            ))}
          </div>
        </div>

        {/* Dynamic Step Content */}
        <div>
          {currentStep === 1 && (
            <div className="animate-fade-in">
              <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Basic Info</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                Let's start with the essentials to configure your Creator OS workspace.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Full Name</label>
                  <input type="text" className="form-input" value={localName} onChange={e => setLocalName(e.target.value)} placeholder="Enter your full name" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.65rem' }}>Social Presence</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--bg-surface-low)', padding: '0.35rem 0.75rem', borderRadius: '10px', border: '1px solid var(--border-subtle)' }}>
                      <span style={{ fontSize: '1.1rem' }}>📸</span>
                      <input type="text" className="form-input" style={{ background: 'transparent', border: 'none', padding: '0.5rem 0', boxShadow: 'none' }} value={localHandle} onChange={e => setLocalHandle(e.target.value)} placeholder="Instagram handle (@username)" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="animate-fade-in">
              <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Define Your Niche & Style</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                Select your primary category and micro-tags to calibrate your viral recommendation engine.
              </p>
              
              <div style={{ marginBottom: '2rem' }}>
                <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.75rem' }}>Primary Category</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem' }}>
                  {CATEGORIES.map(cat => {
                    const isSelected = activeCategory === cat.name;
                    return (
                      <div 
                        key={cat.id} 
                        onClick={() => {
                          setActiveCategory(cat.name);
                          setSelectedMicroTags([]);
                        }}
                        className={`card ${isSelected ? 'active-card' : ''}`}
                        style={{ cursor: 'pointer', padding: '1rem', borderColor: isSelected ? 'var(--accent-primary)' : 'var(--border-subtle)', background: isSelected ? 'var(--bg-surface-high)' : 'var(--bg-surface-low)' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
                          <span style={{ fontSize: '1.4rem' }}>{cat.icon}</span>
                          <strong style={{ fontSize: '0.95rem', color: isSelected ? 'var(--accent-primary)' : 'var(--text-main)' }}>{cat.name}</strong>
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{cat.desc}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 600 }}>
                    Micro-Niche Tags for <span style={{ color: 'var(--accent-primary)' }}>{activeCategory}</span>
                  </label>
                  <span className="badge badge-purple" style={{ fontSize: '0.7rem' }}>
                    Selected: <strong style={{ marginLeft: '2px' }}>{selectedMicroTags.length}</strong> / 5
                  </span>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.25rem' }}>
                  {(CATEGORY_TAG_MAP[activeCategory] || []).map(tag => {
                    const isSelected = selectedMicroTags.includes(tag);
                    return (
                      <button 
                        key={tag}
                        onClick={() => handleTagToggle(tag)}
                        className={`btn ${isSelected ? 'btn-primary' : 'btn-secondary'}`} 
                        style={{ borderRadius: '999px', fontSize: '0.82rem', padding: '0.45rem 0.95rem' }}
                      >
                        {isSelected ? '✓ ' : ''}{tag}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}

          {currentStep === 3 && (
            <div className="animate-fade-in">
              <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Content Language & Localization</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                How do you speak? We use this to auto-generate subtitles and script drafts that sound exactly like you.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Primary Spoken Language</label>
                  <select className="form-select">
                    {locale.defaultLanguages.map(lang => (
                      <option key={lang} value={lang}>{lang}</option>
                    ))}
                    <option value="English (Global)">English (Global)</option>
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Creator Catchphrase / Intro</label>
                  <input type="text" className="form-input" placeholder="e.g. 'What's up guys, welcome back...'" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, marginBottom: '0.4rem' }}>Banned Words (AI will avoid these)</label>
                  <input type="text" className="form-input" placeholder="e.g. synergy, game-changer, deep dive" />
                </div>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="animate-fade-in">
              <h1 style={{ fontSize: '2.4rem', marginBottom: '0.5rem', letterSpacing: '-0.02em', fontWeight: 800 }}>Finalize AI Brain ⚡</h1>
              <p style={{ color: 'var(--text-muted)', fontSize: '1.05rem', marginBottom: '2rem' }}>
                You're all set. Our recommendation engine is now calibrated to your specific style and audience.
              </p>
              <div className="card neo-pressed" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', gap: '1rem' }}>
                <span className="material-symbols-outlined" style={{ fontSize: '4rem', color: 'var(--accent-primary)' }}>psychology</span>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800 }}>Your Creator Brain is Ready</h3>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', maxWidth: '400px' }}>
                  KontentOS will now generate customized trend alerts, script outlines, and analytics benchmarks for {activeCategory}.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Wizard Navigation Footer */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '2.5rem', borderTop: '1px solid var(--border-subtle)', paddingTop: '1.5rem' }}>
          <button 
            onClick={() => setCurrentStep(prev => prev - 1)} 
            className="btn btn-secondary" 
            style={{ padding: '0.65rem 1.25rem', visibility: currentStep === 1 ? 'hidden' : 'visible' }}
          >
            <span>← Back</span>
          </button>
          
          <div style={{ display: 'flex', gap: '0.75rem' }}>
            {currentStep < 4 ? (
              <button 
                onClick={() => setCurrentStep(prev => prev + 1)} 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 2rem', fontSize: '0.95rem' }}
              >
                <span>Continue →</span>
              </button>
            ) : (
              <button 
                onClick={handleFinish} 
                className="btn btn-primary" 
                style={{ padding: '0.75rem 2.25rem', fontSize: '1rem' }}
              >
                <span>Initialize Creator Brain ⚡</span>
              </button>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
