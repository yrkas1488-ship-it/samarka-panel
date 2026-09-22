import { Modal, Typography, Card, Space, Button, Alert, Divider } from 'antd';
import { CloudServerOutlined, LinkOutlined, CopyOutlined, CheckOutlined } from '@ant-design/icons';
import { useState } from 'react';

const { Title, Text, Paragraph } = Typography;

interface YandexCloudModalProps {
  open: boolean;
  onClose: () => void;
}

export default function YandexCloudModal({ open, onClose }: YandexCloudModalProps) {
  const [copiedSection, setCopiedSection] = useState<string | null>(null);

  const copyToClipboard = (text: string, section: string) => {
    navigator.clipboard.writeText(text);
    setCopiedSection(section);
    setTimeout(() => setCopiedSection(null), 2000);
  };

  const clientJsonSnippet = `{
  "mode": "packet-up",
  "scMaxEachPostBytes": 1000000,
  "scMinPostsIntervalMs": 30,
  "scMaxBufferedPosts": 30,
  "xPaddingObfsMode": true,
  "xPaddingKey": "dc",
  "xPaddingHeader": "X-Cache",
  "xPaddingMethod": "tokenish",
  "xPaddingPlacement": "queryInHeader",
  "uplinkHTTPMethod": "OPTIONS"
}`;

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
        proxy_pass http://127.0.0.1:8003;
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
    <Modal
      open={open}
      onCancel={onClose}
      footer={[
        <Button key="close" type="primary" onClick={onClose}>
          Понятно
        </Button>,
      ]}
      width={780}
      title={
        <Space>
          <CloudServerOutlined style={{ color: '#ff334b' }} />
          <span>Справка: XHTTP через Yandex Cloud CDN (Белые списки РФ)</span>
        </Space>
      }
    >
      <Alert
        type="info"
        showIcon
        message="Архитектура обхода блокировок через CDN в РФ"
        description="Клиент подключается к CDN-домену (например, cdn.yourdomain.com) на порт 443. Yandex CDN проксирует запрос через российские белые списки на Origin-сервер, откуда трафик направляется через Relay в открытый интернет."
        style={{ marginBottom: 16 }}
      />

      <Card size="small" title="Быстрый переход в облачные консоли" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Button
            type="dashed"
            icon={<LinkOutlined />}
            href="https://console.yandex.cloud/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Яндекс Cloud CDN
          </Button>
          <Button
            type="dashed"
            icon={<LinkOutlined />}
            href="https://cloud.vk.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            VK Cloud CDN
          </Button>
          <Button
            type="dashed"
            icon={<LinkOutlined />}
            href="https://my.selectel.ru/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Selectel Cloud
          </Button>
          <Button
            type="dashed"
            icon={<LinkOutlined />}
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Cloudflare Dashboard
          </Button>
        </Space>
      </Card>

      <Title level={5}>Ключевые параметры настройки Yandex Cloud CDN</Title>
      <ul>
        <li><Text strong>Протокол источника:</Text> HTTPS (порт 443)</li>
        <li><Text strong>Методы запросов:</Text> обязательно включить <Text code>OPTIONS</Text> (GET, HEAD, OPTIONS)</li>
        <li><Text strong>Кеширование:</Text> отключить («Кеширование на CDN» и «В браузере»)</li>
        <li><Text strong>Заголовок Host:</Text> «Свое значение» = Origin-домен (например, <Text code>origin.yourdomain.com</Text>)</li>
        <li><Text strong>Заголовок X-Cache:</Text> не удалять и не перезаписывать (используется для обфускации padding)</li>
      </ul>

      <Divider style={{ margin: '12px 0' }} />

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>Параметры клиента (v2rayNG / Happ / Xray extra JSON)</Title>
        <Button
          size="small"
          icon={copiedSection === 'client' ? <CheckOutlined /> : <CopyOutlined />}
          onClick={() => copyToClipboard(clientJsonSnippet, 'client')}
        >
          {copiedSection === 'client' ? 'Скопировано!' : 'Копировать JSON'}
        </Button>
      </div>
      <Paragraph style={{ marginTop: 8 }}>
        <pre style={{ background: 'rgba(128,128,128,0.1)', padding: 10, borderRadius: 6, fontSize: 12 }}>
          {clientJsonSnippet}
        </pre>
      </Paragraph>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Title level={5} style={{ margin: 0 }}>Nginx конфиг на Origin (преобразование OPTIONS в POST)</Title>
        <Button
          size="small"
          icon={copiedSection === 'nginx' ? <CheckOutlined /> : <CopyOutlined />}
          onClick={() => copyToClipboard(nginxSnippet, 'nginx')}
        >
          {copiedSection === 'nginx' ? 'Скопировано!' : 'Копировать Nginx'}
        </Button>
      </div>
      <Paragraph style={{ marginTop: 8 }}>
        <pre style={{ background: 'rgba(128,128,128,0.1)', padding: 10, borderRadius: 6, fontSize: 12 }}>
          {nginxSnippet}
        </pre>
      </Paragraph>
    </Modal>
  );
}
