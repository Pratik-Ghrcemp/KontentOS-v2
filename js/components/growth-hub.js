// KontentOS — Growth Intelligence, Deep Video Diagnostics & AI Creator Coach
import { stateStore, GEO_LOCALES } from '../state.js';

export function renderGrowthHub(container) {
  const state = stateStore.get();
  const profile = state.creatorProfile;
  const locale = GEO_LOCALES[state.geo] || GEO_LOCALES.IN;

  let activePlatformFilter = 'all'; // 'all', 'instagram', 'youtube', 'linkedin', 'twitter'

  // Master audited videos database with granular algorithmic & production diagnostics
  const auditedVideos = [
    {
      id: 'audit-1',
      title: "Top 3 Tools Every Freelancer Needs in 2026",
      platform: 'instagram',
      platformName: '📸 Instagram Reel',
      views: '4.2K',
      retention3s: '38%',
      status: 'critical',
      statusLabel: '⚠️ Needs Major Fixes',
      statusColor: 'var(--accent-red)',
      diagnosticScore: 48,
      issues: [
        {
          type: 'Weak Hook (0–3s)',
          severity: 'high',
          desc: "Started with 'Hey guys, today I want to share...' 62% of viewers swiped away in the first 1.8 seconds."
        },
        {
          type: 'No Differentiator',
          severity: 'high',
          desc: "Covered generic tools (Notion/ChatGPT) without a unique contrarian angle or unexpected pricing hack."
        },
        {
          type: 'Audio & Visual Clarity',
          severity: 'med',
          desc: "Background room echo and low face-lighting reduced perceived authority on high-ticket feeds."
        }
      ],
      coachingTip: "Re-record hook with negative framing: 'Stop paying $50/mo for software. Here are 3 free tools nobody told you about.' Enable Studio Voice Isolator to remove room echo.",
      revisedHook: "Stop paying $50/mo for software. Here are 3 free tools nobody told you about.",
      format: '15s Hook Fix'
    },
    {
      id: 'audit-2',
      title: "POV: Explaining My Remote Internet Job to Family at Dinner",
      platform: 'instagram',
      platformName: '📸 Instagram Reel',
      views: '840K',
      retention3s: '89%',
      status: 'viral',
      statusLabel: '🔥 Top 1% Viral Outlier',
      statusColor: 'var(--accent-secondary)',
      diagnosticScore: 96,
      issues: [
        {
          type: 'Winning Hook',
          severity: 'win',
          desc: "Instant deadpan stare + recognizable comedic sound cue in first 0.4s held 89% of viewer attention."
        },
        {
          type: 'High Comment Velocity',
          severity: 'win',
          desc: "Relatable family banter triggered 2,840+ comments with viewers tagging friends, forcing the FYP algorithm into mass distribution."
        }
      ],
      coachingTip: "Double down on this exact format! Turn this into a 4-part series (e.g. 'Explaining your taxes to mom', 'When relatives ask why you are home all day').",
      revisedHook: "POV: Trying to explain remote work tax write-offs to your parents in 2026.",
      format: 'Series Multiplier'
    },
    {
      id: 'audit-3',
      title: "5 AI Productivity Hacks That Save 10 Hours Weekly",
      platform: 'youtube',
      platformName: '▶️ YouTube Shorts',
      views: '38K',
      retention3s: '54%',
      status: 'average',
      statusLabel: '⚡ Average (Pacing Flaws)',
      statusColor: 'var(--accent-gold)',
      diagnosticScore: 68,
      issues: [
        {
          type: 'Small Screen Text (Mobile Framing)',
          severity: 'high',
          desc: "Screen recording UI text was too tiny to read on mobile phones without zooming in."
        },
        {
          type: 'Mid-Video Drop-off (0:14)',
          severity: 'med',
          desc: "Spent 9 seconds explaining tool #2 with zero camera movement or visual B-roll cuts."
        },
        {
          type: 'Missing Follower CTA',
          severity: 'med',
          desc: "Ended abruptly with no trigger to subscribe or bookmark for future reference."
        }
      ],
      coachingTip: "Use 9:16 Face & UI Punch-in Zoom on key tool buttons. Add a 3-second lead magnet CTA: 'Comment WORKFLOW and I will send you the prompt template.'",
      revisedHook: "I automated my entire 40-hour work week into a 15-minute prompt. Watch this.",
      format: 'Zoom Punch-In'
    },
    {
      id: 'audit-4',
      title: "Why 95% of Solo Creators Will Burn Out in 2026",
      platform: 'linkedin',
      platformName: '💼 LinkedIn Video',
      views: '112K',
      retention3s: '81%',
      status: 'good',
      statusLabel: '📈 Strong Thought Leadership',
      statusColor: 'var(--accent-cyan)',
      diagnosticScore: 88,
      issues: [
        {
          type: 'Contrarian Authority',
          severity: 'win',
          desc: "Strong bold claim backed by real industry numbers drove 840+ LinkedIn reposts."
        },
        {
          type: 'Subtitles Contrast',
          severity: 'med',
          desc: "White subtitles blended into light shirt at 0:20. Use 'The Beast' or frosted dark container."
        }
      ],
      coachingTip: "Pair this video with an accompanying 5-slide PDF carousel document to capture high LinkedIn algorithm boost.",
      revisedHook: "The creators who win in 2026 aren't working 14 hours a day. They have systems.",
      format: 'Slide Companion'
    }
  ];

  function getFilteredAudits() {
    if (activePlatformFilter === 'all') return auditedVideos;
    return auditedVideos.filter(v => v.platform === activePlatformFilter);
  }

  container.innerHTML = `
    <div class="content-container" style="max-width: 1200px;">
      
      <!-- Top Header -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.5rem; flex-wrap: wrap; gap: 1rem;">
        <div>
          <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
            <h1 style="font-size: 2rem;">📊 Growth Intelligence & AI Video Diagnostic Coach</h1>
            <span class="badge badge-purple">DEEP POST-MORTEM</span>
          </div>
          <p style="color: var(--text-muted); font-size: 0.92rem;">
            Real-time algorithmic diagnosis of your published videos: hook failures, clarity defects, missing differentiators, and follower conversion bottlenecks.
          </p>
        </div>

        <div style="display: flex; gap: 0.5rem; align-items: center;">
          <button id="btn-re-audit" class="btn btn-regenerate" style="padding: 0.45rem 1rem; font-size: 0.82rem;">
            <span>🔄 Re-Audit Connected Channels</span>
          </button>
        </div>
      </div>

      <!-- Top Scorecard: Creator Health & Algorithmic Benchmarks -->
      <div class="bento-grid" style="margin-bottom: 2rem;">
        
        <!-- Scorecard 1: Hook Strength -->
        <div class="card" style="grid-column: span 3; background: var(--bg-surface-card); border-color: var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Hook Velocity (0–3s)</span>
            <span class="badge badge-purple" style="font-size: 0.6rem;">62/100</span>
          </div>
          <div style="font-size: 1.8rem; font-weight: 900; color: var(--accent-primary); line-height: 1.1;">62% Avg</div>
          <div style="font-size: 0.72rem; color: var(--accent-red); margin-top: 0.35rem; line-height: 1.35;">
            ⚠️ 3 of last 5 videos started with slow conversational intros.
          </div>
        </div>

        <!-- Scorecard 2: Visual & Audio Clarity -->
        <div class="card" style="grid-column: span 3; background: var(--bg-surface-card); border-color: var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Production Clarity</span>
            <span class="badge badge-neon" style="font-size: 0.6rem;">78/100</span>
          </div>
          <div style="font-size: 1.8rem; font-weight: 900; color: var(--accent-secondary); line-height: 1.1;">Good (78%)</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.35;">
            ✓ Subtitle contrast strong. Enable voice isolator for room echo.
          </div>
        </div>

        <!-- Scorecard 3: Content Differentiation -->
        <div class="card" style="grid-column: span 3; background: var(--bg-surface-card); border-color: var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Unfair Differentiator</span>
            <span class="badge badge-cyan" style="font-size: 0.6rem;">58/100</span>
          </div>
          <div style="font-size: 1.8rem; font-weight: 900; color: var(--accent-cyan); line-height: 1.1;">Moderate</div>
          <div style="font-size: 0.72rem; color: var(--text-muted); margin-top: 0.35rem; line-height: 1.35;">
            💡 Add more contrarian angles & personal proof case studies.
          </div>
        </div>

        <!-- Scorecard 4: Follower Conversion Rate -->
        <div class="card" style="grid-column: span 3; background: var(--bg-surface-card); border-color: var(--border-subtle);">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.4rem;">
            <span style="font-size: 0.75rem; text-transform: uppercase; color: var(--text-dim); font-weight: 700;">Viewer-to-Follower</span>
            <span class="badge badge-neon" style="font-size: 0.6rem;">+3.4%</span>
          </div>
          <div style="font-size: 1.8rem; font-weight: 900; color: var(--accent-primary); line-height: 1.1;">3.4%</div>
          <div style="font-size: 0.72rem; color: var(--accent-secondary); margin-top: 0.35rem; line-height: 1.35;">
            ↗ +1.2% above creator average when using comment CTAs.
          </div>
        </div>
      </div>

      <!-- Main Audit Section: Detailed Video-by-Video Diagnostics -->
      <div class="card" style="margin-bottom: 2rem; padding: 1.5rem;">
        
        <!-- Controls: Platform Filter Tabs -->
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.25rem; flex-wrap: wrap; gap: 0.75rem;">
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <h2 style="font-size: 1.25rem;">🔍 Published Video Algorithmic Audits</h2>
            <span class="badge badge-purple">${auditedVideos.length} AUDITED POSTS</span>
          </div>

          <div style="display: flex; gap: 0.35rem; flex-wrap: wrap;" id="audit-filter-group">
            <button class="btn ${activePlatformFilter === 'all' ? 'btn-primary' : 'btn-secondary'} btn-audit-filter" data-filter="all" style="padding: 0.3rem 0.75rem; font-size: 0.78rem; border-radius: 999px;">
              All Channels (${auditedVideos.length})
            </button>
            <button class="btn ${activePlatformFilter === 'instagram' ? 'btn-primary' : 'btn-secondary'} btn-audit-filter" data-filter="instagram" style="padding: 0.3rem 0.75rem; font-size: 0.78rem; border-radius: 999px;">
              📸 Instagram
            </button>
            <button class="btn ${activePlatformFilter === 'youtube' ? 'btn-primary' : 'btn-secondary'} btn-audit-filter" data-filter="youtube" style="padding: 0.3rem 0.75rem; font-size: 0.78rem; border-radius: 999px;">
              ▶️ YouTube Shorts
            </button>
            <button class="btn ${activePlatformFilter === 'linkedin' ? 'btn-primary' : 'btn-secondary'} btn-audit-filter" data-filter="linkedin" style="padding: 0.3rem 0.75rem; font-size: 0.78rem; border-radius: 999px;">
              💼 LinkedIn
            </button>
          </div>
        </div>

        <!-- Video Audit Cards Grid -->
        <div style="display: flex; flex-direction: column; gap: 1.15rem;" id="audits-container">
          ${renderAuditCards(getFilteredIdeas())}
        </div>
      </div>

      <!-- Actionable Growth Acceleration & Content Quality Playbook -->
      <div class="bento-grid" style="margin-bottom: 2rem;">
        
        <!-- Left: The 4 Golden Rules to Accelerate Followers -->
        <div class="card" style="grid-column: span 6;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
            <h3 style="font-size: 1.15rem; display: flex; align-items: center; gap: 0.4rem;">
              <span>🎯 Follower & Retention Acceleration Playbook</span>
            </h3>
            <span class="badge badge-neon">AI ACTION PLAN</span>
          </div>

          <div style="display: flex; flex-direction: column; gap: 0.85rem;">
            
            <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-size: 1rem;">⚡</span>
                <strong style="font-size: 0.88rem; color: var(--text-main);">1. The 0.8-Second Pattern Interrupt</strong>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                Never say <em>"Hey guys, today I want to tell you about..."</em> Start mid-action with a visual punch or bold statement: <em>"Stop doing THIS in 2026..."</em>
              </p>
            </div>

            <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-size: 1rem;">💬</span>
                <strong style="font-size: 0.88rem; color: var(--text-main);">2. The High-Velocity Comment Trigger CTA</strong>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                Instead of generic <em>"Please like and follow"</em>, use a value-exchange CTA: <em>"Comment 'PROMPT' below and I will DM you the free file."</em> Comments are weighted 4x more heavily by algorithms.
              </p>
            </div>

            <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-size: 1rem;">📱</span>
                <strong style="font-size: 0.88rem; color: var(--text-main);">3. Mobile-First Safe Zone Formatting</strong>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                Keep subtitles and visual focus between 15% from top and 20% from bottom to avoid Instagram Reel captions, like buttons, and audio icons blocking text.
              </p>
            </div>

            <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 10px; padding: 0.85rem;">
              <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
                <span style="font-size: 1rem;">🎙️</span>
                <strong style="font-size: 0.88rem; color: var(--text-main);">4. Audio Quality = Perceived Authority</strong>
              </div>
              <p style="font-size: 0.78rem; color: var(--text-muted); line-height: 1.4;">
                Viewers forgive average camera video, but swipe away from hollow room echo. Always keep <strong>Studio Mic Isolator</strong> enabled in Raw-to-Reel Studio.
              </p>
            </div>

          </div>
        </div>

        <!-- Right: "Make 10 More" Script Generator & Multiplier -->
        <div class="card card-glow" style="grid-column: span 6; background: linear-gradient(135deg, var(--bg-surface-card), var(--bg-surface-high)); border: 1px solid var(--border-glass); display: flex; flex-direction: column; justify-content: space-between;">
          <div>
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem;">
              <h3 style="font-size: 1.15rem;">⚡ AI Multiplier: "Make 10 More Like Winning Post"</h3>
              <span class="badge badge-neon">TOP 1% VIRAL FORMULA</span>
            </div>
            
            <p style="font-size: 0.82rem; color: var(--text-muted); line-height: 1.45; margin-bottom: 1rem;">
              KontentOS deconstructed your top performer <strong>"POV: Explaining My Remote Job" (840K Views)</strong> and reverse-engineered its viral DNA:
            </p>

            <div style="background: var(--bg-surface-low); border-radius: 10px; border: 1px solid var(--border-subtle); padding: 0.85rem; display: flex; flex-direction: column; gap: 0.5rem; margin-bottom: 1.25rem;">
              <div style="font-size: 0.78rem; color: var(--text-main);">
                ✓ <strong>Pacing:</strong> Fast 1.5s visual scene cuts + high-energy sound sync
              </div>
              <div style="font-size: 0.78rem; color: var(--text-main);">
                ✓ <strong>Subtitle Style:</strong> "The Beast" active neon kinetic highlighting
              </div>
              <div style="font-size: 0.78rem; color: var(--text-main);">
                ✓ <strong>Psychological Trigger:</strong> Relatable family dynamics + self-deprecating humor
              </div>
            </div>
          </div>

          <div>
            <button id="btn-make-10-more" class="btn btn-primary" style="width: 100%; padding: 0.85rem; font-size: 0.95rem;">
              <span>⚡ Generate 10 Corrected High-Retention Scripts</span>
            </button>
            <div style="font-size: 0.72rem; color: var(--text-dim); text-align: center; margin-top: 0.45rem;">
              Directly loads 10 viral variations into your Recording Studio Queue.
            </div>
          </div>
        </div>

      </div>

    </div>
  `;

  function getFilteredIdeas() {
    if (activePlatformFilter === 'all') return auditedVideos;
    return auditedVideos.filter(v => v.platform === activePlatformFilter);
  }

  function renderAuditCards(videos) {
    if (videos.length === 0) {
      return `
        <div style="padding: 2rem; text-align: center; color: var(--text-muted); font-size: 0.85rem;">
          No video audits found for this channel.
        </div>
      `;
    }

    return videos.map(v => `
      <div style="background: var(--bg-surface-low); border: 1px solid var(--border-subtle); border-radius: 14px; padding: 1.25rem; transition: border-color 0.2s ease;">
        
        <!-- Video Header Info -->
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 0.85rem; flex-wrap: wrap; gap: 0.5rem;">
          <div>
            <div style="display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.25rem;">
              <span class="badge badge-purple" style="font-size: 0.65rem;">${v.platformName}</span>
              <span class="badge" style="font-size: 0.65rem; background: rgba(0,0,0,0.4); color: ${v.statusColor}; border: 1px solid ${v.statusColor};">
                ${v.statusLabel}
              </span>
            </div>
            <h3 style="font-size: 1.05rem; font-weight: 800; color: var(--text-main); line-height: 1.3;">
              "${v.title}"
            </h3>
          </div>

          <!-- Quick Metrics -->
          <div style="display: flex; gap: 1rem; align-items: center; background: var(--bg-surface-card); padding: 0.4rem 0.85rem; border-radius: 8px; border: 1px solid var(--border-subtle);">
            <div style="text-align: right;">
              <div style="font-size: 1rem; font-weight: 800; color: var(--text-main);">${v.views}</div>
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Views</div>
            </div>
            <div style="height: 24px; width: 1px; background: var(--border-subtle);"></div>
            <div style="text-align: right;">
              <div style="font-size: 1rem; font-weight: 800; color: var(--accent-primary);">${v.retention3s}</div>
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">3s Hook</div>
            </div>
            <div style="height: 24px; width: 1px; background: var(--border-subtle);"></div>
            <div style="text-align: right;">
              <div style="font-size: 1rem; font-weight: 800; color: var(--accent-secondary);">${v.diagnosticScore}/100</div>
              <div style="font-size: 0.6rem; color: var(--text-dim); text-transform: uppercase;">Score</div>
            </div>
          </div>
        </div>

        <!-- Diagnostic Issues Breakdown -->
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 0.65rem; margin-bottom: 0.85rem;">
          ${v.issues.map(iss => `
            <div style="background: var(--bg-surface-card); border-left: 3px solid ${iss.severity === 'win' ? 'var(--accent-secondary)' : (iss.severity === 'high' ? 'var(--accent-red)' : 'var(--accent-gold)')}; padding: 0.65rem 0.85rem; border-radius: 6px;">
              <strong style="font-size: 0.78rem; color: ${iss.severity === 'win' ? 'var(--accent-secondary)' : (iss.severity === 'high' ? 'var(--accent-red)' : 'var(--accent-gold)')}; display: block; margin-bottom: 2px;">
                ${iss.severity === 'win' ? '✓' : '⚠️'} ${iss.type}
              </strong>
              <div style="font-size: 0.74rem; color: var(--text-muted); line-height: 1.35;">
                ${iss.desc}
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Actionable AI Coaching Tip & 1-Click Fix CTA -->
        <div style="background: rgba(0, 240, 255, 0.06); border: 1px solid var(--border-glass); border-radius: 10px; padding: 0.75rem 0.95rem; display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.75rem;">
          <div style="flex: 1; min-width: 260px;">
            <div style="display: flex; align-items: center; gap: 0.35rem; margin-bottom: 2px;">
              <span style="font-size: 0.85rem;">💡</span>
              <strong style="font-size: 0.8rem; color: var(--accent-primary);">AI Coaching Recommendation:</strong>
            </div>
            <div style="font-size: 0.75rem; color: var(--text-main); line-height: 1.4;">
              ${v.coachingTip}
            </div>
          </div>

          <button class="btn btn-primary btn-fix-script" data-hook="${v.revisedHook}" style="padding: 0.4rem 0.85rem; font-size: 0.78rem; border-radius: 8px;">
            <span>⚡ Fix Script & Re-Record</span>
          </button>
        </div>

      </div>
    `).join('');
  }

  // Filter Buttons
  container.querySelectorAll('.btn-audit-filter').forEach(btn => {
    btn.addEventListener('click', () => {
      activePlatformFilter = btn.getAttribute('data-filter');
      container.querySelectorAll('.btn-audit-filter').forEach(b => {
        b.classList.remove('btn-primary');
        b.classList.add('btn-secondary');
      });
      btn.classList.add('btn-primary');
      btn.classList.remove('btn-secondary');

      const auditsContainer = container.querySelector('#audits-container');
      if (auditsContainer) {
        auditsContainer.innerHTML = renderAuditCards(getFilteredIdeas());
        attachCardTriggers();
      }
    });
  });

  function attachCardTriggers() {
    container.querySelectorAll('.btn-fix-script').forEach(btn => {
      btn.addEventListener('click', () => {
        const revisedHook = btn.getAttribute('data-hook') || '';
        alert(`⚡ Corrected high-retention script loaded into Studio:\n\n"${revisedHook}"`);
        stateStore.setTab('studio');
      });
    });
  }

  attachCardTriggers();

  // Re-Audit Button Action
  const btnReAudit = container.querySelector('#btn-re-audit');
  if (btnReAudit) {
    btnReAudit.addEventListener('click', () => {
      btnReAudit.disabled = true;
      btnReAudit.innerHTML = '<span>⚡ Scanning Published Videos...</span>';

      setTimeout(() => {
        btnReAudit.disabled = false;
        btnReAudit.innerHTML = '<span>🔄 Re-Audit Connected Channels</span>';
        alert('🎉 Audit complete! Analyzed 4 published videos across Instagram, YouTube & LinkedIn with latest audience retention metrics.');
      }, 700);
    });
  }

  // Make 10 More Button
  const make10Btn = container.querySelector('#btn-make-10-more');
  if (make10Btn) {
    make10Btn.addEventListener('click', () => {
      alert('⚡ 10 AI Script variations generated based on your 840K viral winner and added to your Recording Queue!');
      stateStore.setTab('studio');
    });
  }
}
