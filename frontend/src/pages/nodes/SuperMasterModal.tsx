import { useState } from 'react';
import { Modal, Typography, Card, Input, Button, Space, Alert, Tabs, Divider } from 'antd';
import { CrownOutlined, LinkOutlined, CopyOutlined, CheckOutlined, SafetyCertificateOutlined, NodeIndexOutlined } from '@ant-design/icons';

const { Title, Text, Paragraph } = Typography;

interface SuperMasterModalProps {
  open: boolean;
  onClose: () => void;
  onAddSubordinate?: (link: string) => void;
}

export default function SuperMasterModal({ open, onClose, onAddSubordinate }: SuperMasterModalProps) {
  const [subordinateLink, setSubordinateLink] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const currentHost = window.location.hostname;
  const currentPort = window.location.port || (window.location.protocol === 'https:' ? '443' : '80');
  const basePath = window.X_UI_BASE_PATH || '/';
  const masterJoinLink = `samarka://join?address=${currentHost}&port=${currentPort}&basePath=${basePath}&scheme=${window.location.protocol.replace(':', '')}`;
  const curlCommand = `curl -Ls https://raw.githubusercontent.com/yrkas1488-ship-it/samarka-panel/main/install.sh | bash -s -- --join "${masterJoinLink}"`;

  const handleAdd = () => {
    if (onAddSubordinate && subordinateLink.trim()) {
      onAddSubordinate(subordinateLink.trim());
      setSubordinateLink('');
      onClose();
    }
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" onClick={onClose}>
          Закрыть
        </Button>,
      ]}
      width={720}
      title={
        <Space>
          <CrownOutlined style={{ color: '#faad14' }} />
          <span>Управление кластером Samarka (Глав-Главный / Главный сервер)</span>
        </Space>
      }
    >
      <Tabs
        defaultActiveKey="join_link"
        items={[
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
                  message="Подключение Второстепенных серверов"
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
          {
            key: 'super_master',
            label: (
              <Space>
                <CrownOutlined style={{ color: '#faad14' }} />
                <span>👑 Режим Глав-Главного сервера</span>
              </Space>
            ),
            children: (
              <>
                <Alert
                  type="warning"
                  showIcon
                  message="Пульт управления всеми серверами"
                  description="Глав-Главный сервер позволяет централизованно видеть и контролировать все остальные сервера (Главные и Второстепенные), передавать права и объединять кластеры."
                  style={{ marginBottom: 16 }}
                />

                <Card size="small" title="Добавить подчиненный сервер по ссылке" style={{ marginBottom: 16 }}>
                  <Space direction="vertical" style={{ width: '100%' }}>
                    <Text type="secondary">Вставьте ссылку подчиненного сервера (Master или Worker) для добавления его в этот пульт:</Text>
                    <Input.Search
                      placeholder="Вставьте ссылку подчиненного сервера (samarka://join?...)"
                      value={subordinateLink}
                      onChange={(e) => setSubordinateLink(e.target.value)}
                      enterButton="Привязать к Главному"
                      onSearch={handleAdd}
                    />
                  </Space>
                </Card>

                <Card size="small" title="Передать права управления другому серверу">
                  <Text type="secondary">
                    Если вы хотите передать статус Глав-Главного сервера другой ноде, скопируйте токен делегирования:
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
        ]}
      />
    </Modal>
  );
}
