import { lazy, Suspense } from 'react';
import { createBrowserRouter, useRouteError, type RouteObject } from 'react-router-dom';
import { Button, Result } from 'antd';

import PanelLayout from '@/layouts/PanelLayout';

const IndexPage = lazy(() => import('@/pages/index/IndexPage'));
const InboundsPage = lazy(() => import('@/pages/inbounds/InboundsPage'));
const ClientsPage = lazy(() => import('@/pages/clients/ClientsPage'));
const GroupsPage = lazy(() => import('@/pages/groups/GroupsPage'));
const NodesPage = lazy(() => import('@/pages/nodes/NodesPage'));
const HostsPage = lazy(() => import('@/pages/hosts/HostsPage'));
const SettingsPage = lazy(() => import('@/pages/settings/SettingsPage'));
const XrayPage = lazy(() => import('@/pages/xray/XrayPage'));
const ApiDocsPage = lazy(() => import('@/pages/api-docs/ApiDocsPage'));

function withSuspense(node: React.ReactNode) {
  return <Suspense fallback={null}>{node}</Suspense>;
}

function RouteErrorBoundary() {
  const error = useRouteError() as { message?: string; statusText?: string } | null;
  return (
    <div style={{ display: 'flex', minHeight: '80vh', alignItems: 'center', justifyContent: 'center' }}>
      <Result
        status="warning"
        title="Панель Самарка: Произошла ошибка интерфейса"
        subTitle={error?.message || error?.statusText || 'Непредвиденная ошибка отображения'}
        extra={[
          <Button
            key="refresh"
            type="primary"
            onClick={() => window.location.reload()}
            style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
          >
            Перезагрузить страницу
          </Button>,
          <Button
            key="dashboard"
            onClick={() => {
              const base = (typeof window !== 'undefined' && window.X_UI_BASE_PATH) || '/';
              window.location.href = `${base.replace(/\/+$/, '')}/panel/`;
            }}
          >
            На главную
          </Button>,
        ]}
      />
    </div>
  );
}

const routes: RouteObject[] = [
  {
    path: '/',
    element: <PanelLayout />,
    errorElement: <RouteErrorBoundary />,
    children: [
      { index: true, element: withSuspense(<IndexPage />) },
      { path: 'inbounds', element: withSuspense(<InboundsPage />) },
      { path: 'clients', element: withSuspense(<ClientsPage />) },
      { path: 'groups', element: withSuspense(<GroupsPage />) },
      { path: 'nodes', element: withSuspense(<NodesPage />) },
      { path: 'hosts', element: withSuspense(<HostsPage />) },
      { path: 'settings', element: withSuspense(<SettingsPage />) },
      { path: 'xray', element: withSuspense(<XrayPage />) },
      { path: 'outbound', element: withSuspense(<XrayPage />) },
      { path: 'routing', element: withSuspense(<XrayPage />) },
      { path: 'api-docs', element: withSuspense(<ApiDocsPage />) },
    ],
  },
];

function computeBasename() {
  const raw = (typeof window !== 'undefined' && window.X_UI_BASE_PATH) || '/';
  const trimmed = raw.replace(/\/+$/, '');
  return `${trimmed}/panel`;
}

export const router = createBrowserRouter(routes, {
  basename: computeBasename(),
});
