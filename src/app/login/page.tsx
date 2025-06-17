'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuth } from '@/contexts/AuthContext';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { signIn } = useAuth();
  const router = useRouter();
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: '',
      password: '',
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    try {
      setIsLoading(true);
      setError('');
      await signIn(data.email, data.password);
      router.push('/dashboard');
    } catch (error) {
      setError('Invalid email or password');
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const fillCredentials = (email: string, password: string) => {
    setValue('email', email);
    setValue('password', password);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-2xl font-bold">Admin Panel Login</h1>
        
        {/* Predefined Accounts */}
        <div className="mb-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
          <h3 className="font-medium text-gray-900 mb-3">Available Accounts</h3>
          <div className="space-y-2">
            <button
              type="button"
              onClick={() => fillCredentials('skluva.com@gmail.com', 'SuperAdmin123!')}
              className="w-full text-left text-sm bg-blue-100 hover:bg-blue-200 p-3 rounded transition-colors"
            >
              <div className="font-medium text-blue-900">🔑 Super Admin</div>
              <div className="text-blue-700 text-xs">skluva.com@gmail.com</div>
              <div className="text-blue-600 text-xs">Can create ads without payment</div>
            </button>
            <button
              type="button"
              onClick={() => fillCredentials('admin@skluva.com', 'Admin123!')}
              className="w-full text-left text-sm bg-gray-100 hover:bg-gray-200 p-3 rounded transition-colors"
            >
              <div className="font-medium text-gray-900">👤 Regular Admin</div>
              <div className="text-gray-700 text-xs">admin@skluva.com</div>
              <div className="text-gray-600 text-xs">Standard admin access</div>
            </button>
          </div>
        </div>
        
        {error && (
          <div className="mb-4 rounded-md bg-red-50 p-4 text-sm text-red-500">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              Email
            </label>
            <input
              id="email"
              type="email"
              {...register('email')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your email"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>
          
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Password
            </label>
            <input
              id="password"
              type="password"
              {...register('password')}
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
              placeholder="Enter your password"
            />
            {errors.password && (
              <p className="mt-1 text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          <button
            type="submit"
            disabled={isLoading}
            className="w-full rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50"
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
