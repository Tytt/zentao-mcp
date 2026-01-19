/**
 * 禅道 API 客户端
 * 封装禅道 REST API 的调用，支持 Bug 和需求的增删改查
 */
import { ZentaoConfig, Bug, Story, Product, Project, CreateBugParams, ResolveBugParams, CloseBugParams, ActivateBugParams, CreateStoryParams, CloseStoryParams, BugStatus, StoryStatus, TestCase, TestCaseListResponse, CreateTestCaseParams, UpdateTestCaseParams } from './types.js';
/**
 * 禅道 API 客户端类
 * 提供与禅道系统交互的所有方法
 */
export declare class ZentaoClient {
    private config;
    private http;
    private sessionID;
    private isLoggedIn;
    /**
     * 创建禅道客户端实例
     * @param config - 禅道配置
     */
    constructor(config: ZentaoConfig);
    /**
     * 获取 Session ID
     * @returns Session ID
     */
    private getSessionID;
    /**
     * 登录禅道系统
     * @returns 是否登录成功
     */
    login(): Promise<boolean>;
    /**
     * 确保已登录
     */
    private ensureLogin;
    /**
     * 获取 Bug 列表
     * @param productID - 产品 ID
     * @param status - Bug 状态过滤 (可选)
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    getBugs(productID: number, status?: BugStatus, limit?: number): Promise<Bug[]>;
    /**
     * 获取未解决的 Bug 列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 未解决的 Bug 列表
     */
    getActiveBugs(productID: number, limit?: number): Promise<Bug[]>;
    /**
     * 获取指派给某人的 Bug
     * @param account - 用户账号
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    getAssignedBugs(account: string, limit?: number): Promise<Bug[]>;
    /**
     * 获取 Bug 详情
     * @param bugID - Bug ID
     * @returns Bug 详情
     */
    getBug(bugID: number): Promise<Bug | null>;
    /**
     * 创建 Bug
     * @param params - 创建 Bug 参数
     * @returns 新创建的 Bug
     */
    createBug(params: CreateBugParams): Promise<Bug>;
    /**
     * 解决 Bug
     * @param params - 解决 Bug 参数
     * @returns 操作结果
     */
    resolveBug(params: ResolveBugParams): Promise<boolean>;
    /**
     * 关闭 Bug
     * @param params - 关闭 Bug 参数
     * @returns 操作结果
     */
    closeBug(params: CloseBugParams): Promise<boolean>;
    /**
     * 激活 Bug（重新打开）
     * @param params - 激活 Bug 参数
     * @returns 操作结果
     */
    activateBug(params: ActivateBugParams): Promise<boolean>;
    /**
     * 确认 Bug
     * @param bugID - Bug ID
     * @param assignedTo - 指派给（可选）
     * @returns 操作结果
     */
    confirmBug(bugID: number, assignedTo?: string): Promise<boolean>;
    /**
     * 获取需求列表
     * @param productID - 产品 ID
     * @param status - 需求状态过滤（可选）
     * @param limit - 返回数量限制
     * @returns 需求列表
     */
    getStories(productID: number, status?: StoryStatus, limit?: number): Promise<Story[]>;
    /**
     * 获取进行中的需求
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 进行中的需求列表
     */
    getActiveStories(productID: number, limit?: number): Promise<Story[]>;
    /**
     * 获取需求详情
     * @param storyID - 需求 ID
     * @returns 需求详情
     */
    getStory(storyID: number): Promise<Story | null>;
    /**
     * 创建需求
     * @param params - 创建需求参数
     * @returns 新创建的需求
     */
    createStory(params: CreateStoryParams): Promise<Story>;
    /**
     * 关闭需求
     * @param params - 关闭需求参数
     * @returns 操作结果
     */
    closeStory(params: CloseStoryParams): Promise<boolean>;
    /**
     * 激活需求
     * @param storyID - 需求 ID
     * @param assignedTo - 指派给（可选）
     * @param comment - 备注（可选）
     * @returns 操作结果
     */
    activateStory(storyID: number, assignedTo?: string, comment?: string): Promise<boolean>;
    /**
     * 获取产品列表
     * @param limit - 返回数量限制
     * @returns 产品列表
     */
    getProducts(limit?: number): Promise<Product[]>;
    /**
     * 获取项目列表
     * @param limit - 返回数量限制
     * @returns 项目列表
     */
    getProjects(limit?: number): Promise<Project[]>;
    /**
     * 获取执行列表（迭代）
     * @param projectID - 项目 ID
     * @param limit - 返回数量限制
     * @returns 执行列表
     */
    getExecutions(projectID: number, limit?: number): Promise<Project[]>;
    /**
     * 获取测试用例列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 测试用例列表响应
     */
    getTestCases(productID: number, limit?: number): Promise<TestCaseListResponse>;
    /**
     * 获取测试用例详情
     * @param caseID - 用例 ID
     * @returns 测试用例详情
     */
    getTestCase(caseID: number): Promise<TestCase | null>;
    /**
     * 创建测试用例
     * @param params - 创建测试用例参数
     * @returns 新创建的测试用例
     */
    createTestCase(params: CreateTestCaseParams): Promise<TestCase>;
    /**
     * 修改测试用例
     * @param params - 修改测试用例参数
     * @returns 修改后的测试用例
     */
    updateTestCase(params: UpdateTestCaseParams): Promise<TestCase>;
    /**
     * 删除测试用例
     * @param caseID - 用例 ID
     * @returns 是否删除成功
     */
    deleteTestCase(caseID: number): Promise<boolean>;
}
//# sourceMappingURL=zentao-client.d.ts.map