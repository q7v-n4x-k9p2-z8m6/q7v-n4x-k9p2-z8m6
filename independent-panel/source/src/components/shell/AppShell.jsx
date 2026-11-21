import React from 'react';
import { Outlet } from 'react-router-dom';
import SideNav from '@/components/shell/SideNav';
import TopBar from '@/components/shell/TopBar';
import MobileTabs from '@/components/shell/MobileTabs';

export default function AppShell() {
  return (
    <div className="min-h-screen bg-background">
      <SideNav />
      <div className="flex min-h-screen flex-col lg:pr-64">
        <TopBar />
        <main className="mx-auto w-full max-w-[1400px] flex-1 px-3 pb-24 pt-4 sm:px-5 lg:pb-8 lg:pt-6">
          <Outlet />
        </main>
      </div>
      <MobileTabs />
    </div>
  );
}