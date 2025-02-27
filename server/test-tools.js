export function getTimestamp() {
  const time = new Date();
  return time.toISOString();
}

export async function waitDuration(duration = 0) {
  await new Promise((resolve) => {
    setTimeout(resolve, duration);
  });
}
