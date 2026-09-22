import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Modal,
  Radio,
  Typography,
  Space,
  Button,
  Card,
  Input,
  Alert,
  Divider,
  Tag,
  Row,
  Col,
  message,
} from 'antd';
import {
  CrownOutlined,
  CloudServerOutlined,
  ApiOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  RocketOutlined,
  GlobalOutlined,
  BranchesOutlined,
  ThunderboltOutlined,
  CodeOutlined,
} from '@ant-design/icons';
import { HttpUtil, RandomUtil } from '@/utils';
import SuperMasterModal from '../nodes/SuperMasterModal';

const { Title, Text, Paragraph } = Typography;

interface SamarkaSetupWizardModalProps {
  open: boolean;
  onClose: () => void;
  onInboundsChanged?: () => void;
}

export default function SamarkaSetupWizardModal({ open, onClose, onInboundsChanged }: SamarkaSetupWizardModalProps) {
  const navigate = useNavigate();
  const [role, setRole] = useState<'master' | 'worker' | 'super_master'>(() => {
    return (localStorage.getItem('samarka_server_role') as 'master' | 'worker' | 'super_master') || 'master';
  });
  const [workerMode, setWorkerMode] = useState<'cdn' | 'double_vpn'>(() => {
    return (localStorage.getItem('samarka_worker_mode') as 'cdn' | 'double_vpn') || 'cdn';
  });
  const [masterLink, setMasterLink] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [clusterToken, setClusterToken] = useState('');
  const [creatingCdn, setCreatingCdn] = useState(false);
  const [connectingWorker, setConnectingWorker] = useState(false);
  const [superMasterModalOpen, setSuperMasterModalOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    HttpUtil.get<{ id: number; token: string; name: string }[]>('/panel/api/setting/apiTokens').then(async (res) => {
      if (res?.success && Array.isArray(res.obj) && res.obj.length > 0) {
        const found = res.obj.find((t) => t.token) || res.obj[0];
        if (found?.token) {
          setClusterToken(found.token);
          return;
        }
      }
      const created = await HttpUtil.post<{ id: number; token: string }>('/panel/api/setting/apiTokens/create', {
        name: 'Samarka-Cluster',
      });
      if (created?.success && created.obj?.token) {
        setClusterToken(created.obj.token);
      }
    });
  }, [open]);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    message.success('Скопировано в буфер обмена!');
    setTimeout(() => setCopied(null), 2000);
  };

  const currentHost = window.location.hostname;
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '2053');
  const basePath = window.X_UI_BASE_PATH || '/';
  const scheme = window.location.protocol.replace(':', '');
  const myJoinLink = `samarka://join?address=${currentHost}&port=${currentPort}&basePath=${basePath}&scheme=${scheme}${clusterToken ? `&token=${clusterToken}` : ''}&role=${role}`;

  const handleSave = () => {
    localStorage.setItem('samarka_server_role', role);
    localStorage.setItem('samarka_worker_mode', workerMode);
    localStorage.setItem('samarka_setup_completed', 'true');
    message.success('Настройки роли Samarka успешно сохранены');
    onClose();
  };

  const handleCreateCdnInbound = async () => {
    setCreatingCdn(true);
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
        message.success('Входящее подключение CDN (XHTTP, порт 443) успешно создано в панели!');
        if (onInboundsChanged) onInboundsChanged();
      } else {
        message.error(res?.msg || 'Не удалось создать CDN подключение (возможно порт 443 уже занят)');
      }
    } catch (e: any) {
      message.error('Ошибка создания CDN: ' + (e?.message || 'Сетевая ошибка'));
    } finally {
      setCreatingCdn(false);
    }
  };

  const handleConnectToMaster = async () => {
    if (!masterLink.trim()) {
      message.error('Вставьте ссылку от Главного сервера');
      return;
    }
    setConnectingWorker(true);
    try {
      let parsedUrl: URL;
      const trimmed = masterLink.trim();
      if (trimmed.startsWith('samarka://')) {
        parsedUrl = new URL(trimmed.replace('samarka://join', 'https://samarka.local'));
      } else if (!trimmed.includes('://')) {
        parsedUrl = new URL(`https://${trimmed}`);
      } else {
        parsedUrl = new URL(trimmed);
      }
      const params = parsedUrl.searchParams;
      const addr = params.get('address') || (parsedUrl.hostname !== 'samarka.local' ? parsedUrl.hostname : '');
      const port = Number(params.get('port') || parsedUrl.port) || 2053;
      const token = params.get('token') || params.get('apiToken') || '';
      const bPath = params.get('basePath') || parsedUrl.pathname || '/';
      const sScheme = (params.get('scheme') || (parsedUrl.protocol ? parsedUrl.protocol.replace(':', '') : 'https')) as 'http' | 'https';

      if (!addr) {
        message.error('Не удалось определить адрес Главного сервера из ссылки');
        return;
      }

      const testRes = await HttpUtil.post('/panel/api/nodes/test', {
        name: `Master-${addr}`,
        address: addr,
        port,
        basePath: bPath.endsWith('/') ? bPath : `${bPath}/`,
        apiToken: token,
        scheme: sScheme,
      });

      if (testRes?.success) {
        message.success(`Связь с Главным сервером ${addr}:${port} успешно установлена!`);
        localStorage.setItem('samarka_master_connected', 'true');
        localStorage.setItem('samarka_master_addr', addr);
      } else {
        message.warning(`Сервер ответил с предупреждением: ${testRes?.msg || 'Проверьте доступность порта и токена'}`);
      }
    } catch (e: any) {
      message.error('Ошибка обработки ссылки: ' + (e?.message || 'Неверная ссылка'));
    } finally {
      setConnectingWorker(false);
    }
  };

  const nginxSnippet = `map $request_method $xhttp_proxy_method {
    default  $request_method;
    OPTIONS  POST;
}

server {
    listen 443 ssl http2;
    server_name origin.yourdomain.com;
    
    # SSL certs...
    client_max_body_size 0;
    http2_max_field_size 128k;
    http2_max_header_size 128k;

    location /api-test {
        proxy_pass http://127.0.0.1:443;
        proxy_method $xhttp_proxy_method;
        proxy_http_version 1.1;
        proxy_set_header Connection "";
        proxy_set_header Host $host;
        proxy_buffering off;
        proxy_request_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }
}`;

  return (
    <>
      <Modal
        open={open}
        onCancel={onClose}
        width={800}
        title={
          <Space>
            <RocketOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
            <span style={{ fontSize: 18, fontWeight: 700 }}>Мастер настройки Samarka v0.0.3</span>
            <Tag color="gold">Веб-конфигуратор</Tag>
          </Space>
        }
        footer={[
          <Button key="cancel" onClick={onClose}>
            Закрыть
          </Button>,
          <Button
            key="save"
            type="primary"
            icon={<CheckOutlined />}
            onClick={handleSave}
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
          >
            Сохранить настройки роли
          </Button>,
        ]}
      >
        <Alert
          type="info"
          showIcon
          message="Настройка роли сервера и CDN архитектуры"
          description="Выберите назначение этого сервера в вашей сети. Все порты и протоколы преднастроены: порт панели 2053, прямые подключения 8443, CDN-подключения строго 443."
          style={{ marginBottom: 16 }}
        />

        <div style={{ marginBottom: 20 }}>
          <Text strong style={{ fontSize: 15, display: 'block', marginBottom: 10 }}>
            1. Какую роль выполняет данный сервер?
          </Text>
          <Radio.Group
            value={role}
            onChange={(e) => setRole(e.target.value)}
            style={{ width: '100%' }}
          >
            <Row gutter={[12, 12]}>
              <Col span={8}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setRole('master')}
                  style={{
                    borderColor: role === 'master' ? '#f59e0b' : undefined,
                    background: role === 'master' ? 'rgba(245, 158, 11, 0.08)' : undefined,
                    height: '100%',
                  }}
                >
                  <Radio value="master">
                    <Text strong style={{ color: '#f8fafc' }}>👑 Главный (Master)</Text>
                  </Radio>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                    Управляет пользователями, выдает ключи, генерирует ссылку для подчиненных серверов.
                  </Paragraph>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setRole('worker')}
                  style={{
                    borderColor: role === 'worker' ? '#f59e0b' : undefined,
                    background: role === 'worker' ? 'rgba(245, 158, 11, 0.08)' : undefined,
                    height: '100%',
                  }}
                >
                  <Radio value="worker">
                    <Text strong style={{ color: '#f8fafc' }}>🛠️ Второстепенный</Text>
                  </Radio>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                    Подчиненный узел: работает через CDN (Origin) или как выход Двойного VPN.
                  </Paragraph>
                </Card>
              </Col>
              <Col span={8}>
                <Card
                  hoverable
                  size="small"
                  onClick={() => setRole('super_master')}
                  style={{
                    borderColor: role === 'super_master' ? '#f59e0b' : undefined,
                    background: role === 'super_master' ? 'rgba(245, 158, 11, 0.08)' : undefined,
                    height: '100%',
                  }}
                >
                  <Radio value="super_master">
                    <Text strong style={{ color: '#f8fafc' }}>🌟 Глав-Главный</Text>
                  </Radio>
                  <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 8, marginBottom: 0 }}>
                    Центральный пульт управления: объединяет несколько Главных серверов в одну сеть.
                  </Paragraph>
                </Card>
              </Col>
            </Row>
          </Radio.Group>
        </div>

        <Divider style={{ margin: '16px 0' }} />

        {role === 'master' && (
          <Card size="small" style={{ background: 'rgba(245, 158, 11, 0.03)', borderColor: 'rgba(245, 158, 11, 0.2)' }}>
            <Title level={5} style={{ margin: 0, color: '#f59e0b' }}>
              <Space>
                <CrownOutlined />
                <span>Параметры Главного сервера (Master)</span>
              </Space>
            </Title>
            <Paragraph style={{ marginTop: 8, fontSize: 13 }}>
              Скопируйте эту ссылку и вставьте её во Второстепенный сервер для объединения в кластер:
            </Paragraph>
            <div style={{ display: 'flex', gap: 8 }}>
              <Input value={myJoinLink} readOnly />
              <Button
                icon={copied === 'myJoin' ? <CheckOutlined /> : <CopyOutlined />}
                onClick={() => copyToClipboard(myJoinLink, 'myJoin')}
              >
                {copied === 'myJoin' ? 'Скопировано!' : 'Копия ссылки'}
              </Button>
            </div>
            <div style={{ marginTop: 12 }}>
              <Text type="secondary" style={{ fontSize: 12 }}>
                💡 Дефолтные порты: панель доступна по <b>2053</b>, прямые подключения Reality gRPC / TCP настраиваются на <b>8443</b> с масками <code>максвайб.рф</code> и <code>nemaxvibe.lol</code>.
              </Text>
            </div>
          </Card>
        )}

        {role === 'worker' && (
          <div>
            <Text strong style={{ fontSize: 14, display: 'block', marginBottom: 8 }}>
              2. Выберите способ работы Второстепенного сервера:
            </Text>
            <Radio.Group
              value={workerMode}
              onChange={(e) => setWorkerMode(e.target.value)}
              style={{ width: '100%', marginBottom: 16 }}
            >
              <Row gutter={[12, 12]}>
                <Col span={12}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => setWorkerMode('cdn')}
                    style={{
                      borderColor: workerMode === 'cdn' ? '#52c41a' : undefined,
                      background: workerMode === 'cdn' ? 'rgba(82, 196, 26, 0.04)' : undefined,
                    }}
                  >
                    <Radio value="cdn">
                      <Text strong>☁️ Способ через CDN (Origin)</Text>
                    </Radio>
                    <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                      Трафик идет через белые списки российских CDN (Яндекс Cloud, VK Cloud, Selectel) или Cloudflare. Порт строго <b>443</b>.
                    </Paragraph>
                  </Card>
                </Col>
                <Col span={12}>
                  <Card
                    hoverable
                    size="small"
                    onClick={() => setWorkerMode('double_vpn')}
                    style={{
                      borderColor: workerMode === 'double_vpn' ? '#722ed1' : undefined,
                      background: workerMode === 'double_vpn' ? 'rgba(114, 46, 209, 0.04)' : undefined,
                    }}
                  >
                    <Radio value="double_vpn">
                      <Text strong>🛡️ Способ Двойного VPN (Relay/Exit)</Text>
                    </Radio>
                    <Paragraph type="secondary" style={{ fontSize: 12, marginTop: 6, marginBottom: 0 }}>
                      Двухуровневая цепочка: первый сервер принимает подключение, а этот сервер выпускает трафик в свободный интернет.
                    </Paragraph>
                  </Card>
                </Col>
              </Row>
            </Radio.Group>

            {workerMode === 'cdn' && (
              <Card size="small" style={{ marginBottom: 16, background: 'rgba(82, 196, 26, 0.04)', borderColor: 'rgba(82, 196, 26, 0.3)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8, marginBottom: 8 }}>
                  <Text strong style={{ color: '#52c41a', fontSize: 14 }}>
                    ⚡ Авто-конфигурация CDN входящего подключения
                  </Text>
                  <Button
                    type="primary"
                    icon={<ThunderboltOutlined />}
                    loading={creatingCdn}
                    onClick={handleCreateCdnInbound}
                    style={{ background: '#52c41a', borderColor: '#52c41a' }}
                  >
                    Создать CDN Inbound (порт 443)
                  </Button>
                </div>
                <ul style={{ paddingLeft: 18, margin: 0, fontSize: 12 }}>
                  <li><b>Протокол:</b> VLESS XHTTP (порт <b>443</b>)</li>
                  <li><b>Обфускация Padding:</b> mode: <code>packet-up</code>, header: <code>X-Cache</code>, key: <code>dc</code>, method: <code>tokenish</code></li>
                  <li><b>Метод запроса:</b> <code>OPTIONS</code> (маппинг в POST через Nginx на Origin-сервере)</li>
                </ul>

                <Divider style={{ margin: '10px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <Text strong style={{ fontSize: 12 }}>Шаблон Nginx для Origin-сервера:</Text>
                  <Button size="small" icon={<CopyOutlined />} onClick={() => copyToClipboard(nginxSnippet, 'nginx')}>
                    Копировать Nginx
                  </Button>
                </div>
                <pre style={{ background: 'rgba(0,0,0,0.3)', padding: 8, borderRadius: 6, fontSize: 11, margin: 0, maxHeight: 110, overflowY: 'auto' }}>
                  {nginxSnippet}
                </pre>
              </Card>
            )}

            <div style={{ marginTop: 12 }}>
              <Text strong>3. Вставьте ссылку от Главного сервера для привязки:</Text>
              <div style={{ display: 'flex', gap: 8, marginTop: 6 }}>
                <Input
                  placeholder="samarka://join?address=...&port=2053&token=..."
                  value={masterLink}
                  onChange={(e) => setMasterLink(e.target.value)}
                />
                <Button
                  type="primary"
                  loading={connectingWorker}
                  onClick={handleConnectToMaster}
                  style={{ background: '#1677ff' }}
                >
                  Привязать к Master
                </Button>
              </div>
            </div>
          </div>
        )}

        {role === 'super_master' && (
          <Card size="small" style={{ background: 'rgba(245, 158, 11, 0.04)', borderColor: 'rgba(245, 158, 11, 0.3)' }}>
            <Title level={5} style={{ margin: 0, color: '#f59e0b' }}>
              <CrownOutlined /> Глав-Главный диспетчерский пульт (Super-Master)
            </Title>
            <Paragraph style={{ marginTop: 8, fontSize: 13 }}>
              Этот сервер выступает центральным мастер-оркестратором вашей сети. Вы можете подключать подчиненные серверы, делегировать права и мониторить всю распределенную инфраструктуру:
            </Paragraph>
            <Space wrap>
              <Button
                type="primary"
                icon={<CrownOutlined />}
                onClick={() => setSuperMasterModalOpen(true)}
                style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
              >
                Открыть пульт управления кластером
              </Button>
              <Button
                type="default"
                icon={<BranchesOutlined />}
                onClick={() => {
                  onClose();
                  navigate('/nodes');
                }}
              >
                Перейти во вкладку «Узлы»
              </Button>
            </Space>
          </Card>
        )}
      </Modal>

      <SuperMasterModal
        open={superMasterModalOpen}
        onClose={() => setSuperMasterModalOpen(false)}
      />
    </>
  );
}
