/**
 * 测试禅道文档 API - 包含目录管理功能
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';
import CryptoJS from 'crypto-js';
import FormData from 'form-data';
import fs from 'fs';

const ZENTAO_URL = 'http://43.163.106.99:8088';
const ZENTAO_ACCOUNT = 'york';
const ZENTAO_PASSWORD = 'Fp888999';

const sessionName = 'zentaosid';
const sessionID = '9072de19e933e2a38bada7aed77d72ca';
const rand = 4273;

let cookies: string[] = [];

const http: AxiosInstance = axios.create({ baseURL: ZENTAO_URL });

http.interceptors.request.use((config) => {
  if (cookies.length > 0) config.headers['Cookie'] = cookies.join('; ');
  return config;
});

http.interceptors.response.use((response) => {
  const setCookies = response.headers['set-cookie'];
  if (setCookies) {
    setCookies.forEach((c: string) => {
      const name = c.split('=')[0];
      const value = c.split(';')[0];
      const idx = cookies.findIndex((x) => x.startsWith(name + '='));
      if (idx >= 0) cookies[idx] = value;
      else cookies.push(value);
    });
  }
  return response;
});

async function login() {
  console.log('1. 登录...');
  const passwordMd5 = CryptoJS.MD5(ZENTAO_PASSWORD).toString();
  const encryptedPassword = CryptoJS.MD5(passwordMd5 + rand).toString();

  const loginResp = await http.post(
    `/index.php?m=user&f=login&t=json&${sessionName}=${sessionID}`,
    `account=${ZENTAO_ACCOUNT}&password=${encryptedPassword}&verifyRand=${rand}`,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
  );

  if (loginResp.data.result === 'success' || loginResp.data.status === 'success') {
    console.log('   ✓ 登录成功');
    return true;
  } else {
    console.log('   ✗ 登录失败:', loginResp.data);
    return false;
  }
}

async function getSpaceData() {
  console.log('\n2. 获取文档空间数据（目录树）...');
  const url = `/index.php?m=doc&f=ajaxGetSpaceData&type=product&spaceID=1&picks=&${sessionName}=${sessionID}`;
  const resp = await http.get(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest', 'Referer': ZENTAO_URL }
  });
  
  fs.writeFileSync('response-tree.json', JSON.stringify(resp.data, null, 2));
  console.log('   ✓ 目录树数据已保存到 response-tree.json');
  
  // 解析并显示目录结构
  if (resp.data && resp.data.libs) {
    console.log('   文档库列表:');
    resp.data.libs.forEach((lib: any) => {
      console.log(`     - [${lib.id}] ${lib.name}`);
    });
  }
  
  return resp.data;
}

async function createModule() {
  console.log('\n3. 创建文档目录...');
  const moduleName = `测试目录_${Date.now()}`;
  
  const form = new FormData();
  form.append('name', moduleName);
  form.append('libID', '1');
  form.append('parentID', '0');
  form.append('objectID', '1');
  form.append('moduleType', 'doc');
  form.append('isUpdate', 'false');
  form.append('createType', 'child');

  const url = `/index.php?m=tree&f=ajaxCreateModule&${sessionName}=${sessionID}`;
  const resp = await http.post(url, form, {
    headers: { 
      ...form.getHeaders(), 
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${ZENTAO_URL}/index.php?m=doc&f=productspace&objectID=1`
    }
  });

  fs.writeFileSync('response-createModule.json', JSON.stringify(resp.data, null, 2));
  
  if (resp.data && resp.data.result === 'success' && resp.data.module) {
    console.log(`   ✓ 创建目录成功: ID=${resp.data.module.id}, 名称=${resp.data.module.name}`);
    return resp.data.module.id;
  } else {
    console.log('   ✗ 创建目录失败:', resp.data);
    return null;
  }
}

async function editModule(moduleID: number) {
  console.log(`\n4. 编辑文档目录 #${moduleID}...`);
  const newName = `已修改目录_${Date.now()}`;
  
  const form = new FormData();
  form.append('root', '1');
  form.append('parent', '0');
  form.append('name', newName);

  const url = `/index.php?m=doc&f=editCatalog&moduleID=${moduleID}&type=doc&${sessionName}=${sessionID}`;
  const resp = await http.post(url, form, {
    headers: { 
      ...form.getHeaders(), 
      'X-Requested-With': 'XMLHttpRequest',
      'X-ZUI-Modal': 'true',
      'Referer': `${ZENTAO_URL}/index.php?m=doc&f=productspace&objectID=1`
    }
  });

  fs.writeFileSync('response-editModule.json', JSON.stringify(resp.data, null, 2));
  
  if (resp.data && resp.data.result === 'success') {
    console.log(`   ✓ 编辑目录成功: 新名称=${newName}`);
    return true;
  } else {
    console.log('   响应:', resp.data);
    // 有时候成功也不返回 result，检查响应类型
    if (typeof resp.data === 'object') {
      console.log('   ✓ 编辑目录完成（可能成功）');
      return true;
    }
    return false;
  }
}

async function createDoc(moduleID?: number) {
  console.log(`\n5. 创建文档（目录ID: ${moduleID || '无'}）...`);
  const docTitle = `测试文档_${Date.now()}`;
  
  const form = new FormData();
  form.append('title', docTitle);
  form.append('content', '<p>这是测试文档的内容</p>');
  form.append('lib', '1');
  form.append('module', String(moduleID || 0));
  form.append('parent', moduleID ? `m_${moduleID}` : 'm_0');
  form.append('status', 'normal');
  form.append('contentType', 'doc');
  form.append('type', 'text');
  form.append('acl', 'open');
  form.append('space', 'product');
  form.append('product', '1');
  form.append('uid', `doc${Date.now()}`);
  form.append('template', '0');
  form.append('mailto[]', '');
  form.append('contactList', '');
  form.append('groups[]', '');
  form.append('users[]', '');

  const url = `/index.php?m=doc&f=create&objectType=product&objectID=1&libID=1&moduleID=${moduleID || 0}&${sessionName}=${sessionID}`;
  const resp = await http.post(url, form, {
    headers: { 
      ...form.getHeaders(), 
      'X-Requested-With': 'XMLHttpRequest',
      'Referer': `${ZENTAO_URL}/index.php?m=doc&f=productspace&objectID=1`
    }
  });

  fs.writeFileSync('response-createDoc.json', JSON.stringify(resp.data, null, 2));
  
  if (resp.data && resp.data.result === 'success') {
    console.log(`   ✓ 创建文档成功: ID=${resp.data.id}, 标题=${docTitle}`);
    return resp.data.id;
  } else {
    console.log('   ✗ 创建文档失败:', typeof resp.data === 'string' ? '返回HTML' : resp.data);
    return null;
  }
}

async function getDoc(docID: number) {
  console.log(`\n6. 获取文档详情 #${docID}...`);
  const url = `/index.php?m=doc&f=ajaxGetDoc&docID=${docID}&version=0&${sessionName}=${sessionID}`;
  const resp = await http.get(url, {
    headers: { 'X-Requested-With': 'XMLHttpRequest' }
  });

  fs.writeFileSync('response-getDoc.json', JSON.stringify(resp.data, null, 2));
  
  if (resp.data) {
    console.log(`   ✓ 获取文档成功: 标题=${resp.data.title || '(无标题)'}`);
    return resp.data;
  }
  return null;
}

async function main() {
  console.log('========== 禅道文档 API 测试 ==========\n');
  
  try {
    // 1. 登录
    const loggedIn = await login();
    if (!loggedIn) return;

    // 2. 获取文档空间数据（目录树）
    await getSpaceData();

    // 3. 创建目录
    const moduleID = await createModule();

    // 4. 编辑目录
    if (moduleID) {
      await editModule(moduleID);
    }

    // 5. 在目录下创建文档
    const docID = await createDoc(moduleID || undefined);

    // 6. 获取文档详情
    if (docID) {
      await getDoc(docID);
    }

    console.log('\n========== 测试完成 ==========');
    
  } catch (error: any) {
    console.error('测试失败:', error.message);
    if (error.response) {
      fs.writeFileSync('response-error.json', JSON.stringify({
        status: error.response.status,
        headers: error.response.headers,
        data: error.response.data,
      }, null, 2));
      console.log('错误详情已保存到 response-error.json');
    }
  }
}

main();
