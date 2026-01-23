/**
 * 禅道 API 客户端
 * 封装禅道 REST API 的调用，支持 Bug 和需求的增删改查
 */
import axios from 'axios';
import https from 'https';
import CryptoJS from 'crypto-js';
import FormData from 'form-data';
/**
 * 禅道 API 客户端类
 * 提供与禅道系统交互的所有方法
 */
export class ZentaoClient {
    config;
    http;
    sessionID = '';
    isLoggedIn = false;
    // 内置 API 认证相关属性
    legacySessionID = '';
    legacySessionName = 'zentaosid';
    legacyRand = 0;
    isLegacyLoggedIn = false;
    legacyCookies = [];
    /**
     * 创建禅道客户端实例
     * @param config - 禅道配置
     */
    constructor(config) {
        this.config = config;
        // 规范化 URL
        const baseURL = config.url.endsWith('/') ? config.url.slice(0, -1) : config.url;
        // 创建 axios 实例配置
        const axiosConfig = {
            baseURL,
            timeout: 30000,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        // 如果配置跳过SSL验证，创建自定义 https agent
        if (config.rejectUnauthorized === false) {
            axiosConfig.httpsAgent = new https.Agent({
                rejectUnauthorized: false,
            });
        }
        this.http = axios.create(axiosConfig);
    }
    /**
     * 获取 Session ID
     * @returns Session ID
     */
    async getSessionID() {
        const response = await this.http.get('/api.php/v1/tokens');
        return response.data.data || response.data.sessionID || response.data;
    }
    /**
     * 登录禅道系统
     * @returns 是否登录成功
     */
    async login() {
        if (this.isLoggedIn) {
            return true;
        }
        try {
            // 获取 session
            this.sessionID = await this.getSessionID();
            // 密码 MD5 加密
            const passwordMd5 = CryptoJS.MD5(this.config.password).toString();
            // 登录请求
            const response = await this.http.post(`/api.php/v1/tokens`, {
                account: this.config.account,
                password: passwordMd5,
            });
            if (response.data.token) {
                // 新版本 API 返回 token
                this.http.defaults.headers.common['Token'] = response.data.token;
                this.isLoggedIn = true;
            }
            else if (response.data.data?.token) {
                this.http.defaults.headers.common['Token'] = response.data.data.token;
                this.isLoggedIn = true;
            }
            else {
                // 老版本可能使用 session
                this.http.defaults.headers.common['Cookie'] = `zentaosid=${this.sessionID}`;
                this.isLoggedIn = true;
            }
            return true;
        }
        catch (error) {
            console.error('禅道登录失败:', error);
            throw new Error(`禅道登录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 确保已登录
     */
    async ensureLogin() {
        if (!this.isLoggedIn) {
            await this.login();
        }
    }
    // ==================== Bug 相关方法 ====================
    /**
     * 获取 Bug 列表
     * @param productID - 产品 ID
     * @param browseType - 浏览类型: all-全部, unclosed-未关闭, unresolved-未解决, toclosed-待关闭, openedbyme-我创建, assigntome-指派给我
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    async getBugs(productID, browseType, limit) {
        await this.ensureLogin();
        const params = new URLSearchParams();
        if (browseType)
            params.append('status', browseType);
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const url = `/api.php/v1/products/${productID}/bugs${queryString ? '?' + queryString : ''}`;
        const response = await this.http.get(url);
        return response.data.data || response.data.bugs || [];
    }
    /**
     * 获取指派给某人的 Bug
     * @param account - 用户账号
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    async getAssignedBugs(account, limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/bugs?assignedTo=${account}&limit=${limit}`);
        return response.data.data || response.data.bugs || [];
    }
    /**
     * 获取 Bug 详情
     * @param bugID - Bug ID
     * @returns Bug 详情
     */
    async getBug(bugID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/bugs/${bugID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建 Bug
     * @param params - 创建 Bug 参数
     * @returns 新创建的 Bug
     */
    async createBug(params) {
        await this.ensureLogin();
        const data = {
            title: params.title,
            severity: params.severity,
            pri: params.pri,
            type: params.type,
        };
        // 可选参数，仅在有值时添加
        if (params.branch !== undefined)
            data.branch = params.branch;
        if (params.module !== undefined)
            data.module = params.module;
        if (params.execution !== undefined)
            data.execution = params.execution;
        if (params.keywords !== undefined)
            data.keywords = params.keywords;
        if (params.os !== undefined)
            data.os = params.os;
        if (params.browser !== undefined)
            data.browser = params.browser;
        if (params.steps !== undefined)
            data.steps = params.steps;
        if (params.task !== undefined)
            data.task = params.task;
        if (params.story !== undefined)
            data.story = params.story;
        if (params.deadline !== undefined)
            data.deadline = params.deadline;
        if (params.openedBuild !== undefined)
            data.openedBuild = params.openedBuild;
        if (params.assignedTo !== undefined)
            data.assignedTo = params.assignedTo;
        if (params.project !== undefined)
            data.project = params.project;
        const response = await this.http.post(`/api.php/v1/products/${params.product}/bugs`, data);
        return response.data.data || response.data;
    }
    /**
     * 解决 Bug
     * @param params - 解决 Bug 参数
     * @returns 操作结果
     */
    async resolveBug(params) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/bugs/${params.id}/resolve`, {
                resolution: params.resolution,
                resolvedBuild: params.resolvedBuild || 'trunk',
                comment: params.comment || '',
            });
            return true;
        }
        catch (error) {
            console.error('解决 Bug 失败:', error);
            return false;
        }
    }
    /**
     * 关闭 Bug
     * @param params - 关闭 Bug 参数
     * @returns 操作结果
     */
    async closeBug(params) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/bugs/${params.id}/close`, {
                comment: params.comment || '',
            });
            return true;
        }
        catch (error) {
            console.error('关闭 Bug 失败:', error);
            return false;
        }
    }
    /**
     * 激活 Bug（重新打开）
     * @param params - 激活 Bug 参数
     * @returns 操作结果
     */
    async activateBug(params) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/bugs/${params.id}/activate`, {
                assignedTo: params.assignedTo || '',
                comment: params.comment || '',
            });
            return true;
        }
        catch (error) {
            console.error('激活 Bug 失败:', error);
            return false;
        }
    }
    /**
     * 确认 Bug
     * @param bugID - Bug ID
     * @param assignedTo - 指派给（可选）
     * @returns 操作结果
     */
    async confirmBug(bugID, assignedTo) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/bugs/${bugID}/confirm`, {
                assignedTo: assignedTo || '',
            });
            return true;
        }
        catch (error) {
            console.error('确认 Bug 失败:', error);
            return false;
        }
    }
    // ==================== 需求相关方法 ====================
    /**
     * 获取需求列表
     * @param productID - 产品 ID
     * @param browseType - 浏览类型: allstory-全部, unclosed-未关闭, draftstory-草稿, activestory-激活, reviewingstory-评审中, closedstory-已关闭, openedbyme-我创建
     * @param limit - 返回数量限制
     * @returns 需求列表
     */
    async getStories(productID, browseType, limit) {
        await this.ensureLogin();
        const params = new URLSearchParams();
        if (browseType)
            params.append('status', browseType);
        if (limit)
            params.append('limit', limit.toString());
        const queryString = params.toString();
        const url = `/api.php/v1/products/${productID}/stories${queryString ? '?' + queryString : ''}`;
        const response = await this.http.get(url);
        return response.data.data || response.data.stories || [];
    }
    /**
     * 获取需求详情
     * @param storyID - 需求 ID
     * @returns 需求详情
     */
    async getStory(storyID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/stories/${storyID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建需求
     * @param params - 创建需求参数
     * @returns 新创建的需求
     */
    async createStory(params) {
        await this.ensureLogin();
        const data = {
            product: params.product,
            title: params.title,
            category: params.category,
            pri: params.pri,
            spec: params.spec,
            reviewer: params.reviewer,
        };
        if (params.verify !== undefined)
            data.verify = params.verify;
        if (params.estimate !== undefined)
            data.estimate = params.estimate;
        if (params.module !== undefined)
            data.module = params.module;
        if (params.plan !== undefined)
            data.plan = params.plan;
        if (params.source !== undefined)
            data.source = params.source;
        if (params.sourceNote !== undefined)
            data.sourceNote = params.sourceNote;
        if (params.keywords !== undefined)
            data.keywords = params.keywords;
        try {
            const response = await this.http.post(`/api.php/v1/products/${params.product}/stories`, data);
            // 尝试多种响应格式
            if (response.data.data) {
                return response.data.data;
            }
            if (response.data && typeof response.data === 'object' && 'id' in response.data) {
                return response.data;
            }
            // 返回完整响应作为调试信息
            return response.data;
        }
        catch (error) {
            const axiosError = error;
            console.error('创建需求失败:', axiosError.response?.data || axiosError.message);
            throw new Error(`创建需求失败: ${JSON.stringify(axiosError.response?.data || axiosError.message)}`);
        }
    }
    /**
     * 关闭需求
     * @param params - 关闭需求参数
     * @returns 操作结果
     */
    async closeStory(params) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/stories/${params.id}/close`, {
                closedReason: params.closedReason,
                comment: params.comment || '',
            });
            return true;
        }
        catch (error) {
            console.error('关闭需求失败:', error);
            return false;
        }
    }
    /**
     * 激活需求
     * @param storyID - 需求 ID
     * @param assignedTo - 指派给（可选）
     * @param comment - 备注（可选）
     * @returns 操作结果
     */
    async activateStory(storyID, assignedTo, comment) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/stories/${storyID}/activate`, {
                assignedTo: assignedTo || '',
                comment: comment || '',
            });
            return true;
        }
        catch (error) {
            console.error('激活需求失败:', error);
            return false;
        }
    }
    // ==================== 产品和项目相关方法 ====================
    /**
     * 获取产品列表
     * @param limit - 返回数量限制
     * @returns 产品列表
     */
    async getProducts(limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/products?limit=${limit}`);
        return response.data.data || response.data.products || [];
    }
    /**
     * 获取项目列表
     * @param limit - 返回数量限制
     * @returns 项目列表
     */
    async getProjects(limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/projects?limit=${limit}`);
        return response.data.data || response.data.projects || [];
    }
    /**
     * 获取执行列表（迭代）
     * @param projectID - 项目 ID
     * @param limit - 返回数量限制
     * @returns 执行列表
     */
    async getExecutions(projectID, limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/projects/${projectID}/executions?limit=${limit}`);
        return response.data.data || response.data.executions || [];
    }
    // ==================== 测试用例相关方法 ====================
    /**
     * 获取测试用例列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 测试用例列表响应
     */
    async getTestCases(productID, limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/products/${productID}/testcases?limit=${limit}`);
        return response.data;
    }
    /**
     * 获取测试用例详情
     * @param caseID - 用例 ID
     * @returns 测试用例详情
     */
    async getTestCase(caseID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/testcases/${caseID}`);
            return response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建测试用例
     * @param params - 创建测试用例参数
     * @returns 新创建的测试用例
     */
    async createTestCase(params) {
        await this.ensureLogin();
        const response = await this.http.post(`/api.php/v1/products/${params.product}/testcases`, {
            title: params.title,
            type: params.type,
            steps: params.steps,
            branch: params.branch || 0,
            module: params.module || 0,
            story: params.story || 0,
            stage: params.stage || '',
            precondition: params.precondition || '',
            pri: params.pri || 3,
            keywords: params.keywords || '',
        });
        return response.data;
    }
    // ==================== Bug 更新相关方法 ====================
    /**
     * 更新 Bug
     * @param params - 更新 Bug 参数
     * @returns 更新后的 Bug
     */
    async updateBug(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.title !== undefined)
            updateData.title = params.title;
        if (params.severity !== undefined)
            updateData.severity = params.severity;
        if (params.pri !== undefined)
            updateData.pri = params.pri;
        if (params.type !== undefined)
            updateData.type = params.type;
        if (params.module !== undefined)
            updateData.module = params.module;
        if (params.execution !== undefined)
            updateData.execution = params.execution;
        if (params.keywords !== undefined)
            updateData.keywords = params.keywords;
        if (params.os !== undefined)
            updateData.os = params.os;
        if (params.browser !== undefined)
            updateData.browser = params.browser;
        if (params.steps !== undefined)
            updateData.steps = params.steps;
        if (params.task !== undefined)
            updateData.task = params.task;
        if (params.story !== undefined)
            updateData.story = params.story;
        if (params.deadline !== undefined)
            updateData.deadline = params.deadline;
        if (params.openedBuild !== undefined)
            updateData.openedBuild = params.openedBuild;
        try {
            const response = await this.http.put(`/api.php/v1/bugs/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 需求更新/变更相关方法 ====================
    /**
     * 更新需求
     * @param params - 更新需求参数
     * @returns 更新后的需求
     */
    async updateStory(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.module !== undefined)
            updateData.module = params.module;
        if (params.source !== undefined)
            updateData.source = params.source;
        if (params.sourceNote !== undefined)
            updateData.sourceNote = params.sourceNote;
        if (params.pri !== undefined)
            updateData.pri = params.pri;
        if (params.category !== undefined)
            updateData.category = params.category;
        if (params.estimate !== undefined)
            updateData.estimate = params.estimate;
        if (params.keywords !== undefined)
            updateData.keywords = params.keywords;
        try {
            const response = await this.http.put(`/api.php/v1/stories/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 变更需求（修改标题、描述、验收标准，会导致状态变为 changed）
     * @param params - 变更需求参数
     * @returns 变更后的需求
     */
    async changeStory(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.title !== undefined)
            updateData.title = params.title;
        if (params.spec !== undefined)
            updateData.spec = params.spec;
        if (params.verify !== undefined)
            updateData.verify = params.verify;
        try {
            const response = await this.http.post(`/api.php/v1/stories/${params.id}/change`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 产品详情/创建/更新相关方法 ====================
    /**
     * 获取产品详情
     * @param productID - 产品 ID
     * @returns 产品详情
     */
    async getProduct(productID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/products/${productID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建产品
     * @param params - 创建产品参数
     * @returns 新创建的产品
     */
    async createProduct(params) {
        await this.ensureLogin();
        const data = {
            name: params.name,
            code: params.code,
        };
        if (params.program !== undefined)
            data.program = params.program;
        if (params.line !== undefined)
            data.line = params.line;
        if (params.PO !== undefined)
            data.PO = params.PO;
        if (params.QD !== undefined)
            data.QD = params.QD;
        if (params.RD !== undefined)
            data.RD = params.RD;
        if (params.type !== undefined)
            data.type = params.type;
        if (params.desc !== undefined)
            data.desc = params.desc;
        if (params.acl !== undefined)
            data.acl = params.acl;
        if (params.whitelist !== undefined)
            data.whitelist = params.whitelist;
        const response = await this.http.post('/api.php/v1/products', data);
        return response.data.data || response.data;
    }
    /**
     * 更新产品
     * @param params - 更新产品参数
     * @returns 更新后的产品
     */
    async updateProduct(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.code !== undefined)
            updateData.code = params.code;
        if (params.program !== undefined)
            updateData.program = params.program;
        if (params.line !== undefined)
            updateData.line = params.line;
        if (params.type !== undefined)
            updateData.type = params.type;
        if (params.status !== undefined)
            updateData.status = params.status;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        if (params.PO !== undefined)
            updateData.PO = params.PO;
        if (params.QD !== undefined)
            updateData.QD = params.QD;
        if (params.RD !== undefined)
            updateData.RD = params.RD;
        if (params.acl !== undefined)
            updateData.acl = params.acl;
        if (params.whitelist !== undefined)
            updateData.whitelist = params.whitelist;
        try {
            const response = await this.http.put(`/api.php/v1/products/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 项目详情/创建/更新相关方法 ====================
    /**
     * 获取项目详情
     * @param projectID - 项目 ID
     * @returns 项目详情
     */
    async getProject(projectID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/projects/${projectID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建项目
     * @param params - 创建项目参数
     * @returns 新创建的项目
     */
    async createProject(params) {
        await this.ensureLogin();
        const response = await this.http.post('/api.php/v1/projects', {
            name: params.name,
            code: params.code,
            begin: params.begin,
            end: params.end,
            products: params.products,
            model: params.model || 'scrum',
            parent: params.parent || 0,
        });
        return response.data.data || response.data;
    }
    /**
     * 更新项目
     * @param params - 更新项目参数
     * @returns 更新后的项目
     */
    async updateProject(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.code !== undefined)
            updateData.code = params.code;
        if (params.parent !== undefined)
            updateData.parent = params.parent;
        if (params.PM !== undefined)
            updateData.PM = params.PM;
        if (params.budget !== undefined)
            updateData.budget = params.budget;
        if (params.budgetUnit !== undefined)
            updateData.budgetUnit = params.budgetUnit;
        if (params.days !== undefined)
            updateData.days = params.days;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        if (params.acl !== undefined)
            updateData.acl = params.acl;
        if (params.whitelist !== undefined)
            updateData.whitelist = params.whitelist;
        if (params.auth !== undefined)
            updateData.auth = params.auth;
        try {
            const response = await this.http.put(`/api.php/v1/projects/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 任务相关方法 ====================
    /**
     * 获取执行的任务列表
     * @param executionID - 执行 ID
     * @param limit - 返回数量限制
     * @returns 任务列表
     */
    async getTasks(executionID, limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/executions/${executionID}/tasks?limit=${limit}`);
        return response.data.data || response.data.tasks || [];
    }
    /**
     * 获取任务详情
     * @param taskID - 任务 ID
     * @returns 任务详情
     */
    async getTask(taskID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/tasks/${taskID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建任务
     * @param params - 创建任务参数
     * @returns 新创建的任务
     */
    async createTask(params) {
        await this.ensureLogin();
        const data = {
            name: params.name,
            type: params.type,
            assignedTo: params.assignedTo,
            estStarted: params.estStarted,
            deadline: params.deadline,
        };
        if (params.module !== undefined)
            data.module = params.module;
        if (params.story !== undefined)
            data.story = params.story;
        if (params.fromBug !== undefined)
            data.fromBug = params.fromBug;
        if (params.pri !== undefined)
            data.pri = params.pri;
        if (params.estimate !== undefined)
            data.estimate = params.estimate;
        if (params.desc !== undefined)
            data.desc = params.desc;
        const response = await this.http.post(`/api.php/v1/executions/${params.execution}/tasks`, data);
        return response.data.data || response.data;
    }
    /**
     * 更新任务
     * @param params - 更新任务参数
     * @returns 更新后的任务
     */
    async updateTask(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.type !== undefined)
            updateData.type = params.type;
        if (params.assignedTo !== undefined)
            updateData.assignedTo = params.assignedTo;
        if (params.module !== undefined)
            updateData.module = params.module;
        if (params.story !== undefined)
            updateData.story = params.story;
        if (params.fromBug !== undefined)
            updateData.fromBug = params.fromBug;
        if (params.pri !== undefined)
            updateData.pri = params.pri;
        if (params.estimate !== undefined)
            updateData.estimate = params.estimate;
        if (params.estStarted !== undefined)
            updateData.estStarted = params.estStarted;
        if (params.deadline !== undefined)
            updateData.deadline = params.deadline;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        try {
            const response = await this.http.put(`/api.php/v1/tasks/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 用户相关方法 ====================
    /**
     * 获取用户列表
     * @param limit - 返回数量限制
     * @returns 用户列表
     */
    async getUsers(limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/users?limit=${limit}`);
        return response.data.data || response.data.users || [];
    }
    /**
     * 获取用户详情
     * @param userID - 用户 ID
     * @returns 用户详情
     */
    async getUser(userID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/users/${userID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 获取当前登录用户信息
     * @returns 当前用户信息
     */
    async getMyProfile() {
        await this.ensureLogin();
        try {
            const response = await this.http.get('/api.php/v1/user');
            return response.data.data?.profile || response.data.profile || null;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建用户
     * @param params - 创建用户参数
     * @returns 新创建的用户
     */
    async createUser(params) {
        await this.ensureLogin();
        const data = {
            account: params.account,
            password: params.password,
            gender: params.gender || 'm',
        };
        if (params.realname !== undefined)
            data.realname = params.realname;
        if (params.visions !== undefined)
            data.visions = params.visions;
        if (params.role !== undefined)
            data.role = params.role;
        if (params.dept !== undefined)
            data.dept = params.dept;
        if (params.email !== undefined)
            data.email = params.email;
        if (params.mobile !== undefined)
            data.mobile = params.mobile;
        if (params.phone !== undefined)
            data.phone = params.phone;
        if (params.weixin !== undefined)
            data.weixin = params.weixin;
        if (params.qq !== undefined)
            data.qq = params.qq;
        if (params.address !== undefined)
            data.address = params.address;
        if (params.join !== undefined)
            data.join = params.join;
        const response = await this.http.post('/api.php/v1/users', data);
        return response.data.data || response.data;
    }
    /**
     * 更新用户
     * @param params - 更新用户参数
     * @returns 更新后的用户
     */
    async updateUser(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.realname !== undefined)
            updateData.realname = params.realname;
        if (params.role !== undefined)
            updateData.role = params.role;
        if (params.dept !== undefined)
            updateData.dept = params.dept;
        if (params.email !== undefined)
            updateData.email = params.email;
        if (params.gender !== undefined)
            updateData.gender = params.gender;
        if (params.mobile !== undefined)
            updateData.mobile = params.mobile;
        if (params.phone !== undefined)
            updateData.phone = params.phone;
        if (params.weixin !== undefined)
            updateData.weixin = params.weixin;
        if (params.qq !== undefined)
            updateData.qq = params.qq;
        if (params.address !== undefined)
            updateData.address = params.address;
        if (params.join !== undefined)
            updateData.join = params.join;
        if (params.password !== undefined)
            updateData.password = params.password;
        try {
            const response = await this.http.put(`/api.php/v1/users/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 项目集相关方法 ====================
    /**
     * 获取项目集列表
     * @param limit - 返回数量限制
     * @returns 项目集列表
     */
    async getPrograms(limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/programs?limit=${limit}`);
        return response.data.data || response.data.programs || [];
    }
    /**
     * 获取项目集详情
     * @param programID - 项目集 ID
     * @returns 项目集详情
     */
    async getProgram(programID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/programs/${programID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建项目集
     * @param params - 创建项目集参数
     * @returns 新创建的项目集
     */
    async createProgram(params) {
        await this.ensureLogin();
        const data = {
            name: params.name,
            begin: params.begin,
            end: params.end,
            parent: params.parent || 0,
        };
        if (params.PM !== undefined)
            data.PM = params.PM;
        if (params.budget !== undefined)
            data.budget = params.budget;
        if (params.budgetUnit !== undefined)
            data.budgetUnit = params.budgetUnit;
        if (params.desc !== undefined)
            data.desc = params.desc;
        if (params.acl !== undefined)
            data.acl = params.acl;
        if (params.whitelist !== undefined)
            data.whitelist = params.whitelist;
        const response = await this.http.post('/api.php/v1/programs', data);
        return response.data.data || response.data;
    }
    /**
     * 更新项目集
     * @param params - 更新项目集参数
     * @returns 更新后的项目集
     */
    async updateProgram(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.parent !== undefined)
            updateData.parent = params.parent;
        if (params.PM !== undefined)
            updateData.PM = params.PM;
        if (params.budget !== undefined)
            updateData.budget = params.budget;
        if (params.budgetUnit !== undefined)
            updateData.budgetUnit = params.budgetUnit;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        if (params.begin !== undefined)
            updateData.begin = params.begin;
        if (params.end !== undefined)
            updateData.end = params.end;
        if (params.acl !== undefined)
            updateData.acl = params.acl;
        if (params.whitelist !== undefined)
            updateData.whitelist = params.whitelist;
        try {
            const response = await this.http.put(`/api.php/v1/programs/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 计划相关方法 ====================
    /**
     * 获取产品计划列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 计划列表
     */
    async getPlans(productID, limit = 100) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/products/${productID}/plans?limit=${limit}`);
        return response.data.data || response.data.plans || [];
    }
    /**
     * 获取计划详情
     * @param planID - 计划 ID
     * @returns 计划详情
     */
    async getPlan(planID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/productplans/${planID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建计划
     * @param params - 创建计划参数
     * @returns 新创建的计划
     */
    async createPlan(params) {
        await this.ensureLogin();
        const data = {
            title: params.title,
        };
        if (params.begin !== undefined)
            data.begin = params.begin;
        if (params.end !== undefined)
            data.end = params.end;
        if (params.branch !== undefined)
            data.branch = params.branch;
        if (params.parent !== undefined)
            data.parent = params.parent;
        if (params.desc !== undefined)
            data.desc = params.desc;
        const response = await this.http.post(`/api.php/v1/products/${params.product}/plans`, data);
        return response.data.data || response.data;
    }
    /**
     * 更新计划
     * @param params - 更新计划参数
     * @returns 更新后的计划
     */
    async updatePlan(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.title !== undefined)
            updateData.title = params.title;
        if (params.begin !== undefined)
            updateData.begin = params.begin;
        if (params.end !== undefined)
            updateData.end = params.end;
        if (params.branch !== undefined)
            updateData.branch = params.branch;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        try {
            const response = await this.http.put(`/api.php/v1/productplans/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 计划关联需求
     * @param planID - 计划 ID
     * @param stories - 需求 ID 列表
     * @returns 是否成功
     */
    async linkStoriesToPlan(planID, stories) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/productplans/${planID}/linkstories`, { stories });
            return true;
        }
        catch (error) {
            console.error('计划关联需求失败:', error);
            return false;
        }
    }
    /**
     * 计划取消关联需求
     * @param planID - 计划 ID
     * @param stories - 需求 ID 列表
     * @returns 是否成功
     */
    async unlinkStoriesFromPlan(planID, stories) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/productplans/${planID}/unlinkstories`, { stories });
            return true;
        }
        catch (error) {
            console.error('计划取消关联需求失败:', error);
            return false;
        }
    }
    /**
     * 计划关联 Bug
     * @param planID - 计划 ID
     * @param bugs - Bug ID 列表
     * @returns 是否成功
     */
    async linkBugsToPlan(planID, bugs) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/productplans/${planID}/linkbugs`, { bugs });
            return true;
        }
        catch (error) {
            console.error('计划关联 Bug 失败:', error);
            return false;
        }
    }
    /**
     * 计划取消关联 Bug
     * @param planID - 计划 ID
     * @param bugs - Bug ID 列表
     * @returns 是否成功
     */
    async unlinkBugsFromPlan(planID, bugs) {
        await this.ensureLogin();
        try {
            await this.http.post(`/api.php/v1/productplans/${planID}/unlinkbugs`, { bugs });
            return true;
        }
        catch (error) {
            console.error('计划取消关联 Bug 失败:', error);
            return false;
        }
    }
    // ==================== 发布相关方法 ====================
    /**
     * 获取项目发布列表
     * @param projectID - 项目 ID
     * @returns 发布列表
     */
    async getProjectReleases(projectID) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/projects/${projectID}/releases`);
        return response.data.data || response.data.releases || [];
    }
    /**
     * 获取产品发布列表
     * @param productID - 产品 ID
     * @returns 发布列表
     */
    async getProductReleases(productID) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/products/${productID}/releases`);
        return response.data.data || response.data.releases || [];
    }
    // ==================== 版本相关方法 ====================
    /**
     * 获取项目版本列表
     * @param projectID - 项目 ID
     * @returns 版本列表
     */
    async getProjectBuilds(projectID) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/projects/${projectID}/builds`);
        return response.data.data || response.data.builds || [];
    }
    /**
     * 获取执行版本列表
     * @param executionID - 执行 ID
     * @returns 版本列表
     */
    async getExecutionBuilds(executionID) {
        await this.ensureLogin();
        const response = await this.http.get(`/api.php/v1/executions/${executionID}/builds`);
        return response.data.data || response.data.builds || [];
    }
    /**
     * 获取版本详情
     * @param buildID - 版本 ID
     * @returns 版本详情
     */
    async getBuild(buildID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/builds/${buildID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建版本
     * @param params - 创建版本参数
     * @returns 新创建的版本
     */
    async createBuild(params) {
        await this.ensureLogin();
        const data = {
            name: params.name,
            execution: params.execution,
            product: params.product,
            builder: params.builder,
        };
        if (params.branch !== undefined)
            data.branch = params.branch;
        if (params.date !== undefined)
            data.date = params.date;
        if (params.scmPath !== undefined)
            data.scmPath = params.scmPath;
        if (params.filePath !== undefined)
            data.filePath = params.filePath;
        if (params.desc !== undefined)
            data.desc = params.desc;
        const response = await this.http.post(`/api.php/v1/projects/${params.project}/builds`, data);
        return response.data.data || response.data;
    }
    /**
     * 更新版本
     * @param params - 更新版本参数
     * @returns 更新后的版本
     */
    async updateBuild(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.scmPath !== undefined)
            updateData.scmPath = params.scmPath;
        if (params.filePath !== undefined)
            updateData.filePath = params.filePath;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        if (params.builder !== undefined)
            updateData.builder = params.builder;
        if (params.date !== undefined)
            updateData.date = params.date;
        try {
            const response = await this.http.put(`/api.php/v1/builds/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 执行（迭代）相关方法 ====================
    /**
     * 获取执行详情
     * @param executionID - 执行 ID
     * @returns 执行详情
     */
    async getExecution(executionID) {
        await this.ensureLogin();
        try {
            const response = await this.http.get(`/api.php/v1/executions/${executionID}`);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建执行
     * @param params - 创建执行参数
     * @returns 新创建的执行
     */
    async createExecution(params) {
        await this.ensureLogin();
        const data = {
            name: params.name,
            code: params.code,
            begin: params.begin,
            end: params.end,
        };
        if (params.days !== undefined)
            data.days = params.days;
        if (params.lifetime !== undefined)
            data.lifetime = params.lifetime;
        if (params.PO !== undefined)
            data.PO = params.PO;
        if (params.PM !== undefined)
            data.PM = params.PM;
        if (params.QD !== undefined)
            data.QD = params.QD;
        if (params.RD !== undefined)
            data.RD = params.RD;
        if (params.teamMembers !== undefined)
            data.teamMembers = params.teamMembers;
        if (params.desc !== undefined)
            data.desc = params.desc;
        if (params.acl !== undefined)
            data.acl = params.acl;
        if (params.whitelist !== undefined)
            data.whitelist = params.whitelist;
        const response = await this.http.post(`/api.php/v1/projects/${params.project}/executions`, data);
        return response.data.data || response.data;
    }
    /**
     * 更新执行
     * @param params - 更新执行参数
     * @returns 更新后的执行
     */
    async updateExecution(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.name !== undefined)
            updateData.name = params.name;
        if (params.code !== undefined)
            updateData.code = params.code;
        if (params.begin !== undefined)
            updateData.begin = params.begin;
        if (params.end !== undefined)
            updateData.end = params.end;
        if (params.days !== undefined)
            updateData.days = params.days;
        if (params.lifetime !== undefined)
            updateData.lifetime = params.lifetime;
        if (params.PO !== undefined)
            updateData.PO = params.PO;
        if (params.PM !== undefined)
            updateData.PM = params.PM;
        if (params.QD !== undefined)
            updateData.QD = params.QD;
        if (params.RD !== undefined)
            updateData.RD = params.RD;
        if (params.teamMembers !== undefined)
            updateData.teamMembers = params.teamMembers;
        if (params.desc !== undefined)
            updateData.desc = params.desc;
        if (params.acl !== undefined)
            updateData.acl = params.acl;
        if (params.whitelist !== undefined)
            updateData.whitelist = params.whitelist;
        try {
            const response = await this.http.put(`/api.php/v1/executions/${params.id}`, updateData);
            return response.data.data || response.data;
        }
        catch {
            return null;
        }
    }
    // ==================== 内置 API 认证方法 ====================
    /**
     * 确保内置 API 已登录
     * 内置 API 使用不同的认证方式：
     * 1. 获取 sessionID 和 rand: GET /index.php?m=api&f=getSessionID&t=json
     * 2. 用户登录: POST /index.php?m=user&f=login&t=json&zentaosid=xxx
     *    密码加密: md5(md5(password) + rand)
     */
    async ensureLegacyLogin() {
        if (this.isLegacyLoggedIn) {
            return;
        }
        try {
            // 1. 获取 sessionID 和 rand
            const sessionResp = await this.http.get('/index.php?m=api&f=getSessionID&t=json');
            this.handleLegacyCookies(sessionResp);
            let sessionData = sessionResp.data;
            if (typeof sessionData.data === 'string') {
                sessionData = JSON.parse(sessionData.data);
            }
            else if (sessionData.data) {
                sessionData = sessionData.data;
            }
            this.legacySessionID = sessionData.sessionID;
            this.legacySessionName = sessionData.sessionName || 'zentaosid';
            this.legacyRand = sessionData.rand || 0;
            // 2. 用户登录，密码使用 md5(md5(password) + rand) 加密
            const passwordMd5 = CryptoJS.MD5(this.config.password).toString();
            const encryptedPassword = CryptoJS.MD5(passwordMd5 + this.legacyRand).toString();
            const loginResp = await this.http.post(`/index.php?m=user&f=login&t=json&${this.legacySessionName}=${this.legacySessionID}`, `account=${this.config.account}&password=${encryptedPassword}&verifyRand=${this.legacyRand}`, {
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    'Cookie': this.legacyCookies.join('; '),
                },
            });
            this.handleLegacyCookies(loginResp);
            this.isLegacyLoggedIn = true;
        }
        catch (error) {
            console.error('内置 API 登录失败:', error);
            throw new Error(`内置 API 登录失败: ${error instanceof Error ? error.message : '未知错误'}`);
        }
    }
    /**
     * 处理内置 API 响应中的 cookies
     */
    handleLegacyCookies(response) {
        const setCookies = response.headers['set-cookie'];
        if (setCookies) {
            setCookies.forEach((c) => {
                const name = c.split('=')[0];
                const value = c.split(';')[0];
                const idx = this.legacyCookies.findIndex((x) => x.startsWith(name + '='));
                if (idx >= 0) {
                    this.legacyCookies[idx] = value;
                }
                else {
                    this.legacyCookies.push(value);
                }
            });
        }
    }
    /**
     * 内置 API GET 请求
     * @param path - 请求路径
     * @returns 响应数据
     */
    async legacyGet(path) {
        await this.ensureLegacyLogin();
        const sep = path.includes('?') ? '&' : '?';
        const response = await this.http.get(`${path}${sep}${this.legacySessionName}=${this.legacySessionID}`, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': this.legacyCookies.join('; '),
            },
        });
        this.handleLegacyCookies(response);
        return response.data;
    }
    /**
     * 内置 API POST 请求 (JSON 格式)
     * @param path - 请求路径
     * @param data - 请求数据
     * @returns 响应数据
     */
    async legacyPost(path, data) {
        await this.ensureLegacyLogin();
        const sep = path.includes('?') ? '&' : '?';
        const response = await this.http.post(`${path}${sep}${this.legacySessionName}=${this.legacySessionID}`, data, {
            headers: {
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': this.legacyCookies.join('; '),
                'Referer': this.config.url,
            },
        });
        this.handleLegacyCookies(response);
        return response.data;
    }
    /**
     * 内置 API POST 请求 (multipart/form-data 格式)
     * @param path - 请求路径
     * @param form - FormData 对象
     * @returns 响应数据
     */
    async legacyPostForm(path, form) {
        await this.ensureLegacyLogin();
        const sep = path.includes('?') ? '&' : '?';
        const response = await this.http.post(`${path}${sep}${this.legacySessionName}=${this.legacySessionID}`, form, {
            headers: {
                ...form.getHeaders(),
                'X-Requested-With': 'XMLHttpRequest',
                'Cookie': this.legacyCookies.join('; '),
                'Referer': this.config.url,
            },
        });
        this.handleLegacyCookies(response);
        return response.data;
    }
    // ==================== 文档相关方法（内置 API）====================
    /**
     * 获取文档空间数据（文档库、目录树、文档列表）
     * @param type - 空间类型: product 或 project
     * @param spaceID - 空间 ID（产品或项目 ID）
     * @returns 文档空间数据
     */
    async getDocSpaceData(type, spaceID) {
        const data = await this.legacyGet(`/index.php?m=doc&f=ajaxGetSpaceData&type=${type}&spaceID=${spaceID}&picks=`);
        return data;
    }
    /**
     * 获取文档详情
     * @param docID - 文档 ID
     * @param version - 版本号（0 表示最新版本）
     * @returns 文档详情
     */
    async getDoc(docID, version = 0) {
        try {
            const data = await this.legacyGet(`/index.php?m=doc&f=ajaxGetDoc&docID=${docID}&version=${version}`);
            return data || null;
        }
        catch {
            return null;
        }
    }
    /**
     * 创建文档
     * @param params - 创建文档参数
     * @returns 创建结果
     */
    async createDoc(params) {
        const form = new FormData();
        form.append('title', params.title);
        form.append('content', params.content || '');
        form.append('lib', String(params.lib));
        form.append('module', String(params.module || 0));
        form.append('parent', 'm_0');
        form.append('status', 'normal');
        form.append('contentType', 'doc');
        form.append('type', params.type || 'text');
        form.append('acl', 'open');
        form.append('space', 'product');
        form.append('product', '1');
        form.append('uid', `doc${Date.now()}`);
        form.append('template', '0');
        form.append('mailto[]', '');
        form.append('contactList', '');
        form.append('groups[]', '');
        form.append('users[]', '');
        if (params.keywords)
            form.append('keywords', params.keywords);
        const result = await this.legacyPostForm(`/index.php?m=doc&f=create&objectType=product&objectID=1&libID=${params.lib}&moduleID=${params.module || 0}`, form);
        if (result.result !== 'success') {
            throw new Error(result.message || '创建文档失败');
        }
        return { id: result.id, doc: result.doc };
    }
    /**
     * 编辑文档
     * @param params - 编辑文档参数
     * @returns 更新后的文档
     */
    async editDoc(params) {
        const form = new FormData();
        if (params.title !== undefined)
            form.append('title', params.title);
        if (params.content !== undefined)
            form.append('content', params.content);
        if (params.keywords !== undefined)
            form.append('keywords', params.keywords);
        // 必需的字段
        form.append('lib', '1');
        form.append('module', '0');
        form.append('parent', '0');
        form.append('status', 'normal');
        form.append('contentType', 'doc');
        form.append('type', 'text');
        form.append('acl', 'open');
        form.append('space', 'product');
        form.append('uid', `doc${params.id}`);
        form.append('files', '');
        form.append('fromVersion', '1');
        try {
            const result = await this.legacyPostForm(`/index.php?m=doc&f=edit&docID=${params.id}`, form);
            if (result.result !== 'success') {
                throw new Error(result.message || '编辑文档失败');
            }
            return result.doc || null;
        }
        catch (error) {
            console.error('编辑文档失败:', error);
            return null;
        }
    }
    // ==================== 文档目录相关方法（内置 API）====================
    /**
     * 创建文档目录
     * @param params - 创建目录参数
     * @returns 创建结果
     */
    async createDocModule(params) {
        const form = new FormData();
        form.append('name', params.name);
        form.append('libID', String(params.libID));
        form.append('parentID', String(params.parentID || 0));
        form.append('objectID', String(params.objectID));
        form.append('moduleType', 'doc');
        form.append('isUpdate', 'false');
        form.append('createType', 'child');
        const result = await this.legacyPostForm('/index.php?m=tree&f=ajaxCreateModule', form);
        if (result.result !== 'success') {
            throw new Error(result.message || '创建目录失败');
        }
        return {
            id: result.module?.id || 0,
            name: result.module?.name || params.name
        };
    }
    /**
     * 编辑文档目录
     * @param params - 编辑目录参数
     * @returns 操作结果
     */
    async editDocModule(params) {
        const form = new FormData();
        form.append('root', String(params.root));
        form.append('parent', String(params.parent || 0));
        form.append('name', params.name);
        try {
            const result = await this.legacyPostForm(`/index.php?m=doc&f=editCatalog&moduleID=${params.moduleID}&type=doc`, form);
            return result.result === 'success';
        }
        catch {
            return false;
        }
    }
}
//# sourceMappingURL=zentao-client.js.map