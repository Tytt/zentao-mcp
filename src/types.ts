/**
 * 绂呴亾 MCP 绫诲瀷瀹氫箟
 */

/** 绂呴亾閰嶇疆閫夐」 */
export interface ZentaoConfig {
  /** 绂呴亾鏈嶅姟鍣ㄥ湴鍧€ */
  url: string;
  /** 鐢ㄦ埛鍚?*/
  account: string;
  /** 瀵嗙爜 */
  password: string;
  /** 鏄惁璺宠繃SSL璇佷功楠岃瘉锛堣嚜绛惧悕璇佷功鏃惰涓簍rue锛?*/
  rejectUnauthorized?: boolean;
}

/** Bug 鐘舵€佹灇涓?*/
export type BugStatus = 'active' | 'resolved' | 'closed';

/** Bug 涓ラ噸绋嬪害 */
export type BugSeverity = 1 | 2 | 3 | 4;

/** Bug 淇℃伅 */
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

/** Bug 绫诲瀷 */
export type BugType = 'codeerror' | 'config' | 'install' | 'security' | 'performance' | 'standard' | 'automation' | 'designdefect' | 'others';

/** 鍒涘缓 Bug 鍙傛暟 */
export interface CreateBugParams {
  /** 浜у搧 ID */
  product: number;
  /** Bug 鏍囬 */
  title: string;
  /** 涓ラ噸绋嬪害 1-4 (蹇呭～) */
  severity: BugSeverity;
  /** 浼樺厛绾?1-4 (蹇呭～) */
  pri: number;
  /** Bug 绫诲瀷 (蹇呭～) */
  type: BugType;
  /** 鎵€灞炲垎鏀?*/
  branch?: number;
  /** 妯″潡 ID */
  module?: number;
  /** 鎵€灞炴墽琛?*/
  execution?: number;
  /** 鍏抽敭璇?*/
  keywords?: string;
  /** 鎿嶄綔绯荤粺 */
  os?: string;
  /** 娴忚鍣?*/
  browser?: string;
  /** 閲嶇幇姝ラ (鏀寔 HTML 鏍煎紡) */
  steps?: string;
  /** 鐩稿叧浠诲姟 ID */
  task?: number;
  /** 鐩稿叧闇€姹?ID */
  story?: number;
  /** 鎴鏃ユ湡 YYYY-MM-DD */
  deadline?: string;
  /** 褰卞搷鐗堟湰 */
  openedBuild?: string[];
  /** 鎸囨淳缁欙紙鐢ㄦ埛璐﹀彿锛?*/
  assignedTo?: string;
  /** 椤圭洰 ID */
  project?: number;
}

/** 瑙ｅ喅 Bug 鍙傛暟 */
export interface ResolveBugParams {
  /** Bug ID */
  id: number;
  /** 瑙ｅ喅鏂规 */
  resolution: 'bydesign' | 'duplicate' | 'external' | 'fixed' | 'notrepro' | 'postponed' | 'willnotfix';
  /** 瑙ｅ喅鐗堟湰 */
  resolvedBuild?: string;
  /** 澶囨敞 */
  comment?: string;
}

/** 鍏抽棴 Bug 鍙傛暟 */
export interface CloseBugParams {
  /** Bug ID */
  id: number;
  /** 澶囨敞 */
  comment?: string;
}

/** 婵€娲?Bug 鍙傛暟 */
export interface ActivateBugParams {
  /** Bug ID */
  id: number;
  /** 鎸囨淳缁?*/
  assignedTo?: string;
  /** 澶囨敞 */
  comment?: string;
}

/** 闇€姹傜姸鎬?*/
export type StoryStatus = 'draft' | 'active' | 'changed' | 'reviewing' | 'closed';

/** 闇€姹備俊鎭?*/
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

/** 闇€姹傜被鍨?*/
export type StoryCategory = 'feature' | 'interface' | 'performance' | 'safe' | 'experience' | 'improve' | 'other';

/** 鍒涘缓闇€姹傚弬鏁?*/
export interface CreateStoryParams {
  /** 浜у搧 ID */
  product: number;
  /** 闇€姹傛爣棰?*/
  title: string;
  /** 闇€姹傜被鍨嬶紙蹇呭～锛?*/
  category: StoryCategory;
  /** 浼樺厛绾?1-4锛堝繀濉級 */
  pri: number;
  /** 闇€姹傛弿杩帮紙蹇呭～锛?*/
  spec: string;
  /** 璇勫浜鸿处鍙峰垪琛紙蹇呭～锛?*/
  reviewer: string[];
  /** 楠屾敹鏍囧噯 */
  verify?: string;
  /** 棰勪及宸ユ椂 */
  estimate?: number;
  /** 妯″潡 ID */
  module?: number;
  /** 璁″垝 ID */
  plan?: number;
  /** 鏉ユ簮 */
  source?: string;
  /** 鏉ユ簮澶囨敞 */
  sourceNote?: string;
  /** 鍏抽敭璇?*/
  keywords?: string;
}

/** 鍏抽棴闇€姹傚弬鏁?*/
export interface CloseStoryParams {
  /** 闇€姹?ID */
  id: number;
  /** 鍏抽棴鍘熷洜 */
  closedReason: 'done' | 'subdivided' | 'duplicate' | 'postponed' | 'willnotdo' | 'cancel' | 'bydesign';
  /** 澶囨敞 */
  comment?: string;
}

/** 浜у搧淇℃伅 */
export interface Product {
  id: number;
  name: string;
  code: string;
  status: string;
  desc?: string;
}

/** 椤圭洰淇℃伅 */
export interface Project {
  id: number;
  name: string;
  code?: string;
  status: string;
  begin?: string;
  end?: string;
}

/** API 鍝嶅簲鍩虹缁撴瀯 */
export interface ApiResponse<T = unknown> {
  status?: string;
  data?: T;
  error?: string;
  message?: string;
}

// ==================== 娴嬭瘯鐢ㄤ緥鐩稿叧绫诲瀷 ====================

/** 娴嬭瘯鐢ㄤ緥绫诲瀷 */
export type TestCaseType = 'feature' | 'performance' | 'config' | 'install' | 'security' | 'interface' | 'unit' | 'other';

/** 娴嬭瘯鐢ㄤ緥閫傜敤闃舵 */
export type TestCaseStage = 'unittest' | 'feature' | 'intergrate' | 'system' | 'smoke' | 'bvt';

/** 娴嬭瘯鐢ㄤ緥鐘舵€?*/
export type TestCaseStatus = 'wait' | 'normal' | 'blocked' | 'investigate';

/** 娴嬭瘯鐢ㄤ緥姝ラ */
export interface TestCaseStep {
  /** 姝ラID */
  id?: number;
  /** 姝ラ鎻忚堪 */
  desc: string;
  /** 鏈熸湜缁撴灉 */
  expect: string;
}

/** 娴嬭瘯鐢ㄤ緥淇℃伅 */
export interface TestCase {
  /** 鐢ㄤ緥ID */
  id: number;
  /** 鎵€灞炰骇鍝?*/
  product: number;
  /** 鎵€灞炲垎鏀?*/
  branch?: number;
  /** 鎵€灞炴ā鍧?*/
  module?: number;
  /** 鐩稿叧闇€姹?*/
  story?: number;
  /** 闇€姹傜増鏈?*/
  storyVersion?: number;
  /** 鐢ㄤ緥鏍囬 */
  title: string;
  /** 鍓嶇疆鏉′欢 */
  precondition?: string;
  /** 鍏抽敭璇?*/
  keywords?: string;
  /** 浼樺厛绾?*/
  pri: number;
  /** 鐢ㄤ緥绫诲瀷 */
  type: TestCaseType;
  /** 閫傜敤闃舵 */
  stage?: TestCaseStage;
  /** 鐘舵€?*/
  status: TestCaseStatus;
  /** 鍒涘缓浜?*/
  openedBy: {
    id: number;
    account: string;
    avatar: string;
    realname: string;
  } | string;
  /** 鍒涘缓鏃堕棿 */
  openedDate: string;
  /** 鏉ヨ嚜Bug */
  fromBug?: number;
  /** 鏉ヨ嚜鐢ㄤ緥 */
  fromCaseID?: number;
  /** 鐢ㄤ緥姝ラ */
  steps?: TestCaseStep[];
  /** 鏈€鍚庢墽琛屼汉 */
  lastRunner?: string;
  /** 鏈€鍚庢墽琛屾椂闂?*/
  lastRunDate?: string;
  /** 鏈€鍚庢墽琛岀粨鏋?*/
  lastRunResult?: string;
  /** 鐘舵€佸悕绉?*/
  statusName?: string;
}

/** 鍒涘缓娴嬭瘯鐢ㄤ緥鍙傛暟 */
export interface CreateTestCaseParams {
  /** 浜у搧 ID */
  product: number;
  /** 鐢ㄤ緥鏍囬 */
  title: string;
  /** 鐢ㄤ緥绫诲瀷 */
  type: TestCaseType;
  /** 鐢ㄤ緥姝ラ */
  steps: TestCaseStep[];
  /** 鎵€灞炲垎鏀?*/
  branch?: number;
  /** 鎵€灞炴ā鍧?*/
  module?: number;
  /** 鎵€灞為渶姹?*/
  story?: number;
  /** 閫傜敤闃舵 */
  stage?: TestCaseStage;
  /** 鍓嶇疆鏉′欢 */
  precondition?: string;
  /** 浼樺厛绾?1-4 */
  pri?: number;
  /** 鍏抽敭璇?*/
  keywords?: string;
}

/** 娴嬭瘯鐢ㄤ緥鍒楄〃鍝嶅簲 */
export interface TestCaseListResponse {
  /** 褰撳墠椤垫暟 */
  page: number;
  /** 鐢ㄤ緥鎬绘暟 */
  total: number;
  /** 姣忛〉鐢ㄤ緥鏁?*/
  limit: number;
  /** 鐢ㄤ緥鍒楄〃 */
  testcases: TestCase[];
}

// ==================== 鏇存柊/鍒犻櫎 Bug 鐩稿叧绫诲瀷 ====================

/** 鏇存柊 Bug 鍙傛暟 */
export interface UpdateBugParams {
  /** Bug ID */
  id: number;
  /** Bug 鏍囬 */
  title?: string;
  /** 涓ラ噸绋嬪害 */
  severity?: BugSeverity;
  /** 浼樺厛绾?*/
  pri?: number;
  /** Bug 绫诲瀷 */
  type?: string;
  /** 妯″潡 ID */
  module?: number;
  /** 鎵ц ID */
  execution?: number;
  /** 鍏抽敭璇?*/
  keywords?: string;
  /** 鎿嶄綔绯荤粺 */
  os?: string;
  /** 娴忚鍣?*/
  browser?: string;
  /** 閲嶇幇姝ラ */
  steps?: string;
  /** 鍏宠仈浠诲姟 */
  task?: number;
  /** 鍏宠仈闇€姹?*/
  story?: number;
  /** 鎴鏃ユ湡 */
  deadline?: string;
  /** 褰卞搷鐗堟湰 */
  openedBuild?: string[];
}

// ==================== 鏇存柊/鍒犻櫎/鍙樻洿 Story 鐩稿叧绫诲瀷 ====================

/** 鏇存柊闇€姹傚弬鏁?*/
export interface UpdateStoryParams {
  /** 闇€姹?ID */
  id: number;
  /** 妯″潡 ID */
  module?: number;
  /** 鏉ユ簮 */
  source?: string;
  /** 鏉ユ簮澶囨敞 */
  sourceNote?: string;
  /** 浼樺厛绾?*/
  pri?: number;
  /** 绫诲瀷 */
  category?: string;
  /** 棰勮宸ユ椂 */
  estimate?: number;
  /** 鍏抽敭璇?*/
  keywords?: string;
}

/** 鍙樻洿闇€姹傚弬鏁?*/
export interface ChangeStoryParams {
  /** 闇€姹?ID */
  id: number;
  /** 鏍囬 */
  title?: string;
  /** 鎻忚堪 */
  spec?: string;
  /** 楠屾敹鏍囧噯 */
  verify?: string;
}

// ==================== 浠诲姟 (Tasks) 鐩稿叧绫诲瀷 ====================

/** 浠诲姟绫诲瀷鏋氫妇 */
export type TaskType = 'design' | 'devel' | 'request' | 'test' | 'study' | 'discuss' | 'ui' | 'affair' | 'misc';

/** 浠诲姟鐘舵€?*/
export type TaskStatus = 'wait' | 'doing' | 'done' | 'closed' | 'cancel';

/** 浠诲姟淇℃伅 */
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

/** 鍒涘缓浠诲姟鍙傛暟 */
export interface CreateTaskParams {
  /** 鎵ц ID */
  execution: number;
  /** 浠诲姟鍚嶇О */
  name: string;
  /** 浠诲姟绫诲瀷 */
  type: TaskType;
  /** 鎸囨淳缁欙紙鐢ㄦ埛璐﹀彿鍒楄〃锛?*/
  assignedTo: string[];
  /** 棰勮寮€濮嬫棩鏈?YYYY-MM-DD */
  estStarted: string;
  /** 鎴鏃ユ湡 YYYY-MM-DD */
  deadline: string;
  /** 妯″潡 ID */
  module?: number;
  /** 鍏宠仈闇€姹?ID */
  story?: number;
  /** 鏉ヨ嚜 Bug ID */
  fromBug?: number;
  /** 浼樺厛绾?*/
  pri?: number;
  /** 棰勮宸ユ椂 */
  estimate?: number;
  /** 浠诲姟鎻忚堪 */
  desc?: string;
}

/** 鏇存柊浠诲姟鍙傛暟 */
export interface UpdateTaskParams {
  /** 浠诲姟 ID */
  id: number;
  /** 浠诲姟鍚嶇О */
  name?: string;
  /** 浠诲姟绫诲瀷 */
  type?: TaskType;
  /** 鎸囨淳缁?*/
  assignedTo?: string[];
  /** 妯″潡 ID */
  module?: number;
  /** 鍏宠仈闇€姹?*/
  story?: number;
  /** 鏉ヨ嚜 Bug */
  fromBug?: number;
  /** 浼樺厛绾?*/
  pri?: number;
  /** 棰勮宸ユ椂 */
  estimate?: number;
  /** 棰勮寮€濮嬫棩鏈?*/
  estStarted?: string;
  /** 鎴鏃ユ湡 */
  deadline?: string;
  /** 浠诲姟鎻忚堪 */
  desc?: string;
}

// ==================== 鐢ㄦ埛 (Users) 鐩稿叧绫诲瀷 ====================

/** 鐢ㄦ埛淇℃伅 */
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

/** 鍒涘缓鐢ㄦ埛鍙傛暟 */
export interface CreateUserParams {
  /** 鐢ㄦ埛璐﹀彿 */
  account: string;
  /** 瀵嗙爜 */
  password: string;
  /** 鐪熷疄濮撳悕 */
  realname?: string;
  /** 鎬у埆 */
  gender?: 'm' | 'f';
  /** 鐣岄潰鏉冮檺 */
  visions?: string[];
  /** 瑙掕壊 */
  role?: string;
  /** 閮ㄩ棬 ID */
  dept?: number;
  /** 閭 */
  email?: string;
  /** 鎵嬫満鍙?*/
  mobile?: string;
  /** 鐢佃瘽 */
  phone?: string;
  /** 寰俊 */
  weixin?: string;
  /** QQ */
  qq?: string;
  /** 鍦板潃 */
  address?: string;
  /** 鍏ヨ亴鏃ユ湡 YYYY-MM-DD */
  join?: string;
}

/** 鏇存柊鐢ㄦ埛鍙傛暟 */
export interface UpdateUserParams {
  /** 鐢ㄦ埛 ID */
  id: number;
  /** 鐪熷疄濮撳悕 */
  realname?: string;
  /** 瑙掕壊 */
  role?: string;
  /** 閮ㄩ棬 ID */
  dept?: number;
  /** 閭 */
  email?: string;
  /** 鎬у埆 */
  gender?: 'm' | 'f';
  /** 鎵嬫満鍙?*/
  mobile?: string;
  /** 鐢佃瘽 */
  phone?: string;
  /** 寰俊 */
  weixin?: string;
  /** QQ */
  qq?: string;
  /** 鍦板潃 */
  address?: string;
  /** 鍏ヨ亴鏃ユ湡 */
  join?: string;
  /** 瀵嗙爜 */
  password?: string;
}

// ==================== 椤圭洰闆?(Programs) 鐩稿叧绫诲瀷 ====================

/** 椤圭洰闆嗕俊鎭?*/
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

/** 鍒涘缓椤圭洰闆嗗弬鏁?*/
export interface CreateProgramParams {
  /** 鍚嶇О */
  name: string;
  /** 寮€濮嬫棩鏈?YYYY-MM-DD */
  begin: string;
  /** 缁撴潫鏃ユ湡 YYYY-MM-DD */
  end: string;
  /** 鐖堕」鐩泦 ID */
  parent?: number;
  /** 璐熻矗浜鸿处鍙?*/
  PM?: string;
  /** 棰勭畻 */
  budget?: number;
  /** 棰勭畻甯佺 */
  budgetUnit?: string;
  /** 鎻忚堪 */
  desc?: string;
  /** 璁块棶鎺у埗 */
  acl?: string;
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

/** 鏇存柊椤圭洰闆嗗弬鏁?*/
export interface UpdateProgramParams {
  /** 椤圭洰闆?ID */
  id: number;
  /** 鍚嶇О */
  name?: string;
  /** 鐖堕」鐩泦 */
  parent?: number;
  /** 璐熻矗浜?*/
  PM?: string;
  /** 棰勭畻 */
  budget?: number;
  /** 棰勭畻甯佺 */
  budgetUnit?: string;
  /** 鎻忚堪 */
  desc?: string;
  /** 寮€濮嬫棩鏈?*/
  begin?: string;
  /** 缁撴潫鏃ユ湡 */
  end?: string;
  /** 璁块棶鎺у埗 */
  acl?: string;
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

// ==================== 璁″垝 (Plans) 鐩稿叧绫诲瀷 ====================

/** 璁″垝淇℃伅 */
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

/** 鍒涘缓璁″垝鍙傛暟 */
export interface CreatePlanParams {
  /** 浜у搧 ID */
  product: number;
  /** 璁″垝鍚嶇О */
  title: string;
  /** 寮€濮嬫棩鏈?*/
  begin?: string;
  /** 缁撴潫鏃ユ湡 */
  end?: string;
  /** 鍒嗘敮 ID */
  branch?: number;
  /** 鐖惰鍒?ID */
  parent?: number;
  /** 鎻忚堪 */
  desc?: string;
}

/** 鏇存柊璁″垝鍙傛暟 */
export interface UpdatePlanParams {
  /** 璁″垝 ID */
  id: number;
  /** 璁″垝鍚嶇О */
  title?: string;
  /** 寮€濮嬫棩鏈?*/
  begin?: string;
  /** 缁撴潫鏃ユ湡 */
  end?: string;
  /** 鍒嗘敮 ID */
  branch?: number;
  /** 鎻忚堪 */
  desc?: string;
}

// ==================== 鍙戝竷 (Releases) 鐩稿叧绫诲瀷 ====================

/** 鍙戝竷淇℃伅 */
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

// ==================== 鐗堟湰 (Builds) 鐩稿叧绫诲瀷 ====================

/** 鐗堟湰淇℃伅 */
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

/** 鍒涘缓鐗堟湰鍙傛暟 */
export interface CreateBuildParams {
  /** 椤圭洰 ID */
  project: number;
  /** 鐗堟湰鍚嶇О */
  name: string;
  /** 鎵ц ID */
  execution: number;
  /** 浜у搧 ID */
  product: number;
  /** 鏋勫缓鑰呰处鍙?*/
  builder: string;
  /** 鍒嗘敮 ID */
  branch?: number;
  /** 鎵撳寘鏃ユ湡 */
  date?: string;
  /** 婧愪唬鐮佸湴鍧€ */
  scmPath?: string;
  /** 涓嬭浇鍦板潃 */
  filePath?: string;
  /** 鎻忚堪 */
  desc?: string;
}

/** 鏇存柊鐗堟湰鍙傛暟 */
export interface UpdateBuildParams {
  /** 鐗堟湰 ID */
  id: number;
  /** 鐗堟湰鍚嶇О */
  name?: string;
  /** 婧愪唬鐮佸湴鍧€ */
  scmPath?: string;
  /** 涓嬭浇鍦板潃 */
  filePath?: string;
  /** 鎻忚堪 */
  desc?: string;
  /** 鏋勫缓鑰?*/
  builder?: string;
  /** 鎵撳寘鏃ユ湡 */
  date?: string;
}

// ==================== 鎵ц (Executions) 鐩稿叧绫诲瀷 ====================

/** 鎵ц淇℃伅 */
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

/** 鍒涘缓鎵ц鍙傛暟 */
export interface CreateExecutionParams {
  /** 椤圭洰 ID */
  project: number;
  /** 鎵ц鍚嶇О */
  name: string;
  /** 鎵ц浠ｅ彿 */
  code: string;
  /** 寮€濮嬫棩鏈?*/
  begin: string;
  /** 缁撴潫鏃ユ湡 */
  end: string;
  /** 鍙敤宸ヤ綔鏃?*/
  days?: number;
  /** 绫诲瀷 */
  lifetime?: string;
  /** 浜у搧璐熻矗浜?*/
  PO?: string;
  /** 杩唬璐熻矗浜?*/
  PM?: string;
  /** 娴嬭瘯璐熻矗浜?*/
  QD?: string;
  /** 鍙戝竷璐熻矗浜?*/
  RD?: string;
  /** 鍥㈤槦鎴愬憳 */
  teamMembers?: string[];
  /** 鎻忚堪 */
  desc?: string;
  /** 璁块棶鎺у埗 */
  acl?: string;
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

/** 鏇存柊鎵ц鍙傛暟 */
export interface UpdateExecutionParams {
  /** 鎵ц ID */
  id: number;
  /** 鎵ц鍚嶇О */
  name?: string;
  /** 鎵ц浠ｅ彿 */
  code?: string;
  /** 寮€濮嬫棩鏈?*/
  begin?: string;
  /** 缁撴潫鏃ユ湡 */
  end?: string;
  /** 鍙敤宸ヤ綔鏃?*/
  days?: number;
  /** 绫诲瀷 */
  lifetime?: string;
  /** 浜у搧璐熻矗浜?*/
  PO?: string;
  /** 杩唬璐熻矗浜?*/
  PM?: string;
  /** 娴嬭瘯璐熻矗浜?*/
  QD?: string;
  /** 鍙戝竷璐熻矗浜?*/
  RD?: string;
  /** 鍥㈤槦鎴愬憳 */
  teamMembers?: string[];
  /** 鎻忚堪 */
  desc?: string;
  /** 璁块棶鎺у埗 */
  acl?: string;
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

// ==================== 浜у搧/椤圭洰 鍒涘缓/鏇存柊鐩稿叧绫诲瀷 ====================

/** 鍒涘缓浜у搧鍙傛暟 */
export interface CreateProductParams {
  /** 浜у搧鍚嶇О */
  name: string;
  /** 浜у搧浠ｅ彿 */
  code: string;
  /** 鎵€灞為」鐩泦 ID */
  program?: number;
  /** 浜у搧绾?ID */
  line?: number;
  /** 浜у搧璐熻矗浜?*/
  PO?: string;
  /** 娴嬭瘯璐熻矗浜?*/
  QD?: string;
  /** 鍙戝竷璐熻矗浜?*/
  RD?: string;
  /** 浜у搧绫诲瀷 */
  type?: 'normal' | 'branch' | 'platform';
  /** 鎻忚堪 */
  desc?: string;
  /** 璁块棶鎺у埗 */
  acl?: 'open' | 'private';
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

/** 鏇存柊浜у搧鍙傛暟 */
export interface UpdateProductParams {
  /** 浜у搧 ID */
  id: number;
  /** 浜у搧鍚嶇О */
  name?: string;
  /** 浜у搧浠ｅ彿 */
  code?: string;
  /** 鎵€灞為」鐩泦 */
  program?: number;
  /** 浜у搧绾?*/
  line?: number;
  /** 浜у搧绫诲瀷 */
  type?: 'normal' | 'branch' | 'platform';
  /** 鐘舵€?*/
  status?: string;
  /** 鎻忚堪 */
  desc?: string;
  /** 浜у搧璐熻矗浜?*/
  PO?: string;
  /** 娴嬭瘯璐熻矗浜?*/
  QD?: string;
  /** 鍙戝竷璐熻矗浜?*/
  RD?: string;
  /** 璁块棶鎺у埗 */
  acl?: 'open' | 'private';
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
}

/** 鍒涘缓椤圭洰鍙傛暟 */
export interface CreateProjectParams {
  /** 椤圭洰鍚嶇О */
  name: string;
  /** 椤圭洰浠ｅ彿 */
  code: string;
  /** 寮€濮嬫棩鏈?YYYY-MM-DD */
  begin: string;
  /** 缁撴潫鏃ユ湡 YYYY-MM-DD */
  end: string;
  /** 鍏宠仈浜у搧 ID 鍒楄〃 */
  products: number[];
  /** 椤圭洰妯″瀷 */
  model?: 'scrum' | 'waterfall';
  /** 鎵€灞為」鐩泦 ID */
  parent?: number;
}

/** 鏇存柊椤圭洰鍙傛暟 */
export interface UpdateProjectParams {
  /** 椤圭洰 ID */
  id: number;
  /** 椤圭洰鍚嶇О */
  name?: string;
  /** 椤圭洰浠ｅ彿 */
  code?: string;
  /** 鎵€灞為」鐩泦 */
  parent?: number;
  /** 椤圭洰璐熻矗浜?*/
  PM?: string;
  /** 棰勭畻 */
  budget?: number;
  /** 棰勭畻甯佺 */
  budgetUnit?: string;
  /** 鍙敤宸ヤ綔鏃?*/
  days?: number;
  /** 鎻忚堪 */
  desc?: string;
  /** 璁块棶鎺у埗 */
  acl?: string;
  /** 鐧藉悕鍗?*/
  whitelist?: string[];
  /** 鏉冮檺鎺у埗 */
  auth?: string;
}

// ==================== 鏂囨。 (Doc) 鐩稿叧绫诲瀷 ====================

/** 鏂囨。绫诲瀷 */
export type DocType = 'text' | 'url' | 'word' | 'ppt' | 'excel';

/** 鏂囨。淇℃伅 */
export interface Doc {
  /** 鏂囨。 ID */
  id: number;
  /** 鎵€灞炴枃妗ｅ簱 ID */
  lib: number;
  /** 鎵€灞炴ā鍧?ID */
  module?: number;
  /** 鏂囨。鏍囬 */
  title: string;
  /** 鏂囨。绫诲瀷 */
  type: DocType;
  /** 鏂囨。鍐呭锛圚TML锛?*/
  content?: string;
  /** 澶栭儴閾炬帴锛坱ype=url 鏃讹級 */
  url?: string;
  /** 鍏抽敭璇?*/
  keywords?: string;
  /** 娣诲姞浜?*/
  addedBy?: string;
  /** 娣诲姞鏃堕棿 */
  addedDate?: string;
  /** 缂栬緫浜?*/
  editedBy?: string;
  /** 缂栬緫鏃堕棿 */
  editedDate?: string;
  /** 鐗堟湰鍙?*/
  version?: number;
  /** 璁块棶鏉冮檺 */
  acl?: string;
  /** 娴忚娆℃暟 */
  views?: number;
}

/** 鏂囨。搴撶被鍨?*/
export type DocLibType = 'product' | 'project' | 'execution' | 'custom' | 'api';

/** 鏂囨。搴撲俊鎭?*/
export interface DocLib {
  /** 鏂囨。搴?ID */
  id: number;
  /** 鏂囨。搴撳悕绉?*/
  name: string;
  /** 鏂囨。搴撶被鍨?*/
  type: DocLibType;
  /** 鍏宠仈瀵硅薄 ID锛堜骇鍝?椤圭洰 ID锛?*/
  product?: number;
  /** 鍏宠仈椤圭洰 ID */
  project?: number;
  /** 璁块棶鏉冮檺 */
  acl?: string;
  /** 鏄惁鍒犻櫎 */
  deleted?: boolean;
}

/** 鍒涘缓鏂囨。鍙傛暟 */
export interface CreateDocParams {
  /** 鏂囨。搴?ID */
  lib: number;
  /** 鏂囨。鏍囬 */
  title: string;
  /** 鏂囨。绫诲瀷 */
  type?: DocType;
  /** 鏂囨。鍐呭锛圚TML锛?*/
  content?: string;
  /** 澶栭儴閾炬帴锛坱ype=url 鏃讹級 */
  url?: string;
  /** 鍏抽敭璇?*/
  keywords?: string;
  /** 鎵€灞炴ā鍧?ID */
  module?: number;
}

/** 缂栬緫鏂囨。鍙傛暟 */
export interface EditDocParams {
  /** 鏂囨。 ID */
  id: number;
  /** 鏂囨。鏍囬 */
  title?: string;
  /** 鏂囨。鍐呭锛圚TML锛?*/
  content?: string;
  /** 鍏抽敭璇?*/
  keywords?: string;
}

// ==================== 鏂囨。鐩綍 (DocModule) 鐩稿叧绫诲瀷 ====================

/** 鏂囨。鐩綍鑺傜偣 */
export interface DocModule {
  /** 鐩綍 ID */
  id: number;
  /** 鐩綍鍚嶇О */
  name: string;
  /** 鐖剁洰褰?ID */
  parent: number;
  /** 鎵€灞炴枃妗ｅ簱 ID */
  root: number;
  /** 璺緞 */
  path?: string;
  /** 灞傜骇 */
  grade?: number;
  /** 鎺掑簭 */
  order?: number;
  /** 瀛愮洰褰?*/
  children?: DocModule[];
}

/** 鏂囨。绌洪棿鏁版嵁锛堝寘鍚枃妗ｅ簱鍜岀洰褰曟爲锛?*/
export interface DocSpaceData {
  /** 鏂囨。搴撳垪琛?*/
  libs?: DocLib[];
  /** 鐩綍鍒楄〃 */
  modules?: DocModule[];
  /** 鏂囨。鍒楄〃 */
  docs?: Doc[];
}

/** 鍒涘缓鏂囨。鐩綍鍙傛暟 */
export interface CreateDocModuleParams {
  /** 鐩綍鍚嶇О */
  name: string;
  /** 鏂囨。搴?ID */
  libID: number;
  /** 鐖剁洰褰?ID锛? 涓烘牴鐩綍锛?*/
  parentID?: number;
  /** 瀵硅薄 ID锛堜骇鍝?椤圭洰 ID锛?*/
  objectID: number;
}

/** 缂栬緫鏂囨。鐩綍鍙傛暟 */
export interface EditDocModuleParams {
  /** 鐩綍 ID */
  moduleID: number;
  /** 鐩綍鍚嶇О */
  name: string;
  /** 鏂囨。搴?ID */
  root: number;
  /** 鐖剁洰褰?ID */
  parent?: number;
}
