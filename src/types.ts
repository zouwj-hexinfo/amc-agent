export type ProjectType = 
  | 'NPA_ACQUISITION' 
  | 'NPA_TRANSFER' 
  | 'DEBT_RESTRUCTURE' 
  | 'BANKRUPTCY_REORG' 
  | 'SUBSTANTIVE_REORG' 
  | 'STANDARDIZED_DEBT' 
  | 'BATCH_PERSONAL_NPA';

export interface AMCProject {
  id: string;
  name: string;
  customerName: string;
  projectType: ProjectType;
  debtorName: string;
  totalDebt: number; // in ten thousand RMB (万元)
  collateralType: string;
  collateralEstValue: number; // in ten thousand RMB
  status: 'Draft' | 'DataCollected' | 'Active' | 'Reviewing' | 'Approved' | 'Archived';
  description: string;
  createdAt: string;
  updatedAt: string;
  files: ProjectFile[];
  evaluations: Record<string, EvaluationRecord[]>; // Key is agentType or 'orchestrator'
  businessFields?: Record<string, any>; // Dynamic project-type specific business fields
}

export interface ProjectFile {
  id: string;
  name: string;
  size: number;
  type: string; // 'DD_Report' | 'Financial' | 'Ownership' | 'Other'
  uploadedAt: string;
  contentSnippet: string;
}

export type AgentType = 'law_review' | 'risk_review' | 'evaluation' | 'industry' | 'orchestrator';

export interface AgentSkill {
  id: string;
  name: string;
  description: string;
  prompt: string;
  selected: boolean;
}

export interface AgentConfig {
  type: AgentType;
  name: string;
  role: string;
  temperature: number;
  systemPrompt: string;
  skills: AgentSkill[];
}

export interface EvaluationRecord {
  id: string;
  projectId: string;
  agentType: AgentType;
  version: number;
  orchestrationMode?: 'single' | 'chain' | 'discuss' | 'master-slave';
  analysisId?: string;
  hermesEventCount?: number;
  runStatus?: 'running' | 'completed' | 'failed' | 'requires_action' | 'stream_interrupted';
  content: string; // Markdown output
  reflection?: SelfReflection;
  sensitiveWordsFlagged: string[];
  createdAt: string;
  status: 'Draft' | 'Confirmed' | 'Rejected';
  notes?: string;
  usedSkills: string[];
  usedKnowledgeBases: string[];
}

export interface SelfReflection {
  score: number; // 0 - 100
  completeness: number; // 0 - 100
  compliance: number; // 0 - 100
  depth: number; // 0 - 100
  professionalism: number; // 0 - 100
  pros: string[];
  cons: string[];
  suggestions: string;
}

export interface KnowledgeItem {
  id: string;
  category: 'policies' | 'legal' | 'market' | 'cases' | 'methodology' | 'internal_policies' | 'industry' | 'feedback';
  title: string;
  content: string;
  tags: string[];
  source?: string;
}

export interface QccResult {
  companyName: string;
  legalPerson: string;
  regStatus: string;
  regCapital: string;
  establishDate: string;
  address: string;
  shareholders: { name: string; ratio: string }[];
  risks: { title: string; type: 'HIGH' | 'MEDIUM' | 'LOW'; date: string; desc: string }[];
}

export interface StockResult {
  code: string;
  name: string;
  price: number;
  change: number; // percentage
  volume: string;
  marketCap: string;
  peRatio: number;
}

export interface ExecutionStep {
  step: string;
  title: string;
  desc: string;
  status: 'completed' | 'active' | 'pending';
}

export interface CommunicationBubble {
  senderName: string;
  senderRole: string;
  senderAvatar: string;
  timestamp: string;
  content: string;
  bubbleType?: string; // e.g. 'lawyer', 'valuer', 'risk', 'leader'
}

export interface ExecutionEvent {
  id: string;
  projectId: string;
  projectName: string;
  user: string;
  userRole: string;
  userAvatar: string;
  timestamp: string;
  actionName: string;
  orchestratorMode: 'single' | 'chain' | 'discuss' | 'master-slave';
  agentType?: string;
  instructionText?: string;
  status: 'completed' | 'active' | 'failed';
  steps: ExecutionStep[];
  communicationTranscripts: CommunicationBubble[];
}
