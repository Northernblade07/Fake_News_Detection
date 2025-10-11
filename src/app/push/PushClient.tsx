'use client';
import { useEffect, useMemo, useState } from 'react';
import { IoIosNotificationsOutline } from 'react-icons/io';
import { MdNotificationsActive } from "react-icons/md";

function urlBase64ToUint8Array(base64String: string) {
  const s = base64String.replace(/\s+/g, '').trim(); // remove spaces/newlines
  const padding = '='.repeat((4 - (s.length % 4)) % 4);
  const base64 = (s + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw.charCodeAt(i);
  return out;
}

export default function PushClient() {
  const [supported, setSupported] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const vapid = (process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || '').trim();
  const appServerKey = useMemo(() => (vapid ? urlBase64ToUint8Array(vapid) : undefined), [vapid]);

  useEffect(() => {
    const isSupported = 'serviceWorker' in navigator && 'PushManager' in window && window.isSecureContext;
    setSupported(isSupported);
    if (!isSupported) return;

    navigator.serviceWorker.register('/sw.js', { scope: '/' })
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => setSubscribed(!!sub))
      .catch(console.error);
  }, []);

  async function subscribe() {
    if (!appServerKey) {
      console.error('Missing/invalid VAPID public key');
      alert('Push not available: invalid VAPID key.');
      return;
    }

    console.log('VAPID key length:', appServerKey.length); // Should be 65

    const perm = await Notification.requestPermission();
    if (perm !== 'granted') {
      alert("Please allow Notifications to enable push alerts.");
      return;
    }

    const reg = await navigator.serviceWorker.ready;

    // Unsubscribe old subscription
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      try { await existing.unsubscribe(); } catch (err) { console.warn(err); }
    }

    try {
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: appServerKey,
      });

      const payload = {
        endpoint: sub.endpoint,
        keys: (sub).toJSON().keys,
        expirationTime: (sub).expirationTime ?? null,
        userAgent: navigator.userAgent,
      };

      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      setSubscribed(true);

      try {
  reg.showNotification('Welcome to SatyaShield!', {
    body: 'Notifications have been enabled for your account.',
    icon: '/icons-192x192.png',
    badge: '/icons-192x192.png',
  });
} catch(err) {
  console.warn('Could not show immediate notification', err);
}

    } catch (err) {
      console.error('Subscribe failed:', err);
      alert(`Push subscribe failed:`);
      setSubscribed(false);
    }
  }

  async function unsubscribe() {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();

    if (sub) {
      try { await sub.unsubscribe(); } catch (err) { console.warn(err); }
      try {
        await fetch('/api/push/unsubscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ endpoint: sub.endpoint }),
        });
      } catch (err) { console.warn(err); }
    }

    setSubscribed(false);
  }

  if (!supported) return null;

  return subscribed ? (
    <button onClick={unsubscribe} title="Disable notifications"><MdNotificationsActive /></button>
  ) : (
    <button onClick={subscribe} title="Enable notifications"><IoIosNotificationsOutline /></button>
  );
}
