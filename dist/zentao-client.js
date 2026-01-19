/**
 * 禅道 API 客户端
 * 封装禅道 REST API 的调用，支持 Bug 和需求的增删改查
 */
import axios from 'axios';
import https from 'https';
import CryptoJS from 'crypto-js';
/**
 * 禅道 API 客户端类
 * 提供与禅道系统交互的所有方法
 */
export class ZentaoClient {
    config;
    http;
    sessionID = '';
    isLoggedIn = false;
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
     * @param status - Bug 状态过滤 (可选)
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    async getBugs(productID, status, limit = 100) {
        await this.ensureLogin();
        let url = `/api.php/v1/products/${productID}/bugs?limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        const response = await this.http.get(url);
        return response.data.data || response.data.bugs || [];
    }
    /**
     * 获取未解决的 Bug 列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 未解决的 Bug 列表
     */
    async getActiveBugs(productID, limit = 100) {
        return this.getBugs(productID, 'active', limit);
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
        const response = await this.http.post(`/api.php/v1/products/${params.product}/bugs`, {
            title: params.title,
            severity: params.severity || 3,
            pri: params.pri || 3,
            steps: params.steps || '',
            type: params.type || 'codeerror',
            module: params.module || 0,
            assignedTo: params.assignedTo || '',
            project: params.project || 0,
        });
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
     * @param status - 需求状态过滤（可选）
     * @param limit - 返回数量限制
     * @returns 需求列表
     */
    async getStories(productID, status, limit = 100) {
        await this.ensureLogin();
        let url = `/api.php/v1/products/${productID}/stories?limit=${limit}`;
        if (status) {
            url += `&status=${status}`;
        }
        const response = await this.http.get(url);
        return response.data.data || response.data.stories || [];
    }
    /**
     * 获取进行中的需求
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 进行中的需求列表
     */
    async getActiveStories(productID, limit = 100) {
        return this.getStories(productID, 'active', limit);
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
        const response = await this.http.post(`/api.php/v1/products/${params.product}/stories`, {
            title: params.title,
            spec: params.spec || '',
            verify: params.verify || '',
            pri: params.pri || 3,
            estimate: params.estimate || 0,
            module: params.module || 0,
            plan: params.plan || 0,
            source: params.source || '',
            sourceNote: params.sourceNote || '',
        });
        return response.data.data || response.data;
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
    /**
     * 修改测试用例
     * @param params - 修改测试用例参数
     * @returns 修改后的测试用例
     */
    async updateTestCase(params) {
        await this.ensureLogin();
        const updateData = {};
        if (params.title !== undefined)
            updateData.title = params.title;
        if (params.type !== undefined)
            updateData.type = params.type;
        if (params.steps !== undefined)
            updateData.steps = params.steps;
        if (params.branch !== undefined)
            updateData.branch = params.branch;
        if (params.module !== undefined)
            updateData.module = params.module;
        if (params.story !== undefined)
            updateData.story = params.story;
        if (params.stage !== undefined)
            updateData.stage = params.stage;
        if (params.precondition !== undefined)
            updateData.precondition = params.precondition;
        if (params.pri !== undefined)
            updateData.pri = params.pri;
        if (params.keywords !== undefined)
            updateData.keywords = params.keywords;
        const response = await this.http.put(`/api.php/v1/testcases/${params.id}`, updateData);
        return response.data;
    }
    /**
     * 删除测试用例
     * @param caseID - 用例 ID
     * @returns 是否删除成功
     */
    async deleteTestCase(caseID) {
        await this.ensureLogin();
        try {
            await this.http.delete(`/api.php/v1/testcases/${caseID}`);
            return true;
        }
        catch (error) {
            console.error('删除测试用例失败:', error);
            return false;
        }
    }
}
//# sourceMappingURL=zentao-client.js.map