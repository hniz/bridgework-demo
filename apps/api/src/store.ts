import { pilotScenario as seededPilot, schoolProfile as seededSchool, seededApplications, seededBusinesses, seededFeedback, seededOpportunities, seededStudents } from './seed.js';
import type { Application, Business, Feedback, Opportunity, PilotScenario, SchoolProfile, Student } from './types.js';

export const school: SchoolProfile = structuredClone(seededSchool);
export const pilot: PilotScenario = structuredClone(seededPilot);
export const students: Student[] = structuredClone(seededStudents);
export const businesses: Business[] = structuredClone(seededBusinesses);
export const opportunities: Opportunity[] = structuredClone(seededOpportunities);
export const applications: Application[] = structuredClone(seededApplications);
export const feedback: Feedback[] = structuredClone(seededFeedback);
let opportunityId = Math.max(...opportunities.map((item) => item.id)) + 1;
let applicationId = Math.max(...applications.map((item) => item.id)) + 1;
let feedbackId = Math.max(...feedback.map((item) => item.id)) + 1;
export const ids = { opportunity: () => opportunityId++, application: () => applicationId++, feedback: () => feedbackId++ };
