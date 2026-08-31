import { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../api/client';
export function CallbackPage() { const navigate = useNavigate(); const [params] = useSearchParams(); useEffect(() => { if (params.get('error')) { navigate(`/login?error=${params.get('error')}`, { replace: true }); return; } api.ssoResult().then(result => { localStorage.setItem('acalendar_token', result.token); localStorage.setItem('acalendar_profile', JSON.stringify(result)); navigate('/', { replace: true }); }).catch(() => navigate('/login?error=sso_callback_failed', { replace: true })); }, [navigate, params]); return <main className="login-page"><div className="loading-card"><div className="spinner" /><p>正在完成 aSSO 登录…</p></div></main>; }
