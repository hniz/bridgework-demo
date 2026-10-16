import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { api } from './api';
import type { Application, Business, Metrics, Opportunity, PilotScenario, Role, SchoolProfile, Student } from './types';

type Page = 'dashboard' | 'opportunities' | 'applications' | 'post' | 'impact' | 'cohort' | 'network';

const emptyMetrics: Metrics = { opportunities: 0, applications: 0, approved: 0, completed: 0, verifiedHours: 0 };
const emptyPilot: PilotScenario = { cohortSize: 0, businessNetworkSize: 0, activeProjectCount: 0, businessSatisfaction: 0, careerConfidence: 0, postsecondaryEnrollmentTarget: 0, persistenceTarget: 0, highOpportunityOutcomeLabel: '', highOpportunityOutcomeValue: 0, disclaimer: '' };
const demoStudent = 'Alex Rivera';

function App() {
  const [role, setRole] = useState<Role>('school');
  const [page, setPage] = useState<Page>('dashboard');
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<SchoolProfile>();
  const [pilot, setPilot] = useState<PilotScenario>(emptyPilot);
  const [metrics, setMetrics] = useState<Metrics>(emptyMetrics);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();
  const [selectedCategory, setSelectedCategory] = useState('All');

  const refresh = useCallback(async () => {
    setLoading(true); setError(undefined);
    try {
      const [opportunityData, applicationData, metricData, schoolData, pilotData, studentData, businessData] = await Promise.all([
        api.getOpportunities(), api.getApplications(), api.getMetrics(), api.getSchool(), api.getPilot(), api.getStudents(), api.getBusinesses(),
      ]);
      setOpportunities(opportunityData); setApplications(applicationData); setMetrics(metricData); setSchool(schoolData); setPilot(pilotData); setStudents(studentData); setBusinesses(businessData);
    } catch (err) { setError(err instanceof Error ? err.message : 'Unable to load demo data.'); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { void refresh(); }, [refresh]);

  const filtered = useMemo(() => opportunities.filter((item) => selectedCategory === 'All' || item.category === selectedCategory), [opportunities, selectedCategory]);
  const categories = useMemo(() => ['All', ...Array.from(new Set(opportunities.map((item) => item.category)))], [opportunities]);
  const studentApplicationFor = (id: number) => applications.find((item) => item.opportunityId === id && item.studentName === demoStudent);

  async function apply(id: number) {
    try { await api.createApplication(id, demoStudent); await refresh(); setPage('applications'); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to apply.'); }
  }

  async function setStatus(application: Application, status: 'approved' | 'rejected' | 'completed') {
    const opportunity = opportunities.find((item) => item.id === application.opportunityId);
    const verifiedHours = status === 'completed' ? opportunity?.hours ?? 0 : application.verifiedHours;
    try { await api.updateApplicationStatus(application.id, status, verifiedHours); await refresh(); }
    catch (err) { setError(err instanceof Error ? err.message : 'Unable to update application.'); }
  }

  const nav: Record<Role, { page: Page; label: string; icon: string }[]> = {
    student: [
      { page: 'dashboard', label: 'Dashboard', icon: '◫' }, { page: 'opportunities', label: 'Explore projects', icon: '⌕' },
      { page: 'applications', label: 'My applications', icon: '◷' }, { page: 'impact', label: 'My experience', icon: '▥' },
    ],
    business: [
      { page: 'dashboard', label: 'Dashboard', icon: '◫' }, { page: 'post', label: 'Post a project', icon: '＋' },
      { page: 'applications', label: 'Applicants', icon: '♧' }, { page: 'network', label: 'Local network', icon: '◎' }, { page: 'impact', label: 'Project outcomes', icon: '▥' },
    ],
    school: [
      { page: 'dashboard', label: 'John Bowne pilot', icon: '◫' }, { page: 'cohort', label: 'Student cohort', icon: '♙' },
      { page: 'applications', label: 'Approvals', icon: '✓' }, { page: 'network', label: '2-mile network', icon: '◎' }, { page: 'impact', label: 'Pilot report', icon: '▥' },
    ],
  };

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <button className="brand" onClick={() => setPage('dashboard')}><span className="brand-mark">↗</span><span>bridgework<small>SCHOOL × BUSINESS</small></span></button>
        <div className="school-chip"><span>🏫</span><div><strong>John Bowne HS</strong><small>Spring 2027 synthetic pilot</small></div></div>
        <p className="nav-label">Workspace</p>
        <nav>{nav[role].map((item) => <button className={page === item.page ? 'active' : ''} key={item.page} onClick={() => setPage(item.page)}><span>{item.icon}</span>{item.label}</button>)}</nav>
        <div className="prototype-note"><strong>🌿 Demo data policy</strong><br />John Bowne identity + historical baseline metrics are public-reference context. Students, businesses, matches and pilot outcomes are synthetic.<br /><br />{api.mode === 'mock' ? 'Browser-local demo mode.' : 'Connected to API.'}</div>
      </aside>
      <main>
        <header className="topbar">
          <div><span className="crumb">{school?.dbn ?? '25Q425'} / </span><strong>{pageLabel(page)}</strong></div>
          <div className="top-actions"><span className="demo-pill">● SYNTHETIC PILOT</span><select value={role} onChange={(event) => { setRole(event.target.value as Role); setPage('dashboard'); }}><option value="student">🎓 Student view</option><option value="business">🏪 Business view</option><option value="school">🏫 School coordinator</option></select></div>
        </header>
        <section className="content">
          {error && <div className="error-banner"><span>{error}</span><button onClick={() => setError(undefined)}>×</button></div>}
          {loading || !school ? <div className="loading-card">Loading John Bowne pilot…</div> : renderPage()}
          <p className="footnote">Prototype only. No displayed business is represented as a real Bridgework partner. Safety, eligibility, consent, compensation, privacy and supervision checks are illustrative—not operational.</p>
        </section>
      </main>
    </div>
  );

  function renderPage() {
    if (!school) return null;
    if (page === 'dashboard') return <Dashboard role={role} metrics={metrics} opportunities={opportunities} applications={applications} students={students} businesses={businesses} school={school} pilot={pilot} go={setPage} setStatus={setStatus} />;
    if (page === 'opportunities') return <OpportunityList role={role} items={filtered} categories={categories} selected={selectedCategory} setSelected={setSelectedCategory} applicationFor={studentApplicationFor} apply={apply} />;
    if (page === 'applications') return <Applications role={role} items={applications} opportunities={opportunities} students={students} setStatus={setStatus} />;
    if (page === 'post') return <PostProject onCreated={async () => { await refresh(); setPage('opportunities'); }} />;
    if (page === 'cohort') return <Cohort students={students} applications={applications} />;
    if (page === 'network') return <Network businesses={businesses} opportunities={opportunities} school={school} />;
    return <Impact role={role} metrics={metrics} applications={applications} opportunities={opportunities} school={school} pilot={pilot} />;
  }
}

function Dashboard({ role, metrics, opportunities, applications, students, businesses, school, pilot, go, setStatus }: { role: Role; metrics: Metrics; opportunities: Opportunity[]; applications: Application[]; students: Student[]; businesses: Business[]; school: SchoolProfile; pilot: PilotScenario; go: (page: Page) => void; setStatus: (app: Application, status: 'approved' | 'rejected' | 'completed') => Promise<void> }) {
  const alex = students.find((item) => item.name === demoStudent);
  const alexApps = applications.filter((item) => item.studentName === demoStudent);
  const pending = applications.filter((item) => item.status === 'applied');
  if (role === 'student') return <>
    <section className="hero"><div><p className="eyebrow">{school.name.toUpperCase()} · {alex?.pathway.toUpperCase()}</p><h1>Build proof of what you can do.</h1><p>Hi Alex. Explore supervised projects within a two-mile opportunity network around school and turn your coursework into portfolio-ready work.</p><button className="primary" onClick={() => go('opportunities')}>Explore nearby projects →</button></div><span className="hero-icon">🎒 ✦</span></section>
    <div className="stats"><Stat label="Nearby projects" value={opportunities.length} note="≤ 2 mile demo radius" /><Stat label="My applications" value={alexApps.length} /><Stat label="Completed" value={alexApps.filter((item) => item.status === 'completed').length} /><Stat label="Verified hours" value={alexApps.reduce((sum, item) => sum + item.verifiedHours, 0)} /></div>
    <div className="two-col"><div><div className="section-title"><h2>Projects matched to STEM Research Honors</h2></div><div className="cards two-cards">{opportunities.filter((item) => item.pathways?.includes('STEM Research Honors')).slice(0, 4).map((item) => <OpportunityCard key={item.id} item={item} />)}</div></div><div className="panel profile-panel"><p className="eyebrow">SYNTHETIC STUDENT PROFILE</p><h2>{alex?.name}</h2><p className="muted">Grade {alex?.grade} · {alex?.pathway}</p><KeyValue label="Focus" value={alex?.focus ?? ''} /><KeyValue label="Advanced coursework" value={`${alex?.advancedCoursework ?? 0} courses`} /><KeyValue label="Availability" value={alex?.availability ?? ''} /></div></div>
  </>;

  if (role === 'business') return <>
    <section className="hero"><div><p className="eyebrow">JOHN BOWNE LOCAL PARTNER NETWORK</p><h1>Give a student a real problem worth solving.</h1><p>The demo network contains {pilot.cohortSize} synthetic students across seven school pathways and {businesses.length} fictional nearby businesses.</p><button className="primary" onClick={() => go('post')}>Create a student-safe project →</button></div><span className="hero-icon">🏬 ✦</span></section>
    <div className="stats"><Stat label="Student cohort" value={students.length} /><Stat label="Network businesses" value={businesses.length} /><Stat label="Active projects" value={metrics.opportunities} /><Stat label="Completed matches" value={metrics.completed} /></div>
    <div className="section-title"><h2>Examples already in the network</h2><button className="text-button" onClick={() => go('network')}>View all businesses →</button></div><div className="cards">{opportunities.slice(0, 6).map((item) => <OpportunityCard key={item.id} item={item} />)}</div>
  </>;

  return <>
    <section className="hero school-hero"><div><p className="eyebrow">{school.dbn} · SPRING 2027 SYNTHETIC PILOT</p><h1>{school.name}</h1><p>Test whether local, portfolio-producing business projects can convert existing academic potential into professional capital and stronger postsecondary outcomes.</p><div className="hero-actions"><button className="primary" onClick={() => go('applications')}>Review {pending.length} pending matches →</button><button className="secondary" onClick={() => go('network')}>Explore 2-mile network</button></div></div><span className="hero-icon">🏫 ✦</span></section>
    <div className="stats"><Stat label="Synthetic cohort" value={students.length} note="grades 10–12" /><Stat label="Nearby businesses" value={businesses.length} note="fictional, ≤ 2 miles" /><Stat label="Approved + completed" value={metrics.approved} /><Stat label="Completed projects" value={metrics.completed} note={`${metrics.verifiedHours} verified hours`} /></div>
    <SchoolBaseline school={school} pilot={pilot} />
    <div className="two-col school-grid"><div><div className="section-title"><h2>Approvals queue</h2><button className="text-button" onClick={() => go('applications')}>View all →</button></div><Applications role="school" items={applications.filter((item) => item.status === 'applied').slice(0, 5)} opportunities={opportunities} students={students} setStatus={setStatus} compact /></div><div><div className="section-title"><h2>Pilot thesis</h2></div><div className="panel thesis"><strong>77% complete college/career-prep coursework, but 58% enroll postsecondary within six months.</strong><p>Bridgework is designed to test whether real project experience, adult professional references, stronger portfolios and career context can help close that conversion gap.</p><p className="micro">Baseline references are historical public data; causality and impact would require a controlled evaluation.</p></div></div></div>
  </>;
}

function SchoolBaseline({ school, pilot }: { school: SchoolProfile; pilot: PilotScenario }) {
  return <section className="baseline-section"><div className="section-title"><div><p className="eyebrow">PUBLIC BASELINE + SYNTHETIC EVALUATION TARGETS</p><h2>Why this school makes an interesting pilot</h2></div></div><div className="baseline-grid">{school.baseline.map((metric) => <div className="baseline-card" key={metric.key}><span>{metric.label}</span><strong>{metric.value}{metric.suffix ?? ''}</strong><small>{metric.comparison}</small>{metric.key === 'postsecondary' && <div className="target-tag">Pilot evaluation target: {pilot.postsecondaryEnrollmentTarget}%</div>}{metric.key === 'persistence' && <div className="target-tag">Pilot evaluation target: {pilot.persistenceTarget}%</div>}</div>)}</div><div className="source-note">{school.sourceNote}</div></section>;
}

function OpportunityList({ role, items, categories, selected, setSelected, applicationFor, apply }: { role: Role; items: Opportunity[]; categories: string[]; selected: string; setSelected: (value: string) => void; applicationFor: (id: number) => Application | undefined; apply: (id: number) => Promise<void> }) {
  return <><p className="eyebrow">JOHN BOWNE · 2-MILE OPPORTUNITY NETWORK</p><h1>Find a project worth doing.</h1><p className="muted">Fictional projects built from plausible business categories around Kew Gardens Hills, Fresh Meadows and Flushing. Every project is scoped for supervised student work.</p><div className="filters">{categories.map((item) => <button key={item} className={item === selected ? 'selected' : ''} onClick={() => setSelected(item)}>{item}</button>)}</div><div className="cards">{items.map((item) => <OpportunityCard key={item.id} item={item} action={role === 'student' ? applicationFor(item.id) ? `Status: ${applicationFor(item.id)?.status}` : 'Apply' : undefined} onAction={role === 'student' && !applicationFor(item.id) ? () => void apply(item.id) : undefined} />)}</div></>;
}

function OpportunityCard({ item, action, onAction }: { item: Opportunity; action?: string; onAction?: () => void }) {
  return <article className="card"><div className="card-art"><span className="chip">{item.category}</span><span>{item.icon}</span></div><div className="card-body"><div className="location-line">◎ {item.distanceMiles?.toFixed(2)} mi · {item.zone}</div><h3>{item.title}</h3><p>{item.description}</p><div className="meta"><span>◷ {item.duration}</span><span>⏱ {item.hours}h</span><span className={item.safetyLevel === 'yellow' ? 'safety yellow' : 'safety'}>{item.safetyLevel === 'yellow' ? 'Supervision+' : 'Student-safe scope'}</span></div>{item.pathways && <div className="pathway-tags">{item.pathways.slice(0, 2).map((pathway) => <span key={pathway}>{pathway}</span>)}</div>}</div><footer><small>{item.business}</small>{action && <button className="secondary small" onClick={onAction} disabled={!onAction}>{action}</button>}</footer></article>;
}

function Applications({ role, items, opportunities, students, setStatus, compact = false }: { role: Role; items: Application[]; opportunities: Opportunity[]; students: Student[]; setStatus: (app: Application, status: 'approved' | 'rejected' | 'completed') => Promise<void>; compact?: boolean }) {
  const displayed = role === 'student' ? items.filter((item) => item.studentName === demoStudent) : items;
  if (!displayed.length) return <div className="empty"><span>🗂️</span><h3>No applications in this view</h3><p>Try another role or apply to a new project.</p></div>;
  return <div className={compact ? 'panel compact' : 'panel'}>{!compact && <><p className="eyebrow">PROJECT ACTIVITY</p><h1>{role === 'student' ? 'My applications' : role === 'business' ? 'Student applicants' : 'Review student matches'}</h1><p className="muted">All names and decisions shown here are synthetic.</p></>}{displayed.map((item) => { const opportunity = opportunities.find((o) => o.id === item.opportunityId); const student = students.find((s) => s.id === item.studentId || s.name === item.studentName); if (!opportunity) return null; return <div className="application-row" key={item.id}><span className="round-icon">{opportunity.icon}</span><div className="application-copy"><strong>{opportunity.title}</strong><small>{item.studentName}{student ? ` · Grade ${student.grade} · ${student.pathway}` : ''}</small><small>{opportunity.business} · {opportunity.distanceMiles?.toFixed(2)} mi · {item.verifiedHours}/{opportunity.hours} hours</small><span className={`status ${item.status}`}>{item.status}</span></div><div className="row-actions">{role === 'school' && item.status === 'applied' && <><button className="primary small" onClick={() => void setStatus(item, 'approved')}>Approve</button><button className="secondary small" onClick={() => void setStatus(item, 'rejected')}>Decline</button></>}{role === 'business' && item.status === 'approved' && <button className="primary small" onClick={() => void setStatus(item, 'completed')}>Verify completion</button>}</div></div>; })}</div>;
}

function Cohort({ students, applications }: { students: Student[]; applications: Application[] }) {
  const pathwayCounts = Array.from(new Set(students.map((item) => item.pathway))).map((pathway) => ({ pathway, count: students.filter((item) => item.pathway === pathway).length }));
  return <><p className="eyebrow">SYNTHETIC STUDENT COHORT</p><h1>36 students with academic momentum.</h1><p className="muted">The cohort intentionally spans John Bowne's real academic pathways. Profiles, names, interests, availability and participation are entirely fictional.</p><div className="pathway-summary">{pathwayCounts.map((item) => <div className="pathway-count" key={item.pathway}><strong>{item.count}</strong><span>{item.pathway}</span></div>)}</div><div className="student-grid">{students.map((student) => { const appCount = applications.filter((item) => item.studentId === student.id).length; const completed = applications.filter((item) => item.studentId === student.id && item.status === 'completed').length; return <article className="student-card" key={student.id}><div className="student-avatar">{initials(student.name)}</div><div><h3>{student.name}</h3><p>Grade {student.grade} · {student.pathway}</p></div><div className="student-details"><KeyValue label="Focus" value={student.focus} /><KeyValue label="Advanced coursework" value={`${student.advancedCoursework} courses`} /><KeyValue label="Availability" value={student.availability} /></div><div className="student-footer"><span>{appCount} application{appCount === 1 ? '' : 's'}</span><span>{completed} completed</span></div></article>; })}</div></>;
}

function Network({ businesses, opportunities, school }: { businesses: Business[]; opportunities: Opportunity[]; school: SchoolProfile }) {
  const bands = [
    { label: '0–0.75 mi', count: businesses.filter((item) => item.distanceMiles <= .75).length, copy: 'Main Street / Kew Gardens Hills / Queens College edge' },
    { label: '0.76–1.25 mi', count: businesses.filter((item) => item.distanceMiles > .75 && item.distanceMiles <= 1.25).length, copy: 'Kissena / Pomonok / Fresh Meadows' },
    { label: '1.26–1.75 mi', count: businesses.filter((item) => item.distanceMiles > 1.25 && item.distanceMiles <= 1.75).length, copy: 'Fresh Meadows / Flushing' },
    { label: '1.76–2.0 mi', count: businesses.filter((item) => item.distanceMiles > 1.75).length, copy: 'Flushing core / Forest Hills edge' },
  ];
  return <><p className="eyebrow">COMMUTABLE BUSINESS ECOSYSTEM</p><h1>A two-mile opportunity network.</h1><p className="muted">Centered on {school.address}. Business names are synthetic; categories, distance bands and neighborhood zones are designed to model a plausible local partner network.</p><div className="distance-bands">{bands.map((band) => <div className="band" key={band.label}><strong>{band.label}</strong><span>{band.count} businesses</span><small>{band.copy}</small></div>)}</div><div className="network-layout"><div className="network-center"><div className="school-marker">🏫<strong>John Bowne HS</strong><span>{school.radiusMiles}-mile pilot radius</span></div><div className="ring ring-one"></div><div className="ring ring-two"></div><div className="ring ring-three"></div></div><div className="panel"><p className="eyebrow">BUSINESS MIX</p>{categoryCounts(businesses).map(([category, count]) => <div className="mix-row" key={category}><span>{category}</span><div><i style={{ width: `${Math.max(16, count * 18)}%` }}></i></div><strong>{count}</strong></div>)}</div></div><div className="section-title"><h2>Fictional partner prospects</h2><span className="muted">{businesses.length} within demo radius</span></div><div className="business-grid">{businesses.map((business) => <article className="business-card" key={business.id}><div className="business-head"><span className="business-icon">{businessIcon(business.category)}</span><div><h3>{business.name}</h3><p>{business.category}</p></div><span className={`partner-status ${business.status}`}>{business.status}</span></div><div className="location-line">◎ {business.distanceMiles.toFixed(2)} mi · {business.zone}</div><div className="pathway-tags">{business.projectFit.map((fit) => <span key={fit}>{fit}</span>)}</div><footer><span className={business.safetyLevel === 'yellow' ? 'safety-dot yellow-dot' : 'safety-dot'}></span>{business.safetyLevel === 'yellow' ? 'Enhanced supervision / data boundaries' : 'Green project categories available'} · {opportunities.filter((item) => item.businessId === business.id).length} active project(s)</footer></article>)}</div></>;
}

function PostProject({ onCreated }: { onCreated: () => Promise<void> }) {
  const [saving, setSaving] = useState(false); const [message, setMessage] = useState<string>();
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setSaving(true); setMessage(undefined); const form = new FormData(event.currentTarget);
    try {
      await api.createOpportunity({
        title: String(form.get('title')), business: String(form.get('business')), category: String(form.get('category')), borough: 'Queens', zone: String(form.get('zone') || 'Kew Gardens Hills / Flushing'), distanceMiles: Number(form.get('distanceMiles') || 1),
        duration: String(form.get('duration')), hours: Number(form.get('hours')), stipend: String(form.get('stipend') || 'Not specified'), description: String(form.get('description')), tasks: String(form.get('tasks')), mentor: String(form.get('mentor') || 'Business supervisor'), eligibility: String(form.get('eligibility') || 'School eligibility review required'), pathways: [String(form.get('pathway') || 'STEM Research Honors')], safetyLevel: String(form.get('safetyLevel')) === 'yellow' ? 'yellow' : 'green', icon: '✨',
      }); await onCreated();
    } catch (err) { setMessage(err instanceof Error ? err.message : 'Unable to create project.'); }
    finally { setSaving(false); }
  }
  return <><p className="eyebrow">BUSINESS PORTAL · JOHN BOWNE PILOT</p><h1>Post a student-safe challenge.</h1><p className="muted">Projects should produce a clear artifact, fit after-school schedules, and avoid protected data, hazardous work or unsupervised tasks.</p><form className="form-card" onSubmit={submit}>{message && <div className="error-banner">{message}</div>}<label>Project title<input required name="title" placeholder="Build a simple inventory dashboard" /></label><div className="form-grid"><label>Business name<input required name="business" /></label><label>Local zone<select name="zone"><option>Main St · Kew Gardens Hills</option><option>Queens College / Kissena</option><option>Fresh Meadows</option><option>Flushing</option></select></label><label>Distance from school (miles)<input type="number" min="0" max="2" step="0.05" defaultValue="0.8" name="distanceMiles" /></label><label>Category<select name="category"><option>Technology</option><option>Engineering</option><option>Health</option><option>Design</option><option>Marketing</option><option>Sustainability</option><option>Legal / Research</option><option>Business Operations</option></select></label><label>Best-fit pathway<select name="pathway"><option>STEM Research Honors</option><option>Computer Science</option><option>Agriscience</option><option>Health & Nutritional Sciences</option><option>Law Institute</option><option>Visual Arts</option><option>ACAW / Writing</option></select></label><label>Project risk profile<select name="safetyLevel"><option value="green">Green — standard student-safe scope</option><option value="yellow">Yellow — enhanced supervision / data boundaries</option></select></label><label>Duration<select name="duration"><option>1 week</option><option>2 weeks</option><option>3 weeks</option><option>4 weeks</option></select></label><label>Supervised hours<input type="number" min="1" max="40" defaultValue="10" name="hours" /></label><label>Potential stipend<input name="stipend" placeholder="Proposed $150 award" /></label><label>Supervisor<input name="mentor" /></label></div><label>Description<textarea required name="description" /></label><label>Tasks and deliverables<textarea required name="tasks" /></label><label>Eligibility / guardrails<input name="eligibility" placeholder="No protected data; school approval required" /></label><button className="primary" disabled={saving}>{saving ? 'Publishing…' : 'Publish demo project →'}</button></form></>;
}

function Impact({ role, metrics, applications, opportunities, school, pilot }: { role: Role; metrics: Metrics; applications: Application[]; opportunities: Opportunity[]; school: SchoolProfile; pilot: PilotScenario }) {
  const completed = applications.filter((item) => item.status === 'completed');
  const alexCompleted = completed.filter((item) => item.studentName === demoStudent);
  if (role === 'student') return <><p className="eyebrow">MY EXPERIENCE · SYNTHETIC PROFILE</p><h1>Turn projects into evidence.</h1><p className="muted">Alex's demo record is designed to show how Bridgework could create portfolio artifacts, adult references and stories for college/program applications.</p><div className="stats"><Stat label="Projects completed" value={alexCompleted.length} /><Stat label="Verified hours" value={alexCompleted.reduce((sum, item) => sum + item.verifiedHours, 0)} /><Stat label="Portfolio artifacts" value={alexCompleted.length * 2} /><Stat label="Supervisor references" value={alexCompleted.length} /></div><CompletedWork completed={alexCompleted} opportunities={opportunities} /></>;

  return <><p className="eyebrow">PILOT EVALUATION · SYNTHETIC SCENARIO</p><h1>{role === 'school' ? 'Does local work experience improve upward-mobility outcomes?' : 'Project network outcomes.'}</h1><p className="muted">Operational activity below comes from the seeded synthetic demo. Satisfaction, confidence and postsecondary figures are scenario values/targets—not measured results.</p><div className="stats"><Stat label="Completed projects" value={metrics.completed} note={`${Math.round((metrics.completed / Math.max(1, metrics.approved)) * 100)}% of approved`} /><Stat label="Verified hours" value={metrics.verifiedHours} /><Stat label="Business satisfaction" value={pilot.businessSatisfaction} suffix="%" note="synthetic scenario" /><Stat label="Career confidence" value={pilot.careerConfidence} suffix="%" note="synthetic scenario" /></div>{role === 'school' && <><SchoolBaseline school={school} pilot={pilot} /><div className="outcome-grid"><div className="outcome-card"><p className="eyebrow">POSTSECONDARY</p><strong>58% → {pilot.postsecondaryEnrollmentTarget}%</strong><span>Evaluation target for participant cohort; not a forecast.</span></div><div className="outcome-card"><p className="eyebrow">PERSISTENCE</p><strong>64% → {pilot.persistenceTarget}%</strong><span>Three-semester persistence evaluation target.</span></div><div className="outcome-card"><p className="eyebrow">HIGH-OPPORTUNITY OUTCOME</p><strong>{pilot.highOpportunityOutcomeValue}</strong><span>{pilot.highOpportunityOutcomeLabel} in the synthetic scenario.</span></div></div><div className="panel evaluation-plan"><h2>What NYCPS would need to validate</h2><div className="evaluation-steps"><div><b>1</b><span>Match participants to similar non-participants using prior GPA/course rigor, attendance, pathway and grade.</span></div><div><b>2</b><span>Track project completion, skill rubrics, references, portfolio outputs and application behavior.</span></div><div><b>3</b><span>Measure 4-year/2-year enrollment, financial aid, selective/honors/research program offers and net cost.</span></div><div><b>4</b><span>Follow persistence for at least three semesters before making an ROI claim.</span></div></div></div></>}<CompletedWork completed={completed.slice(0, 10)} opportunities={opportunities} /><div className="source-note">{pilot.disclaimer}</div></>;
}

function CompletedWork({ completed, opportunities }: { completed: Application[]; opportunities: Opportunity[] }) {
  return <div className="panel completed-panel"><h2>Completed work</h2>{completed.length ? completed.map((item) => { const opportunity = opportunities.find((o) => o.id === item.opportunityId); return <div className="application-row" key={item.id}><span className="round-icon">{opportunity?.icon ?? '✨'}</span><div className="application-copy"><strong>{opportunity?.title ?? 'Project'}</strong><small>{item.studentName} · {opportunity?.business} · {item.verifiedHours} verified hours</small></div></div>; }) : <div className="empty inline"><p>Complete a project to populate outcomes.</p></div>}</div>;
}

function Stat({ label, value, suffix = '', note = 'Synthetic demo' }: { label: string; value: number; suffix?: string; note?: string }) { return <div className="stat"><span>{label}</span><strong>{value}{suffix}</strong><small>{note}</small></div>; }
function KeyValue({ label, value }: { label: string; value: string }) { return <div className="key-value"><span>{label}</span><strong>{value}</strong></div>; }
function initials(name: string) { return name.split(' ').map((part) => part[0]).join('').slice(0, 2); }
function pageLabel(page: Page) { return ({ dashboard: 'Pilot overview', opportunities: 'Opportunities', applications: 'Applications', post: 'Post project', impact: 'Pilot report', cohort: 'Student cohort', network: '2-mile network' } as Record<Page, string>)[page]; }
function businessIcon(category: string) { if (/Health|Pharmacy|Dental|Optometry|Physical/i.test(category)) return '🩺'; if (/Tech|IT/i.test(category)) return '💻'; if (/Food|Grocery|Restaurant/i.test(category)) return '🥬'; if (/Legal|Accounting|Financial/i.test(category)) return '📑'; if (/Design|Media|Arts|Marketing|Print/i.test(category)) return '🎨'; if (/Veterinary|Pet/i.test(category)) return '🐾'; if (/Energy|Architecture|Engineering/i.test(category)) return '📐'; return '🏪'; }
function categoryCounts(businesses: Business[]): Array<[string, number]> { const grouped = new Map<string, number>(); businesses.forEach((item) => { const broad = item.category.split(' / ')[0]; grouped.set(broad, (grouped.get(broad) ?? 0) + 1); }); return Array.from(grouped.entries()).sort((a, b) => b[1] - a[1]).slice(0, 8); }

export default App;
