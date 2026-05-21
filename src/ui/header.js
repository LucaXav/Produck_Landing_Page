/**
 * OS menu bar — live clock in the top-right, like a real desktop.
 */

export function mountHeader() {
  const clock = document.getElementById('topnav-clock');
  if (!clock) return;
  const update = () => {
    const d = new Date();
    let h = d.getHours();
    const m = String(d.getMinutes()).padStart(2, '0');
    const suffix = h >= 12 ? 'PM' : 'AM';
    h = h % 12 || 12;
    clock.textContent = `${h}:${m} ${suffix}`;
  };
  update();
  // Tick at the top of each minute so the displayed time is honest
  const msToNextMinute = 60_000 - (Date.now() % 60_000);
  setTimeout(() => { update(); setInterval(update, 60_000); }, msToNextMinute);
}
