import { useState, useMemo } from 'react';
import { Card, Input, Button, Space, Typography, Steps, Alert, Divider, message, Collapse, Switch, Tag } from 'antd';
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
  EyeInvisibleOutlined,
  ReloadOutlined,
  RobotOutlined,
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

interface DecoyInfo {
  theme?: string;
  companyName?: string;
  tagline?: string;
  accentColor?: string;
  directory?: string;
  isCustom?: boolean;
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

  // Stealth & Camouflage states
  const [enableStealth, setEnableStealth] = useState(true);
  const [secretBasePath, setSecretBasePath] = useState(() => {
    if (initialWebBasePath && initialWebBasePath !== '/') {
      return initialWebBasePath.endsWith('/') ? initialWebBasePath : `${initialWebBasePath}/`;
    }
    return `/portal-${Math.floor(1000 + Math.random() * 9000)}/`;
  });
  const [generatingDecoy, setGeneratingDecoy] = useState(false);
  const [decoyInfo, setDecoyInfo] = useState<DecoyInfo | null>(null);

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

  const handleRandomizeSecret = () => {
    const prefixes = ['crm', 'portal', 'internal', 'service', 'hub', 'panel'];
    const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randNum = Math.floor(1000 + Math.random() * 9000);
    setSecretBasePath(`/${prefix}-${randNum}/`);
    message.success('Сгенерирован новый случайный секретный путь');
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

  // Generate Unique Decoy Website
  const handleGenerateDecoy = async () => {
    setGeneratingDecoy(true);
    try {
      const res = await HttpUtil.post<DecoyInfo>('/panel/api/server/domain/generateDecoy', {});
      if (res?.success && res.obj) {
        setDecoyInfo(res.obj);
        message.success(`Сгенерирован новый сайт-заглушка: ${res.obj.companyName || 'Decoy Site'}`);
      } else {
        message.error(res?.msg || 'Не удалось сгенерировать сайт-заглушку');
      }
    } catch (e: unknown) {
      const err = e as Error;
      message.error(err?.message || 'Ошибка генерации сайта');
    } finally {
      setGeneratingDecoy(false);
    }
  };

  // 3. Setup Nginx Reverse Proxy with Stealth Decoy
  const handleSetupNginx = async () => {
    if (!cleanDomain) {
      message.warning('Пожалуйста, введите домен');
      return;
    }
    setSettingUpNginx(true);
    try {
      const formattedSecret = secretBasePath.trim().startsWith('/') ? secretBasePath.trim() : `/${secretBasePath.trim()}`;
      const res = await HttpUtil.post('/panel/api/server/domain/setupNginx', {
        domain: cleanDomain,
        panelPort,
        enableStealth,
        secretBasePath: enableStealth ? formattedSecret : '/',
      });
      if (res?.success) {
        setNginxSuccessMsg(res.msg || 'Nginx успешно настроен!');
        message.success(enableStealth ? 'Маскировка и Nginx успешно активированы!' : 'Nginx успешно настроен!');
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
        setEnableStealth(false);
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

  const cleanSecretPath = useMemo(() => {
    let p = secretBasePath.trim();
    if (!p.startsWith('/')) p = `/${p}`;
    if (!p.endsWith('/')) p = `${p}/`;
    return p;
  }, [secretBasePath]);

  const finalUrl = useMemo(() => {
    if (!cleanDomain) return '';
    if (enableStealth) {
      return `https://${cleanDomain}${cleanSecretPath}`;
    }
    const basePath = basePathCleaned || currentBasePath === '/' ? '/' : currentBasePath;
    const pathPart = basePath.startsWith('/') ? basePath : `/${basePath}`;
    if (nginxSuccessMsg) {
      return `https://${cleanDomain}${pathPart === '/' ? '/' : pathPart}`;
    }
    return `https://${cleanDomain}:${panelPort}${pathPart === '/' ? '/' : pathPart}`;
  }, [cleanDomain, enableStealth, cleanSecretPath, nginxSuccessMsg, panelPort, currentBasePath, basePathCleaned]);

  const nginxSnippet = cleanDomain
    ? enableStealth
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

    # Маскировка: сайт-заглушка на корне /
    location / {
        root /var/www/decoy;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Секретный вход в панель
    location ${cleanSecretPath} {
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
      : `server {
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
          <GlobalOutlined style={{ color: '#8b5cf6' }} />
          <span style={{ fontWeight: 600 }}>Привязка домена, SSL и маскировка под сайт (Stealth Mode)</span>
        </Space>
      }
      style={{ marginBottom: 16, borderColor: 'rgba(139, 92, 246, 0.35)', borderRadius: 12 }}
    >
      <Alert
        type="info"
        showIcon
        message="Полная маскировка панели под обычный корпоративный веб-сайт"
        description="Любой посторонний или DPI-сканер, переходя по домену, увидит уникальный сайт-заглушку (IT-компания/SaaS/облако). Доступ к панели осуществляется только по вашему секретному пути!"
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
            style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderColor: '#8b5cf6', color: '#ffffff', fontWeight: 600 }}
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
                title: 'Шаг 3: Маскировка под сайт и секретный вход (Nginx Stealth)',
                description: (
                  <div style={{ marginTop: 6 }}>
                    <div style={{ background: 'rgba(128,128,128,0.06)', padding: 12, borderRadius: 8, marginBottom: 10 }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                        <Space>
                          <EyeInvisibleOutlined style={{ color: '#8b5cf6', fontSize: 16 }} />
                          <Text strong>Режим маскировки под сайт (Stealth Camouflage):</Text>
                        </Space>
                        <Switch
                          checked={enableStealth}
                          onChange={(checked) => setEnableStealth(checked)}
                          checkedChildren="Вкл"
                          unCheckedChildren="Выкл"
                        />
                      </div>

                      {enableStealth ? (
                        <div>
                          <Paragraph style={{ fontSize: 12, marginBottom: 10 }} type="secondary">
                            На корне <Text code>https://{cleanDomain}/</Text> Nginx будет открывать полноценный сайт-заглушку. Панель Samarka будет доступна исключительно по вашему секретному URL.
                          </Paragraph>

                          <div style={{ marginBottom: 12 }}>
                            <Text strong style={{ fontSize: 12 }}>Сайт-заглушка (в /var/www/decoy):</Text>
                            <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                              <Button
                                size="small"
                                icon={<ReloadOutlined />}
                                loading={generatingDecoy}
                                onClick={handleGenerateDecoy}
                              >
                                Сгенерировать новый уникальный сайт
                              </Button>
                              {decoyInfo && (
                                <Tag color="purple">
                                  {decoyInfo.companyName} ({decoyInfo.theme})
                                </Tag>
                              )}
                            </div>
                          </div>

                          <div style={{ marginBottom: 12 }}>
                            <Text strong style={{ fontSize: 12 }}>Секретный путь к панели:</Text>
                            <Space style={{ display: 'flex', marginTop: 6 }}>
                              <Input
                                value={secretBasePath}
                                onChange={(e) => setSecretBasePath(e.target.value)}
                                style={{ width: 220 }}
                                placeholder="/portal-1234/"
                              />
                              <Button size="small" onClick={handleRandomizeSecret}>
                                Случайный путь
                              </Button>
                            </Space>
                          </div>

                          <Alert
                            type="info"
                            showIcon
                            icon={<RobotOutlined />}
                            message="Напоминалка в Telegram боте"
                            description="Если вы забудете секретный путь, просто отправьте команду /mask или /link вашему Telegram боту панели — он мгновенно напомнит секретную ссылку!"
                            style={{ fontSize: 12 }}
                          />
                        </div>
                      ) : (
                        <div>
                          <Text type="secondary" style={{ fontSize: 12 }}>
                            Маскировка отключена. Панель открывается напрямую на стандартном порту 443 без сайта-заглушки.
                          </Text>
                        </div>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <Button
                        type="primary"
                        icon={<ThunderboltOutlined />}
                        loading={settingUpNginx}
                        onClick={handleSetupNginx}
                        style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderColor: '#8b5cf6' }}
                      >
                        {nginxSuccessMsg ? 'Обновить конфиг Nginx' : 'Применить маскировку и запустить Nginx'}
                      </Button>

                      <Button
                        icon={<KeyOutlined />}
                        loading={cleaningBasePath}
                        onClick={handleCleanBasePath}
                        disabled={basePathCleaned || currentBasePath === '/'}
                      >
                        {basePathCleaned || currentBasePath === '/' ? 'Ключ уже убран (корень /)' : 'Сбросить ключ панели (корень /)'}
                      </Button>
                    </div>

                    {nginxSuccessMsg && (
                      <div style={{ marginTop: 8 }}>
                        <Alert
                          type="success"
                          showIcon
                          message="Nginx успешно настроен!"
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
            <div style={{ marginTop: 18, background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.3)', borderRadius: 12, padding: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
                <div>
                  <Text strong style={{ fontSize: 13, color: '#a78bfa' }}>
                    {enableStealth ? 'ВАША СЕКРЕТНАЯ ССЫЛКА ДЛЯ ВХОДА В ПАНЕЛЬ:' : 'ГОТОВАЯ ССЫЛКА ДЛЯ ВХОДА В ПАНЕЛЬ:'}
                  </Text>
                  <div style={{ fontSize: 15, fontWeight: 700, marginTop: 4, wordBreak: 'break-all' }}>
                    <a href={finalUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#38bdf8' }}>
                      {finalUrl}
                    </a>
                  </div>
                  {enableStealth && (
                    <Text type="secondary" style={{ fontSize: 11, display: 'block', marginTop: 4 }}>
                      🎭 По адресу <Text code>https://{cleanDomain}/</Text> посторонние увидят только сайт компании.
                    </Text>
                  )}
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
                    style={{ background: 'linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)', borderColor: '#8b5cf6', color: '#ffffff', fontWeight: 600 }}
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
                  label: <Text type="secondary" style={{ fontSize: 12 }}>Конфигурация Nginx (для справки)</Text>,
                  children: (
                    <div>
                      <Paragraph type="secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                        Этот конфиг автоматически генерируется и активируется на сервере:
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
