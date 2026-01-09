import { Outlet } from 'react-router-dom';
import { Header, BottomNav, Sidebar } from '../layout';
import './AppLayout.css';

function AppLayout() {
    return (
        <div className="app-layout">
            <Sidebar />
            <Header />
            <main className="app-main">
                <Outlet />
            </main>
            <BottomNav />
        </div>
    );
}

export default AppLayout;
