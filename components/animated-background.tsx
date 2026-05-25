'use client';

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden">
      {/* Gradient orbs */}
      <div className="absolute -top-40 -left-40 h-[500px] w-[500px] animate-gradient rounded-full bg-gradient-to-br from-indigo-500/8 to-purple-500/8 blur-3xl" />
      <div className="absolute -bottom-40 -right-40 h-[500px] w-[500px] animate-gradient rounded-full bg-gradient-to-br from-purple-500/8 to-pink-500/8 blur-3xl" style={{ animationDelay: '-4s' }} />

      {/* Floating geometric shapes */}
      <svg
        className="animate-float absolute left-[15%] top-[20%] h-8 w-8 text-indigo-500/10"
        viewBox="0 0 32 32"
        fill="none"
      >
        <circle cx="16" cy="16" r="16" fill="currentColor" />
      </svg>

      <svg
        className="animate-float-delayed absolute right-[20%] top-[30%] h-6 w-6 text-purple-500/10"
        viewBox="0 0 24 24"
        fill="none"
      >
        <rect width="24" height="24" rx="4" fill="currentColor" />
      </svg>

      <svg
        className="animate-float absolute left-[30%] bottom-[25%] h-10 w-10 text-indigo-500/8"
        viewBox="0 0 40 40"
        fill="none"
      >
        <path d="M20 0L40 20L20 40L0 20L20 0Z" fill="currentColor" />
      </svg>

      <svg
        className="animate-float-delayed absolute right-[25%] bottom-[35%] h-5 w-5 text-purple-500/10"
        viewBox="0 0 20 20"
        fill="none"
      >
        <circle cx="10" cy="10" r="10" fill="currentColor" />
      </svg>

      {/* Subtle dots pattern */}
      <div
        className="absolute inset-0 opacity-[0.015]"
        style={{
          backgroundImage: 'radial-gradient(circle at 1px 1px, #6366f1 1px, transparent 0)',
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
}
