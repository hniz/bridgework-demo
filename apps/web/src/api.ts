import { pilotScenario, schoolProfile, seededApplications, seededBusinesses, seededFeedback, seededOpportunities, seededStudents } from './seed';
import type { Application, ApplicationStatus, Business, Feedback, Metrics, Opportunity, PilotScenario, SchoolProfile, Student } from './types';

const baseUrl = import.meta.env.VITE_API_BASE_URL?.replace(/\/$/, '');
const mockKey = 'bridgework-john-bowne-demo-v1';

interface MockState {
  opportunities: Opportunity[];
  applications: Application[];
  feedback: Feedback[];
  businesses: Business[];
  students: Student[];
  school: SchoolProfile;
  pilot: PilotScenario;
  nextOpportunityId: number;
  nextApplicationId: number;
  nextFeedbackId: number;
}

function initialMockState(): MockState {
  return {
    opportunities: structuredClone(seededOpportunities),
    applications: structuredClone(seededApplications),
    feedback: structuredClone(seededFeedback),
    businesses: structuredClone(seededBusinesses),
    students: structuredClone(seededStudents),
    school: structuredClone(schoolProfile),
    pilot: structuredClone(pilotScenario),
    nextOpportunityId: Math.max(...seededOpportunities.map((item) => item.id)) + 1,
    nextApplicationId: Math.max(...seededApplications.map((item) => item.id)) + 1,
    nextFeedbackId: Math.max(...seededFeedback.map((item) => item.id)) + 1,
  };
}

function readMock(): MockState {
  const raw = localStorage.getItem(mockKey);
  if (!raw) return initialMockState();
  try { return JSON.parse(raw) as MockState; } catch { return initialMockState(); }
}

function writeMock(state: MockState) { localStorage.setItem(mockKey, JSON.stringify(state)); }

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  if (!baseUrl) return mockRequest<T>(path, init);
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!response.ok) {
    const body = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(body.error ?? `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

async function mockRequest<T>(path: string, init?: RequestInit): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 90));
  const state = readMock();
  const method = init?.method ?? 'GET';
  const body = init?.body ? JSON.parse(String(init.body)) : undefined;

  if (path === '/school' && method === 'GET') return structuredClone(state.school) as T;
  if (path === '/pilot' && method === 'GET') return structuredClone(state.pilot) as T;
  if (path === '/students' && method === 'GET') return structuredClone(state.students) as T;
  if (path === '/businesses' && method === 'GET') return structuredClone(state.businesses) as T;
  if (path === '/opportunities' && method === 'GET') return structuredClone(state.opportunities) as T;
  if (path === '/opportunities' && method === 'POST') {
    const created: Opportunity = { ...body, id: state.nextOpportunityId++, status: 'open', safetyLevel: body.safetyLevel ?? 'green' };
    state.opportunities.unshift(created); writeMock(state); return created as T;
  }
  const opportunityMatch = path.match(/^\/opportunities\/(\d+)$/);
  if (opportunityMatch && method === 'GET') {
    const found = state.opportunities.find((item) => item.id === Number(opportunityMatch[1]));
    if (!found) throw new Error('Opportunity not found');
    return structuredClone(found) as T;
  }
  if (path === '/applications' && method === 'GET') return structuredClone(state.applications) as T;
  if (path === '/applications' && method === 'POST') {
    if (state.applications.some((item) => item.opportunityId === body.opportunityId && item.studentName === body.studentName)) throw new Error('This student has already applied to that project.');
    const student = state.students.find((item) => item.name === body.studentName);
    const created: Application = { id: state.nextApplicationId++, opportunityId: body.opportunityId, studentId: student?.id, studentName: body.studentName, status: 'applied', verifiedHours: 0, createdAt: new Date().toISOString() };
    state.applications.push(created); writeMock(state); return created as T;
  }
  const statusMatch = path.match(/^\/applications\/(\d+)\/status$/);
  if (statusMatch && method === 'PATCH') {
    const found = state.applications.find((item) => item.id === Number(statusMatch[1]));
    if (!found) throw new Error('Application not found');
    found.status = body.status;
    if (body.verifiedHours !== undefined) found.verifiedHours = Number(body.verifiedHours);
    writeMock(state); return structuredClone(found) as T;
  }
  const feedbackMatch = path.match(/^\/applications\/(\d+)\/feedback$/);
  if (feedbackMatch && method === 'POST') {
    const app = state.applications.find((item) => item.id === Number(feedbackMatch[1]));
    if (!app) throw new Error('Application not found');
    app.status = 'completed'; app.verifiedHours = Number(body.verifiedHours ?? app.verifiedHours);
    const created: Feedback = { id: state.nextFeedbackId++, applicationId: app.id, skills: body.skills, comment: body.comment, verifiedHours: app.verifiedHours, createdAt: new Date().toISOString() };
    state.feedback.push(created); writeMock(state); return created as T;
  }
  if (path === '/metrics' && method === 'GET') {
    const metrics: Metrics = {
      opportunities: state.opportunities.length,
      applications: state.applications.length,
      approved: state.applications.filter((item) => item.status === 'approved' || item.status === 'completed').length,
      completed: state.applications.filter((item) => item.status === 'completed').length,
      verifiedHours: state.applications.reduce((sum, item) => sum + item.verifiedHours, 0),
    };
    return metrics as T;
  }
  throw new Error(`Mock route not implemented: ${method} ${path}`);
}

export const api = {
  mode: baseUrl ? 'remote' : 'mock',
  getSchool: () => request<SchoolProfile>('/school'),
  getPilot: () => request<PilotScenario>('/pilot'),
  getStudents: () => request<Student[]>('/students'),
  getBusinesses: () => request<Business[]>('/businesses'),
  getOpportunities: () => request<Opportunity[]>('/opportunities'),
  getOpportunity: (id: number) => request<Opportunity>(`/opportunities/${id}`),
  createOpportunity: (input: Omit<Opportunity, 'id' | 'status'>) => request<Opportunity>('/opportunities', { method: 'POST', body: JSON.stringify(input) }),
  getApplications: () => request<Application[]>('/applications'),
  createApplication: (opportunityId: number, studentName = 'Alex Rivera') => request<Application>('/applications', { method: 'POST', body: JSON.stringify({ opportunityId, studentName }) }),
  updateApplicationStatus: (id: number, status: ApplicationStatus, verifiedHours?: number) => request<Application>(`/applications/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status, verifiedHours }) }),
  createFeedback: (id: number, feedback: Pick<Feedback, 'skills' | 'comment' | 'verifiedHours'>) => request<Feedback>(`/applications/${id}/feedback`, { method: 'POST', body: JSON.stringify(feedback) }),
  getMetrics: () => request<Metrics>('/metrics'),
};
