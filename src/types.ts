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

/** 创建 Bug 参数 */
export interface CreateBugParams {
  /** 产品 ID */
  product: number;
  /** Bug 标题 */
  title: string;
  /** 严重程度 1-4 */
  severity?: BugSeverity;
  /** 优先级 1-4 */
  pri?: number;
  /** 重现步骤 */
  steps?: string;
  /** Bug 类型 */
  type?: string;
  /** 模块 ID */
  module?: number;
  /** 指派给 */
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

/** 创建需求参数 */
export interface CreateStoryParams {
  /** 产品 ID */
  product: number;
  /** 需求标题 */
  title: string;
  /** 需求描述 */
  spec?: string;
  /** 验收标准 */
  verify?: string;
  /** 优先级 1-4 */
  pri?: number;
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

