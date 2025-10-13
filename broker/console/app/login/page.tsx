'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const ParticleNetwork: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    // Create particles - fewer for better performance
    const particleCount = 50;
    const particles: Particle[] = [];
    const maxDistance = 150; // Max distance to draw connecting lines

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.5,
        vy: (Math.random() - 0.5) * 0.5,
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw connections
      ctx.strokeStyle = 'rgba(59, 130, 246, 0.15)'; // blue-500 with low opacity
      ctx.lineWidth = 1;

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance < maxDistance) {
            const opacity = (1 - distance / maxDistance) * 0.15;
            ctx.strokeStyle = `rgba(59, 130, 246, ${opacity})`;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      // Draw particles
      ctx.fillStyle = 'rgba(59, 130, 246, 0.6)'; // blue-500
      for (const particle of particles) {
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, 2, 0, Math.PI * 2);
        ctx.fill();
      }

      // Update particle positions
      for (const particle of particles) {
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Keep particles within bounds
        particle.x = Math.max(0, Math.min(canvas.width, particle.x));
        particle.y = Math.max(0, Math.min(canvas.height, particle.y));
      }
    };

    const animate = () => {
      draw();
      requestAnimationFrame(animate);
    };

    animate();

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" />;
};

export default function LoginPage() {
  const [apiKey, setApiKey] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  useEffect(() => {
    document.documentElement.classList.add('dark');

    return () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        document.documentElement.classList.remove('dark');
      }
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!apiKey.trim()) {
      setError('API key is required');
      return;
    }

    setIsLoading(true);

    // For now, we'll do simple validation and store in sessionStorage
    // In production, this would validate against your backend
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Store API key in session storage and set cookie
      sessionStorage.setItem('realmMeshApiKey', apiKey);
      sessionStorage.setItem('isAuthenticated', 'true');

      // Set cookie for middleware authentication check
      document.cookie = 'isAuthenticated=true; path=/; max-age=86400'; // 24 hours

      // Navigate to dashboard
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid API key');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center bg-slate-900 overflow-hidden">
      <ParticleNetwork />

      {/* Top Left Branding */}
      <div className="absolute top-8 left-8 z-20 flex items-center space-x-4">
        <svg
          className="w-12 h-12"
          viewBox="0 0 100 100"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* 3D Cube */}
          <path
            d="M50 10 L85 30 L85 70 L50 90 L15 70 L15 30 Z"
            fill="url(#cubeGradient)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          <path
            d="M50 10 L50 50 L85 70 L85 30 Z"
            fill="rgba(6, 182, 212, 0.3)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          <path
            d="M50 10 L50 50 L15 70 L15 30 Z"
            fill="rgba(20, 184, 166, 0.3)"
            stroke="#14b8a6"
            strokeWidth="2"
          />
          <path
            d="M50 50 L85 70 L50 90 L15 70 Z"
            fill="rgba(6, 182, 212, 0.5)"
            stroke="#06b6d4"
            strokeWidth="2"
          />
          <defs>
            <linearGradient id="cubeGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#14b8a6" />
              <stop offset="100%" stopColor="#06b6d4" />
            </linearGradient>
          </defs>
        </svg>
        <h1 className="text-3xl font-bold text-white">
          InterRealm
        </h1>
      </div>

      {/* Login Box */}
      <div className="relative z-10 w-full max-w-lg px-6">
        <div className="bg-gray-900/90 backdrop-blur-xl border border-gray-800 rounded-2xl p-8 shadow-2xl">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold text-white mb-2">
Realm Mesh          </h2>
            <p className="text-gray-400 text-sm">
              Enter your API key to access the control plane
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="apiKey" className="block text-sm font-medium text-gray-300 mb-2">
                API Key
              </label>
              <div className="relative">
                <input
                  id="apiKey"
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  className="w-full px-4 py-3 bg-gray-800/50 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  placeholder="Enter your API key..."
                  disabled={isLoading}
                />
                <div className="absolute inset-y-0 right-3 flex items-center">
                  <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                  </svg>
                </div>
              </div>
              {error && (
                <p className="mt-2 text-sm text-red-400">{error}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 px-4 bg-gradient-to-r from-blue-500 to-cyan-500 text-white font-semibold rounded-lg hover:from-blue-600 hover:to-cyan-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Authenticating...
                </span>
              ) : (
                'Access Console'
              )}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-800">
            <div className="flex items-center justify-center space-x-4 text-xs text-gray-500">
              <span>Secured by RealmMesh</span>
              <span>•</span>
              <span>End-to-End Encrypted</span>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Tech Pattern */}
      <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-slate-900 via-slate-900/50 to-transparent z-10">
        <div className="h-full flex items-end justify-center pb-4">
          <div className="flex space-x-8 text-xs text-gray-600">
            <span className="flex items-center">
              <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
              System Online
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
              Neural Network Active
            </span>
            <span className="flex items-center">
              <span className="w-2 h-2 bg-purple-500 rounded-full mr-2 animate-pulse"></span>
              Quantum Encryption
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}