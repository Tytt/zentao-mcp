#!/usr/bin/env node
/**
 * 禅道 MCP Server
 * 提供 Bug 和需求的增删改查工具给 AI 使用
 */

// 重写 stdout/stderr，过滤非 MCP 协议的输出（如 npx/dotenv 的日志）
const originalStdoutWrite = process.stdout.write.bind(process.stdout);
const originalStderrWrite = process.stderr.write.bind(process.stderr);

/** 检查是否为 MCP 协议消息 */
const isMcpMessage = (str: string): boolean => {
  const trimmed = str.trimStart();
  return trimmed.startsWith('{') || trimmed.startsWith('Content-Length:');
};

// stdout: 只允许 MCP 协议消息通过，其他静默丢弃
process.stdout.write = (chunk: any, encodingOrCallback?: any, callback?: any): boolean => {
  const str = typeof chunk === 'string' ? chunk : chunk.toString();
  if (isMcpMessage(str)) {
    return originalStdoutWrite(chunk, encodingOrCallback, callback);
  }
  // 静默丢弃非协议消息
  if (typeof encodingOrCallback === 'function') encodingOrCallback();
  else if (callback) callback();
  return true;
};

// stderr: 过滤掉 dotenv 等第三方库的输出
process.stderr.write = (chunk: any, encodingOrCallback?: any, callback?: any): boolean => {
  const str = typeof chunk === 'string' ? chunk : chunk.toString();
  // 过滤掉 dotenv 的日志
  if (str.includes('dotenv') || str.includes('injecting env') || str.includes('dotenvx')) {
    if (typeof encodingOrCallback === 'function') encodingOrCallback();
    else if (callback) callback();
    return true;
  }
  return originalStderrWrite(chunk, encodingOrCallback, callback);
};

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  Tool,
} from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ZentaoClient } from './zentao-client.js';
import {
  BugType,
  BugSeverity,
  TestCaseType,
  TestCaseStage,
  TestCaseStep,
  StoryCategory,
} from './types.js';

// 加载环境变量
dotenv.config();

// 验证必需的环境变量
const ZENTAO_URL = process.env.ZENTAO_URL;
const ZENTAO_ACCOUNT = process.env.ZENTAO_ACCOUNT;
const ZENTAO_PASSWORD = process.env.ZENTAO_PASSWORD;
/** 是否跳过SSL证书验证（自签名证书时设为 'true'） */
const ZENTAO_SKIP_SSL = process.env.ZENTAO_SKIP_SSL === 'true';

if (!ZENTAO_URL || !ZENTAO_ACCOUNT || !ZENTAO_PASSWORD) {
  console.error('错误: 请设置以下环境变量:');
  console.error('  ZENTAO_URL - 禅道服务器地址');
  console.error('  ZENTAO_ACCOUNT - 禅道用户名');
  console.error('  ZENTAO_PASSWORD - 禅道密码');
  console.error('  ZENTAO_SKIP_SSL - 是否跳过SSL验证（可选，自签名证书时设为 true）');
  process.exit(1);
}

// 创建禅道客户端
const zentaoClient = new ZentaoClient({
  url: ZENTAO_URL,
  account: ZENTAO_ACCOUNT,
  password: ZENTAO_PASSWORD,
  rejectUnauthorized: ZENTAO_SKIP_SSL ? false : undefined,
});

// ==================== 工具定义 ====================

const tools: Tool[] = [
  // Bug 相关工具
  {
    name: 'zentao_get_bugs',
    description: '获取产品的 Bug 列表。可按浏览类型筛选',
    inputSchema: {
      type: 'object',
      properties: {
        productID: {
          type: 'number',
          description: '产品 ID',
        },
        browseType: {
          type: 'string',
          enum: ['all', 'unclosed', 'unresolved', 'toclosed', 'openedbyme', 'assigntome', 'resolvedbyme', 'assigntonull'],
          description: '浏览类型: all-全部, unclosed-未关闭(默认), unresolved-未解决, toclosed-待关闭, openedbyme-我创建, assigntome-指派给我, resolvedbyme-我解决, assigntonull-未指派',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认 20',
        },
      },
      required: ['productID'],
    },
  },
  {
    name: 'zentao_get_bug',
    description: '获取 Bug 详情',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: {
          type: 'number',
          description: 'Bug ID',
        },
      },
      required: ['bugID'],
    },
  },
  {
    name: 'zentao_create_bug',
    description: '创建新的 Bug',
    inputSchema: {
      type: 'object',
      properties: {
        product: {
          type: 'number',
          description: '产品 ID',
        },
        title: {
          type: 'string',
          description: 'Bug 标题',
        },
        severity: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '严重程度: 1-致命, 2-严重, 3-一般, 4-轻微',
        },
        pri: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '优先级: 1-紧急, 2-高, 3-中, 4-低',
        },
        type: {
          type: 'string',
          enum: ['codeerror', 'config', 'install', 'security', 'performance', 'standard', 'automation', 'designdefect', 'others'],
          description: 'Bug 类型: codeerror-代码错误, config-配置相关, install-安装部署, security-安全相关, performance-性能问题, standard-标准规范, automation-测试脚本, designdefect-设计缺陷, others-其他',
        },
        branch: {
          type: 'number',
          description: '所属分支 ID',
        },
        module: {
          type: 'number',
          description: '模块 ID',
        },
        execution: {
          type: 'number',
          description: '所属执行 ID',
        },
        keywords: {
          type: 'string',
          description: '关键词',
        },
        os: {
          type: 'string',
          description: '操作系统',
        },
        browser: {
          type: 'string',
          description: '浏览器',
        },
        steps: {
          type: 'string',
          description: '重现步骤 (支持 HTML 格式，可内嵌图片)',
        },
        task: {
          type: 'number',
          description: '相关任务 ID',
        },
        story: {
          type: 'number',
          description: '相关需求 ID',
        },
        deadline: {
          type: 'string',
          description: '截止日期，格式 YYYY-MM-DD',
        },
        openedBuild: {
          type: 'array',
          items: { type: 'string' },
          description: '影响版本，如 ["trunk"]',
        },
        assignedTo: {
          type: 'string',
          description: '指派给（用户账号）',
        },
        project: {
          type: 'number',
          description: '项目 ID',
        },
      },
      required: ['product', 'title', 'severity', 'pri', 'type'],
    },
  },
  {
    name: 'zentao_resolve_bug',
    description: '解决 Bug',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Bug ID',
        },
        resolution: {
          type: 'string',
          enum: ['bydesign', 'duplicate', 'external', 'fixed', 'notrepro', 'postponed', 'willnotfix'],
          description: '解决方案: fixed-已修复, bydesign-设计如此, duplicate-重复, external-外部原因, notrepro-无法重现, postponed-延期, willnotfix-不予解决',
        },
        resolvedBuild: {
          type: 'string',
          description: '解决版本',
        },
        comment: {
          type: 'string',
          description: '备注',
        },
      },
      required: ['id', 'resolution'],
    },
  },
  {
    name: 'zentao_close_bug',
    description: '关闭 Bug',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: 'Bug ID',
        },
        comment: {
          type: 'string',
          description: '关闭备注',
        },
      },
      required: ['id'],
    },
  },

  // 需求相关工具
  {
    name: 'zentao_get_stories',
    description: '获取产品的需求列表。可按浏览类型筛选',
    inputSchema: {
      type: 'object',
      properties: {
        productID: {
          type: 'number',
          description: '产品 ID',
        },
        browseType: {
          type: 'string',
          enum: ['allstory', 'unclosed', 'draftstory', 'activestory', 'reviewingstory', 'changingstory', 'closedstory', 'openedbyme', 'assignedtome', 'reviewbyme'],
          description: '浏览类型: allstory-全部, unclosed-未关闭(默认), draftstory-草稿, activestory-激活, reviewingstory-评审中, changingstory-变更中, closedstory-已关闭, openedbyme-我创建, assignedtome-指派给我, reviewbyme-我评审',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认 20',
        },
      },
      required: ['productID'],
    },
  },
  {
    name: 'zentao_get_story',
    description: '获取需求详情',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: {
          type: 'number',
          description: '需求 ID',
        },
      },
      required: ['storyID'],
    },
  },
  {
    name: 'zentao_create_story',
    description: '创建新需求',
    inputSchema: {
      type: 'object',
      properties: {
        product: {
          type: 'number',
          description: '产品 ID',
        },
        title: {
          type: 'string',
          description: '需求标题',
        },
        category: {
          type: 'string',
          enum: ['feature', 'interface', 'performance', 'safe', 'experience', 'improve', 'other'],
          description: '需求类型: feature-功能, interface-接口, performance-性能, safe-安全, experience-体验, improve-改进, other-其他',
        },
        pri: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '优先级: 1-紧急, 2-高, 3-中, 4-低',
        },
        spec: {
          type: 'string',
          description: `需求描述（必填）。建议按以下禅道模板格式填写：

【目标】要达到的结果（例如：用户能在X页面完成Y操作）

【范围】包含/不包含（例如：仅支持A端，不支持B端）

【约束】兼容性、权限、性能、依赖系统、上线时间等限制条件

【验收标准】可检查的标准（尽量可量化/可点检）

【风险点】可能翻车的地方（初版可先写1-2条）

【信息来源】相关文档/截图/旧需求链接/接口文档链接`,
        },
        reviewer: {
          type: 'array',
          items: { type: 'string' },
          description: '评审人账号列表（必填），如 ["york", "admin"]',
        },
        verify: {
          type: 'string',
          description: '验收标准',
        },
        estimate: {
          type: 'number',
          description: '预估工时（小时）',
        },
        module: {
          type: 'number',
          description: '模块 ID',
        },
        plan: {
          type: 'number',
          description: '计划 ID',
        },
        source: {
          type: 'string',
          description: '来源: customer-客户, user-用户, po-产品经理, market-市场',
        },
        sourceNote: {
          type: 'string',
          description: '来源备注',
        },
        keywords: {
          type: 'string',
          description: '关键词',
      },
      },
      required: ['product', 'title', 'category', 'pri', 'spec', 'reviewer'],
    },
  },
  {
    name: 'zentao_close_story',
    description: '关闭需求',
    inputSchema: {
      type: 'object',
      properties: {
        id: {
          type: 'number',
          description: '需求 ID',
        },
        closedReason: {
          type: 'string',
          enum: ['done', 'subdivided', 'duplicate', 'postponed', 'willnotdo', 'cancel', 'bydesign'],
          description: '关闭原因: done-已完成, subdivided-已细分, duplicate-重复, postponed-延期, willnotdo-不做, cancel-取消, bydesign-设计如此',
        },
        comment: {
          type: 'string',
          description: '备注',
        },
      },
      required: ['id', 'closedReason'],
    },
  },

  // 产品和项目相关工具
  {
    name: 'zentao_get_products',
    description: '获取所有产品列表',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回数量限制，默认 100',
        },
      },
      required: [],
    },
  },
  {
    name: 'zentao_get_projects',
    description: '获取所有项目列表',
    inputSchema: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          description: '返回数量限制，默认 100',
        },
      },
      required: [],
    },
  },

  // 测试用例相关工具
  {
    name: 'zentao_get_testcases',
    description: '获取产品的测试用例列表',
    inputSchema: {
      type: 'object',
      properties: {
        productID: {
          type: 'number',
          description: '产品 ID',
        },
        limit: {
          type: 'number',
          description: '返回数量限制，默认 100',
        },
      },
      required: ['productID'],
    },
  },
  {
    name: 'zentao_get_testcase',
    description: '获取测试用例详情',
    inputSchema: {
      type: 'object',
      properties: {
        caseID: {
          type: 'number',
          description: '用例 ID',
        },
      },
      required: ['caseID'],
    },
  },
  {
    name: 'zentao_create_testcase',
    description: '创建测试用例',
    inputSchema: {
      type: 'object',
      properties: {
        product: {
          type: 'number',
          description: '产品 ID',
        },
        title: {
          type: 'string',
          description: '用例标题',
        },
        type: {
          type: 'string',
          enum: ['feature', 'performance', 'config', 'install', 'security', 'interface', 'unit', 'other'],
          description: '用例类型: feature-功能测试, performance-性能测试, config-配置相关, install-安装部署, security-安全相关, interface-接口测试, unit-单元测试, other-其他',
        },
        steps: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              desc: {
                type: 'string',
                description: '步骤描述',
              },
              expect: {
                type: 'string',
                description: '期望结果',
              },
            },
            required: ['desc', 'expect'],
          },
          description: '用例步骤',
        },
        pri: {
          type: 'number',
          enum: [1, 2, 3, 4],
          description: '优先级: 1-高, 2-中, 3-低, 4-最低',
        },
        stage: {
          type: 'string',
          enum: ['unittest', 'feature', 'intergrate', 'system', 'smoke', 'bvt'],
          description: '适用阶段: unittest-单元测试, feature-功能测试, intergrate-集成测试, system-系统测试, smoke-冒烟测试, bvt-版本验证',
        },
        precondition: {
          type: 'string',
          description: '前置条件',
        },
        module: {
          type: 'number',
          description: '所属模块 ID',
        },
        story: {
          type: 'number',
          description: '相关需求 ID',
        },
        keywords: {
          type: 'string',
          description: '关键词',
        },
      },
      required: ['product', 'title', 'type', 'steps'],
    },
  },
  // Bug 更新相关工具
  {
    name: 'zentao_update_bug',
    description: '更新 Bug 信息',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Bug ID' },
        title: { type: 'string', description: 'Bug 标题' },
        severity: { type: 'number', enum: [1, 2, 3, 4], description: '严重程度' },
        pri: { type: 'number', enum: [1, 2, 3, 4], description: '优先级' },
        type: { type: 'string', description: 'Bug 类型' },
        steps: { type: 'string', description: '重现步骤' },
        module: { type: 'number', description: '模块 ID' },
        deadline: { type: 'string', description: '截止日期 YYYY-MM-DD' },
      },
      required: ['id'],
    },
  },
  // 需求更新/变更相关工具
  {
    name: 'zentao_update_story',
    description: '更新需求信息（不含标题和描述）',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: '需求 ID' },
        module: { type: 'number', description: '模块 ID' },
        source: { type: 'string', description: '来源' },
        sourceNote: { type: 'string', description: '来源备注' },
        pri: { type: 'number', enum: [1, 2, 3, 4], description: '优先级' },
        category: { type: 'string', description: '需求类型' },
        estimate: { type: 'number', description: '预计工时' },
        keywords: { type: 'string', description: '关键词' },
      },
      required: ['id'],
    },
  },
  // 产品详情/创建/更新相关工具
  {
    name: 'zentao_get_product',
    description: '获取产品详情',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'number', description: '产品 ID' },
      },
      required: ['productID'],
    },
  },
  // 项目详情/创建/更新相关工具
  {
    name: 'zentao_get_project',
    description: '获取项目详情',
    inputSchema: {
      type: 'object',
      properties: {
        projectID: { type: 'number', description: '项目 ID' },
      },
      required: ['projectID'],
    },
  },
  // 用户相关工具
  {
    name: 'zentao_get_users',
    description: '获取用户列表',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
  },
  {
    name: 'zentao_get_user',
    description: '获取用户详情',
    inputSchema: {
      type: 'object',
      properties: {
        userID: { type: 'number', description: '用户 ID' },
      },
      required: ['userID'],
    },
  },
  {
    name: 'zentao_get_my_profile',
    description: '获取当前登录用户信息',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  },
];

// ==================== 创建 MCP Server ====================

const server = new Server(
  {
    name: 'zentao-mcp',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// 列出所有可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return { tools };
});

// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    let result: unknown;

    switch (name) {
      // Bug 相关
      case 'zentao_get_bugs': {
        const { productID, browseType, limit } = args as {
          productID: number;
          browseType?: string;
          limit?: number;
        };
        result = await zentaoClient.getBugs(productID, browseType, limit);
        break;
      }

      case 'zentao_get_bug': {
        const { bugID } = args as { bugID: number };
        result = await zentaoClient.getBug(bugID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `Bug #${bugID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      case 'zentao_create_bug': {
        const {
          product, title, severity, pri, type,
          branch, module, execution, keywords, os, browser,
          steps, task, story, deadline, openedBuild, assignedTo, project
        } = args as {
            product: number;
            title: string;
          severity: BugSeverity;
          pri: number;
          type: BugType;
          branch?: number;
            module?: number;
          execution?: number;
          keywords?: string;
          os?: string;
          browser?: string;
          steps?: string;
          task?: number;
          story?: number;
          deadline?: string;
          openedBuild?: string[];
            assignedTo?: string;
            project?: number;
          };
        result = await zentaoClient.createBug({
          product,
          title,
          severity,
          pri,
          type,
          branch,
          module,
          execution,
          keywords,
          os,
          browser,
          steps,
          task,
          story,
          deadline,
          openedBuild,
          assignedTo,
          project,
        });
        break;
      }

      case 'zentao_resolve_bug': {
        const { id, resolution, resolvedBuild, comment } = args as {
          id: number;
          resolution: 'bydesign' | 'duplicate' | 'external' | 'fixed' | 'notrepro' | 'postponed' | 'willnotfix';
          resolvedBuild?: string;
          comment?: string;
        };
        const success = await zentaoClient.resolveBug({ id, resolution, resolvedBuild, comment });
        result = {
          success,
          message: success ? `Bug #${id} 已解决` : `Bug #${id} 解决失败`,
        };
        break;
      }

      case 'zentao_close_bug': {
        const { id, comment } = args as { id: number; comment?: string };
        const success = await zentaoClient.closeBug({ id, comment });
        result = {
          success,
          message: success ? `Bug #${id} 已关闭` : `Bug #${id} 关闭失败`,
        };
        break;
      }

      // 需求相关
      case 'zentao_get_stories': {
        const { productID, browseType, limit } = args as {
          productID: number;
          browseType?: string;
          limit?: number;
        };
        result = await zentaoClient.getStories(productID, browseType, limit);
        break;
      }

      case 'zentao_get_story': {
        const { storyID } = args as { storyID: number };
        result = await zentaoClient.getStory(storyID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `需求 #${storyID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      case 'zentao_create_story': {
        const { product, title, category, pri, spec, reviewer, verify, estimate, module, plan, source, sourceNote, keywords } =
          args as {
            product: number;
            title: string;
            category: StoryCategory;
            pri: number;
            spec: string;
            reviewer: string[];
            verify?: string;
            estimate?: number;
            module?: number;
            plan?: number;
            source?: string;
            sourceNote?: string;
            keywords?: string;
          };
        result = await zentaoClient.createStory({
          product,
          title,
          category,
          pri,
          spec,
          reviewer,
          verify,
          estimate,
          module,
          plan,
          source,
          sourceNote,
          keywords,
        });
        break;
      }

      case 'zentao_close_story': {
        const { id, closedReason, comment } = args as {
          id: number;
          closedReason: 'done' | 'subdivided' | 'duplicate' | 'postponed' | 'willnotdo' | 'cancel' | 'bydesign';
          comment?: string;
        };
        const success = await zentaoClient.closeStory({ id, closedReason, comment });
        result = {
          success,
          message: success ? `需求 #${id} 已关闭` : `需求 #${id} 关闭失败`,
        };
        break;
      }

      // 产品和项目相关
      case 'zentao_get_products': {
        const { limit } = (args as { limit?: number }) || {};
        result = await zentaoClient.getProducts(limit);
        break;
      }

      case 'zentao_get_projects': {
        const { limit } = (args as { limit?: number }) || {};
        result = await zentaoClient.getProjects(limit);
        break;
      }


      // 测试用例相关
      case 'zentao_get_testcases': {
        const { productID, limit } = args as { productID: number; limit?: number };
        result = await zentaoClient.getTestCases(productID, limit);
        break;
      }

      case 'zentao_get_testcase': {
        const { caseID } = args as { caseID: number };
        result = await zentaoClient.getTestCase(caseID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `测试用例 #${caseID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      case 'zentao_create_testcase': {
        const { product, title, type, steps, pri, stage, precondition, module, story, keywords } =
          args as {
            product: number;
            title: string;
            type: TestCaseType;
            steps: TestCaseStep[];
            pri?: number;
            stage?: TestCaseStage;
            precondition?: string;
            module?: number;
            story?: number;
            keywords?: string;
          };
        result = await zentaoClient.createTestCase({
          product,
          title,
          type,
          steps,
          pri,
          stage,
          precondition,
          module,
          story,
          keywords,
        });
        break;
      }

      // Bug 更新相关
      case 'zentao_update_bug': {
        const { id, title, severity, pri, type, steps, module, deadline } = args as {
          id: number;
          title?: string;
          severity?: BugSeverity;
          pri?: number;
          type?: string;
          steps?: string;
          module?: number;
          deadline?: string;
        };
        result = await zentaoClient.updateBug({ id, title, severity, pri, type, steps, module, deadline });
        if (!result) {
          return {
            content: [{ type: 'text', text: `Bug #${id} 更新失败` }],
            isError: true,
          };
        }
        break;
      }

      // 需求更新/变更相关
      case 'zentao_update_story': {
        const { id, module, source, sourceNote, pri, category, estimate, keywords } = args as {
          id: number;
          module?: number;
          source?: string;
          sourceNote?: string;
          pri?: number;
          category?: string;
          estimate?: number;
          keywords?: string;
        };
        result = await zentaoClient.updateStory({ id, module, source, sourceNote, pri, category, estimate, keywords });
        if (!result) {
          return {
            content: [{ type: 'text', text: `需求 #${id} 更新失败` }],
            isError: true,
          };
        }
        break;
      }

      // 产品详情/创建/更新相关
      case 'zentao_get_product': {
        const { productID } = args as { productID: number };
        result = await zentaoClient.getProduct(productID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `产品 #${productID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      // 项目详情/创建/更新相关
      case 'zentao_get_project': {
        const { projectID } = args as { projectID: number };
        result = await zentaoClient.getProject(projectID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `项目 #${projectID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      // 用户相关
      case 'zentao_get_users': {
        const { limit } = (args as { limit?: number }) || {};
        result = await zentaoClient.getUsers(limit);
        break;
      }

      case 'zentao_get_user': {
        const { userID } = args as { userID: number };
        result = await zentaoClient.getUser(userID);
        if (!result) {
          return {
            content: [{ type: 'text', text: `用户 #${userID} 不存在或无权限查看` }],
            isError: true,
          };
        }
        break;
      }

      case 'zentao_get_my_profile': {
        result = await zentaoClient.getMyProfile();
        if (!result) {
          return {
            content: [{ type: 'text', text: '获取当前用户信息失败' }],
            isError: true,
          };
        }
        break;
      }

      default:
        return {
          content: [{ type: 'text', text: `未知工具: ${name}` }],
          isError: true,
        };
    }

    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(result, null, 2),
        },
      ],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return {
      content: [{ type: 'text', text: `操作失败: ${errorMessage}` }],
      isError: true,
    };
  }
});

// ==================== 启动服务器 ====================

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error('启动失败:', error);
  process.exit(1);
});

