// أدوات وقت بسيطة
const HR = 3600000;

export const nowMs = () => Date.now();

export const timeAgo = (ms) => {
  const d = Date.now() - ms;
  if (d < 60000) return "الآن";
  if (d < HR) return Math.floor(d / 60000) + " دقيقة";
  return Math.floor(d / HR) + " ساعة";
};
