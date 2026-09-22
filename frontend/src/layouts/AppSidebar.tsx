import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ComponentType } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Drawer, Layout, Menu } from 'antd';
import type { MenuProps } from 'antd';
import {
  ApiOutlined,
  CloseOutlined,
  CloudServerOutlined,
  ClusterOutlined,
  CodeOutlined,
  DashboardOutlined,
  DatabaseOutlined,
  ExportOutlined,
  GithubOutlined,
  GlobalOutlined,
  HeartOutlined,
  ImportOutlined,
  LogoutOutlined,
  MailOutlined,
  MenuOutlined,
  MessageOutlined,
  MoonFilled,
  MoonOutlined,
  ReadOutlined,
  SafetyOutlined,
  SettingOutlined,
  SunOutlined,
  SwapOutlined,
  TagsOutlined,
  TeamOutlined,
  ToolOutlined,
} from '@ant-design/icons';

import { HttpUtil, TimeFormatter } from '@/utils';
import { formatPanelVersion } from '@/lib/panel-version';
import { pauseAnimationsUntilLeave, useTheme } from '@/hooks/useTheme';
import { useAllSettings } from '@/api/queries/useAllSettings';
import { useStatusQuery } from '@/api/queries/useStatusQuery';
import logoImg from '@/assets/logo.png';
import './AppSidebar.css';

const SIDEBAR_COLLAPSED_KEY = 'isSidebarCollapsed';
const DONATE_URL = 'https://github.com/yrkas1488-ship-it/samarka-panel';
const DOCS_URL = 'https://github.com/yrkas1488-ship-it/samarka-panel#readme';
const REPO_URL = 'https://github.com/yrkas1488-ship-it/samarka-panel';
const LOGOUT_KEY = '__logout__';

type IconName = 'dashboard' | 'inbound' | 'team' | 'groups' | 'setting' | 'tool' | 'cluster' | 'hosts' | 'logout' | 'apidocs' | 'outbound' | 'routing';

const iconByName: Record<IconName, ComponentType> = {
  dashboard: DashboardOutlined,
  inbound: ImportOutlined,
  team: TeamOutlined,
  groups: TagsOutlined,
  setting: SettingOutlined,
  tool: ToolOutlined,
  cluster: ClusterOutlined,
  hosts: GlobalOutlined,
  logout: LogoutOutlined,
  apidocs: ApiOutlined,
  outbound: ExportOutlined,
  routing: SwapOutlined,
};

function readCollapsed(): boolean {
  try {
    return JSON.parse(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) || 'false');
  } catch {
    return false;
  }
}

function DonateButton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <a
      href={DONATE_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="sidebar-donate"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <HeartOutlined />
    </a>
  );
}

function DocsButton({ ariaLabel }: { ariaLabel: string }) {
  return (
    <a
      href={DOCS_URL}
      target="_blank"
      rel="noopener noreferrer"
      className="sidebar-docs"
      aria-label={ariaLabel}
      title={ariaLabel}
    >
      <ReadOutlined />
    </a>
  );
}

function VersionBadge({ version, collapsed }: { version: string; collapsed?: boolean }) {
  if (!version) return null;
  const label = formatPanelVersion(version);
  return (
    <a
      href={REPO_URL}
      target="_blank"
      rel="noopener noreferrer"
      className={`sider-version${collapsed ? ' is-collapsed' : ''}`}
      aria-label={`GitHub ${label}`}
      title={label}
    >
      <GithubOutlined />
      {!collapsed && <span className="sider-version-text">{label}</span>}
    </a>
  );
}

function ThemeCycleButton({ id, isDark, isUltra, onCycle, ariaLabel }: {
  id: string;
  isDark: boolean;
  isUltra: boolean;
  onCycle: () => void;
  ariaLabel: string;
}) {
  const icon = !isDark ? <SunOutlined /> : !isUltra ? <MoonOutlined /> : <MoonFilled />;
  return (
    <button
      id={id}
      type="button"
      className="sidebar-theme-cycle"
      aria-label={ariaLabel}
      title={ariaLabel}
      onClick={onCycle}
    >
      {icon}
    </button>
  );
}

function UptimeWidget({ collapsed }: { collapsed?: boolean }) {
  const { status } = useStatusQuery();
  const uptimeSeconds = status?.uptime ?? 0;
  const uptimeStr = uptimeSeconds > 0
    ? (typeof TimeFormatter.formatSecond === 'function'
        ? TimeFormatter.formatSecond(uptimeSeconds)
        : `${Math.floor(uptimeSeconds / 86400)}d ${Math.floor((uptimeSeconds % 86400) / 3600)}h`)
    : 'Active';

  if (collapsed) {
    return (
      <div className="sider-uptime-box is-collapsed" title={`UPTIME: ${uptimeStr}\nSystem Normal`}>
        <span className="online-dot" />
      </div>
    );
  }

  return (
    <div className="sider-uptime-box">
      <div className="sider-uptime-text">UPTIME: {uptimeStr}</div>
      <div className="sider-uptime-status">
        <span className="online-dot" />
        <span>System Normal</span>
      </div>
    </div>
  );
}

export default function AppSidebar() {
  const { t } = useTranslation();
  const { isDark, isUltra, toggleTheme, toggleUltra } = useTheme();
  const navigate = useNavigate();
  const { pathname, hash } = useLocation();
  const { allSetting } = useAllSettings();
  const showSubFormats = !!(allSetting.subJsonEnable || allSetting.subClashEnable);

  const [collapsed, setCollapsed] = useState<boolean>(() => readCollapsed());
  const [drawerOpen, setDrawerOpen] = useState(false);

  const currentTheme: 'light' | 'dark' = isDark ? 'dark' : 'light';
  const panelVersion = window.X_UI_CUR_VER || '';

  const tabs = useMemo<{ key: string; icon: IconName; title: string }[]>(() => [
    { key: '/', icon: 'dashboard', title: t('menu.dashboard') },
    { key: '/inbounds', icon: 'inbound', title: t('menu.inbounds') },
    { key: '/clients', icon: 'team', title: t('menu.clients') },
    { key: '/outbound', icon: 'outbound', title: t('menu.outbounds') },
    { key: '/routing', icon: 'routing', title: t('menu.routing') },
    { key: '/settings', icon: 'setting', title: t('menu.settings') },
    { key: LOGOUT_KEY, icon: 'logout', title: t('logout') },
  ], [t]);

  const navItems = useMemo(() => tabs.filter((tab) => tab.icon !== 'logout'), [tabs]);
  const utilItems = useMemo(() => tabs.filter((tab) => tab.icon === 'logout'), [tabs]);

  const settingsChildren = useMemo<NonNullable<MenuProps['items']>>(() => {
    const children: NonNullable<MenuProps['items']> = [
      { key: '/settings#general', icon: <SettingOutlined />, label: t('pages.settings.panelSettings') },
      { key: '/settings#domain', icon: <GlobalOutlined />, label: '🌐 Привязка домена к панели' },
      { key: '/settings#security', icon: <SafetyOutlined />, label: t('pages.settings.securitySettings') },
      { key: '/groups', icon: <TagsOutlined />, label: t('menu.groups') },
      { key: '/nodes', icon: <ClusterOutlined />, label: t('menu.nodes') },
      { key: '/hosts', icon: <GlobalOutlined />, label: t('menu.hosts') },
      { key: '/xray', icon: <ToolOutlined />, label: t('menu.xray') },
      { key: '/api-docs', icon: <ApiOutlined />, label: t('menu.apiDocs') },
      { key: '/settings#telegram', icon: <MessageOutlined />, label: t('pages.settings.TGBotSettings') },
      { key: '/settings#email', icon: <MailOutlined />, label: t('pages.settings.emailSettings') },
      { key: '/settings#subscription', icon: <CloudServerOutlined />, label: t('pages.settings.subSettings') },
    ];
    if (showSubFormats) {
      children.push({ key: '/settings#subscription-formats', icon: <CodeOutlined />, label: 'Sub Formats' });
    }
    return children;
  }, [t, showSubFormats]);

  const settingsActive = pathname === '/settings' || ['/groups', '/nodes', '/hosts', '/xray', '/api-docs'].includes(pathname);
  const selectedKey = settingsActive
    ? pathname === '/settings'
      ? `/settings${hash || '#general'}`
      : pathname
    : (pathname === '' ? '/' : pathname);

  const openSubmenu = settingsActive ? '/settings' : null;
  const [openKeys, setOpenKeys] = useState<string[]>(() => (openSubmenu ? [openSubmenu] : []));
  useEffect(() => {
    if (openSubmenu) {
      setOpenKeys((keys) => (keys.includes(openSubmenu) ? keys : [...keys, openSubmenu]));
    }
  }, [openSubmenu]);

  const toMenuItems = useCallback((items: typeof tabs): MenuProps['items'] =>
    items.map((tab) => {
      const Icon = iconByName[tab.icon];
      if (tab.key === '/settings') {
        return { key: tab.key, icon: <Icon />, label: tab.title, children: settingsChildren };
      }
      return { key: tab.key, icon: <Icon />, label: tab.title };
    }),
  [settingsChildren]);

  const openLink = useCallback(async (key: string) => {
    if (key === LOGOUT_KEY) {
      await HttpUtil.post('/logout');
      window.location.href = window.X_UI_BASE_PATH || '/';
      return;
    }
    navigate(key);
  }, [navigate]);

  const onMenuClick = useCallback<NonNullable<MenuProps['onClick']>>(({ key }) => {
    openLink(String(key));
  }, [openLink]);

  const onSiderCollapse = useCallback((isCollapsed: boolean, type: 'clickTrigger' | 'responsive') => {
    if (type === 'clickTrigger') {
      localStorage.setItem(SIDEBAR_COLLAPSED_KEY, String(isCollapsed));
      setCollapsed(isCollapsed);
    }
  }, []);

  const cycleTheme = useCallback((id: string) => {
    pauseAnimationsUntilLeave(id);
    if (!isDark) {
      toggleTheme();
      if (isUltra) toggleUltra();
    } else if (!isUltra) {
      toggleUltra();
    } else {
      toggleUltra();
      toggleTheme();
    }
  }, [isDark, isUltra, toggleTheme, toggleUltra]);

  return (
    <div className="ant-sidebar">
      <Layout.Sider
        theme={currentTheme}
        width={220}
        collapsible
        collapsed={collapsed}
        breakpoint="md"
        onCollapse={onSiderCollapse}
      >
        <div className={`sider-brand${collapsed ? ' sider-brand-collapsed' : ''}`}>
          <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-avatar-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
              <img src={logoImg} alt="Samarka" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
              <span className="brand-status-dot" />
            </div>
            {!collapsed && (
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
                <span className="brand-text" style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc', letterSpacing: '0.3px' }}>
                  samarka
                </span>
                <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                  v0.0.3
                </span>
              </div>
            )}
          </div>
          {!collapsed && (
            <div className="brand-actions">
              <ThemeCycleButton
                id="theme-cycle"
                isDark={isDark}
                isUltra={isUltra}
                onCycle={() => cycleTheme('theme-cycle')}
                ariaLabel={t('menu.theme')}
              />
            </div>
          )}
        </div>
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={collapsed ? undefined : openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          className="sider-nav"
          items={toMenuItems(navItems)}
          onClick={onMenuClick}
        />
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[selectedKey]}
          className="sider-utility"
          items={toMenuItems(utilItems)}
          onClick={onMenuClick}
        />
        <UptimeWidget collapsed={collapsed} />
        <div className="sider-footer">
          <VersionBadge version={panelVersion} collapsed={collapsed} />
        </div>
      </Layout.Sider>

      <Drawer
        placement="left"
        closable={false}
        open={drawerOpen}
        rootClassName={currentTheme}
        size="min(82vw, 320px)"
        styles={{
          wrapper: { padding: 0 },
          body: { padding: 0, display: 'flex', flexDirection: 'column', height: '100%' },
          header: { display: 'none' },
        }}
        onClose={() => setDrawerOpen(false)}
      >
        <div className="drawer-header">
          <div className="brand-block" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div className="brand-avatar-wrapper" style={{ position: 'relative', display: 'inline-flex' }}>
              <img src={logoImg} alt="Samarka" style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }} />
              <span className="brand-status-dot" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.2 }}>
              <span className="drawer-brand" style={{ fontSize: 16, fontWeight: 700, color: '#f8fafc' }}>
                samarka
              </span>
              <span style={{ fontSize: 11, color: '#94a3b8', fontFamily: 'monospace' }}>
                v0.0.3
              </span>
            </div>
          </div>
          <div className="drawer-header-actions">
            <ThemeCycleButton
              id="theme-cycle-drawer"
              isDark={isDark}
              isUltra={isUltra}
              onCycle={() => cycleTheme('theme-cycle-drawer')}
              ariaLabel={t('menu.theme')}
            />
            <button
              className="drawer-close"
              type="button"
              aria-label={t('close')}
              onClick={() => setDrawerOpen(false)}
            >
              <CloseOutlined />
            </button>
          </div>
        </div>
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[selectedKey]}
          openKeys={openKeys}
          onOpenChange={(keys) => setOpenKeys(keys as string[])}
          className="drawer-menu drawer-nav"
          items={toMenuItems(navItems)}
          onClick={(info) => { onMenuClick(info); setDrawerOpen(false); }}
        />
        <Menu
          theme={currentTheme}
          mode="inline"
          selectedKeys={[selectedKey]}
          className="drawer-menu drawer-utility"
          items={toMenuItems(utilItems)}
          onClick={(info) => { onMenuClick(info); setDrawerOpen(false); }}
        />
        <UptimeWidget />
        <div className="drawer-footer">
          <VersionBadge version={panelVersion} />
        </div>
      </Drawer>

      {!drawerOpen && (
        <button
          className="drawer-handle"
          type="button"
          aria-label={t('menu.openMenu')}
          onClick={() => setDrawerOpen(true)}
        >
          <MenuOutlined />
        </button>
      )}
    </div>
  );
}
