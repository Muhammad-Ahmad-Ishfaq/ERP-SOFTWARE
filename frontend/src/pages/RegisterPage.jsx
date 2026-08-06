import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { User, Lock, Building2, UserCircle } from 'lucide-react';
import api from '../api/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const RegisterPage = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [companies, setCompanies] = useState([]);
  const [form, setForm] = useState({
    username: '',
    password: '',
    confirmPassword: '',
    role: 'user',
    company_id: '',
  });

  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const res = await api.get('/core/companies/');
        setCompanies(res.data);
        if (res.data.length === 1) {
          setForm(prev => ({ ...prev, company_id: String(res.data[0].id) }));
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
        toast.error('Failed to load companies');
      }
    };
    fetchCompanies();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.username || !form.password || !form.company_id) {
    toast.error('Username, password, and company are required');
    return;
  }
  if (form.password !== form.confirmPassword) {
    toast.error('Passwords do not match');
    return;
  }
  setLoading(true);
  try {
    const payload = {
      username: form.username,
      password: form.password,
      role: form.role,
      company_id: parseInt(form.company_id, 10),
    };
    const response = await api.post('/users/register/', payload);
    toast.success('User created successfully');
    navigate('/login');
  } catch (error) {
    console.error('❌ Registration error:', error);
    console.error('Response data:', error.response?.data);
    // Extract meaningful error message
    const errors = error.response?.data;
    let msg = 'Failed to create user';
    if (errors) {
      if (typeof errors === 'object') {
        const firstKey = Object.keys(errors)[0];
        if (firstKey) {
          msg = Array.isArray(errors[firstKey]) ? errors[firstKey][0] : errors[firstKey];
        }
      } else {
        msg = errors;
      }
    }
    toast.error(msg);
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
          <div className="bg-black px-8 py-6 border-b border-gray-800">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">Create Account</h1>
                <p className="text-gray-400 text-sm">Set up a new user for your company</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-orange-500 flex items-center justify-center">
                <UserCircle className="h-5 w-5 text-white" />
              </div>
            </div>
          </div>
          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <Label htmlFor="username" className="text-sm font-medium text-gray-700">
                  Username <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="username"
                    name="username"
                    value={form.username}
                    onChange={handleChange}
                    placeholder="Choose a username"
                    required
                    className="pl-9 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-sm font-medium text-gray-700">
                  Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    value={form.password}
                    onChange={handleChange}
                    placeholder="Enter password"
                    required
                    className="pl-9 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-sm font-medium text-gray-700">
                  Confirm Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={form.confirmPassword}
                    onChange={handleChange}
                    placeholder="Confirm password"
                    required
                    className="pl-9 w-full border-gray-300 rounded-md shadow-sm focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="company_id" className="text-sm font-medium text-gray-700">
                  Company <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    id="company_id"
                    name="company_id"
                    value={form.company_id}
                    onChange={handleChange}
                    className="pl-9 w-full h-10 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 appearance-none"
                    required
                  >
                    <option value="">Select company</option>
                    {companies.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="role" className="text-sm font-medium text-gray-700">
                  Role
                </Label>
                <select
                  id="role"
                  name="role"
                  value={form.role}
                  onChange={handleChange}
                  className="w-full h-10 border border-gray-300 rounded-md shadow-sm bg-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition duration-200 appearance-none"
                >
                  <option value="admin">Administrator</option>
                  <option value="manager">Manager</option>
                  <option value="user">User</option>
                </select>
              </div>

              <div className="pt-4">
                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black hover:bg-gray-800 text-white font-medium py-2.5 rounded-md shadow-sm transition duration-200 disabled:opacity-70"
                >
                  {loading ? 'Creating...' : 'Create User'}
                </Button>
              </div>

              <div className="text-center text-sm text-gray-500">
                Already have an account?{' '}
                <Link to="/login" className="text-orange-600 hover:text-orange-700 font-medium">
                  Sign in
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;