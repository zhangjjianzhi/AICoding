# Supabase 数据库连接指南

## 环境变量

在 `.env.local` 中配置以下环境变量：

```env
NEXT_PUBLIC_SUPABASE_URL=https://你的项目.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=你的sb_publishable_xxx
```

## 创建表

在 Supabase Dashboard 的 **SQL Editor** 中执行：

```sql
-- 创建用户表
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  role VARCHAR(50) DEFAULT 'user',
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 插入测试数据
INSERT INTO users (name, email, role, status) VALUES
('张三', 'zhangsan@example.com', 'admin', 'active'),
('李四', 'lisi@example.com', 'user', 'active'),
('王五', 'wangwu@example.com', 'user', 'inactive'),
('赵六', 'zhaoliu@example.com', 'moderator', 'active');

-- 关闭 RLS（可选）
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
```

## 使用方法

### 1. 引入 Supabase 客户端

```ts
import { supabaseAdmin } from '@/lib/supabase';
```

### 2. API 接口

- `GET /api/users` - 获取所有用户
- `GET /api/users?id=1` - 获取单个用户
- `POST /api/users` - 创建用户
- `PUT /api/users` - 更新用户
- `DELETE /api/users?id=1` - 删除用户
- `GET /api/users/init` - 初始化表（首次使用）

### 3. 页面

访问 `/users` 查看用户管理页面。

## 代码示例

### 查询数据

```ts
const { data, error } = await supabaseAdmin
  .from('users')
  .select('*')
  .order('id');
```

### 插入数据

```ts
const { data, error } = await supabaseAdmin
  .from('users')
  .insert([{ name, email, role: 'user', status: 'active' }])
  .select()
  .single();
```

### 更新数据

```ts
const { data, error } = await supabaseAdmin
  .from('users')
  .update({ name, email, role, status })
  .eq('id', id)
  .select()
  .single();
```

### 删除数据

```ts
const { data, error } = await supabaseAdmin
  .from('users')
  .delete()
  .eq('id', id)
  .select()
  .single();
```

## 注意事项

1. 本地开发时，确保 Supabase 项目的 IP 白名单允许访问（或设置为允许所有 IP）
2. 生产环境部署到 Vercel 时，Vercel 服务器 IP 通常已在白名单中
3. 如遇到 "table not found" 错误，需先在 Supabase Dashboard 中创建表
