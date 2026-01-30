const isDev = Boolean(import.meta.env && import.meta.env.DEV);

function timestamp() {
  try { return new Date().toISOString(); } catch { return String(Date.now()); }
}

function format(level, args) {
  const prefix = `[SerenVoice] ${timestamp()} ${level.toUpperCase()}:`;
  return [prefix, ...args];
}

export default {
  debug: (...args) => {
    if (isDev) {
      console.log(...format('debug', args));
    }
  },
  info: (...args) => console.info(...format('info', args)),
  warn: (...args) => console.warn(...format('warn', args)),
  error: (...args) => console.error(...format('error', args)),
};
