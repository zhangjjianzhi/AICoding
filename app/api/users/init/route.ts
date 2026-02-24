import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const { data: existingTable, error: checkError } = await supabaseAdmin
      .from('users')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === '42P01') {
      return NextResponse.json({
        success: false,
        message: '表不存在，请先在 Supabase Dashboard 中创建 users 表',
        createSQL: `
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
        `
      });
    }

    if (existingTable && existingTable.length === 0) {
      const { error: insertError } = await supabaseAdmin
        .from('users')
        .insert([
          { name: '张三', email: 'zhangsan@example.com', role: 'admin', status: 'active' },
          { name: '李四', email: 'lisi@example.com', role: 'user', status: 'active' },
          { name: '王五', email: 'wangwu@example.com', role: 'user', status: 'inactive' },
          { name: '赵六', email: 'zhaoliu@example.com', role: 'moderator', status: 'active' },
        ]);
      
      if (insertError && insertError.code !== '23505') {
        console.error('Insert error:', insertError);
      }
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('id');

    return NextResponse.json({
      success: true,
      message: '表已存在',
      users: data || []
    });
  } catch (error) {
    console.error('Init error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    }, { status: 500 });
  }
}
