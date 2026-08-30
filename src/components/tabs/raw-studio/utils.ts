
export const formatTime = (value: number) => {
  if (!Number.isFinite(value)) return '00:00.0';
  const minutes = Math.floor(value / 60).toString().padStart(2, '0');
  const seconds = (value % 60).toFixed(1).padStart(4, '0');
  return `${minutes}:${seconds}`;
};

export const isPlayablePath = (path?: string) => {
  return Boolean(path && (path.startsWith('blob:') || path.startsWith('http://') || path.startsWith('https://')));
};
