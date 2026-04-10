import React, { useState } from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';

export default function MainLayout({ children, title, contentClassName }) {
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
                <main className={contentClassName ? `dash-content ${contentClassName}` : 'dash-content'}>
                    {children}
                </main>
            </div>
        </div>
    );
}
