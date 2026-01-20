/**
 * 禅道 API 客户端
 * 封装禅道 REST API 的调用，支持 Bug 和需求的增删改查
 */
import { ZentaoConfig, Bug, Story, Product, Project, CreateBugParams, ResolveBugParams, CloseBugParams, ActivateBugParams, UpdateBugParams, CreateStoryParams, CloseStoryParams, UpdateStoryParams, ChangeStoryParams, TestCase, TestCaseListResponse, CreateTestCaseParams, UpdateTestCaseParams, Task, CreateTaskParams, UpdateTaskParams, User, CreateUserParams, UpdateUserParams, Program, CreateProgramParams, UpdateProgramParams, Plan, CreatePlanParams, UpdatePlanParams, Release, Build, CreateBuildParams, UpdateBuildParams, Execution, CreateExecutionParams, UpdateExecutionParams, TestTask, CreateProductParams, UpdateProductParams, CreateProjectParams, UpdateProjectParams } from './types.js';
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
     * @param browseType - 浏览类型: all-全部, unclosed-未关闭, unresolved-未解决, toclosed-待关闭, openedbyme-我创建, assigntome-指派给我
     * @param limit - 返回数量限制
     * @returns Bug 列表
     */
    getBugs(productID: number, browseType?: string, limit?: number): Promise<Bug[]>;
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
     * @param browseType - 浏览类型: allstory-全部, unclosed-未关闭, draftstory-草稿, activestory-激活, reviewingstory-评审中, closedstory-已关闭, openedbyme-我创建
     * @param limit - 返回数量限制
     * @returns 需求列表
     */
    getStories(productID: number, browseType?: string, limit?: number): Promise<Story[]>;
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
     * 更新 Bug
     * @param params - 更新 Bug 参数
     * @returns 更新后的 Bug
     */
    updateBug(params: UpdateBugParams): Promise<Bug | null>;
    /**
     * 更新需求
     * @param params - 更新需求参数
     * @returns 更新后的需求
     */
    updateStory(params: UpdateStoryParams): Promise<Story | null>;
    /**
     * 变更需求（修改标题、描述、验收标准，会导致状态变为 changed）
     * @param params - 变更需求参数
     * @returns 变更后的需求
     */
    changeStory(params: ChangeStoryParams): Promise<Story | null>;
    /**
     * 获取产品详情
     * @param productID - 产品 ID
     * @returns 产品详情
     */
    getProduct(productID: number): Promise<Product | null>;
    /**
     * 创建产品
     * @param params - 创建产品参数
     * @returns 新创建的产品
     */
    createProduct(params: CreateProductParams): Promise<Product>;
    /**
     * 更新产品
     * @param params - 更新产品参数
     * @returns 更新后的产品
     */
    updateProduct(params: UpdateProductParams): Promise<Product | null>;
    /**
     * 获取项目详情
     * @param projectID - 项目 ID
     * @returns 项目详情
     */
    getProject(projectID: number): Promise<Project | null>;
    /**
     * 创建项目
     * @param params - 创建项目参数
     * @returns 新创建的项目
     */
    createProject(params: CreateProjectParams): Promise<Project>;
    /**
     * 更新项目
     * @param params - 更新项目参数
     * @returns 更新后的项目
     */
    updateProject(params: UpdateProjectParams): Promise<Project | null>;
    /**
     * 获取执行的任务列表
     * @param executionID - 执行 ID
     * @param limit - 返回数量限制
     * @returns 任务列表
     */
    getTasks(executionID: number, limit?: number): Promise<Task[]>;
    /**
     * 获取任务详情
     * @param taskID - 任务 ID
     * @returns 任务详情
     */
    getTask(taskID: number): Promise<Task | null>;
    /**
     * 创建任务
     * @param params - 创建任务参数
     * @returns 新创建的任务
     */
    createTask(params: CreateTaskParams): Promise<Task>;
    /**
     * 更新任务
     * @param params - 更新任务参数
     * @returns 更新后的任务
     */
    updateTask(params: UpdateTaskParams): Promise<Task | null>;
    /**
     * 获取用户列表
     * @param limit - 返回数量限制
     * @returns 用户列表
     */
    getUsers(limit?: number): Promise<User[]>;
    /**
     * 获取用户详情
     * @param userID - 用户 ID
     * @returns 用户详情
     */
    getUser(userID: number): Promise<User | null>;
    /**
     * 获取当前登录用户信息
     * @returns 当前用户信息
     */
    getMyProfile(): Promise<User | null>;
    /**
     * 创建用户
     * @param params - 创建用户参数
     * @returns 新创建的用户
     */
    createUser(params: CreateUserParams): Promise<User>;
    /**
     * 更新用户
     * @param params - 更新用户参数
     * @returns 更新后的用户
     */
    updateUser(params: UpdateUserParams): Promise<User | null>;
    /**
     * 获取项目集列表
     * @param limit - 返回数量限制
     * @returns 项目集列表
     */
    getPrograms(limit?: number): Promise<Program[]>;
    /**
     * 获取项目集详情
     * @param programID - 项目集 ID
     * @returns 项目集详情
     */
    getProgram(programID: number): Promise<Program | null>;
    /**
     * 创建项目集
     * @param params - 创建项目集参数
     * @returns 新创建的项目集
     */
    createProgram(params: CreateProgramParams): Promise<Program>;
    /**
     * 更新项目集
     * @param params - 更新项目集参数
     * @returns 更新后的项目集
     */
    updateProgram(params: UpdateProgramParams): Promise<Program | null>;
    /**
     * 获取产品计划列表
     * @param productID - 产品 ID
     * @param limit - 返回数量限制
     * @returns 计划列表
     */
    getPlans(productID: number, limit?: number): Promise<Plan[]>;
    /**
     * 获取计划详情
     * @param planID - 计划 ID
     * @returns 计划详情
     */
    getPlan(planID: number): Promise<Plan | null>;
    /**
     * 创建计划
     * @param params - 创建计划参数
     * @returns 新创建的计划
     */
    createPlan(params: CreatePlanParams): Promise<Plan>;
    /**
     * 更新计划
     * @param params - 更新计划参数
     * @returns 更新后的计划
     */
    updatePlan(params: UpdatePlanParams): Promise<Plan | null>;
    /**
     * 计划关联需求
     * @param planID - 计划 ID
     * @param stories - 需求 ID 列表
     * @returns 是否成功
     */
    linkStoriesToPlan(planID: number, stories: number[]): Promise<boolean>;
    /**
     * 计划取消关联需求
     * @param planID - 计划 ID
     * @param stories - 需求 ID 列表
     * @returns 是否成功
     */
    unlinkStoriesFromPlan(planID: number, stories: number[]): Promise<boolean>;
    /**
     * 计划关联 Bug
     * @param planID - 计划 ID
     * @param bugs - Bug ID 列表
     * @returns 是否成功
     */
    linkBugsToPlan(planID: number, bugs: number[]): Promise<boolean>;
    /**
     * 计划取消关联 Bug
     * @param planID - 计划 ID
     * @param bugs - Bug ID 列表
     * @returns 是否成功
     */
    unlinkBugsFromPlan(planID: number, bugs: number[]): Promise<boolean>;
    /**
     * 获取项目发布列表
     * @param projectID - 项目 ID
     * @returns 发布列表
     */
    getProjectReleases(projectID: number): Promise<Release[]>;
    /**
     * 获取产品发布列表
     * @param productID - 产品 ID
     * @returns 发布列表
     */
    getProductReleases(productID: number): Promise<Release[]>;
    /**
     * 获取项目版本列表
     * @param projectID - 项目 ID
     * @returns 版本列表
     */
    getProjectBuilds(projectID: number): Promise<Build[]>;
    /**
     * 获取执行版本列表
     * @param executionID - 执行 ID
     * @returns 版本列表
     */
    getExecutionBuilds(executionID: number): Promise<Build[]>;
    /**
     * 获取版本详情
     * @param buildID - 版本 ID
     * @returns 版本详情
     */
    getBuild(buildID: number): Promise<Build | null>;
    /**
     * 创建版本
     * @param params - 创建版本参数
     * @returns 新创建的版本
     */
    createBuild(params: CreateBuildParams): Promise<Build>;
    /**
     * 更新版本
     * @param params - 更新版本参数
     * @returns 更新后的版本
     */
    updateBuild(params: UpdateBuildParams): Promise<Build | null>;
    /**
     * 获取执行详情
     * @param executionID - 执行 ID
     * @returns 执行详情
     */
    getExecution(executionID: number): Promise<Execution | null>;
    /**
     * 创建执行
     * @param params - 创建执行参数
     * @returns 新创建的执行
     */
    createExecution(params: CreateExecutionParams): Promise<Execution>;
    /**
     * 更新执行
     * @param params - 更新执行参数
     * @returns 更新后的执行
     */
    updateExecution(params: UpdateExecutionParams): Promise<Execution | null>;
    /**
     * 获取测试单列表
     * @param productID - 产品 ID (可选)
     * @param limit - 返回数量限制
     * @returns 测试单列表
     */
    getTestTasks(productID?: number, limit?: number): Promise<TestTask[]>;
    /**
     * 获取项目测试单列表
     * @param projectID - 项目 ID
     * @returns 测试单列表
     */
    getProjectTestTasks(projectID: number): Promise<TestTask[]>;
    /**
     * 获取测试单详情
     * @param testtaskID - 测试单 ID
     * @returns 测试单详情
     */
    getTestTask(testtaskID: number): Promise<TestTask | null>;
}
//# sourceMappingURL=zentao-client.d.ts.map