import { useState } from 'react';
import { Card, Input, Button, Space, Typography, Steps, Alert, Divider } from 'antd';
import { GlobalOutlined, LinkOutlined, CopyOutlined, CheckOutlined, SafetyCertificateOutlined } from '@ant-design/icons';

const { Text, Paragraph } = Typography;

interface DomainBindingCardProps {
  serverIp?: string;
  panelPort?: number;
  webBasePath?: string;
  onApplyDomainCert?: (certPath: string, keyPath: string) => void;
}

export default function DomainBindingCard({
  serverIp = 'ВАШ_IP_СЕРВЕРА',
  panelPort = 2053,
  webBasePath = '/',
  onApplyDomainCert,
}: DomainBindingCardProps) {
  const [customDomain, setCustomDomain] = useState('');
  const [copied, setCopied] = useState<string | null>(null);

  const cleanDomain = customDomain.trim().toLowerCase();

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  const nginxSnippet = cleanDomain ? `server {
    listen 80;
    server_name ${cleanDomain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${cleanDomain};

    ssl_certificate /etc/letsencrypt/live/${cleanDomain}/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/${cleanDomain}/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass http://127.0.0.1:${panelPort};
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}` : '';

  return (
    <Card
      size="small"
      title={
        <Space>
          <GlobalOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>Привязка своего домена к панели Samarka</span>
        </Space>
      }
      style={{ marginBottom: 16, borderColor: 'rgba(245, 158, 11, 0.35)', borderRadius: 10 }}
    >
      <Alert
        type="info"
        showIcon
        message="Двойной режим доступа активен"
        description="Панель Samarka всегда доступна напрямую по IP:PORT. Привязав свой домен, вы также сможете входить через красивый защищенный адрес https://ваш-домен.com."
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong>Введите ваш домен для панели:</Text>
        <Space style={{ display: 'flex', marginTop: 8 }}>
          <Input
            placeholder="например, panel.mydomain.com или myvibe.ru"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            style={{ minWidth: 280 }}
          />
          <Button
            type="primary"
            icon={<LinkOutlined />}
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
          >
            Управление DNS в Cloudflare ↗
          </Button>
        </Space>
      </div>

      {cleanDomain && (
        <>
          <Divider style={{ margin: '12px 0' }} />
          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              {
                title: 'Шаг 1: Добавьте A-запись в DNS',
                description: (
                  <div style={{ background: 'rgba(128,128,128,0.06)', padding: 8, borderRadius: 6, marginTop: 4 }}>
                    <Text>Тип: <Text code>A</Text> | Имя/Хост: <Text code>{cleanDomain.split('.')[0] || '@'}</Text> | IP-адрес: <Text code>{serverIp}</Text></Text>
                  </div>
                ),
              },
              {
                title: 'Шаг 2: Выпуск SSL-сертификата (Let\'s Encrypt)',
                description: (
                  <div style={{ marginTop: 4 }}>
                    <Text>Выполните команду на сервере:</Text>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
                      <pre style={{ background: 'rgba(128,128,128,0.08)', padding: 6, borderRadius: 4, margin: 0, fontSize: 11, flex: 1 }}>
                        certbot certonly --standalone -d {cleanDomain}
                      </pre>
                      <Button
                        size="small"
                        icon={copied === 'certbot' ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => copyText(`certbot certonly --standalone -d ${cleanDomain}`, 'certbot')}
                      >
                        {copied === 'certbot' ? 'Скопировано' : 'Копия'}
                      </Button>
                    </div>
                  </div>
                ),
              },
              {
                title: 'Шаг 3: Nginx Reverse Proxy (доступ без указания порта)',
                description: (
                  <div style={{ marginTop: 4 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <Text type="secondary">Конфигурация Nginx для сайта {cleanDomain}:</Text>
                      <Button
                        size="small"
                        icon={copied === 'nginx' ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => copyText(nginxSnippet, 'nginx')}
                      >
                        {copied === 'nginx' ? 'Скопировано!' : 'Копировать Nginx конфиг'}
                      </Button>
                    </div>
                    <pre style={{ background: 'rgba(128,128,128,0.08)', padding: 8, borderRadius: 4, marginTop: 4, fontSize: 11, maxHeight: 160, overflowY: 'auto' }}>
                      {nginxSnippet}
                    </pre>
                    {onApplyDomainCert && (
                      <Button
                        size="small"
                        type="dashed"
                        icon={<SafetyCertificateOutlined />}
                        style={{ marginTop: 6 }}
                        onClick={() => onApplyDomainCert(
                          `/etc/letsencrypt/live/${cleanDomain}/fullchain.pem`,
                          `/etc/letsencrypt/live/${cleanDomain}/privkey.pem`
                        )}
                      >
                        Применить сертификаты к панели
                      </Button>
                    )}
                  </div>
                ),
              },
            ]}
          />
        </>
      )}
    </Card>
  );
}
