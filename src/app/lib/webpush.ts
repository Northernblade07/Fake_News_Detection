import webpush from 'web-push'

webpush.setVapidDetails(
  'mailto:prashantbhandaricr07@gmail.com',
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  process.env.VAPID_PRIVATE_KEY!
);

export { webpush };
