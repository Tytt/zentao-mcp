/**
 * 禅道 MCP 类型定义
 */

/** 禅道配置选项 */
export interface ZentaoConfig {
  /** 禅道服务器地址 */
  url: string;
  /** 用户名 */
  account: string;
  /** 密码 */
  password: string;
  /** 是否跳过SSL证书验证（自签名证书时设为true） */
  rejectUnauthorized?: boolean;
}

/** Bug 状态枚举 */
export type BugStatus = 'active' | 'resolved' | 'closed';

/** Bug 严重程度 */
export type BugSeverity = 1 | 2 | 3 | 4;

/** Bug 信息 */
export interface Bug {
  id: number;
  title: string;
  status: BugStatus;
  severity: BugSeverity;
  pri: number;
  product: number;
  productName?: string;
  project?: number;
  projectName?: string;
  module?: number;
  moduleName?: string;
  openedBy: string;
  openedDate: string;
  assignedTo: string;
  resolvedBy?: string;
  resolvedDate?: string;
  resolution?: string;
  closedBy?: string;
  closedDate?: string;
  steps?: string;
  type?: string;
  confirmed?: number;
}

/** Bug 类型 */
export type BugType = 'codeerror' | 'config' | 'install' | 'security' | 'performance' | 'standard' | 'automation' | 'designdefect' | 'others';

/** 创建 Bug 参数 */
export interface CreateBugParams {
  /** 产品 ID */
  product: number;
  /** Bug 标题 */
  title: string;
  /** 严重程度 1-4 (必填) */
  severity: BugSeverity;
  /** 优先级 1-4 (必填) */
  pri: number;
  /** Bug 类型 (必填) */
  type: BugType;
  /** 所属分支 */
  branch?: number;
  /** 模块 ID */
  module?: number;
  /** 所属执行 */
  execution?: number;
  /** 关键词 */
  keywords?: string;
  /** 操作系统 */
  os?: string;
  /** 浏览器 */
  browser?: string;
  /** 重现步骤 (支持 HTML 格式) */
  steps?: string;
  /** 相关任务 ID */
  task?: number;
  /** 相关需求 ID */
  story?: number;
  /** 截止日期 YYYY-MM-DD */
  deadline?: string;
  /** 影响版本 */
  openedBuild?: string[];
  /** 指派给（用户账号） */
  assignedTo?: string;
  /** 项目 ID */
  project?: number;
}

/** 解决 Bug 参数 */
export interface ResolveBugParams {
  /** Bug ID */
  id: number;
  /** 解决方案 */
  resolution: 'bydesign' | 'duplicate' | 'external' | 'fixed' | 'notrepro' | 'postponed' | 'willnotfix';
  /** 解决版本 */
  resolvedBuild?: string;
  /** 备注 */
  comment?: string;
}

/** 关闭 Bug 参数 */
export interface CloseBugParams {
  /** Bug ID */
  id: number;
  /** 备注 */
  comment?: string;
}

/** 激活 Bug 参数 */
export interface ActivateBugParams {
  /** Bug ID */
  id: number;
  /** 指派给 */
  assignedTo?: string;
  /** 备注 */
  comment?: string;
}

/** 需求状态 */
export type StoryStatus = 'draft' | 'active' | 'changed' | 'reviewing' | 'closed';

/** 需求信息 */
export interface Story {
  id: number;
  title: string;
  status: StoryStatus;
  stage: string;
  pri: number;
  estimate?: number;
  product: number;
  productName?: string;
  module?: number;
  moduleName?: string;
  plan?: number;
  source?: string;
  sourceNote?: string;
  openedBy: string;
  openedDate: string;
  assignedTo?: string;
  assignedDate?: string;
  closedBy?: string;
  closedDate?: string;
  closedReason?: string;
  spec?: string;
  verify?: string;
}

/** 需求类型 */
export type StoryCategory = 'feature' | 'interface' | 'performance' | 'safe' | 'experience' | 'improve' | 'other';

/** 创建需求参数 */
export interface CreateStoryParams {
  /** 产品 ID */
  product: number;
  /** 需求标题 */
  title: string;
  /** 需求类型（必填） */
  category: StoryCategory;
  /** 优先级 1-4（必填） */
  pri: number;
  /** 需求描述 */
  spec?: string;
  /** 验收标准 */
  verify?: string;
  /** 预估工时 */
  estimate?: number;
  /** 模块 ID */
  module?: number;
  /** 计划 ID */
  plan?: number;
  /** 来源 */
  source?: string;
  /** 来源备注 */
  sourceNote?: string;
  /** 关键词 */
  keywords?: string;
}

/** 关闭需求参数 */
export interface CloseStoryParams {
  /** 需求 ID */
  id: number;
  /** 关闭原因 */
  closedReason: 'done' | 'subdivided' | 'duplicate' | 'postponed' | 'willnotdo' | 'cancel' | 'bydesign';
  /** 备注 */
  comment?: string;
}

/** 产品信息 */
export interface Product {
  id: number;
  name: string;
  code: string;
  status: string;
  desc?: string;
}

/** 项目信息 */
export interface Project {
  id: number;
  name: string;
  code?: string;
  status: string;
  begin?: string;
  end?: string;
}

/** API 响应基础结构 */
export interface ApiResponse<T = unknown> {
  status?: string;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 测试用例相关类型 ====================

/** 测试用例类型 */
export type TestCaseType = 'feature' | 'performance' | 'config' | 'install' | 'security' | 'interface' | 'unit' | 'other';

/** 测试用例适用阶段 */
export type TestCaseStage = 'unittest' | 'feature' | 'intergrate' | 'system' | 'smoke' | 'bvt';

/** 测试用例状态 */
export type TestCaseStatus = 'wait' | 'normal' | 'blocked' | 'investigate';

/** 测试用例步骤 */
export interface TestCaseStep {
  /** 步骤ID */
  id?: number;
  /** 步骤描述 */
  desc: string;
  /** 期望结果 */
  expect: string;
}

/** 测试用例信息 */
export interface TestCase {
  /** 用例ID */
  id: number;
  /** 所属产品 */
  product: number;
  /** 所属分支 */
  branch?: number;
  /** 所属模块 */
  module?: number;
  /** 相关需求 */
  story?: number;
  /** 需求版本 */
  storyVersion?: number;
  /** 用例标题 */
  title: string;
  /** 前置条件 */
  precondition?: string;
  /** 关键词 */
  keywords?: string;
  /** 优先级 */
  pri: number;
  /** 用例类型 */
  type: TestCaseType;
  /** 适用阶段 */
  stage?: TestCaseStage;
  /** 状态 */
  status: TestCaseStatus;
  /** 创建人 */
  openedBy: {
    id: number;
    account: string;
    avatar: string;
    realname: string;
  } | string;
  /** 创建时间 */
  openedDate: string;
  /** 来自Bug */
  fromBug?: number;
  /** 来自用例 */
  fromCaseID?: number;
  /** 用例步骤 */
  steps?: TestCaseStep[];
  /** 最后执行人 */
  lastRunner?: string;
  /** 最后执行时间 */
  lastRunDate?: string;
  /** 最后执行结果 */
  lastRunResult?: string;
  /** 状态名称 */
  statusName?: string;
}

/** 创建测试用例参数 */
export interface CreateTestCaseParams {
  /** 产品 ID */
  product: number;
  /** 用例标题 */
  title: string;
  /** 用例类型 */
  type: TestCaseType;
  /** 用例步骤 */
  steps: TestCaseStep[];
  /** 所属分支 */
  branch?: number;
  /** 所属模块 */
  module?: number;
  /** 所属需求 */
  story?: number;
  /** 适用阶段 */
  stage?: TestCaseStage;
  /** 前置条件 */
  precondition?: string;
  /** 优先级 1-4 */
  pri?: number;
  /** 关键词 */
  keywords?: string;
}

/** 修改测试用例参数 */
export interface UpdateTestCaseParams {
  /** 用例 ID */
  id: number;
  /** 用例标题 */
  title?: string;
  /** 用例类型 */
  type?: TestCaseType;
  /** 用例步骤 */
  steps?: TestCaseStep[];
  /** 所属分支 */
  branch?: number;
  /** 所属模块 */
  module?: number;
  /** 所属需求 */
  story?: number;
  /** 适用阶段 */
  stage?: TestCaseStage;
  /** 前置条件 */
  precondition?: string;
  /** 优先级 1-4 */
  pri?: number;
  /** 关键词 */
  keywords?: string;
}

/** 测试用例列表响应 */
export interface TestCaseListResponse {
  /** 当前页数 */
  page: number;
  /** 用例总数 */
  total: number;
  /** 每页用例数 */
  limit: number;
  /** 用例列表 */
  testcases: TestCase[];
}

// ==================== 更新/删除 Bug 相关类型 ====================

/** 更新 Bug 参数 */
export interface UpdateBugParams {
  /** Bug ID */
  id: number;
  /** Bug 标题 */
  title?: string;
  /** 严重程度 */
  severity?: BugSeverity;
  /** 优先级 */
  pri?: number;
  /** Bug 类型 */
  type?: string;
  /** 模块 ID */
  module?: number;
  /** 执行 ID */
  execution?: number;
  /** 关键词 */
  keywords?: string;
  /** 操作系统 */
  os?: string;
  /** 浏览器 */
  browser?: string;
  /** 重现步骤 */
  steps?: string;
  /** 关联任务 */
  task?: number;
  /** 关联需求 */
  story?: number;
  /** 截止日期 */
  deadline?: string;
  /** 影响版本 */
  openedBuild?: string[];
}

// ==================== 更新/删除/变更 Story 相关类型 ====================

/** 更新需求参数 */
export interface UpdateStoryParams {
  /** 需求 ID */
  id: number;
  /** 模块 ID */
  module?: number;
  /** 来源 */
  source?: string;
  /** 来源备注 */
  sourceNote?: string;
  /** 优先级 */
  pri?: number;
  /** 类型 */
  category?: string;
  /** 预计工时 */
  estimate?: number;
  /** 关键词 */
  keywords?: string;
}

/** 变更需求参数 */
export interface ChangeStoryParams {
  /** 需求 ID */
  id: number;
  /** 标题 */
  title?: string;
  /** 描述 */
  spec?: string;
  /** 验收标准 */
  verify?: string;
}

// ==================== 任务 (Tasks) 相关类型 ====================

/** 任务类型枚举 */
export type TaskType = 'design' | 'devel' | 'request' | 'test' | 'study' | 'discuss' | 'ui' | 'affair' | 'misc';

/** 任务状态 */
export type TaskStatus = 'wait' | 'doing' | 'done' | 'closed' | 'cancel';

/** 任务信息 */
export interface Task {
  id: number;
  project: number;
  execution: number;
  module?: number;
  story?: number;
  fromBug?: number;
  name: string;
  type: TaskType;
  pri: number;
  estimate?: number;
  consumed?: number;
  left?: number;
  deadline?: string;
  status: TaskStatus;
  desc?: string;
  openedBy?: { id: number; account: string; realname: string } | string;
  openedDate?: string;
  assignedTo?: { id: number; account: string; realname: string } | string;
  assignedDate?: string;
  estStarted?: string;
  realStarted?: string;
  finishedBy?: string;
  finishedDate?: string;
  closedBy?: string;
  closedDate?: string;
  progress?: number;
}

/** 创建任务参数 */
export interface CreateTaskParams {
  /** 执行 ID */
  execution: number;
  /** 任务名称 */
  name: string;
  /** 任务类型 */
  type: TaskType;
  /** 指派给（用户账号列表） */
  assignedTo: string[];
  /** 预计开始日期 YYYY-MM-DD */
  estStarted: string;
  /** 截止日期 YYYY-MM-DD */
  deadline: string;
  /** 模块 ID */
  module?: number;
  /** 关联需求 ID */
  story?: number;
  /** 来自 Bug ID */
  fromBug?: number;
  /** 优先级 */
  pri?: number;
  /** 预计工时 */
  estimate?: number;
  /** 任务描述 */
  desc?: string;
}

/** 更新任务参数 */
export interface UpdateTaskParams {
  /** 任务 ID */
  id: number;
  /** 任务名称 */
  name?: string;
  /** 任务类型 */
  type?: TaskType;
  /** 指派给 */
  assignedTo?: string[];
  /** 模块 ID */
  module?: number;
  /** 关联需求 */
  story?: number;
  /** 来自 Bug */
  fromBug?: number;
  /** 优先级 */
  pri?: number;
  /** 预计工时 */
  estimate?: number;
  /** 预计开始日期 */
  estStarted?: string;
  /** 截止日期 */
  deadline?: string;
  /** 任务描述 */
  desc?: string;
}

// ==================== 用户 (Users) 相关类型 ====================

/** 用户信息 */
export interface User {
  id: number;
  account: string;
  realname?: string;
  avatar?: string;
  gender?: 'm' | 'f';
  role?: string;
  dept?: number;
  email?: string;
  mobile?: string;
  phone?: string;
  weixin?: string;
  qq?: string;
  address?: string;
  join?: string;
  visits?: number;
  last?: string;
  fails?: number;
  locked?: string;
  deleted?: boolean;
}

/** 创建用户参数 */
export interface CreateUserParams {
  /** 用户账号 */
  account: string;
  /** 密码 */
  password: string;
  /** 真实姓名 */
  realname?: string;
  /** 性别 */
  gender?: 'm' | 'f';
  /** 界面权限 */
  visions?: string[];
  /** 角色 */
  role?: string;
  /** 部门 ID */
  dept?: number;
  /** 邮箱 */
  email?: string;
  /** 手机号 */
  mobile?: string;
  /** 电话 */
  phone?: string;
  /** 微信 */
  weixin?: string;
  /** QQ */
  qq?: string;
  /** 地址 */
  address?: string;
  /** 入职日期 YYYY-MM-DD */
  join?: string;
}

/** 更新用户参数 */
export interface UpdateUserParams {
  /** 用户 ID */
  id: number;
  /** 真实姓名 */
  realname?: string;
  /** 角色 */
  role?: string;
  /** 部门 ID */
  dept?: number;
  /** 邮箱 */
  email?: string;
  /** 性别 */
  gender?: 'm' | 'f';
  /** 手机号 */
  mobile?: string;
  /** 电话 */
  phone?: string;
  /** 微信 */
  weixin?: string;
  /** QQ */
  qq?: string;
  /** 地址 */
  address?: string;
  /** 入职日期 */
  join?: string;
  /** 密码 */
  password?: string;
}

// ==================== 项目集 (Programs) 相关类型 ====================

/** 项目集信息 */
export interface Program {
  id: number;
  name: string;
  parent?: number;
  PM?: string;
  budget?: number;
  budgetUnit?: string;
  begin: string;
  end: string;
  status?: string;
  desc?: string;
  openedBy?: string;
  openedDate?: string;
  acl?: string;
}

/** 创建项目集参数 */
export interface CreateProgramParams {
  /** 名称 */
  name: string;
  /** 开始日期 YYYY-MM-DD */
  begin: string;
  /** 结束日期 YYYY-MM-DD */
  end: string;
  /** 父项目集 ID */
  parent?: number;
  /** 负责人账号 */
  PM?: string;
  /** 预算 */
  budget?: number;
  /** 预算币种 */
  budgetUnit?: string;
  /** 描述 */
  desc?: string;
  /** 访问控制 */
  acl?: string;
  /** 白名单 */
  whitelist?: string[];
}

/** 更新项目集参数 */
export interface UpdateProgramParams {
  /** 项目集 ID */
  id: number;
  /** 名称 */
  name?: string;
  /** 父项目集 */
  parent?: number;
  /** 负责人 */
  PM?: string;
  /** 预算 */
  budget?: number;
  /** 预算币种 */
  budgetUnit?: string;
  /** 描述 */
  desc?: string;
  /** 开始日期 */
  begin?: string;
  /** 结束日期 */
  end?: string;
  /** 访问控制 */
  acl?: string;
  /** 白名单 */
  whitelist?: string[];
}

// ==================== 计划 (Plans) 相关类型 ====================

/** 计划信息 */
export interface Plan {
  id: number;
  product: number;
  branch?: number;
  parent?: number;
  title: string;
  desc?: string;
  begin?: string;
  end?: string;
  stories?: number;
  bugs?: number;
  status?: string;
}

/** 创建计划参数 */
export interface CreatePlanParams {
  /** 产品 ID */
  product: number;
  /** 计划名称 */
  title: string;
  /** 开始日期 */
  begin?: string;
  /** 结束日期 */
  end?: string;
  /** 分支 ID */
  branch?: number;
  /** 父计划 ID */
  parent?: number;
  /** 描述 */
  desc?: string;
}

/** 更新计划参数 */
export interface UpdatePlanParams {
  /** 计划 ID */
  id: number;
  /** 计划名称 */
  title?: string;
  /** 开始日期 */
  begin?: string;
  /** 结束日期 */
  end?: string;
  /** 分支 ID */
  branch?: number;
  /** 描述 */
  desc?: string;
}

// ==================== 发布 (Releases) 相关类型 ====================

/** 发布信息 */
export interface Release {
  id: number;
  project?: number;
  product: number;
  branch?: number;
  build?: number;
  name: string;
  date?: string;
  desc?: string;
  status?: string;
  productName?: string;
  buildID?: number;
  buildName?: string;
  projectName?: string;
}

// ==================== 版本 (Builds) 相关类型 ====================

/** 版本信息 */
export interface Build {
  id: number;
  project: number;
  product: number;
  branch?: number;
  execution?: number;
  name: string;
  scmPath?: string;
  filePath?: string;
  date?: string;
  builder?: string;
  desc?: string;
  deleted?: boolean;
  executionName?: string;
  productName?: string;
}

/** 创建版本参数 */
export interface CreateBuildParams {
  /** 项目 ID */
  project: number;
  /** 版本名称 */
  name: string;
  /** 执行 ID */
  execution: number;
  /** 产品 ID */
  product: number;
  /** 构建者账号 */
  builder: string;
  /** 分支 ID */
  branch?: number;
  /** 打包日期 */
  date?: string;
  /** 源代码地址 */
  scmPath?: string;
  /** 下载地址 */
  filePath?: string;
  /** 描述 */
  desc?: string;
}

/** 更新版本参数 */
export interface UpdateBuildParams {
  /** 版本 ID */
  id: number;
  /** 版本名称 */
  name?: string;
  /** 源代码地址 */
  scmPath?: string;
  /** 下载地址 */
  filePath?: string;
  /** 描述 */
  desc?: string;
  /** 构建者 */
  builder?: string;
  /** 打包日期 */
  date?: string;
}

// ==================== 执行 (Executions) 相关类型 ====================

/** 执行信息 */
export interface Execution {
  id: number;
  project: number;
  name: string;
  code?: string;
  type?: string;
  parent?: number;
  begin: string;
  end: string;
  days?: number;
  status?: string;
  PO?: string;
  PM?: string;
  QD?: string;
  RD?: string;
  team?: string;
  acl?: string;
  whitelist?: string;
  openedBy?: string;
  openedDate?: string;
  progress?: number;
}

/** 创建执行参数 */
export interface CreateExecutionParams {
  /** 项目 ID */
  project: number;
  /** 执行名称 */
  name: string;
  /** 执行代号 */
  code: string;
  /** 开始日期 */
  begin: string;
  /** 结束日期 */
  end: string;
  /** 可用工作日 */
  days?: number;
  /** 类型 */
  lifetime?: string;
  /** 产品负责人 */
  PO?: string;
  /** 迭代负责人 */
  PM?: string;
  /** 测试负责人 */
  QD?: string;
  /** 发布负责人 */
  RD?: string;
  /** 团队成员 */
  teamMembers?: string[];
  /** 描述 */
  desc?: string;
  /** 访问控制 */
  acl?: string;
  /** 白名单 */
  whitelist?: string[];
}

/** 更新执行参数 */
export interface UpdateExecutionParams {
  /** 执行 ID */
  id: number;
  /** 执行名称 */
  name?: string;
  /** 执行代号 */
  code?: string;
  /** 开始日期 */
  begin?: string;
  /** 结束日期 */
  end?: string;
  /** 可用工作日 */
  days?: number;
  /** 类型 */
  lifetime?: string;
  /** 产品负责人 */
  PO?: string;
  /** 迭代负责人 */
  PM?: string;
  /** 测试负责人 */
  QD?: string;
  /** 发布负责人 */
  RD?: string;
  /** 团队成员 */
  teamMembers?: string[];
  /** 描述 */
  desc?: string;
  /** 访问控制 */
  acl?: string;
  /** 白名单 */
  whitelist?: string[];
}

// ==================== 测试单 (TestTasks) 相关类型 ====================

/** 测试单状态 */
export type TestTaskStatus = 'wait' | 'doing' | 'done' | 'blocked';

/** 测试单类型 */
export type TestTaskType = 'integrate' | 'system' | 'acceptance' | 'performance' | 'safety';

/** 测试单信息 */
export interface TestTask {
  id: number;
  project?: number;
  product: number;
  name: string;
  execution?: number;
  build?: number | string;
  type?: TestTaskType;
  owner?: string;
  pri?: number;
  begin?: string;
  end?: string;
  desc?: string;
  status: TestTaskStatus;
  productName?: string;
  executionName?: string;
  buildName?: string;
  branch?: number;
}

// ==================== 产品/项目 创建/更新相关类型 ====================

/** 创建产品参数 */
export interface CreateProductParams {
  /** 产品名称 */
  name: string;
  /** 产品代号 */
  code: string;
  /** 所属项目集 ID */
  program?: number;
  /** 产品线 ID */
  line?: number;
  /** 产品负责人 */
  PO?: string;
  /** 测试负责人 */
  QD?: string;
  /** 发布负责人 */
  RD?: string;
  /** 产品类型 */
  type?: 'normal' | 'branch' | 'platform';
  /** 描述 */
  desc?: string;
  /** 访问控制 */
  acl?: 'open' | 'private';
  /** 白名单 */
  whitelist?: string[];
}

/** 更新产品参数 */
export interface UpdateProductParams {
  /** 产品 ID */
  id: number;
  /** 产品名称 */
  name?: string;
  /** 产品代号 */
  code?: string;
  /** 所属项目集 */
  program?: number;
  /** 产品线 */
  line?: number;
  /** 产品类型 */
  type?: 'normal' | 'branch' | 'platform';
  /** 状态 */
  status?: string;
  /** 描述 */
  desc?: string;
  /** 产品负责人 */
  PO?: string;
  /** 测试负责人 */
  QD?: string;
  /** 发布负责人 */
  RD?: string;
  /** 访问控制 */
  acl?: 'open' | 'private';
  /** 白名单 */
  whitelist?: string[];
}

/** 创建项目参数 */
export interface CreateProjectParams {
  /** 项目名称 */
  name: string;
  /** 项目代号 */
  code: string;
  /** 开始日期 YYYY-MM-DD */
  begin: string;
  /** 结束日期 YYYY-MM-DD */
  end: string;
  /** 关联产品 ID 列表 */
  products: number[];
  /** 项目模型 */
  model?: 'scrum' | 'waterfall';
  /** 所属项目集 ID */
  parent?: number;
}

/** 更新项目参数 */
export interface UpdateProjectParams {
  /** 项目 ID */
  id: number;
  /** 项目名称 */
  name?: string;
  /** 项目代号 */
  code?: string;
  /** 所属项目集 */
  parent?: number;
  /** 项目负责人 */
  PM?: string;
  /** 预算 */
  budget?: number;
  /** 预算币种 */
  budgetUnit?: string;
  /** 可用工作日 */
  days?: number;
  /** 描述 */
  desc?: string;
  /** 访问控制 */
  acl?: string;
  /** 白名单 */
  whitelist?: string[];
  /** 权限控制 */
  auth?: string;
}

