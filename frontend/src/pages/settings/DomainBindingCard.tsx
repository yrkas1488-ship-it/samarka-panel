import { useState, useMemo } from 'react';
import { Card, Input, Button, Space, Typography, Steps, Alert, Divider, message, Collapse } from 'antd';
import {
  GlobalOutlined,
  LinkOutlined,
  CopyOutlined,
  CheckOutlined,
  SafetyCertificateOutlined,
  ThunderboltOutlined,
  CheckCircleOutlined,
  WarningOutlined,
  KeyOutlined,
} from '@ant-design/icons';
import { HttpUtil } from '@/utils';

const { Text, Paragraph } = Typography;

interface DomainBindingCardProps {
  initialDomain?: string;
  serverIp?: string;
  panelPort?: number;
  webBasePath?: string;
  onApplyDomainCert?: (certPath: string, keyPath: string) => void;
}

interface DnsCheckResult {
  domain: string;
  resolvedIps: string[];
  serverIp: string;
  matched: boolean;
}

interface IssueCertResult {
  certFile: string;
  keyFile: string;
  reused: boolean;
  message: string;
}

export default function DomainBindingCard({
  initialDomain = '',
  serverIp = 'ВАШ_IP_СЕРВЕРА',
  panelPort = 2053,
  webBasePath: initialWebBasePath = '/',
  onApplyDomainCert,
}: DomainBindingCardProps) {
  const [customDomain, setCustomDomain] = useState(initialDomain);
  const [currentBasePath, setCurrentBasePath] = useState(initialWebBasePath);
  const [copied, setCopied] = useState<string | null>(null);

  // Async action states
  const [checkingDns, setCheckingDns] = useState(false);
  const [dnsResult, setDnsResult] = useState<DnsCheckResult | null>(null);

  const [issuingCert, setIssuingCert] = useState(false);
  const [certResult, setCertResult] = useState<IssueCertResult | null>(null);

  const [settingUpNginx, setSettingUpNginx] = useState(false);
  const [nginxSuccessMsg, setNginxSuccessMsg] = useState<string | null>(null);

  const [cleaningBasePath, setCleaningBasePath] = useState(false);
  const [basePathCleaned, setBasePathCleaned] = useState(false);

  const cleanDomain = customDomain.trim().toLowerCase();

  const copyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(null), 2000);
  };

  // 1. Check DNS
  const handleCheckDns = async () => {
    if (!cleanDomain) {
      message.warning('Пожалуйста, введите домен');
      return;
    }
    setCheckingDns(true);
    setDnsResult(null);
    try {
      const res = await HttpUtil.post<DnsCheckResult>('/panel/api/server/domain/checkDns', { domain: cleanDomain });
      if (res?.success && res.obj) {
        setDnsResult(res.obj);
        if (res.obj.matched) {
          message.success('DNS настроен верно! Домен указывает на IP сервера.');
        } else {
          message.info('DNS запись получена. Проверьте соответствие IP.');
        }
      } else {
        message.error(res?.msg || 'Не удалось проверить DNS домена');
      }
    } catch (e: unknown) {
      const err = e as Error;
      message.error(err?.message || 'Сетевая ошибка при проверке DNS');
    } finally {
      setCheckingDns(false);
    }
  };

  // 2. Issue / Apply SSL in 1-Click
  const handleIssueCert = async (force = false) => {
    if (!cleanDomain) {
      message.warning('Пожалуйста, введите домен');
      return;
    }
    setIssuingCert(true);
    try {
      const res = await HttpUtil.post<IssueCertResult>('/panel/api/server/domain/issueCert', {
        domain: cleanDomain,
        force,
      });
      if (res?.success && res.obj) {
        setCertResult(res.obj);
        message.success(res.obj.message || 'SSL-сертификат успешно применен к панели!');
        if (onApplyDomainCert) {
          onApplyDomainCert(res.obj.certFile, res.obj.keyFile);
        }
      } else {
        message.error(res?.msg || 'Ошибка при получении сертификата');
      }
    } catch (e: unknown) {
      const err = e as Error;
      message.error(err?.message || 'Сетевая ошибка при выпуске сертификата');
    } finally {
      setIssuingCert(false);
    }
  };

  // 3. Setup Nginx Reverse Proxy in 1-Click
  const handleSetupNginx = async () => {
    if (!cleanDomain) {
      message.warning('Пожалуйста, введите домен');
      return;
    }
    setSettingUpNginx(true);
    try {
      const res = await HttpUtil.post('/panel/api/server/domain/setupNginx', {
        domain: cleanDomain,
        panelPort,
      });
      if (res?.success) {
        setNginxSuccessMsg(res.msg || 'Nginx успешно настроен!');
        message.success('Nginx настроен! Порт 2053 больше указывать не нужно.');
      } else {
        message.error(res?.msg || 'Не удалось настроить Nginx');
      }
    } catch (e: unknown) {
      const err = e as Error;
      message.error(err?.message || 'Ошибка настройки Nginx');
    } finally {
      setSettingUpNginx(false);
    }
  };

  // 4. Clean Base Path to '/' in 1-Click
  const handleCleanBasePath = async () => {
    setCleaningBasePath(true);
    try {
      const res = await HttpUtil.post('/panel/api/server/domain/cleanBasePath', {});
      if (res?.success) {
        setBasePathCleaned(true);
        setCurrentBasePath('/');
        message.success('Секретный ключ убран! Панель открывается прямо по корню /');
      } else {
        message.error(res?.msg || 'Не удалось сбросить базовый путь');
      }
    } catch (e: unknown) {
      const err = e as Error;
      message.error(err?.message || 'Ошибка сброса базового пути');
    } finally {
      setCleaningBasePath(false);
    }
  };

  const finalUrl = useMemo(() => {
    if (!cleanDomain) return '';
    const basePath = basePathCleaned || currentBasePath === '/' ? '/' : currentBasePath;
    const pathPart = basePath.startsWith('/') ? basePath : `/${basePath}`;
    if (nginxSuccessMsg) {
      return `https://${cleanDomain}${pathPart === '/' ? '/' : pathPart}`;
    }
    return `https://${cleanDomain}:${panelPort}${pathPart === '/' ? '/' : pathPart}`;
  }, [cleanDomain, nginxSuccessMsg, panelPort, currentBasePath, basePathCleaned]);

  const nginxSnippet = cleanDomain
    ? `server {
    listen 80;
    server_name ${cleanDomain};
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl http2;
    server_name ${cleanDomain};

    ssl_certificate ${certResult?.certFile || `/root/cert/${cleanDomain}/fullchain.pem`};
    ssl_certificate_key ${certResult?.keyFile || `/root/cert/${cleanDomain}/privkey.pem`};
    ssl_protocols TLSv1.2 TLSv1.3;

    location / {
        proxy_pass https://127.0.0.1:${panelPort};
        proxy_ssl_verify off;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}`
    : '';

  return (
    <Card
      size="small"
      title={
        <Space>
          <GlobalOutlined style={{ color: '#f59e0b' }} />
          <span style={{ fontWeight: 600 }}>Привязка домена и SSL к панели Samarka (в 1 клик на сайте)</span>
        </Space>
      }
      style={{ marginBottom: 16, borderColor: 'rgba(245, 158, 11, 0.35)', borderRadius: 10 }}
    >
      <Alert
        type="info"
        showIcon
        message="Автоматическая привязка без терминала"
        description="Теперь привязать домен, выпустить SSL и настроить вход без порта :2053 можно прямо здесь, не вводя команды в консоли сервера."
        style={{ marginBottom: 16 }}
      />

      <div style={{ marginBottom: 16 }}>
        <Text strong>Введите ваш домен для панели:</Text>
        <Space style={{ display: 'flex', marginTop: 8, flexWrap: 'wrap' }}>
          <Input
            placeholder="например, panel.nemaxvibe.lol"
            value={customDomain}
            onChange={(e) => setCustomDomain(e.target.value)}
            style={{ minWidth: 280 }}
            allowClear
          />
          <Button
            type="primary"
            icon={<LinkOutlined />}
            href="https://dash.cloudflare.com/"
            target="_blank"
            rel="noopener noreferrer"
            style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
          >
            Cloudflare DNS ↗
          </Button>
        </Space>
      </div>

      {cleanDomain && (
        <>
          <Divider style={{ margin: '14px 0' }} />

          <Steps
            direction="vertical"
            size="small"
            current={-1}
            items={[
              {
                title: 'Шаг 1: Проверка A-записи в DNS',
                description: (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ background: 'rgba(128,128,128,0.06)', padding: 10, borderRadius: 6 }}>
                      <Text>
                        Создайте запись в Cloudflare / у регистратора: Тип <Text code>A</Text> | Хост{' '}
                        <Text code>{cleanDomain.split('.')[0] || '@'}</Text> | IP-адрес <Text code>{serverIp}</Text>
                      </Text>
                      <div style={{ marginTop: 8 }}>
                        <Button
                          size="small"
                          icon={<ThunderboltOutlined />}
                          loading={checkingDns}
                          onClick={handleCheckDns}
                        >
                          Проверить DNS на сервере
                        </Button>
                      </div>
                    </div>

                    {dnsResult && (
                      <div style={{ marginTop: 8 }}>
                        {dnsResult.matched ? (
                          <Alert
                            type="success"
                            showIcon
                            icon={<CheckCircleOutlined />}
                            message="DNS настроен правильно!"
                            description={`Домен ${dnsResult.domain} успешно указывает на IP вашего сервера (${dnsResult.serverIp}).`}
                          />
                        ) : (
                          <Alert
                            type="warning"
                            showIcon
                            icon={<WarningOutlined />}
                            message="Внимание: IP не совпадает напрямую"
                            description={`Домен указывает на: ${dnsResult.resolvedIps.join(', ')} (IP сервера: ${dnsResult.serverIp}). Если в Cloudflare включено оранжевое облако (Proxied), это нормально. Если DNS только обновлен, подождите 1-2 минуты.`}
                          />
                        )}
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Шаг 2: Выпуск SSL-сертификата (Let\'s Encrypt) прямо на сайте',
                description: (
                  <div style={{ marginTop: 6 }}>
                    <Text type="secondary">
                      Сервер сам запустит получение сертификата Let's Encrypt через встроенный acme.sh / certbot и сразу пропишет пути в панель:
                    </Text>
                    <div style={{ marginTop: 8, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        icon={<SafetyCertificateOutlined />}
                        loading={issuingCert}
                        onClick={() => handleIssueCert(false)}
                        style={{ background: '#10b981', borderColor: '#10b981' }}
                      >
                        {certResult ? 'Обновить / Перевыпустить SSL' : 'Выпустить и привязать SSL в 1 клик'}
                      </Button>
                    </div>

                    {certResult && (
                      <div style={{ marginTop: 8 }}>
                        <Alert
                          type="success"
                          showIcon
                          message="SSL-сертификат активен!"
                          description={
                            <div>
                              <div>{certResult.message}</div>
                              <div style={{ fontSize: 11, fontFamily: 'monospace', marginTop: 4 }}>
                                Cert: {certResult.certFile}
                                <br />
                                Key: {certResult.keyFile}
                              </div>
                            </div>
                          }
                        />
                      </div>
                    )}
                  </div>
                ),
              },
              {
                title: 'Шаг 3: Вход без порта :2053 (Nginx) и без секретного ключа',
                description: (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Button
                        icon={<ThunderboltOutlined />}
                        loading={settingUpNginx}
                        onClick={handleSetupNginx}
                      >
                        {nginxSuccessMsg ? 'Обновить конфиг Nginx' : 'Настроить Nginx (доступ по порту 443 без :2053)'}
                      </Button>

                      <Button
                        icon={<KeyOutlined />}
                        loading={cleaningBasePath}
                        onClick={handleCleanBasePath}
                        disabled={basePathCleaned || currentBasePath === '/'}
                      >
                        {basePathCleaned || currentBasePath === '/' ? 'Ключ уже убран (корень /)' : 'Убрать секретный ключ (сделать /)'}
                      </Button>
                    </div>

                    {nginxSuccessMsg && (
                      <div style={{ marginTop: 8 }}>
                        <Alert
                          type="success"
                          showIcon
                          message="Nginx успешно подключен!"
                          description={nginxSuccessMsg}
                        />
                      </div>
                    )}
                  </div>
                ),
              },
            ]}
          />

          {finalUrl && (
            <div style={{ marginTop: 18, background: 'rgba(245, 158, 11, 0.08)', border: '1px solid rgba(245, 158, 11, 0.3)', borderRadius: 10, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13, color: '#f59e0b' }}>
                    ГОТОВАЯ ССЫЛКА ДЛЯ ВХОДА В ПАНЕЛЬ:
                  </Text>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, wordBreak: 'break-all' }}>
                    <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
                      {finalUrl}
                    </a>
                  </div>
                </div>

                <Space>
                  <Button
                    size="small"
                    icon={copied === 'finalUrl' ? <CheckOutlined /> : <CopyOutlined />}
                    onClick={() => copyText(finalUrl, 'finalUrl')}
                  >
                    {copied === 'finalUrl' ? 'Скопировано!' : 'Копировать ссылку'}
                  </Button>
                  <Button
                    size="small"
                    type="primary"
                    href={finalUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ background: '#f59e0b', borderColor: '#f59e0b', color: '#0f172a', fontWeight: 600 }}
                  >
                    Открыть в новой вкладке ↗
                  </Button>
                </Space>
              </div>
            </div>
          )}

          <div style={{ marginTop: 16 }}>
            <Collapse
              ghost
              items={[
                {
                  key: 'manual',
                  label: <Text type="secondary" style={{ fontSize: 12 }}>Ручная настройка (для гиков / терминала)</Text>,
                  children: (
                    <div>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                        Если вы предпочитаете выполнять команды вручную через консоль сервера:
                      </Paragraph>
                      <pre style={{ background: 'rgba(128,128,128,0.08)', padding: 8, borderRadius: 6, fontSize: 11, maxHeight: 180, overflowY: 'auto' }}>
                        {nginxSnippet}
                      </pre>
                      <Button
                        size="small"
                        icon={copied === 'manualNginx' ? <CheckOutlined /> : <CopyOutlined />}
                        onClick={() => copyText(nginxSnippet, 'manualNginx')}
                      >
                        {copied === 'manualNginx' ? 'Скопировано!' : 'Копировать Nginx конфиг'}
                      </Button>
                    </div>
                  ),
                },
              ]}
            />
          </div>
        </>
      )}
    </Card>
  );
}
