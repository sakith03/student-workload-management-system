import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ children, title }) {
    const [sidebarOpen, setSidebarOpen] = useState(false);

    return (
        <div className="dash-root">
            <Sidebar
                isOpen={sidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />
            <div className="dash-main">
                <Topbar
                    title={title}
                    onToggleSidebar={() => setSidebarOpen(o => !o)}
                />
                <main className="dash-content">
                    {children}
                </main>
            </div>
        </div>
    );
}
