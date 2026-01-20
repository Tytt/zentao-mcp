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
                    description: '需求描述',
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
            required: ['product', 'title', 'category', 'pri'],
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
    {
        name: 'zentao_change_story',
        description: '变更需求（修改标题、描述、验收标准，会导致状态变为 changed）',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '需求 ID' },
                title: { type: 'string', description: '标题' },
                spec: { type: 'string', description: '描述' },
                verify: { type: 'string', description: '验收标准' },
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
    {
        name: 'zentao_create_product',
        description: '创建产品',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '产品名称' },
                code: { type: 'string', description: '产品代号' },
                program: { type: 'number', description: '所属项目集 ID' },
                PO: { type: 'string', description: '产品负责人账号' },
                QD: { type: 'string', description: '测试负责人账号' },
                RD: { type: 'string', description: '发布负责人账号' },
                type: { type: 'string', enum: ['normal', 'branch', 'platform'], description: '产品类型' },
                desc: { type: 'string', description: '产品描述' },
                acl: { type: 'string', enum: ['open', 'private'], description: '访问控制' },
            },
            required: ['name', 'code'],
        },
    },
    {
        name: 'zentao_update_product',
        description: '更新产品信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '产品 ID' },
                name: { type: 'string', description: '产品名称' },
                code: { type: 'string', description: '产品代号' },
                desc: { type: 'string', description: '产品描述' },
                PO: { type: 'string', description: '产品负责人账号' },
                QD: { type: 'string', description: '测试负责人账号' },
                RD: { type: 'string', description: '发布负责人账号' },
                status: { type: 'string', description: '产品状态' },
            },
            required: ['id'],
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
    {
        name: 'zentao_create_project',
        description: '创建项目',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '项目名称' },
                code: { type: 'string', description: '项目代号' },
                begin: { type: 'string', description: '开始日期 YYYY-MM-DD' },
                end: { type: 'string', description: '结束日期 YYYY-MM-DD' },
                products: { type: 'array', items: { type: 'number' }, description: '关联产品 ID 列表' },
                model: { type: 'string', enum: ['scrum', 'waterfall'], description: '项目模型' },
                parent: { type: 'number', description: '所属项目集 ID' },
            },
            required: ['name', 'code', 'begin', 'end', 'products'],
        },
    },
    {
        name: 'zentao_update_project',
        description: '更新项目信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '项目 ID' },
                name: { type: 'string', description: '项目名称' },
                code: { type: 'string', description: '项目代号' },
                PM: { type: 'string', description: '项目负责人账号' },
                desc: { type: 'string', description: '项目描述' },
                days: { type: 'number', description: '可用工作日' },
            },
            required: ['id'],
        },
    },
    // 任务相关工具
    {
        name: 'zentao_get_tasks',
        description: '获取执行（迭代）的任务列表',
        inputSchema: {
            type: 'object',
            properties: {
                executionID: { type: 'number', description: '执行 ID' },
                limit: { type: 'number', description: '返回数量限制，默认 100' },
            },
            required: ['executionID'],
        },
    },
    {
        name: 'zentao_get_task',
        description: '获取任务详情',
        inputSchema: {
            type: 'object',
            properties: {
                taskID: { type: 'number', description: '任务 ID' },
            },
            required: ['taskID'],
        },
    },
    {
        name: 'zentao_create_task',
        description: '创建任务',
        inputSchema: {
            type: 'object',
            properties: {
                execution: { type: 'number', description: '执行 ID' },
                name: { type: 'string', description: '任务名称' },
                type: { type: 'string', enum: ['design', 'devel', 'request', 'test', 'study', 'discuss', 'ui', 'affair', 'misc'], description: '任务类型' },
                assignedTo: { type: 'array', items: { type: 'string' }, description: '指派给（用户账号列表）' },
                estStarted: { type: 'string', description: '预计开始日期 YYYY-MM-DD' },
                deadline: { type: 'string', description: '截止日期 YYYY-MM-DD' },
                story: { type: 'number', description: '关联需求 ID' },
                pri: { type: 'number', description: '优先级' },
                estimate: { type: 'number', description: '预计工时' },
                desc: { type: 'string', description: '任务描述' },
            },
            required: ['execution', 'name', 'type', 'assignedTo', 'estStarted', 'deadline'],
        },
    },
    {
        name: 'zentao_update_task',
        description: '更新任务信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '任务 ID' },
                name: { type: 'string', description: '任务名称' },
                type: { type: 'string', enum: ['design', 'devel', 'request', 'test', 'study', 'discuss', 'ui', 'affair', 'misc'], description: '任务类型' },
                assignedTo: { type: 'array', items: { type: 'string' }, description: '指派给' },
                pri: { type: 'number', description: '优先级' },
                estimate: { type: 'number', description: '预计工时' },
                deadline: { type: 'string', description: '截止日期' },
                desc: { type: 'string', description: '任务描述' },
            },
            required: ['id'],
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
    {
        name: 'zentao_create_user',
        description: '创建用户',
        inputSchema: {
            type: 'object',
            properties: {
                account: { type: 'string', description: '用户账号' },
                password: { type: 'string', description: '密码' },
                realname: { type: 'string', description: '真实姓名' },
                gender: { type: 'string', enum: ['m', 'f'], description: '性别' },
                role: { type: 'string', description: '角色' },
                dept: { type: 'number', description: '部门 ID' },
                email: { type: 'string', description: '邮箱' },
                mobile: { type: 'string', description: '手机号' },
            },
            required: ['account', 'password'],
        },
    },
    {
        name: 'zentao_update_user',
        description: '更新用户信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '用户 ID' },
                realname: { type: 'string', description: '真实姓名' },
                role: { type: 'string', description: '角色' },
                dept: { type: 'number', description: '部门 ID' },
                email: { type: 'string', description: '邮箱' },
                mobile: { type: 'string', description: '手机号' },
            },
            required: ['id'],
        },
    },
    // 项目集相关工具
    {
        name: 'zentao_get_programs',
        description: '获取项目集列表',
        inputSchema: {
            type: 'object',
            properties: {
                limit: { type: 'number', description: '返回数量限制，默认 100' },
            },
            required: [],
        },
    },
    {
        name: 'zentao_get_program',
        description: '获取项目集详情',
        inputSchema: {
            type: 'object',
            properties: {
                programID: { type: 'number', description: '项目集 ID' },
            },
            required: ['programID'],
        },
    },
    {
        name: 'zentao_create_program',
        description: '创建项目集',
        inputSchema: {
            type: 'object',
            properties: {
                name: { type: 'string', description: '项目集名称' },
                begin: { type: 'string', description: '开始日期 YYYY-MM-DD' },
                end: { type: 'string', description: '结束日期 YYYY-MM-DD' },
                parent: { type: 'number', description: '父项目集 ID' },
                PM: { type: 'string', description: '负责人账号' },
                budget: { type: 'number', description: '预算' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['name', 'begin', 'end'],
        },
    },
    {
        name: 'zentao_update_program',
        description: '更新项目集信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '项目集 ID' },
                name: { type: 'string', description: '项目集名称' },
                PM: { type: 'string', description: '负责人账号' },
                budget: { type: 'number', description: '预算' },
                desc: { type: 'string', description: '描述' },
                begin: { type: 'string', description: '开始日期' },
                end: { type: 'string', description: '结束日期' },
            },
            required: ['id'],
        },
    },
    // 计划相关工具
    {
        name: 'zentao_get_plans',
        description: '获取产品计划列表',
        inputSchema: {
            type: 'object',
            properties: {
                productID: { type: 'number', description: '产品 ID' },
                limit: { type: 'number', description: '返回数量限制，默认 100' },
            },
            required: ['productID'],
        },
    },
    {
        name: 'zentao_get_plan',
        description: '获取计划详情',
        inputSchema: {
            type: 'object',
            properties: {
                planID: { type: 'number', description: '计划 ID' },
            },
            required: ['planID'],
        },
    },
    {
        name: 'zentao_create_plan',
        description: '创建计划',
        inputSchema: {
            type: 'object',
            properties: {
                product: { type: 'number', description: '产品 ID' },
                title: { type: 'string', description: '计划名称' },
                begin: { type: 'string', description: '开始日期 YYYY-MM-DD' },
                end: { type: 'string', description: '结束日期 YYYY-MM-DD' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['product', 'title'],
        },
    },
    {
        name: 'zentao_update_plan',
        description: '更新计划信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '计划 ID' },
                title: { type: 'string', description: '计划名称' },
                begin: { type: 'string', description: '开始日期' },
                end: { type: 'string', description: '结束日期' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['id'],
        },
    },
    {
        name: 'zentao_link_stories_to_plan',
        description: '计划关联需求',
        inputSchema: {
            type: 'object',
            properties: {
                planID: { type: 'number', description: '计划 ID' },
                stories: { type: 'array', items: { type: 'number' }, description: '需求 ID 列表' },
            },
            required: ['planID', 'stories'],
        },
    },
    {
        name: 'zentao_unlink_stories_from_plan',
        description: '计划取消关联需求',
        inputSchema: {
            type: 'object',
            properties: {
                planID: { type: 'number', description: '计划 ID' },
                stories: { type: 'array', items: { type: 'number' }, description: '需求 ID 列表' },
            },
            required: ['planID', 'stories'],
        },
    },
    {
        name: 'zentao_link_bugs_to_plan',
        description: '计划关联 Bug',
        inputSchema: {
            type: 'object',
            properties: {
                planID: { type: 'number', description: '计划 ID' },
                bugs: { type: 'array', items: { type: 'number' }, description: 'Bug ID 列表' },
            },
            required: ['planID', 'bugs'],
        },
    },
    {
        name: 'zentao_unlink_bugs_from_plan',
        description: '计划取消关联 Bug',
        inputSchema: {
            type: 'object',
            properties: {
                planID: { type: 'number', description: '计划 ID' },
                bugs: { type: 'array', items: { type: 'number' }, description: 'Bug ID 列表' },
            },
            required: ['planID', 'bugs'],
        },
    },
    // 发布相关工具
    {
        name: 'zentao_get_project_releases',
        description: '获取项目发布列表',
        inputSchema: {
            type: 'object',
            properties: {
                projectID: { type: 'number', description: '项目 ID' },
            },
            required: ['projectID'],
        },
    },
    {
        name: 'zentao_get_product_releases',
        description: '获取产品发布列表',
        inputSchema: {
            type: 'object',
            properties: {
                productID: { type: 'number', description: '产品 ID' },
            },
            required: ['productID'],
        },
    },
    // 版本相关工具
    {
        name: 'zentao_get_project_builds',
        description: '获取项目版本列表',
        inputSchema: {
            type: 'object',
            properties: {
                projectID: { type: 'number', description: '项目 ID' },
            },
            required: ['projectID'],
        },
    },
    {
        name: 'zentao_get_execution_builds',
        description: '获取执行版本列表',
        inputSchema: {
            type: 'object',
            properties: {
                executionID: { type: 'number', description: '执行 ID' },
            },
            required: ['executionID'],
        },
    },
    {
        name: 'zentao_get_build',
        description: '获取版本详情',
        inputSchema: {
            type: 'object',
            properties: {
                buildID: { type: 'number', description: '版本 ID' },
            },
            required: ['buildID'],
        },
    },
    {
        name: 'zentao_create_build',
        description: '创建版本',
        inputSchema: {
            type: 'object',
            properties: {
                project: { type: 'number', description: '项目 ID' },
                name: { type: 'string', description: '版本名称' },
                execution: { type: 'number', description: '执行 ID' },
                product: { type: 'number', description: '产品 ID' },
                builder: { type: 'string', description: '构建者账号' },
                date: { type: 'string', description: '打包日期 YYYY-MM-DD' },
                scmPath: { type: 'string', description: '源代码地址' },
                filePath: { type: 'string', description: '下载地址' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['project', 'name', 'execution', 'product', 'builder'],
        },
    },
    {
        name: 'zentao_update_build',
        description: '更新版本信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '版本 ID' },
                name: { type: 'string', description: '版本名称' },
                scmPath: { type: 'string', description: '源代码地址' },
                filePath: { type: 'string', description: '下载地址' },
                desc: { type: 'string', description: '描述' },
                builder: { type: 'string', description: '构建者' },
                date: { type: 'string', description: '打包日期' },
            },
            required: ['id'],
        },
    },
    // 执行（迭代）相关工具
    {
        name: 'zentao_get_execution',
        description: '获取执行（迭代）详情',
        inputSchema: {
            type: 'object',
            properties: {
                executionID: { type: 'number', description: '执行 ID' },
            },
            required: ['executionID'],
        },
    },
    {
        name: 'zentao_create_execution',
        description: '创建执行（迭代）',
        inputSchema: {
            type: 'object',
            properties: {
                project: { type: 'number', description: '项目 ID' },
                name: { type: 'string', description: '执行名称' },
                code: { type: 'string', description: '执行代号' },
                begin: { type: 'string', description: '开始日期 YYYY-MM-DD' },
                end: { type: 'string', description: '结束日期 YYYY-MM-DD' },
                days: { type: 'number', description: '可用工作日' },
                PM: { type: 'string', description: '迭代负责人账号' },
                teamMembers: { type: 'array', items: { type: 'string' }, description: '团队成员账号列表' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['project', 'name', 'code', 'begin', 'end'],
        },
    },
    {
        name: 'zentao_update_execution',
        description: '更新执行（迭代）信息',
        inputSchema: {
            type: 'object',
            properties: {
                id: { type: 'number', description: '执行 ID' },
                name: { type: 'string', description: '执行名称' },
                code: { type: 'string', description: '执行代号' },
                begin: { type: 'string', description: '开始日期' },
                end: { type: 'string', description: '结束日期' },
                days: { type: 'number', description: '可用工作日' },
                PM: { type: 'string', description: '迭代负责人' },
                desc: { type: 'string', description: '描述' },
            },
            required: ['id'],
        },
    },
    // 测试单相关工具
    {
        name: 'zentao_get_testtasks',
        description: '获取测试单列表',
        inputSchema: {
            type: 'object',
            properties: {
                productID: { type: 'number', description: '产品 ID（可选）' },
                limit: { type: 'number', description: '返回数量限制，默认 100' },
            },
            required: [],
        },
    },
    {
        name: 'zentao_get_project_testtasks',
        description: '获取项目测试单列表',
        inputSchema: {
            type: 'object',
            properties: {
                projectID: { type: 'number', description: '项目 ID' },
            },
            required: ['projectID'],
        },
    },
    {
        name: 'zentao_get_testtask',
        description: '获取测试单详情',
        inputSchema: {
            type: 'object',
            properties: {
                testtaskID: { type: 'number', description: '测试单 ID' },
            },
            required: ['testtaskID'],
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
                const { product, title, severity, pri, type, branch, module, execution, keywords, os, browser, steps, task, story, deadline, openedBuild, assignedTo, project } = args;
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
                const { product, title, category, pri, spec, verify, estimate, module, plan, source, sourceNote, keywords } = args;
                result = await zentaoClient.createStory({
                    product,
                    title,
                    category,
                    pri,
                    spec,
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
            // Bug 更新相关
            case 'zentao_update_bug': {
                const { id, title, severity, pri, type, steps, module, deadline } = args;
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
                const { id, module, source, sourceNote, pri, category, estimate, keywords } = args;
                result = await zentaoClient.updateStory({ id, module, source, sourceNote, pri, category, estimate, keywords });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `需求 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_change_story': {
                const { id, title, spec, verify } = args;
                result = await zentaoClient.changeStory({ id, title, spec, verify });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `需求 #${id} 变更失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 产品详情/创建/更新相关
            case 'zentao_get_product': {
                const { productID } = args;
                result = await zentaoClient.getProduct(productID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `产品 #${productID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_product': {
                const { name, code, program, PO, QD, RD, type, desc, acl } = args;
                result = await zentaoClient.createProduct({ name, code, program, PO, QD, RD, type, desc, acl });
                break;
            }
            case 'zentao_update_product': {
                const { id, name, code, desc, PO, QD, RD, status } = args;
                result = await zentaoClient.updateProduct({ id, name, code, desc, PO, QD, RD, status });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `产品 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 项目详情/创建/更新相关
            case 'zentao_get_project': {
                const { projectID } = args;
                result = await zentaoClient.getProject(projectID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `项目 #${projectID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_project': {
                const { name, code, begin, end, products, model, parent } = args;
                result = await zentaoClient.createProject({ name, code, begin, end, products, model, parent });
                break;
            }
            case 'zentao_update_project': {
                const { id, name, code, PM, desc, days } = args;
                result = await zentaoClient.updateProject({ id, name, code, PM, desc, days });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `项目 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 任务相关
            case 'zentao_get_tasks': {
                const { executionID, limit } = args;
                result = await zentaoClient.getTasks(executionID, limit);
                break;
            }
            case 'zentao_get_task': {
                const { taskID } = args;
                result = await zentaoClient.getTask(taskID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `任务 #${taskID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_task': {
                const { execution, name, type, assignedTo, estStarted, deadline, story, pri, estimate, desc } = args;
                result = await zentaoClient.createTask({ execution, name, type, assignedTo, estStarted, deadline, story, pri, estimate, desc });
                break;
            }
            case 'zentao_update_task': {
                const { id, name, type, assignedTo, pri, estimate, deadline, desc } = args;
                result = await zentaoClient.updateTask({ id, name, type, assignedTo, pri, estimate, deadline, desc });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `任务 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 用户相关
            case 'zentao_get_users': {
                const { limit } = args || {};
                result = await zentaoClient.getUsers(limit);
                break;
            }
            case 'zentao_get_user': {
                const { userID } = args;
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
            case 'zentao_create_user': {
                const { account, password, realname, gender, role, dept, email, mobile } = args;
                result = await zentaoClient.createUser({ account, password, realname, gender, role, dept, email, mobile });
                break;
            }
            case 'zentao_update_user': {
                const { id, realname, role, dept, email, mobile } = args;
                result = await zentaoClient.updateUser({ id, realname, role, dept, email, mobile });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `用户 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 项目集相关
            case 'zentao_get_programs': {
                const { limit } = args || {};
                result = await zentaoClient.getPrograms(limit);
                break;
            }
            case 'zentao_get_program': {
                const { programID } = args;
                result = await zentaoClient.getProgram(programID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `项目集 #${programID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_program': {
                const { name, begin, end, parent, PM, budget, desc } = args;
                result = await zentaoClient.createProgram({ name, begin, end, parent, PM, budget, desc });
                break;
            }
            case 'zentao_update_program': {
                const { id, name, PM, budget, desc, begin, end } = args;
                result = await zentaoClient.updateProgram({ id, name, PM, budget, desc, begin, end });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `项目集 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 计划相关
            case 'zentao_get_plans': {
                const { productID, limit } = args;
                result = await zentaoClient.getPlans(productID, limit);
                break;
            }
            case 'zentao_get_plan': {
                const { planID } = args;
                result = await zentaoClient.getPlan(planID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `计划 #${planID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_plan': {
                const { product, title, begin, end, desc } = args;
                result = await zentaoClient.createPlan({ product, title, begin, end, desc });
                break;
            }
            case 'zentao_update_plan': {
                const { id, title, begin, end, desc } = args;
                result = await zentaoClient.updatePlan({ id, title, begin, end, desc });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `计划 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_link_stories_to_plan': {
                const { planID, stories } = args;
                const success = await zentaoClient.linkStoriesToPlan(planID, stories);
                result = {
                    success,
                    message: success ? `计划 #${planID} 已关联 ${stories.length} 个需求` : '关联需求失败',
                };
                break;
            }
            case 'zentao_unlink_stories_from_plan': {
                const { planID, stories } = args;
                const success = await zentaoClient.unlinkStoriesFromPlan(planID, stories);
                result = {
                    success,
                    message: success ? `计划 #${planID} 已取消关联 ${stories.length} 个需求` : '取消关联需求失败',
                };
                break;
            }
            case 'zentao_link_bugs_to_plan': {
                const { planID, bugs } = args;
                const success = await zentaoClient.linkBugsToPlan(planID, bugs);
                result = {
                    success,
                    message: success ? `计划 #${planID} 已关联 ${bugs.length} 个 Bug` : '关联 Bug 失败',
                };
                break;
            }
            case 'zentao_unlink_bugs_from_plan': {
                const { planID, bugs } = args;
                const success = await zentaoClient.unlinkBugsFromPlan(planID, bugs);
                result = {
                    success,
                    message: success ? `计划 #${planID} 已取消关联 ${bugs.length} 个 Bug` : '取消关联 Bug 失败',
                };
                break;
            }
            // 发布相关
            case 'zentao_get_project_releases': {
                const { projectID } = args;
                result = await zentaoClient.getProjectReleases(projectID);
                break;
            }
            case 'zentao_get_product_releases': {
                const { productID } = args;
                result = await zentaoClient.getProductReleases(productID);
                break;
            }
            // 版本相关
            case 'zentao_get_project_builds': {
                const { projectID } = args;
                result = await zentaoClient.getProjectBuilds(projectID);
                break;
            }
            case 'zentao_get_execution_builds': {
                const { executionID } = args;
                result = await zentaoClient.getExecutionBuilds(executionID);
                break;
            }
            case 'zentao_get_build': {
                const { buildID } = args;
                result = await zentaoClient.getBuild(buildID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `版本 #${buildID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_build': {
                const { project, name, execution, product, builder, date, scmPath, filePath, desc } = args;
                result = await zentaoClient.createBuild({ project, name, execution, product, builder, date, scmPath, filePath, desc });
                break;
            }
            case 'zentao_update_build': {
                const { id, name, scmPath, filePath, desc, builder, date } = args;
                result = await zentaoClient.updateBuild({ id, name, scmPath, filePath, desc, builder, date });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `版本 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 执行（迭代）相关
            case 'zentao_get_execution': {
                const { executionID } = args;
                result = await zentaoClient.getExecution(executionID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `执行 #${executionID} 不存在或无权限查看` }],
                        isError: true,
                    };
                }
                break;
            }
            case 'zentao_create_execution': {
                const { project, name, code, begin, end, days, PM, teamMembers, desc } = args;
                result = await zentaoClient.createExecution({ project, name, code, begin, end, days, PM, teamMembers, desc });
                break;
            }
            case 'zentao_update_execution': {
                const { id, name, code, begin, end, days, PM, desc } = args;
                result = await zentaoClient.updateExecution({ id, name, code, begin, end, days, PM, desc });
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `执行 #${id} 更新失败` }],
                        isError: true,
                    };
                }
                break;
            }
            // 测试单相关
            case 'zentao_get_testtasks': {
                const { productID, limit } = args || {};
                result = await zentaoClient.getTestTasks(productID, limit);
                break;
            }
            case 'zentao_get_project_testtasks': {
                const { projectID } = args;
                result = await zentaoClient.getProjectTestTasks(projectID);
                break;
            }
            case 'zentao_get_testtask': {
                const { testtaskID } = args;
                result = await zentaoClient.getTestTask(testtaskID);
                if (!result) {
                    return {
                        content: [{ type: 'text', text: `测试单 #${testtaskID} 不存在或无权限查看` }],
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