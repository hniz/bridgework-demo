export type ApplicationStatus = 'applied' | 'approved' | 'rejected' | 'completed';
export type SafetyLevel = 'green' | 'yellow';
export interface BaselineMetric { key: string; label: string; value: number; suffix?: string; comparison?: string; note?: string; }
export interface SchoolProfile { name: string; dbn: string; address: string; borough: string; radiusMiles: number; baselineYear: string; baseline: BaselineMetric[]; pathways: string[]; sourceNote: string; }
export interface Student { id: number; name: string; grade: 10 | 11 | 12; pathway: string; focus: string; advancedCoursework: number; availability: string; }
export interface Business { id: number; name: string; category: string; zone: string; distanceMiles: number; projectFit: string[]; status: 'recruiting' | 'matched' | 'prospect'; safetyLevel: SafetyLevel; }
export interface Opportunity { id: number; title: string; business: string; businessId?: number; category: string; borough: string; zone?: string; distanceMiles?: number; duration: string; hours: number; stipend?: string; description: string; tasks: string; mentor: string; eligibility: string; pathways?: string[]; safetyLevel?: SafetyLevel; icon: string; status: 'open' | 'closed'; }
export interface Application { id: number; opportunityId: number; studentId?: number; studentName: string; status: ApplicationStatus; verifiedHours: number; createdAt: string; }
export interface Feedback { id: number; applicationId: number; skills: string; comment: string; verifiedHours: number; createdAt: string; }
export interface PilotScenario { cohortSize: number; businessNetworkSize: number; activeProjectCount: number; businessSatisfaction: number; careerConfidence: number; postsecondaryEnrollmentTarget: number; persistenceTarget: number; highOpportunityOutcomeLabel: string; highOpportunityOutcomeValue: number; disclaimer: string; }
