import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Compass, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { navGroups } from '@/config/nav';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <div className="w-full max-w-md text-center">
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-2xl bg-navy-900 text-white">
          <Compass className="h-5 w-5" />
        </div>
        <h1 className="text-[22px] font-semibold text-navy-900">Page not found</h1>
        <p className="mx-auto mt-1.5 max-w-sm text-[13px] leading-relaxed text-slate-500">
          The page you are looking for doesn’t exist in this prototype. Use the links below to continue.
        </p>
        <div className="mt-4 flex justify-center gap-2">
          <Button variant="outline" leftIcon={<ArrowLeft className="h-3.5 w-3.5" />} onClick={() => navigate(-1)}>
            Go back
          </Button>
          <Button variant="primary" onClick={() => navigate('/')}>
            Dashboard
          </Button>
        </div>
        <div className="mt-6 flex flex-wrap justify-center gap-1.5">
          {navGroups.flatMap((g) => g.items).slice(0, 8).map((i) => (
            <button
              key={i.to}
              onClick={() => navigate(i.to)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-[12px] font-medium text-slate-600 transition-colors hover:border-slate-300 hover:text-navy-900"
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
