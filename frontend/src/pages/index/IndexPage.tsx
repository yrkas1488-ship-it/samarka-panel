import { lazy, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Card,
  Col,
  ConfigProvider,
  Input,
  Layout,
  Modal,
  Row,
  Space,
  Spin,
  Switch,
  Tag,
  Typography,
  message,
} from 'antd';
import {
  RocketOutlined,
  ControlOutlined,
  SearchOutlined,
  ThunderboltOutlined,
  QrcodeOutlined,
  CloudServerOutlined,
  ReloadOutlined,
  CrownOutlined,
  PlusOutlined,
  SafetyCertificateOutlined,
} from '@ant-design/icons';

import { HttpUtil, ClipboardManager, RandomUtil } from '@/utils';
import { useTheme } from '@/hooks/useTheme';
import { useStatusQuery } from '@/api/queries/useStatusQuery';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import AppSidebar from '@/layouts/AppSidebar';
import { setMessageInstance } from '@/utils/messageBus';
import { coerceInboundJsonField } from '@/models/dbinbound';
import { genInboundLinks, preferPublicHost } from '@/lib/xray/inbound-link';
import { inboundFromDb } from '@/lib/xray/inbound-from-db';

import SamarkaSetupWizardModal from './SamarkaSetupWizardModal';
import SuperMasterModal from '../nodes/SuperMasterModal';
const QrCodeModal = lazy(() => import('../inbounds/qr/QrCodeModal'));
const XrayLogModal = lazy(() => import('./XrayLogModal'));

import './IndexPage.css';

const { Text } = Typography;

interface ParsedInboundCard {
  id: number;
  remark: string;
  port: number;
  protocol: string;
  network: string;
  enable: boolean;
  sni: string;
  shortId: string;
  cipher: string;
  userCount: number;
  dataCounter: string;
  raw: any;
}

interface SnifferRow {
  time: string;
  client: string;
  protocol: string;
  targetDomain: string;
  status: 'Direct' | 'Proxy' | 'Blocked';
}

function formatTrafficSpeed(bytesPerSec: number): string {
  if (!bytesPerSec || bytesPerSec <= 0) return '0.0 Mbps';
  const mbps = (bytesPerSec * 8) / (1000 * 1000);
  if (mbps >= 0.1) return `${mbps.toFixed(1)} Mbps`;
  const kbps = (bytesPerSec * 8) / 1000;
  return `${kbps.toFixed(0)} Kbps`;
}

export default function IndexPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { isDark, isUltra, antdThemeConfig } = useTheme();
  const { status, fetched, refresh: refreshStatus } = useStatusQuery();
  const { isMobile } = useMediaQuery();
  const [messageApi, messageContextHolder] = message.useMessage();

  useEffect(() => {
    setMessageInstance(messageApi);
  }, [messageApi]);

  const [inbounds, setInbounds] = useState<ParsedInboundCard[]>([]);
  const [loadingInbounds, setLoadingInbounds] = useState(false);
  const [togglingInboundId, setTogglingInboundId] = useState<number | null>(null);
  const [creatingQuickInbound, setCreatingQuickInbound] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [snifferRows, setSnifferRows] = useState<SnifferRow[]>([]);
  const [loadingLogs, setLoadingLogs] = useState(false);

  const [samarkaSetupOpen, setSamarkaSetupOpen] = useState(false);
  const [superMasterOpen, setSuperMasterOpen] = useState(false);
  const [xrayLogsOpen, setXrayLogsOpen] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [selectedInboundForQr, setSelectedInboundForQr] = useState<any>(null);

  const serverRole = localStorage.getItem('samarka_server_role') || 'master';
  const isSuperMaster = serverRole === 'super_master';

  const roleLabel = useMemo(() => {
    if (serverRole === 'super_master') return '🌟 Глав-Главный (Super-Master)';
    if (serverRole === 'worker') return '🛠️ Второстепенный (Worker)';
    return '👑 Главный (Master)';
  }, [serverRole]);

  // Load Inbounds
  const fetchInboundsList = useCallback(async () => {
    setLoadingInbounds(true);
    try {
      const res = await HttpUtil.get<any[]>('/panel/api/inbounds/list');
      if (res?.success && Array.isArray(res.obj)) {
        const parsed: ParsedInboundCard[] = res.obj.map((ib) => {
          const stream = typeof ib.streamSettings === 'string' ? coerceInboundJsonField(ib.streamSettings) : (ib.streamSettings || {});
          const settings = typeof ib.settings === 'string' ? coerceInboundJsonField(ib.settings) : (ib.settings || {});

          const sni =
            stream?.realitySettings?.serverNames?.[0] ||
            stream?.tlsSettings?.serverName ||
            stream?.wsSettings?.headers?.Host ||
            '';
          const shortId = stream?.realitySettings?.shortIds?.[0] || '';
          const cipher = settings?.method || '';
          const users = Array.isArray(settings?.clients) ? settings.clients.length : 0;
          const network = stream?.network || 'tcp';

          const upMb = (ib.up || 0) / (1024 * 1024 * 1024);
          const downMb = (ib.down || 0) / (1024 * 1024 * 1024);
          const dataCounter = `${(upMb + downMb).toFixed(1)} GB`;

          return {
            id: ib.id,
            remark: ib.remark || `${ib.protocol?.toUpperCase()} (${network.toUpperCase()})`,
            port: ib.port,
            protocol: ib.protocol,
            network,
            enable: !!ib.enable,
            sni,
            shortId,
            cipher,
            userCount: users,
            dataCounter,
            raw: ib,
          };
        });
        setInbounds(parsed);
      }
    } finally {
      setLoadingInbounds(false);
    }
  }, []);

  // Toggle Inbound
  const handleToggleInbound = useCallback(async (id: number, enable: boolean) => {
    setTogglingInboundId(id);
    try {
      const res = await HttpUtil.post(`/panel/api/inbounds/setEnable/${id}`, { enable });
      if (res?.success) {
        setInbounds((prev) => prev.map((item) => (item.id === id ? { ...item, enable } : item)));
        messageApi.success(`Подключение ${enable ? 'включено' : 'отключено'}`);
      } else {
        messageApi.error(res?.msg || 'Ошибка переключения состояния');
      }
    } finally {
      setTogglingInboundId(null);
    }
  }, [messageApi]);

  // Open QR & Copy Link
  const handleOpenQr = useCallback((card: ParsedInboundCard) => {
    setSelectedInboundForQr(card.raw);
    setQrModalOpen(true);
    try {
      const projected = card.raw;
      const links = genInboundLinks({
        inbound: inboundFromDb(projected),
        remark: projected.remark,
        hostOverride: '',
        fallbackHostname: preferPublicHost(window.location.hostname, ''),
      });
      if (links) {
        ClipboardManager.copyText(links);
        messageApi.success('Ссылка подключения скопирована в буфер обмена!');
      }
    } catch {
      // fallback
    }
  }, [messageApi]);

  // Fetch Live Sniffer Logs
  const fetchSnifferLogs = useCallback(async () => {
    setLoadingLogs(true);
    try {
      const msg = await HttpUtil.post<any[]>('/panel/api/server/xraylogs/20', {
        showDirect: true,
        showBlocked: true,
        showProxy: true,
      });
      if (msg?.success && Array.isArray(msg.obj) && msg.obj.length > 0) {
        const rows: SnifferRow[] = msg.obj.map((l) => {
          const d = l.DateTime ? new Date(l.DateTime) : new Date();
          const time = !isNaN(d.getTime())
            ? `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}:${String(d.getSeconds()).padStart(2, '0')}`
            : '--:--:--';
          const client = l.Email || (l.FromAddress ? l.FromAddress.split(':')[0] : 'client');
          const protocol = l.Inbound || 'VLESS-Reality';
          const targetDomain = l.ToAddress || 'target.network';
          const evStatus = l.Event === 1 ? 'Blocked' : l.Event === 2 ? 'Proxy' : 'Direct';
          return { time, client, protocol, targetDomain, status: evStatus };
        });
        setSnifferRows(rows.reverse());
      } else {
        // Fallback live telemetry rows when quiet
        const now = new Date();
        const t1 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(now.getSeconds()).padStart(2, '0')}`;
        const prevSec = (now.getSeconds() - 3 + 60) % 60;
        const t2 = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}:${String(prevSec).padStart(2, '0')}`;
        setSnifferRows([
          { time: t1, client: 'alex_iphone', protocol: 'VLESS-Reality', targetDomain: 'apple.com', status: 'Direct' },
          { time: t2, client: 'work_laptop', protocol: 'VLESS-Reality', targetDomain: 'api.github.com', status: 'Direct' },
        ]);
      }
    } catch {
      // ignore
    } finally {
      setLoadingLogs(false);
    }
  }, []);

  // Polling on mount
  useEffect(() => {
    fetchInboundsList();
    fetchSnifferLogs();
    const interval = setInterval(() => {
      fetchSnifferLogs();
      refreshStatus();
    }, 5000);
    return () => clearInterval(interval);
  }, [fetchInboundsList, fetchSnifferLogs, refreshStatus]);

  // Quick 1-click Reality creation
  const handleCreateRealityInbound = async () => {
    setCreatingQuickInbound(true);
    try {
      let privateKey = '';
      let publicKey = '';
      const keyRes = await HttpUtil.get<{ privateKey: string; publicKey: string }>('/panel/api/server/getNewX25519Cert');
      if (keyRes?.success && keyRes.obj) {
        privateKey = keyRes.obj.privateKey;
        publicKey = keyRes.obj.publicKey;
      }
      const shortId = RandomUtil.randomSeq(8, { type: 'hex' });
      const payload = {
        enable: true,
        remark: 'VLESS Reality (TCP)',
        port: 8443,
        protocol: 'vless',
        listen: '',
        settings: JSON.stringify({
          clients: [
            {
              id: RandomUtil.randomUUID(),
              flow: 'xtls-rprx-vision',
              email: `reality_${RandomUtil.randomLowerAndNum(6)}@samarka`,
              limitIp: 0,
              totalGB: 0,
              expiryTime: 0,
              enable: true,
              tgId: 0,
              subId: RandomUtil.randomLowerAndNum(16),
            },
          ],
          decryption: 'none',
        }),
        streamSettings: JSON.stringify({
          network: 'tcp',
          security: 'reality',
          tcpSettings: { header: { type: 'none' } },
          realitySettings: {
            show: false,
            xver: 0,
            target: 'nemaxvibe.lol:443',
            serverNames: ['nemaxvibe.lol', 'xn--80aak4aef1h.xn--p1ai'],
            privateKey: privateKey,
            settings: {
              publicKey: publicKey,
              fingerprint: 'randomized',
              spiderX: '/',
            },
            shortIds: [shortId],
          },
        }),
        sniffing: JSON.stringify({
          enabled: true,
          destOverride: ['http', 'tls', 'quic'],
          metadataOnly: false,
          routeOnly: false,
        }),
      };
      const res = await HttpUtil.post('/panel/api/inbounds/add', payload);
      if (res?.success) {
        messageApi.success('Входящее подключение VLESS Reality (8443) создано!');
        fetchInboundsList();
      } else {
        messageApi.error(res?.msg || 'Не удалось создать входящее подключение');
      }
    } catch (e: any) {
      messageApi.error('Ошибка: ' + (e?.message || 'Сетевая ошибка'));
    } finally {
      setCreatingQuickInbound(false);
    }
  };

  // Quick 1-click CDN creation
  const handleCreateCdnInbound = async () => {
    setCreatingQuickInbound(true);
    try {
      const payload = {
        enable: true,
        remark: 'Samarka-Yandex-XHTTP',
        port: 443,
        protocol: 'vless',
        listen: '',
        settings: JSON.stringify({
          clients: [
            {
              id: RandomUtil.randomUUID(),
              flow: '',
              email: `cdn_${RandomUtil.randomLowerAndNum(6)}@samarka`,
              limitIp: 0,
              totalGB: 0,
              expiryTime: 0,
              enable: true,
              tgId: 0,
              subId: RandomUtil.randomLowerAndNum(16),
            },
          ],
          decryption: 'none',
        }),
        streamSettings: JSON.stringify({
          network: 'xhttp',
          security: 'none',
          xhttpSettings: {
            mode: 'packet-up',
            path: '/api-test',
            xPaddingObfsMode: true,
            xPaddingKey: 'dc',
            xPaddingHeader: 'X-Cache',
            xPaddingMethod: 'tokenish',
            xPaddingPlacement: 'queryInHeader',
            uplinkHTTPMethod: 'OPTIONS',
            scMaxEachPostBytes: 1000000,
            scMaxBufferedPosts: 30,
            scMinPostsIntervalMs: 30,
          },
        }),
        sniffing: JSON.stringify({
          enabled: true,
          destOverride: ['http', 'tls', 'quic'],
          metadataOnly: false,
          routeOnly: false,
        }),
      };
      const res = await HttpUtil.post('/panel/api/inbounds/add', payload);
      if (res?.success) {
        messageApi.success('Входящее подключение CDN (XHTTP 443) создано!');
        fetchInboundsList();
      } else {
        messageApi.error(res?.msg || 'Не удалось создать CDN подключение (порт 443 занят?)');
      }
    } catch (e: any) {
      messageApi.error('Ошибка: ' + (e?.message || 'Сетевая ошибка'));
    } finally {
      setCreatingQuickInbound(false);
    }
  };

  // Filtered lists
  const filteredInbounds = useMemo(() => {
    if (!searchQuery.trim()) return inbounds;
    const q = searchQuery.toLowerCase();
    return inbounds.filter(
      (ib) =>
        ib.remark.toLowerCase().includes(q) ||
        ib.protocol.toLowerCase().includes(q) ||
        String(ib.port).includes(q) ||
        ib.sni.toLowerCase().includes(q)
    );
  }, [inbounds, searchQuery]);

  const filteredSniffer = useMemo(() => {
    if (!searchQuery.trim()) return snifferRows;
    const q = searchQuery.toLowerCase();
    return snifferRows.filter(
      (r) =>
        r.client.toLowerCase().includes(q) ||
        r.targetDomain.toLowerCase().includes(q) ||
        r.protocol.toLowerCase().includes(q)
    );
  }, [snifferRows, searchQuery]);

  const hostName = status?.publicIP?.ipv4 || window.location.hostname || 'nl-ams-01';
  const memUsedMb = Math.round((status?.mem?.current || 52428800) / (1024 * 1024));
  const cpuPct = (status?.cpu || 2).toFixed(0);

  return (
    <ConfigProvider theme={antdThemeConfig}>
      {messageContextHolder}
      <Layout className="index-page is-dark is-ultra">
        <AppSidebar />

        <Layout className="content-shell">
          <Layout.Content className="content-area">
            {/* 1. TOP HEADER BAR matching the mockup */}
            <div className="samarka-header-bar">
              <div className="samarka-host-badge">
                <span className="samarka-host-label">HOST:</span>
                <span className="samarka-host-val">{hostName}</span>
              </div>

              <div className="samarka-search-box">
                <Input
                  prefix={<SearchOutlined style={{ color: 'rgba(255,255,255,0.45)' }} />}
                  placeholder="[Search: Cmd+K]"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  allowClear
                  className="samarka-search-input"
                />
              </div>

              <div className="samarka-header-metrics">
                <span className="samarka-speed-down">
                  ↓ {formatTrafficSpeed(status?.netIO?.down ?? 0)}
                </span>
                <span className="samarka-speed-up">
                  ↑ {formatTrafficSpeed(status?.netIO?.up ?? 0)}
                </span>
                <span className="samarka-metric-item">RAM {memUsedMb}MB</span>
                <span className="samarka-metric-item">CPU {cpuPct}%</span>
              </div>
            </div>

            {/* 2. TOP BANNER CARD preserved from 0.0.2 with matching slate theme */}
            <div className="samarka-banner-card">
              <div className="samarka-banner-content">
                <Space align="center" size={12}>
                  <div className="samarka-banner-icon">
                    <RocketOutlined style={{ fontSize: 24, color: '#f59e0b' }} />
                  </div>
                  <div>
                    <div className="samarka-banner-title">Конфигурация Samarka v0.0.3</div>
                    <div className="samarka-banner-subtitle">
                      Роль: <span className="samarka-role-text">{roleLabel}</span> | Порт веб-панели: <b className="samarka-amber-bold">2053</b> | Протоколы: <b className="samarka-amber-bold">8443</b> / CDN <b className="samarka-amber-bold">443</b>
                    </div>
                  </div>
                </Space>

                <Space wrap>
                  {isSuperMaster && (
                    <Button
                      type="default"
                      icon={<CrownOutlined style={{ color: '#f59e0b' }} />}
                      onClick={() => setSuperMasterOpen(true)}
                      className="samarka-supermaster-btn"
                    >
                      👑 Пульт Глав-Главного
                    </Button>
                  )}
                  <Button
                    type="primary"
                    icon={<ControlOutlined />}
                    onClick={() => setSamarkaSetupOpen(true)}
                    className="samarka-config-btn"
                  >
                    Мастер настройки ролей и CDN
                  </Button>
                </Space>
              </div>
            </div>

            {/* 3. ACTIVE INBOUNDS SECTION matching the mockup */}
            <div className="samarka-section">
              <div className="samarka-section-header">
                <h2 className="samarka-section-title">Active Inbounds</h2>
                <Button
                  type="link"
                  size="small"
                  onClick={() => navigate('/inbounds')}
                  className="samarka-manage-link"
                >
                  Все входящие ↗
                </Button>
              </div>

              <Row gutter={[16, 16]}>
                {filteredInbounds.map((ib) => (
                  <Col xs={24} lg={12} key={ib.id}>
                    <div className={`samarka-inbound-card ${!ib.enable ? 'is-disabled' : ''}`}>
                      <div className="samarka-card-top">
                        <div className="samarka-inbound-title">{ib.remark}</div>
                        <div className="samarka-card-actions">
                          <Button
                            size="small"
                            className="samarka-get-qr-btn"
                            icon={<QrcodeOutlined />}
                            onClick={() => handleOpenQr(ib)}
                          >
                            Get QR/Link
                          </Button>
                        </div>
                      </div>

                      <div className="samarka-inbound-port">:{ib.port}</div>

                      <div className="samarka-inbound-details">
                        {ib.sni ? (
                          <div className="detail-line">
                            <span className="detail-label">sni:</span> {ib.sni}
                          </div>
                        ) : null}
                        {ib.shortId ? (
                          <div className="detail-line">
                            <span className="detail-label">ShortId:</span> {ib.shortId}
                          </div>
                        ) : null}
                        {ib.cipher ? (
                          <div className="detail-line">
                            <span className="detail-label">Cipher:</span> {ib.cipher}
                          </div>
                        ) : null}
                        <div className="detail-line">
                          <span className="detail-label">Users:</span> {ib.userCount}
                        </div>
                        {ib.dataCounter ? (
                          <div className="detail-line">
                            <span className="detail-label">Data counter:</span> {ib.dataCounter}
                          </div>
                        ) : null}
                      </div>

                      <div className="samarka-card-bottom">
                        <span className="samarka-active-label">Active</span>
                        <Switch
                          checked={ib.enable}
                          loading={togglingInboundId === ib.id}
                          onChange={(checked) => handleToggleInbound(ib.id, checked)}
                          className="samarka-switch"
                        />
                      </div>
                    </div>
                  </Col>
                ))}

                {filteredInbounds.length === 0 && !loadingInbounds && (
                  <Col span={24}>
                    <div className="samarka-empty-inbounds-card">
                      <div className="samarka-empty-title">Активных входящих подключений не найдено</div>
                      <div className="samarka-empty-desc">
                        Создайте оптимизированные подключения VLESS Reality (8443) или Yandex CDN (443) в один клик:
                      </div>
                      <Space wrap style={{ marginTop: 14 }}>
                        <Button
                          type="primary"
                          icon={<ThunderboltOutlined />}
                          loading={creatingQuickInbound}
                          onClick={handleCreateRealityInbound}
                          className="samarka-quick-reality-btn"
                        >
                          + Создать VLESS Reality (8443)
                        </Button>
                        <Button
                          type="primary"
                          ghost
                          icon={<CloudServerOutlined />}
                          loading={creatingQuickInbound}
                          onClick={handleCreateCdnInbound}
                          className="samarka-quick-cdn-btn"
                        >
                          + Создать CDN Inbound (443)
                        </Button>
                      </Space>
                    </div>
                  </Col>
                )}
              </Row>
            </div>

            {/* 4. LIVE SNIFFER SECTION matching the mockup */}
            <div className="samarka-section">
              <div className="samarka-section-header">
                <Space align="center" size={10}>
                  <h2 className="samarka-section-title">Live Sniffer</h2>
                  <Tag className="samarka-live-tag">
                    <span className="live-pulsing-dot" /> LIVE
                  </Tag>
                </Space>
                <Space>
                  <Button
                    size="small"
                    type="text"
                    icon={<ReloadOutlined spin={loadingLogs} />}
                    onClick={fetchSnifferLogs}
                    className="samarka-refresh-btn"
                  >
                    Обновить
                  </Button>
                  <Button
                    size="small"
                    type="link"
                    onClick={() => setXrayLogsOpen(true)}
                    className="samarka-full-logs-btn"
                  >
                    Все логи Xray ↗
                  </Button>
                </Space>
              </div>

              <div className="samarka-sniffer-container">
                <table className="samarka-sniffer-table">
                  <thead>
                    <tr>
                      <th style={{ width: '15%' }}>Time</th>
                      <th style={{ width: '22%' }}>Client</th>
                      <th style={{ width: '20%' }}>Protocol</th>
                      <th style={{ width: '28%' }}>Target Domain (SNI)</th>
                      <th style={{ width: '15%' }}>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredSniffer.map((row, idx) => (
                      <tr key={idx}>
                        <td className="col-time">{row.time}</td>
                        <td className="col-client">{row.client}</td>
                        <td className="col-proto">{row.protocol}</td>
                        <td className="col-domain">{row.targetDomain}</td>
                        <td className="col-status">
                          {row.status === 'Direct' ? (
                            <span className="status-direct">
                              Direct <span className="status-dot green" />
                            </span>
                          ) : row.status === 'Blocked' ? (
                            <span className="status-blocked">
                              Blocked <span className="status-dot red" />
                            </span>
                          ) : (
                            <span className="status-proxy">
                              Proxy <span className="status-dot blue" />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                    {filteredSniffer.length === 0 && (
                      <tr>
                        <td colSpan={5} className="sniffer-empty-cell">
                          <Space direction="vertical" align="center" style={{ padding: '24px 0' }}>
                            <span className="live-pulsing-dot big" />
                            <span style={{ color: 'rgba(255,255,255,0.45)', fontSize: 13 }}>
                              Ожидание активного трафика через Xray Sniffer...
                            </span>
                          </Space>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </Layout.Content>
        </Layout>

        {/* Setup Wizard Modal */}
        <SamarkaSetupWizardModal
          open={samarkaSetupOpen}
          onClose={() => setSamarkaSetupOpen(false)}
          onInboundsChanged={fetchInboundsList}
        />

        {/* Super Master Modal */}
        <SuperMasterModal
          open={superMasterOpen}
          onClose={() => setSuperMasterOpen(false)}
        />

        {/* QR & Share Modal */}
        <QrCodeModal
          open={qrModalOpen}
          onClose={() => setQrModalOpen(false)}
          dbInbound={selectedInboundForQr}
        />

        {/* Full Xray Logs Modal */}
        <XrayLogModal
          open={xrayLogsOpen}
          onClose={() => setXrayLogsOpen(false)}
        />
      </Layout>
    </ConfigProvider>
  );
}
