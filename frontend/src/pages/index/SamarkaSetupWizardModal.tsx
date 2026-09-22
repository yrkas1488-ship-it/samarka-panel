import { useState, useEffect } from 'react';
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
} from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface SamarkaSetupWizardModalProps {
  open: boolean;
  onClose: () => void;
}

export default function SamarkaSetupWizardModal({ open, onClose }: SamarkaSetupWizardModalProps) {
  const [role, setRole] = useState<'master' | 'worker' | 'super_master'>(() => {
    return (localStorage.getItem('samarka_server_role') as 'master' | 'worker' | 'super_master') || 'master';
  });
  const [workerMode, setWorkerMode] = useState<'cdn' | 'double_vpn'>(() => {
    return (localStorage.getItem('samarka_worker_mode') as 'cdn' | 'double_vpn') || 'cdn';
  });
  const [masterLink, setMasterLink] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentHost = window.location.hostname;
  const currentPort = window.location.port || '2053';
  const basePath = window.X_UI_BASE_PATH || '/';
  const myJoinLink = `samarka://join?host=${currentHost}&port=${currentPort}&path=${basePath}&scheme=${window.location.protocol.replace(':', '')}`;

  const handleSave = () => {
    localStorage.setItem('samarka_server_role', role);
    localStorage.setItem('samarka_worker_mode', workerMode);
    localStorage.setItem('samarka_setup_completed', 'true');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={780}
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
        message="Настройка роли сервера и интеграции"
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
                  borderColor: role === 'master' ? '#1677ff' : undefined,
                  background: role === 'master' ? 'rgba(22, 119, 255, 0.04)' : undefined,
                  height: '100%',
                }}
              >
                <Radio value="master">
                  <Text strong>👑 Главный (Master)</Text>
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
                  borderColor: role === 'worker' ? '#1677ff' : undefined,
                  background: role === 'worker' ? 'rgba(22, 119, 255, 0.04)' : undefined,
                  height: '100%',
                }}
              >
                <Radio value="worker">
                  <Text strong>🛠️ Второстепенный</Text>
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
                  borderColor: role === 'super_master' ? '#faad14' : undefined,
                  background: role === 'super_master' ? 'rgba(250, 173, 20, 0.04)' : undefined,
                  height: '100%',
                }}
              >
                <Radio value="super_master">
                  <Text strong>🌟 Глав-Главный</Text>
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
        <Card size="small" style={{ background: 'rgba(22, 119, 255, 0.02)' }}>
          <Title level={5} style={{ margin: 0 }}>
            <Space>
              <CrownOutlined style={{ color: '#1677ff' }} />
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
            <Card size="small" style={{ marginBottom: 12, background: 'rgba(82, 196, 26, 0.02)' }}>
              <Text strong style={{ color: '#389e0d' }}>
                ✓ Предустановленные параметры для Yandex Cloud CDN:
              </Text>
              <ul style={{ paddingLeft: 18, marginTop: 6, marginBottom: 8, fontSize: 12 }}>
                <li><b>Протокол:</b> VLESS XHTTP (порт <b>443</b>)</li>
                <li><b>Обфускация Padding:</b> mode: <code>packet-up</code>, header: <code>X-Cache</code>, key: <code>dc</code>, method: <code>tokenish</code></li>
                <li><b>Метод запроса:</b> <code>OPTIONS</code> (маппинг в POST через Nginx на Origin-сервере)</li>
              </ul>
              <Space wrap>
                <Button size="small" href="https://console.yandex.cloud/" target="_blank" rel="noopener noreferrer">
                  Консоль Yandex Cloud ↗
                </Button>
                <Button size="small" href="https://cloud.vk.com/" target="_blank" rel="noopener noreferrer">
                  VK Cloud CDN ↗
                </Button>
                <Button size="small" href="https://dash.cloudflare.com/" target="_blank" rel="noopener noreferrer">
                  Cloudflare ↗
                </Button>
              </Space>
            </Card>
          )}

          <div style={{ marginTop: 12 }}>
            <Text strong>3. Вставьте ссылку от Главного сервера (если есть):</Text>
            <Input
              placeholder="samarka://join?host=...&port=2053&..."
              value={masterLink}
              onChange={(e) => setMasterLink(e.target.value)}
              style={{ marginTop: 6 }}
            />
          </div>
        </div>
      )}

      {role === 'super_master' && (
        <Card size="small" style={{ background: 'rgba(250, 173, 20, 0.02)' }}>
          <Title level={5} style={{ margin: 0, color: '#d48806' }}>
            <CrownOutlined /> Глав-Главный диспетчерский пульт
          </Title>
          <Paragraph style={{ marginTop: 8, fontSize: 13 }}>
            Этот сервер выступает мастер-оркестратором. Вы можете подключать Главные серверы и передавать права управления во вкладке <b>«Узлы»</b>.
          </Paragraph>
          <Button type="dashed" icon={<BranchesOutlined />} onClick={() => { onClose(); window.location.href = '#/nodes'; }}>
            Перейти к управлению узлами кластера
          </Button>
        </Card>
      )}
    </Modal>
  );
}
