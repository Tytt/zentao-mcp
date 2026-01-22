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
    name: 'zentao_bugs',
    description: '查询 Bug。传 bugID 获取单个详情，传 productID 获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        bugID: { type: 'number', description: 'Bug ID（获取详情时使用）' },
        productID: { type: 'number', description: '产品 ID（获取列表时使用）' },
        browseType: {
          type: 'string',
          enum: ['all', 'unclosed', 'unresolved', 'toclosed', 'openedbyme', 'assigntome', 'resolvedbyme', 'assigntonull'],
          description: '浏览类型: all-全部, unclosed-未关闭(默认), unresolved-未解决, toclosed-待关闭, openedbyme-我创建, assigntome-指派给我, resolvedbyme-我解决, assigntonull-未指派',
        },
        limit: { type: 'number', description: '返回数量限制，默认 20' },
      },
      required: [],
    },
  },
  {
    name: 'zentao_create_bug',
    description: '创建新的 Bug',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'number', description: '产品 ID' },
        title: { type: 'string', description: 'Bug 标题' },
        severity: { type: 'number', enum: [1, 2, 3, 4], description: '严重程度: 1-致命, 2-严重, 3-一般, 4-轻微' },
        pri: { type: 'number', enum: [1, 2, 3, 4], description: '优先级: 1-紧急, 2-高, 3-中, 4-低' },
        type: {
          type: 'string',
          enum: ['codeerror', 'config', 'install', 'security', 'performance', 'standard', 'automation', 'designdefect', 'others'],
          description: 'Bug 类型: codeerror-代码错误, config-配置相关, install-安装部署, security-安全相关, performance-性能问题, standard-标准规范, automation-测试脚本, designdefect-设计缺陷, others-其他',
        },
        steps: { type: 'string', description: '重现步骤 (支持 HTML 格式)' },
        assignedTo: { type: 'string', description: '指派给（用户账号）' },
        openedBuild: { type: 'array', items: { type: 'string' }, description: '影响版本，如 ["trunk"]' },
        module: { type: 'number', description: '模块 ID' },
        story: { type: 'number', description: '相关需求 ID' },
        project: { type: 'number', description: '项目 ID' },
      },
      required: ['product', 'title', 'severity', 'pri', 'type'],
    },
  },
  {
    name: 'zentao_bug_action',
    description: 'Bug 操作：解决或关闭',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'number', description: 'Bug ID' },
        action: { type: 'string', enum: ['resolve', 'close'], description: '操作类型: resolve-解决, close-关闭' },
        resolution: {
          type: 'string',
          enum: ['bydesign', 'duplicate', 'external', 'fixed', 'notrepro', 'postponed', 'willnotfix'],
          description: '解决方案（resolve时必填）: fixed-已修复, bydesign-设计如此, duplicate-重复, external-外部原因, notrepro-无法重现, postponed-延期, willnotfix-不予解决',
        },
        comment: { type: 'string', description: '备注' },
      },
      required: ['id', 'action'],
    },
  },

  // 需求相关工具
  {
    name: 'zentao_stories',
    description: '查询需求。传 storyID 获取单个详情，传 productID 获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        storyID: { type: 'number', description: '需求 ID（获取详情时使用）' },
        productID: { type: 'number', description: '产品 ID（获取列表时使用）' },
        browseType: {
          type: 'string',
          enum: ['allstory', 'unclosed', 'draftstory', 'activestory', 'reviewingstory', 'changingstory', 'closedstory', 'openedbyme', 'assignedtome', 'reviewbyme'],
          description: '浏览类型: allstory-全部, unclosed-未关闭(默认), draftstory-草稿, activestory-激活, reviewingstory-评审中, changingstory-变更中, closedstory-已关闭, openedbyme-我创建, assignedtome-指派给我, reviewbyme-我评审',
        },
        limit: { type: 'number', description: '返回数量限制，默认 20' },
      },
      required: [],
    },
  },
  {
    name: 'zentao_create_story',
    description: '创建新需求',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'number', description: '产品 ID' },
        title: { type: 'string', description: '需求标题' },
        category: {
          type: 'string',
          enum: ['feature', 'interface', 'performance', 'safe', 'experience', 'improve', 'other'],
          description: '需求类型: feature-功能, interface-接口, performance-性能, safe-安全, experience-体验, improve-改进, other-其他',
        },
        pri: { type: 'number', enum: [1, 2, 3, 4], description: '优先级: 1-紧急, 2-高, 3-中, 4-低' },
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
        reviewer: { type: 'array', items: { type: 'string' }, description: '评审人账号列表（必填），如 ["york", "admin"]' },
        verify: { type: 'string', description: '验收标准' },
        estimate: { type: 'number', description: '预估工时（小时）' },
        module: { type: 'number', description: '模块 ID' },
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
        id: { type: 'number', description: '需求 ID' },
        closedReason: {
          type: 'string',
          enum: ['done', 'subdivided', 'duplicate', 'postponed', 'willnotdo', 'cancel', 'bydesign'],
          description: '关闭原因: done-已完成, subdivided-已细分, duplicate-重复, postponed-延期, willnotdo-不做, cancel-取消, bydesign-设计如此',
        },
        comment: { type: 'string', description: '备注' },
      },
      required: ['id', 'closedReason'],
    },
  },

  // 产品工具
  {
    name: 'zentao_products',
    description: '查询产品。传 productID 获取单个详情，否则获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        productID: { type: 'number', description: '产品 ID（获取详情时使用）' },
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
  },

  // 项目工具
  {
    name: 'zentao_projects',
    description: '查询项目。传 projectID 获取单个详情，否则获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        projectID: { type: 'number', description: '项目 ID（获取详情时使用）' },
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
  },

  // 测试用例工具
  {
    name: 'zentao_testcases',
    description: '查询测试用例。传 caseID 获取单个详情，传 productID 获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        caseID: { type: 'number', description: '用例 ID（获取详情时使用）' },
        productID: { type: 'number', description: '产品 ID（获取列表时使用）' },
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
  },
  {
    name: 'zentao_create_testcase',
    description: '创建测试用例',
    inputSchema: {
      type: 'object',
      properties: {
        product: { type: 'number', description: '产品 ID' },
        title: { type: 'string', description: '用例标题' },
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
              desc: { type: 'string', description: '步骤描述' },
              expect: { type: 'string', description: '期望结果' },
            },
            required: ['desc', 'expect'],
          },
          description: '用例步骤',
        },
        pri: { type: 'number', enum: [1, 2, 3, 4], description: '优先级: 1-高, 2-中, 3-低, 4-最低' },
        precondition: { type: 'string', description: '前置条件' },
        story: { type: 'number', description: '相关需求 ID' },
      },
      required: ['product', 'title', 'type', 'steps'],
    },
  },

  // 用户工具
  {
    name: 'zentao_users',
    description: '查询用户。传 userID 获取单个详情，传 me=true 获取当前用户，否则获取列表',
    inputSchema: {
      type: 'object',
      properties: {
        userID: { type: 'number', description: '用户 ID（获取详情时使用）' },
        me: { type: 'boolean', description: '获取当前登录用户信息' },
        limit: { type: 'number', description: '返回数量限制，默认 100' },
      },
      required: [],
    },
  },

  // 文档工具
  {
    name: 'zentao_docs',
    description: '文档操作。支持：获取文档库列表、获取文档列表、获取文档详情、创建/编辑文档',
    inputSchema: {
      type: 'object',
      properties: {
        action: {
          type: 'string',
          enum: ['libs', 'list', 'view', 'create', 'edit'],
          description: '操作类型: libs-文档库列表, list-文档列表, view-文档详情, create-创建文档, edit-编辑文档',
        },
        // 查询参数
        libID: { type: 'number', description: '文档库 ID（list/create 时使用）' },
        docID: { type: 'number', description: '文档 ID（view/edit 时使用）' },
        objectType: { type: 'string', enum: ['product', 'project'], description: '对象类型（获取特定产品/项目的文档库时使用）' },
        objectID: { type: 'number', description: '对象 ID（产品或项目 ID）' },
        browseType: { type: 'string', description: '浏览类型: all-全部(默认), draft-草稿' },
        // 创建/编辑参数
        title: { type: 'string', description: '文档标题（create/edit 时使用）' },
        content: { type: 'string', description: '文档内容（HTML 格式）' },
        keywords: { type: 'string', description: '关键词' },
        type: { type: 'string', enum: ['text', 'url'], description: '文档类型: text-富文本(默认), url-链接' },
        url: { type: 'string', description: '外部链接（type=url 时使用）' },
      },
      required: ['action'],
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
      // Bug 查询（列表或详情）
      case 'zentao_bugs': {
        const { bugID, productID, browseType, limit } = args as {
          bugID?: number;
          productID?: number;
          browseType?: string;
          limit?: number;
        };
        if (bugID) {
          result = await zentaoClient.getBug(bugID);
          if (!result) {
            return { content: [{ type: 'text', text: `Bug #${bugID} 不存在或无权限查看` }], isError: true };
          }
        } else if (productID) {
          result = await zentaoClient.getBugs(productID, browseType, limit);
        } else {
          return { content: [{ type: 'text', text: '请提供 bugID 或 productID' }], isError: true };
        }
        break;
      }

      // 创建 Bug
      case 'zentao_create_bug': {
        const { product, title, severity, pri, type, steps, assignedTo, openedBuild, module, story, project } = args as {
          product: number;
          title: string;
          severity: BugSeverity;
          pri: number;
          type: BugType;
          steps?: string;
          assignedTo?: string;
          openedBuild?: string[];
          module?: number;
          story?: number;
          project?: number;
        };
        result = await zentaoClient.createBug({ product, title, severity, pri, type, steps, assignedTo, openedBuild, module, story, project });
        break;
      }

      // Bug 操作（解决/关闭）
      case 'zentao_bug_action': {
        const { id, action, resolution, comment } = args as {
          id: number;
          action: 'resolve' | 'close';
          resolution?: 'bydesign' | 'duplicate' | 'external' | 'fixed' | 'notrepro' | 'postponed' | 'willnotfix';
          comment?: string;
        };
        let success: boolean;
        if (action === 'resolve') {
          if (!resolution) {
            return { content: [{ type: 'text', text: '解决 Bug 时必须提供 resolution' }], isError: true };
          }
          success = await zentaoClient.resolveBug({ id, resolution, comment });
          result = { success, message: success ? `Bug #${id} 已解决` : `Bug #${id} 解决失败` };
        } else {
          success = await zentaoClient.closeBug({ id, comment });
          result = { success, message: success ? `Bug #${id} 已关闭` : `Bug #${id} 关闭失败` };
        }
        break;
      }

      // 需求查询（列表或详情）
      case 'zentao_stories': {
        const { storyID, productID, browseType, limit } = args as {
          storyID?: number;
          productID?: number;
          browseType?: string;
          limit?: number;
        };
        if (storyID) {
          result = await zentaoClient.getStory(storyID);
          if (!result) {
            return { content: [{ type: 'text', text: `需求 #${storyID} 不存在或无权限查看` }], isError: true };
          }
        } else if (productID) {
          result = await zentaoClient.getStories(productID, browseType, limit);
        } else {
          return { content: [{ type: 'text', text: '请提供 storyID 或 productID' }], isError: true };
        }
        break;
      }

      // 创建需求
      case 'zentao_create_story': {
        const { product, title, category, pri, spec, reviewer, verify, estimate, module } = args as {
          product: number;
          title: string;
          category: StoryCategory;
          pri: number;
          spec: string;
          reviewer: string[];
          verify?: string;
          estimate?: number;
          module?: number;
        };
        result = await zentaoClient.createStory({ product, title, category, pri, spec, reviewer, verify, estimate, module });
        break;
      }

      // 关闭需求
      case 'zentao_close_story': {
        const { id, closedReason, comment } = args as {
          id: number;
          closedReason: 'done' | 'subdivided' | 'duplicate' | 'postponed' | 'willnotdo' | 'cancel' | 'bydesign';
          comment?: string;
        };
        const success = await zentaoClient.closeStory({ id, closedReason, comment });
        result = { success, message: success ? `需求 #${id} 已关闭` : `需求 #${id} 关闭失败` };
        break;
      }

      // 产品查询（列表或详情）
      case 'zentao_products': {
        const { productID, limit } = args as { productID?: number; limit?: number };
        if (productID) {
          result = await zentaoClient.getProduct(productID);
          if (!result) {
            return { content: [{ type: 'text', text: `产品 #${productID} 不存在或无权限查看` }], isError: true };
          }
        } else {
          result = await zentaoClient.getProducts(limit);
        }
        break;
      }

      // 项目查询（列表或详情）
      case 'zentao_projects': {
        const { projectID, limit } = args as { projectID?: number; limit?: number };
        if (projectID) {
          result = await zentaoClient.getProject(projectID);
          if (!result) {
            return { content: [{ type: 'text', text: `项目 #${projectID} 不存在或无权限查看` }], isError: true };
          }
        } else {
          result = await zentaoClient.getProjects(limit);
        }
        break;
      }

      // 测试用例查询（列表或详情）
      case 'zentao_testcases': {
        const { caseID, productID, limit } = args as { caseID?: number; productID?: number; limit?: number };
        if (caseID) {
          result = await zentaoClient.getTestCase(caseID);
          if (!result) {
            return { content: [{ type: 'text', text: `测试用例 #${caseID} 不存在或无权限查看` }], isError: true };
          }
        } else if (productID) {
          result = await zentaoClient.getTestCases(productID, limit);
        } else {
          return { content: [{ type: 'text', text: '请提供 caseID 或 productID' }], isError: true };
        }
        break;
      }

      // 创建测试用例
      case 'zentao_create_testcase': {
        const { product, title, type, steps, pri, precondition, story } = args as {
          product: number;
          title: string;
          type: TestCaseType;
          steps: TestCaseStep[];
          pri?: number;
          precondition?: string;
          story?: number;
        };
        result = await zentaoClient.createTestCase({ product, title, type, steps, pri, precondition, story });
        break;
      }

      // 用户查询（列表/详情/当前用户）
      case 'zentao_users': {
        const { userID, me, limit } = args as { userID?: number; me?: boolean; limit?: number };
        if (me) {
          result = await zentaoClient.getMyProfile();
          if (!result) {
            return { content: [{ type: 'text', text: '获取当前用户信息失败' }], isError: true };
          }
        } else if (userID) {
          result = await zentaoClient.getUser(userID);
          if (!result) {
            return { content: [{ type: 'text', text: `用户 #${userID} 不存在或无权限查看` }], isError: true };
          }
        } else {
          result = await zentaoClient.getUsers(limit);
        }
        break;
      }

      // 文档操作
      case 'zentao_docs': {
        const { action, libID, docID, objectType, objectID, browseType, title, content, keywords, type, url } = args as {
          action: string;
          libID?: number;
          docID?: number;
          objectType?: 'product' | 'project';
          objectID?: number;
          browseType?: string;
          title?: string;
          content?: string;
          keywords?: string;
          type?: string;
          url?: string;
        };

        switch (action) {
          case 'libs':
            // 获取文档库列表
            if (objectType && objectID) {
              result = await zentaoClient.getObjectDocLibs(objectType, objectID);
            } else {
              result = await zentaoClient.getDocLibs();
            }
            break;

          case 'list':
            // 获取文档列表
            if (!libID) {
              return { content: [{ type: 'text', text: '缺少必要参数: libID（文档库 ID）' }], isError: true };
            }
            result = await zentaoClient.getDocs(libID, browseType);
            break;

          case 'view':
            // 获取文档详情
            if (!docID) {
              return { content: [{ type: 'text', text: '缺少必要参数: docID（文档 ID）' }], isError: true };
            }
            result = await zentaoClient.getDoc(docID);
            if (!result) {
              return { content: [{ type: 'text', text: `文档 #${docID} 不存在或无权限查看` }], isError: true };
            }
            break;

          case 'create':
            // 创建文档
            if (!libID || !title) {
              return { content: [{ type: 'text', text: '缺少必要参数: libID（文档库 ID）和 title（标题）' }], isError: true };
            }
            result = await zentaoClient.createDoc({
              lib: libID,
              title,
              type: type as 'text' | 'url' | undefined,
              content,
              url,
              keywords,
            });
            break;

          case 'edit':
            // 编辑文档
            if (!docID) {
              return { content: [{ type: 'text', text: '缺少必要参数: docID（文档 ID）' }], isError: true };
            }
            result = await zentaoClient.editDoc({ id: docID, title, content, keywords });
            if (!result) {
              return { content: [{ type: 'text', text: `编辑文档 #${docID} 失败` }], isError: true };
            }
            break;

          default:
            return { content: [{ type: 'text', text: `未知操作类型: ${action}` }], isError: true };
        }
        break;
      }

      default:
        return { content: [{ type: 'text', text: `未知工具: ${name}` }], isError: true };
    }

    return { content: [{ type: 'text', text: JSON.stringify(result, null, 2) }] };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '未知错误';
    return { content: [{ type: 'text', text: `操作失败: ${errorMessage}` }], isError: true };
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

