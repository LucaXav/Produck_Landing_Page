/**
 * Dialog drag — mousedown on the title bar grabs the dialog and lets the user
 * move it across the desktop. Position persists per session via translate3d
 * applied directly to the element. The titlebar gets `cursor: grab` / `grabbing`
 * to telegraph the affordance.
 */

const DRAG_PADDING = 12; // keep this much of the dialog on-screen at minimum

export function mountDialogDrag() {
  const dialog  = document.getElementById('dialog');
  const handle  = document.getElementById('dialog-titlebar');
  if (!dialog || !handle) return;

  let dx = 0, dy = 0;       // committed translate
  let startX = 0, startY = 0;
  let originX = 0, originY = 0;
  let dragging = false;

  const apply = () => {
    dialog.style.transform = `translate3d(${dx}px, ${dy}px, 0)`;
  };

  handle.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;          // left click only
    dragging = true;
    startX = e.clientX; startY = e.clientY;
    originX = dx; originY = dy;
    handle.classList.add('is-grabbing');
    e.preventDefault();
  });

  window.addEventListener('mousemove', (e) => {
    if (!dragging) return;
    const proposedX = originX + (e.clientX - startX);
    const proposedY = originY + (e.clientY - startY);
    // Clamp so the dialog can't be dragged completely off-screen
    const r  = dialog.getBoundingClientRect();
    const w  = window.innerWidth, h = window.innerHeight;
    // Convert proposed translate into resulting rect, then clamp
    const dxDelta = proposedX - dx;
    const dyDelta = proposedY - dy;
    const newLeft   = r.left + dxDelta;
    const newTop    = r.top  + dyDelta;
    const newRight  = r.right + dxDelta;
    const newBottom = r.bottom + dyDelta;
    let clampX = proposedX, clampY = proposedY;
    if (newLeft   < DRAG_PADDING)              clampX -= (newLeft - DRAG_PADDING);
    if (newRight  > w - DRAG_PADDING)          clampX -= (newRight - (w - DRAG_PADDING));
    if (newTop    < DRAG_PADDING + 36)         clampY -= (newTop - (DRAG_PADDING + 36)); // below topnav
    if (newBottom > h - DRAG_PADDING)          clampY -= (newBottom - (h - DRAG_PADDING));
    dx = clampX; dy = clampY;
    apply();
  });

  const endDrag = () => {
    if (!dragging) return;
    dragging = false;
    handle.classList.remove('is-grabbing');
  };
  window.addEventListener('mouseup', endDrag);
  window.addEventListener('mouseleave', endDrag);
}
