import cors from 'cors';
import express, { type NextFunction, type Request, type Response } from 'express';
import { applications, businesses, feedback, ids, opportunities, pilot, school, students } from './store.js';
import type { ApplicationStatus, Opportunity } from './types.js';

const app = express();
const port = Number(process.env.PORT ?? 8787);
const allowedOrigins = (process.env.CORS_ORIGIN ?? 'http://localhost:5173').split(',').map((item) => item.trim());

app.use(cors({ origin(origin, callback) { if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) return callback(null, true); return callback(new Error('Origin not allowed by CORS')); } }));
app.use(express.json({ limit: '100kb' }));

app.get('/api/health', (_req, res) => res.json({ ok: true, service: 'bridgework-api', demo: 'john-bowne-spring-2027' }));
app.get('/api/school', (_req, res) => res.json(school));
app.get('/api/pilot', (_req, res) => res.json(pilot));
app.get('/api/students', (_req, res) => res.json(students));
app.get('/api/businesses', (_req, res) => res.json(businesses));
app.get('/api/opportunities', (_req, res) => res.json(opportunities));
app.get('/api/opportunities/:id', (req, res) => {
  const found = opportunities.find((item) => item.id === Number(req.params.id));
  if (!found) return res.status(404).json({ error: 'Opportunity not found' });
  res.json(found);
});
app.post('/api/opportunities', (req, res) => {
  const fields = ['title', 'business', 'category', 'borough', 'duration', 'description', 'tasks', 'mentor', 'eligibility'];
  const missing = fields.filter((field) => typeof req.body[field] !== 'string' || !req.body[field].trim());
  if (missing.length || !Number.isFinite(Number(req.body.hours))) return res.status(400).json({ error: `Invalid opportunity payload${missing.length ? `; missing: ${missing.join(', ')}` : ''}` });
  const created: Opportunity = { ...req.body, id: ids.opportunity(), hours: Number(req.body.hours), distanceMiles: req.body.distanceMiles === undefined ? undefined : Number(req.body.distanceMiles), status: 'open', icon: req.body.icon || '✨', safetyLevel: req.body.safetyLevel === 'yellow' ? 'yellow' : 'green' };
  opportunities.unshift(created); res.status(201).json(created);
});

app.get('/api/applications', (_req, res) => res.json(applications));
app.post('/api/applications', (req, res) => {
  const opportunityId = Number(req.body.opportunityId); const studentName = String(req.body.studentName ?? '').trim();
  const student = students.find((item) => item.name.toLowerCase() === studentName.toLowerCase());
  if (!studentName || !opportunities.some((item) => item.id === opportunityId)) return res.status(400).json({ error: 'Valid opportunityId and studentName are required' });
  if (applications.some((item) => item.opportunityId === opportunityId && item.studentName.toLowerCase() === studentName.toLowerCase())) return res.status(409).json({ error: 'Student has already applied to this project' });
  const created = { id: ids.application(), opportunityId, studentId: student?.id, studentName, status: 'applied' as const, verifiedHours: 0, createdAt: new Date().toISOString() };
  applications.push(created); res.status(201).json(created);
});

app.patch('/api/applications/:id/status', (req, res) => {
  const item = applications.find((application) => application.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Application not found' });
  const status = req.body.status as ApplicationStatus;
  const statuses: ApplicationStatus[] = ['applied', 'approved', 'rejected', 'completed'];
  if (!statuses.includes(status)) return res.status(400).json({ error: 'Invalid status' });
  const allowedTransitions: Record<ApplicationStatus, ApplicationStatus[]> = { applied: ['approved', 'rejected'], approved: ['completed'], rejected: [], completed: [] };
  if (status !== item.status && !allowedTransitions[item.status].includes(status)) return res.status(409).json({ error: `Cannot transition from ${item.status} to ${status}` });
  item.status = status;
  if (req.body.verifiedHours !== undefined) item.verifiedHours = Math.max(0, Number(req.body.verifiedHours) || 0);
  res.json(item);
});

app.post('/api/applications/:id/feedback', (req, res) => {
  const item = applications.find((application) => application.id === Number(req.params.id));
  if (!item) return res.status(404).json({ error: 'Application not found' });
  if (item.status !== 'approved' && item.status !== 'completed') return res.status(409).json({ error: 'Application must be approved before feedback can be recorded' });
  const skills = String(req.body.skills ?? '').trim(); const comment = String(req.body.comment ?? '').trim(); const verifiedHours = Math.max(0, Number(req.body.verifiedHours) || 0);
  if (!skills || !comment) return res.status(400).json({ error: 'skills and comment are required' });
  item.status = 'completed'; item.verifiedHours = verifiedHours;
  const created = { id: ids.feedback(), applicationId: item.id, skills, comment, verifiedHours, createdAt: new Date().toISOString() };
  feedback.push(created); res.status(201).json(created);
});

app.get('/api/metrics', (_req, res) => res.json({
  opportunities: opportunities.length,
  applications: applications.length,
  approved: applications.filter((item) => item.status === 'approved' || item.status === 'completed').length,
  completed: applications.filter((item) => item.status === 'completed').length,
  verifiedHours: applications.reduce((sum, item) => sum + item.verifiedHours, 0),
}));

app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => { console.error(err); res.status(500).json({ error: 'Internal server error' }); });
app.listen(port, () => console.log(`Bridgework API listening on http://localhost:${port}`));
