'use client';

import { useState, useEffect } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', role: 'user', status: 'active' });

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      const data = await res.json();
      if (Array.isArray(data)) {
        setUsers(data);
      }
    } catch (error) {
      console.error('Failed to fetch users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const url = editingUser ? '/api/users' : '/api/users';
      const method = editingUser ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingUser ? { ...formData, id: editingUser.id } : formData),
      });

      if (res.ok) {
        fetchUsers();
        closeModal();
      } else {
        const data = await res.json();
        alert(data.error || '操作失败');
      }
    } catch (error) {
      console.error('Failed to save user:', error);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('确定要删除这个用户吗？')) return;
    try {
      const res = await fetch(`/api/users?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        fetchUsers();
      }
    } catch (error) {
      console.error('Failed to delete user:', error);
    }
  };

  const openAddModal = () => {
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (user: User) => {
    setEditingUser(user);
    setFormData({ name: user.name, email: user.email, role: user.role, status: user.status });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setFormData({ name: '', email: '', role: 'user', status: 'active' });
  };

  if (loading) return <div className="p-8 text-center">加载中...</div>;

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-800">用户管理</h1>
          <button
            onClick={openAddModal}
            className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition"
          >
            + 添加用户
          </button>
        </div>

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">ID</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">姓名</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">邮箱</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">角色</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">状态</th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">操作</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t hover:bg-gray-50">
                  <td className="px-6 py-4 text-sm text-gray-600">{user.id}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-800">{user.name}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">{user.email}</td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                      user.role === 'moderator' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <span className={`px-2 py-1 rounded text-xs ${
                      user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}>
                      {user.status === 'active' ? '启用' : '禁用'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    <button
                      onClick={() => openEditModal(user)}
                      className="text-blue-500 hover:text-blue-700 mr-3"
                    >
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(user.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      删除
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {users.length === 0 && (
            <div className="p-8 text-center text-gray-500">暂无数据</div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h2 className="text-xl font-semibold mb-4">
              {editingUser ? '编辑用户' : '添加用户'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">姓名</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">角色</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="user">普通用户</option>
                  <option value="admin">管理员</option>
                  <option value="moderator">版主</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-1">状态</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                >
                  <option value="active">启用</option>
                  <option value="inactive">禁用</option>
                </select>
              </div>
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  取消
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  保存
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
