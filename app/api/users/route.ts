import { supabaseAdmin } from '@/lib/supabase';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      const { data, error } = await supabaseAdmin
        .from('users')
        .select('*')
        .eq('id', parseInt(id))
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 404 });
      }
      return NextResponse.json(data);
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*')
      .order('id');

    if (error) {
      console.error('GET error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('GET error:', error);
    return NextResponse.json({ error: '获取用户失败' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, role, status } = body;

    if (!name || !email) {
      return NextResponse.json({ error: '姓名和邮箱不能为空' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert([{ name, email, role: role || 'user', status: status || 'active' }])
      .select()
      .single();

    if (error) {
      console.error('POST error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error: any) {
    console.error('POST error:', error);
    return NextResponse.json({ error: '创建用户失败' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, name, email, role, status } = body;

    if (!id) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ name, email, role, status })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('PUT error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error: any) {
    console.error('PUT error:', error);
    return NextResponse.json({ error: '更新用户失败' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: '用户ID不能为空' }, { status: 400 });
    }

    const { data, error } = await supabaseAdmin
      .from('users')
      .delete()
      .eq('id', parseInt(id))
      .select()
      .single();

    if (error) {
      console.error('DELETE error:', error);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ message: '删除成功', user: data });
  } catch (error) {
    console.error('DELETE error:', error);
    return NextResponse.json({ error: '删除用户失败' }, { status: 500 });
  }
}
