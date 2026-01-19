#!/usr/bin/env node
/**
 * 禅道 MCP Server
 * 提供 Bug 和需求的增删改查工具给 AI 使用
 */
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema, } from '@modelcontextprotocol/sdk/types.js';
import dotenv from 'dotenv';
import { ZentaoClient } from './zentao-client.js';
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
const tools = [
    // Bug 相关工具
    {
        name: 'zentao_get_bugs',
        description: '获取产品的 Bug 列表。可按状态筛选：active(未解决)、resolved(已解决)、closed(已关闭)',
        inputSchema: {
            type: 'object',
            properties: {
                productID: {
                    type: 'number',
                    description: '产品 ID',
                },
                status: {
                    type: 'string',
                    enum: ['active', 'resolved', 'closed'],
                    description: 'Bug 状态筛选（可选）',
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
        name: 'zentao_get_active_bugs',
        description: '获取产品未解决的 Bug 列表（快捷方式）',
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
        name: 'zentao_get_assigned_bugs',
        description: '获取指派给某人的 Bug 列表',
        inputSchema: {
            type: 'object',
            properties: {
                account: {
                    type: 'string',
                    description: '用户账号',
                },
                limit: {
                    type: 'number',
                    description: '返回数量限制，默认 100',
                },
            },
            required: ['account'],
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
                steps: {
                    type: 'string',
                    description: '重现步骤',
                },
                type: {
                    type: 'string',
                    description: 'Bug 类型',
                },
                module: {
                    type: 'number',
                    description: '模块 ID',
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
            required: ['product', 'title'],
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
    {
        name: 'zentao_activate_bug',
        description: '激活 Bug（重新打开已关闭的 Bug）',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    description: 'Bug ID',
                },
                assignedTo: {
                    type: 'string',
                    description: '指派给（用户账号）',
                },
                comment: {
                    type: 'string',
                    description: '备注',
                },
            },
            required: ['id'],
        },
    },
    {
        name: 'zentao_confirm_bug',
        description: '确认 Bug',
        inputSchema: {
            type: 'object',
            properties: {
                bugID: {
                    type: 'number',
                    description: 'Bug ID',
                },
                assignedTo: {
                    type: 'string',
                    description: '指派给（用户账号）',
                },
            },
            required: ['bugID'],
        },
    },
    // 需求相关工具
    {
        name: 'zentao_get_stories',
        description: '获取产品的需求列表。可按状态筛选：draft(草稿)、active(激活)、changed(已变更)、reviewing(评审中)、closed(已关闭)',
        inputSchema: {
            type: 'object',
            properties: {
                productID: {
                    type: 'number',
                    description: '产品 ID',
                },
                status: {
                    type: 'string',
                    enum: ['draft', 'active', 'changed', 'reviewing', 'closed'],
                    description: '需求状态筛选（可选）',
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
        name: 'zentao_get_active_stories',
        description: '获取产品进行中的需求列表（快捷方式）',
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
                spec: {
                    type: 'string',
                    description: '需求描述',
                },
                verify: {
                    type: 'string',
                    description: '验收标准',
                },
                pri: {
                    type: 'number',
                    enum: [1, 2, 3, 4],
                    description: '优先级: 1-紧急, 2-高, 3-中, 4-低',
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
                    description: '来源',
                },
                sourceNote: {
                    type: 'string',
                    description: '来源备注',
                },
            },
            required: ['product', 'title'],
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
    {
        name: 'zentao_activate_story',
        description: '激活需求（重新打开已关闭的需求）',
        inputSchema: {
            type: 'object',
            properties: {
                storyID: {
                    type: 'number',
                    description: '需求 ID',
                },
                assignedTo: {
                    type: 'string',
                    description: '指派给（用户账号）',
                },
                comment: {
                    type: 'string',
                    description: '备注',
                },
            },
            required: ['storyID'],
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
    {
        name: 'zentao_get_executions',
        description: '获取项目的执行（迭代）列表',
        inputSchema: {
            type: 'object',
            properties: {
                projectID: {
                    type: 'number',
                    description: '项目 ID',
                },
                limit: {
                    type: 'number',
                    description: '返回数量限制，默认 100',
                },
            },
            required: ['projectID'],
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
    {
        name: 'zentao_update_testcase',
        description: '修改测试用例',
        inputSchema: {
            type: 'object',
            properties: {
                id: {
                    type: 'number',
                    description: '用例 ID',
                },
                title: {
                    type: 'string',
                    description: '用例标题',
                },
                type: {
                    type: 'string',
                    enum: ['feature', 'performance', 'config', 'install', 'security', 'interface', 'unit', 'other'],
                    description: '用例类型',
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
                    description: '优先级',
                },
                stage: {
                    type: 'string',
                    enum: ['unittest', 'feature', 'intergrate', 'system', 'smoke', 'bvt'],
                    description: '适用阶段',
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
            required: ['id'],
        },
    },
    {
        name: 'zentao_delete_testcase',
        description: '删除测试用例',
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
];
// ==================== 创建 MCP Server ====================
const server = new Server({
    name: 'zentao-mcp',
    version: '1.0.0',
}, {
    capabilities: {
        tools: {},
    },
});
// 列出所有可用工具
server.setRequestHandler(ListToolsRequestSchema, async () => {
    return { tools };
});
// 处理工具调用
server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    try {
        let result;
        switch (name) {
            // Bug 相关
            case 'zentao_get_bugs': {
                const { productID, status, limit } = args;
                result = await zentaoClient.getBugs(productID, status, limit);
                break;
            }
            case 'zentao_get_active_bugs': {
                const { productID, limit } = args;
                result = await zentaoClient.getActiveBugs(productID, limit);
                break;
            }
            case 'zentao_get_assigned_bugs': {
                const { account, limit } = args;
                result = await zentaoClient.getAssignedBugs(account, limit);
                break;
            }
            case 'zentao_get_bug': {
                const { bugID } = args;
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
                const { product, title, severity, pri, steps, type, module, assignedTo, project } = args;
                result = await zentaoClient.createBug({
                    product,
                    title,
                    severity,
                    pri,
                    steps,
                    type,
                    module,
                    assignedTo,
                    project,
                });
                break;
            }
            case 'zentao_resolve_bug': {
                const { id, resolution, resolvedBuild, comment } = args;
                const success = await zentaoClient.resolveBug({ id, resolution, resolvedBuild, comment });
                result = {
                    success,
                    message: success ? `Bug #${id} 已解决` : `Bug #${id} 解决失败`,
                };
                break;
            }
            case 'zentao_close_bug': {
                const { id, comment } = args;
                const success = await zentaoClient.closeBug({ id, comment });
                result = {
                    success,
                    message: success ? `Bug #${id} 已关闭` : `Bug #${id} 关闭失败`,
                };
                break;
            }
            case 'zentao_activate_bug': {
                const { id, assignedTo, comment } = args;
                const success = await zentaoClient.activateBug({ id, assignedTo, comment });
                result = {
                    success,
                    message: success ? `Bug #${id} 已激活` : `Bug #${id} 激活失败`,
                };
                break;
            }
            case 'zentao_confirm_bug': {
                const { bugID, assignedTo } = args;
                const success = await zentaoClient.confirmBug(bugID, assignedTo);
                result = {
                    success,
                    message: success ? `Bug #${bugID} 已确认` : `Bug #${bugID} 确认失败`,
                };
                break;
            }
            // 需求相关
            case 'zentao_get_stories': {
                const { productID, status, limit } = args;
                result = await zentaoClient.getStories(productID, status, limit);
                break;
            }
            case 'zentao_get_active_stories': {
                const { productID, limit } = args;
                result = await zentaoClient.getActiveStories(productID, limit);
                break;
            }
            case 'zentao_get_story': {
                const { storyID } = args;
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
                const { product, title, spec, verify, pri, estimate, module, plan, source, sourceNote } = args;
                result = await zentaoClient.createStory({
                    product,
                    title,
                    spec,
                    verify,
                    pri,
                    estimate,
                    module,
                    plan,
                    source,
                    sourceNote,
                });
                break;
            }
            case 'zentao_close_story': {
                const { id, closedReason, comment } = args;
                const success = await zentaoClient.closeStory({ id, closedReason, comment });
                result = {
                    success,
                    message: success ? `需求 #${id} 已关闭` : `需求 #${id} 关闭失败`,
                };
                break;
            }
            case 'zentao_activate_story': {
                const { storyID, assignedTo, comment } = args;
                const success = await zentaoClient.activateStory(storyID, assignedTo, comment);
                result = {
                    success,
                    message: success ? `需求 #${storyID} 已激活` : `需求 #${storyID} 激活失败`,
                };
                break;
            }
            // 产品和项目相关
            case 'zentao_get_products': {
                const { limit } = args || {};
                result = await zentaoClient.getProducts(limit);
                break;
            }
            case 'zentao_get_projects': {
                const { limit } = args || {};
                result = await zentaoClient.getProjects(limit);
                break;
            }
            case 'zentao_get_executions': {
                const { projectID, limit } = args;
                result = await zentaoClient.getExecutions(projectID, limit);
                break;
            }
            // 测试用例相关
            case 'zentao_get_testcases': {
                const { productID, limit } = args;
                result = await zentaoClient.getTestCases(productID, limit);
                break;
            }
            case 'zentao_get_testcase': {
                const { caseID } = args;
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
                const { product, title, type, steps, pri, stage, precondition, module, story, keywords } = args;
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
            case 'zentao_update_testcase': {
                const { id, title, type, steps, pri, stage, precondition, module, story, keywords } = args;
                result = await zentaoClient.updateTestCase({
                    id,
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
            case 'zentao_delete_testcase': {
                const { caseID } = args;
                const success = await zentaoClient.deleteTestCase(caseID);
                result = {
                    success,
                    message: success ? `测试用例 #${caseID} 已删除` : `测试用例 #${caseID} 删除失败`,
                };
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
    }
    catch (error) {
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
    console.error('禅道 MCP Server 已启动');
}
main().catch((error) => {
    console.error('启动失败:', error);
    process.exit(1);
});
//# sourceMappingURL=index.js.map