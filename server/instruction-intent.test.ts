import { describe, expect, test } from 'bun:test';
import type { AgentDomain, AgentRole, AgentWorkItem, InstructionIntentResult } from '../src/types';
import { buildInstructionIntentPrompt, buildPlanningMechanismInstructions, normalizeInstructionIntentWorkItemSelection, parseInstructionIntentResponse } from './instruction-intent';
import { seedAgentDomains, seedAgentRoles, seedAgentWorkItems, seedProjects } from './seed-data';

const project = seedProjects[0];
const domain = seedAgentDomains.find(item => item.code === project.projectType) as AgentDomain;
const role = seedAgentRoles.find(item => item.agentType === 'law_review') as AgentRole;
const workItem = seedAgentWorkItems.find(item => item.roleId === role.id) as AgentWorkItem;

describe('parseInstructionIntentResponse', () => {
  test('parses raw JSON start_evaluation response', () => {
    const intent = parseInstructionIntentResponse(JSON.stringify({
      decision: 'start_evaluation',
      summary: '核验诉讼和抵押顺位风险',
      normalizedInstruction: '请法务专家核验诉讼、查封和抵押顺位风险。',
      reply: '将优先调度法务合规专家。',
      rationale: '用户明确要求专项审查。',
      confidence: 0.91,
      missingInfo: [],
      recommendedMode: 'discuss',
      recommendedAgentType: 'orchestrator',
      recommendedRoleId: role.id,
      recommendedWorkItemId: workItem.id,
    }));

    expect(intent.decision).toBe('start_evaluation');
    expect(intent.normalizedInstruction).toContain('抵押顺位');
    expect(intent.recommendedAgentType).toBe('orchestrator');
    expect(intent.recommendedRoleId).toBe(role.id);
    expect(intent.recommendedWorkItemId).toBe(workItem.id);
  });

  test('parses fenced JSON clarification response', () => {
    const intent = parseInstructionIntentResponse([
      '```json',
      JSON.stringify({
        decision: 'ask_clarification',
        summary: '需要确认审查对象',
        normalizedInstruction: '',
        reply: '请补充要核验的资产或合同范围。',
        clarificationQuestion: '请问本次要核验哪一份合同或哪一项资产？',
        rationale: '用户输入缺少审查对象。',
        confidence: 0.72,
        missingInfo: ['审查对象'],
      }),
      '```',
    ].join('\n'));

    expect(intent.decision).toBe('ask_clarification');
    expect(intent.clarificationQuestion).toContain('哪一份合同');
    expect(intent.missingInfo).toEqual(['审查对象']);
  });

  test('rejects malformed JSON and invalid decisions', () => {
    expect(() => parseInstructionIntentResponse('```json\n{"decision":\n```')).toThrow(/JSON/);
    expect(() => parseInstructionIntentResponse(JSON.stringify({
      decision: 'launch_anyway',
      summary: 'x',
    }))).toThrow(/decision/);
  });

  test('rejects missing required fields for executable decisions', () => {
    expect(() => parseInstructionIntentResponse(JSON.stringify({
      decision: 'start_evaluation',
      summary: 'x',
      normalizedInstruction: '',
    }))).toThrow(/normalizedInstruction/);

    expect(() => parseInstructionIntentResponse(JSON.stringify({
      decision: 'ask_clarification',
      summary: 'x',
    }))).toThrow(/clarificationQuestion/);
  });
});

describe('normalizeInstructionIntentWorkItemSelection', () => {
  const baseIntent: InstructionIntentResult = {
    decision: 'start_evaluation',
    summary: '审查抵押顺位',
    normalizedInstruction: '请核验抵押顺位。',
    reply: '将启动智能规划。',
    rationale: '用户提出明确评估任务。',
    confidence: 0.9,
    missingInfo: [],
    recommendedMode: 'discuss',
    recommendedAgentType: 'orchestrator',
  };

  test('keeps a valid recommended role and work item', () => {
    const intent = normalizeInstructionIntentWorkItemSelection({
      ...baseIntent,
      recommendedRoleId: role.id,
      recommendedWorkItemId: workItem.id,
    }, {
      domain,
      roles: [role],
      workItems: [workItem],
    });

    expect(intent.decision).toBe('start_evaluation');
    expect(intent.recommendedAgentType).toBe(role.agentType);
    expect(intent.recommendedRoleId).toBe(role.id);
    expect(intent.recommendedWorkItemId).toBe(workItem.id);
  });

  test('asks for clarification when no valid work item is recommended', () => {
    const intent = normalizeInstructionIntentWorkItemSelection({
      ...baseIntent,
      recommendedRoleId: role.id,
    }, {
      domain,
      roles: [role],
      workItems: [workItem],
    });

    expect(intent.decision).toBe('ask_clarification');
    expect(intent.clarificationQuestion).toContain('工作项');
    expect(intent.missingInfo).toContain('明确工作项');
  });

  test('rejects cross-role work item recommendation', () => {
    const otherRole = seedAgentRoles.find(item => item.domainId === domain.id && item.id !== role.id) as AgentRole;
    const intent = normalizeInstructionIntentWorkItemSelection({
      ...baseIntent,
      recommendedRoleId: otherRole.id,
      recommendedWorkItemId: workItem.id,
    }, {
      domain,
      roles: [role, otherRole],
      workItems: [workItem],
    });

    expect(intent.decision).toBe('ask_clarification');
    expect(intent.rationale).toContain('不匹配');
  });
});

describe('buildPlanningMechanismInstructions', () => {
  const intent: InstructionIntentResult = {
    decision: 'start_evaluation',
    summary: '审查抵押顺位',
    normalizedInstruction: '请核验抵押顺位。',
    reply: '将启动智能规划。',
    rationale: '用户提出明确评估任务。',
    confidence: 0.9,
    missingInfo: [],
    recommendedMode: 'discuss',
    recommendedAgentType: 'orchestrator',
  };

  test('generates distinct constraints for discuss, single, and chain', () => {
    const discuss = buildPlanningMechanismInstructions('discuss', intent);
    const single = buildPlanningMechanismInstructions('single', intent, { role, workItem });
    const chain = buildPlanningMechanismInstructions('chain', intent);

    expect(discuss).toContain('智能规划');
    expect(discuss).toContain('前置意图理解');
    expect(single).toContain('指定专家');
    expect(single).toContain(role.name);
    expect(chain).toContain('顺序执行');
    expect(chain).toContain('法务合规审查 -> 项目评估/估值测算 -> 风险评估 -> 综合汇总');
    expect(new Set([discuss, single, chain]).size).toBe(3);
  });
});

describe('buildInstructionIntentPrompt', () => {
  test('includes project context, current mode, and clarification context', () => {
    const prompt = buildInstructionIntentPrompt({
      project,
      userInstruction: '补充：核验查封顺位',
      mode: 'discuss',
      role,
      workItem,
      candidateRoles: [role],
      candidateWorkItems: [workItem],
      clarificationContext: {
        originalInstruction: '帮我看看',
        assistantQuestion: '请补充审查重点。',
        previousSummary: '需要明确审查范围',
      },
    });

    expect(prompt).toContain(project.name);
    expect(prompt).toContain('规划机制：discuss');
    expect(prompt).toContain('上一轮反问：请补充审查重点。');
    expect(prompt).toContain('补充：核验查封顺位');
    expect(prompt).toContain(`岗位专家ID：${role.id}`);
    expect(prompt).toContain(`工作项ID：${workItem.id}`);
  });
});
