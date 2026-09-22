import { useState, useEffect } from 'react';
import { Modal, Typography, Card, Input, Button, Space, Alert, Tabs, Tag, Table, Spin, message } from 'antd';
import {
  CrownOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  CloudServerOutlined,
  SafetyCertificateOutlined,
  NodeIndexOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  ReloadOutlined,
} from '@ant-design/icons';
import { HttpUtil } from '@/utils';
import { useNodesQuery } from '@/api/queries/useNodesQuery';
import { useNodeMutations } from '@/api/queries/useNodeMutations';

const { Text, Paragraph } = Typography;

interface SuperMasterModalProps {
  open: boolean;
  onClose: () => void;
  onAddSubordinate?: (link: string) => void;
}

export default function SuperMasterModal({ open, onClose, onAddSubordinate }: SuperMasterModalProps) {
  const [subordinateLink, setSubordinateLink] = useState('');
  const [clusterToken, setClusterToken] = useState('');
  const [copied, setCopied] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [testStatus, setTestStatus] = useState<string | null>(null);

  const { nodes, loading: loadingNodes, refetch } = useNodesQuery();
  const { create, testConnection } = useNodeMutations();

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

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    message.success('Скопировано в буфер обмена!');
    setTimeout(() => setCopied(null), 2000);
  };

  const currentHost = window.location.hostname;
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '2053');
  const basePath = window.X_UI_BASE_PATH || '/';
  const scheme = window.location.protocol.replace(':', '');
  const masterJoinLink = `samarka://join?address=${currentHost}&port=${currentPort}&basePath=${basePath}&scheme=${scheme}${clusterToken ? `&token=${clusterToken}` : ''}&role=master`;
  const curlCommand = `curl -Ls https://raw.githubusercontent.com/yrkas1488-ship-it/samarka-panel/main/install.sh | bash -s -- --join "${masterJoinLink}"`;

  const parseJoinLink = (trimmed: string) => {
    let parsedUrl: URL;
    if (trimmed.startsWith('samarka://')) {
      parsedUrl = new URL(trimmed.replace('samarka://join', 'https://samarka.local'));
    } else if (!trimmed.includes('://')) {
      parsedUrl = new URL(`https://${trimmed}`);
    } else {
      parsedUrl = new URL(trimmed);
    }
    const params = parsedUrl.searchParams;
    const address = params.get('address') || (parsedUrl.hostname !== 'samarka.local' ? parsedUrl.hostname : '');
    const port = Number(params.get('port') || parsedUrl.port) || 2053;
    const token = params.get('token') || params.get('apiToken') || '';
    const rawBasePath = params.get('basePath') || parsedUrl.pathname || '/';
    const linkScheme = (params.get('scheme') || (parsedUrl.protocol ? parsedUrl.protocol.replace(':', '') : 'https')) as 'http' | 'https';
    const name = params.get('name') || `Node-${address || 'Subordinate'}`;
    return {
      address,
      port,
      token,
      basePath: rawBasePath.endsWith('/') ? rawBasePath : `${rawBasePath}/`,
      scheme: linkScheme,
      name,
    };
  };

  const handleAddDirect = async () => {
    if (!subordinateLink.trim()) {
      message.error('Введите ссылку подчиненного сервера');
      return;
    }
    try {
      const parsed = parseJoinLink(subordinateLink.trim());
      if (!parsed.address) {
        message.error('Неверный формат ссылки: отсутствует IP или домен сервера');
        return;
      }
      setConnecting(true);
      setTestStatus('Проверка связи с подчиненным сервером...');

      const payload = {
        name: parsed.name,
        address: parsed.address,
        port: parsed.port,
        basePath: parsed.basePath,
        apiToken: parsed.token,
        scheme: parsed.scheme,
        enable: true,
        allowPrivateAddress: true,
        remark: 'Подчиненный сервер (Worker / Master)',
      };

      const testRes = await testConnection(payload);
      if (!testRes?.success || testRes.obj?.status !== 'online') {
        const errMsg = testRes?.obj?.error || testRes?.msg || 'Сервер не отвечает или API-токен неверен';
        message.error(`Ошибка подключения к ноде: ${errMsg}`);
        setTestStatus(`Ошибка: ${errMsg}`);
        return;
      }

      setTestStatus('Связь подтверждена! Сохранение узла...');
      const addRes = await create(payload);
      if (addRes?.success) {
        message.success(`Сервер ${parsed.name} (${parsed.address}) успешно добавлен в кластер!`);
        setSubordinateLink('');
        setTestStatus(null);
        refetch();
        if (onAddSubordinate) onAddSubordinate(subordinateLink);
      } else {
        message.error(addRes?.msg || 'Не удалось зарегистрировать сервер в кластере');
        setTestStatus(`Ошибка: ${addRes?.msg || 'Не удалось сохранить'}`);
      }
    } catch (e: any) {
      message.error('Ошибка разбора ссылки: ' + (e?.message || 'Неверная ссылка'));
      setTestStatus(null);
    } finally {
      setConnecting(false);
    }
  };

  const nodeColumns = [
    {
      title: 'Имя',
      dataIndex: 'name',
      key: 'name',
      render: (val: string, record: any) => (
        <Space>
          <CloudServerOutlined style={{ color: '#f59e0b' }} />
          <Text strong style={{ color: '#f8fafc' }}>{val}</Text>
          <Text type="secondary" style={{ fontSize: 12 }}>({record.address}:{record.port})</Text>
        </Space>
      ),
    },
    {
      title: 'Статус',
      dataIndex: 'status',
      key: 'status',
      render: (val: string) => {
        const isOnline = val === 'online';
        return (
          <Tag color={isOnline ? 'success' : 'error'} icon={isOnline ? <CheckCircleOutlined /> : <CloseCircleOutlined />}>
            {isOnline ? 'Онлайн' : 'Офлайн'}
          </Tag>
        );
      },
    },
    {
      title: 'Задержка',
      dataIndex: 'latencyMs',
      key: 'latencyMs',
      render: (val: number) => (val > 0 ? `${val} ms` : '-'),
    },
    {
      title: 'Нагрузка (CPU / RAM)',
      key: 'load',
      render: (_: any, record: any) => (
        <span style={{ fontSize: 12 }}>
          CPU: {record.cpuPct ? `${record.cpuPct.toFixed(0)}%` : '-'} | RAM: {record.memPct ? `${record.memPct.toFixed(0)}%` : '-'}
        </span>
      ),
    },
  ];

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
      width={780}
      title={
        <Space>
          <CrownOutlined style={{ color: '#f59e0b', fontSize: 20 }} />
          <span style={{ fontWeight: 700 }}>Управление кластером Samarka (Глав-Главный / Главный сервер)</span>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="super_master"
        items={[
          {
            key: 'super_master',
            label: (
              <Space>
                <CrownOutlined style={{ color: '#f59e0b' }} />
                <span>👑 Режим Глав-Главного сервера</span>
              </Space>
            ),
            children: (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message="Центральный пульт управления кластером (Super-Master)"
                  description="Глав-Главный сервер позволяет централизованно видеть, контролировать и координировать все остальные серверы в единой защищенной панели."
                  style={{ marginBottom: 16 }}
                />

                <Card size="small" title="⚡ Добавить подчиненный сервер по ссылке" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">
                      Вставьте ссылку подчиненного сервера (Master или Worker) со скопированным токеном:
                    </Text>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <Input
                        placeholder="samarka://join?address=1.2.3.4&port=2053&token=... или https://ip:port"
                        value={subordinateLink}
                        onChange={(e) => setSubordinateLink(e.target.value)}
                        onPressEnter={handleAddDirect}
                        disabled={connecting}
                      />
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={connecting}
                        onClick={handleAddDirect}
                        style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
                      >
                        Привязать к Главному
                      </Button>
                    </div>
                    {testStatus && (
                      <div style={{ fontSize: 12, color: testStatus.startsWith('Ошибка') ? '#ff4d4f' : '#f59e0b' }}>
                        {testStatus}
                      </div>
                    )}
                  </Space>
                </Card>

                <Card
                  size="small"
                  title={
                    <Space>
                      <span>Подчиненные серверы в кластере</span>
                      <Tag color="gold">{nodes.length}</Tag>
                    </Space>
                  }
                  extra={
                    <Button size="small" icon={<ReloadOutlined />} onClick={() => refetch()} loading={loadingNodes}>
                      Обновить узлы
                    </Button>
                  }
                  style={{ marginBottom: 16 }}
                >
                  <Table
                    dataSource={nodes}
                    columns={nodeColumns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 5 }}
                    locale={{ emptyText: 'Подчиненных серверов пока нет. Добавьте сервер по ссылке выше.' }}
                  />
                </Card>

                <Card size="small" title="Передать права управления другому серверу (Делегирование)">
                  <Text type="secondary">
                    Если вы хотите передать статус Глав-Главного сервера другой ноде, используйте токен делегирования:
                  </Text>
                  <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                    <Input value={`${masterJoinLink}&super_rights=grant`} readOnly />
                    <Button
                      icon={copied === 'deleg' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyText(`${masterJoinLink}&super_rights=grant`, 'deleg')}
                    >
                      {copied === 'deleg' ? 'Скопировано' : 'Копия'}
                    </Button>
                  </div>
                </Card>
              </>
            ),
          },
          {
            key: 'join_link',
            label: (
              <Space>
                <LinkOutlined />
                <span>Ссылка для Второстепенных нод</span>
              </Space>
            ),
            children: (
              <>
                <Alert
                  type="info"
                  showIcon
                  message="Подключение подчиненных серверов к этому Master"
                  description="Скопируйте эту ссылку и вставьте её на Второстепенном сервере (в веб-панели или в установщике bash). Сервер автоматически привяжется к данному Главному серверу."
                  style={{ marginBottom: 16 }}
                />

                <Card size="small" title="Ссылка для веб-панели Второстепенного сервера" style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Input value={masterJoinLink} readOnly />
                    <Button
                      icon={copied === 'link' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyText(masterJoinLink, 'link')}
                    >
                      {copied === 'link' ? 'Скопировано' : 'Копия'}
                    </Button>
                  </div>
                </Card>

                <Card size="small" title="Однострочная команда для Linux терминала">
                  <div style={{ display: 'flex', gap: 8 }}>
                    <pre style={{ background: 'rgba(128,128,128,0.08)', padding: 8, borderRadius: 4, margin: 0, fontSize: 11, flex: 1, overflowX: 'auto' }}>
                      {curlCommand}
                    </pre>
                    <Button
                      icon={copied === 'curl' ? <CheckOutlined /> : <CopyOutlined />}
                      onClick={() => copyText(curlCommand, 'curl')}
                    >
                      {copied === 'curl' ? 'Скопировано' : 'Копия'}
                    </Button>
                  </div>
                </Card>
              </>
            ),
          },
        ]}
      />
    </Modal>
  );
}
