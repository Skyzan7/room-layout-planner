const room = document.getElementById('room');
const clearBtn = document.getElementById('clearBtn');
const exportBtn = document.getElementById('exportBtn');
const applyRoom = document.getElementById('applyRoom');
const roomWidthInput = document.getElementById('roomWidth');
const roomHeightInput = document.getElementById('roomHeight');
const itemControls = document.getElementById('itemControls');
const noSelection = document.getElementById('noSelection');
const selectionPanel = document.getElementById('selectionPanel');
const itemLabel = document.getElementById('itemLabel');
const itemRotate = document.getElementById('itemRotate');
const itemColor = document.getElementById('itemColor');
const deleteItem = document.getElementById('deleteItem');

let selectedEl = null;
let dragOffsetX = 0, dragOffsetY = 0;
let isDragging = false;
let isResizing = false;
let resizeStartX, resizeStartY, resizeStartW, resizeStartH;

function setRoomSize(w, h) {
  room.style.width = w + 'px';
  room.style.height = h + 'px';
}
setRoomSize(800, 600);

applyRoom.addEventListener('click', () => {
  setRoomSize(parseInt(roomWidthInput.value), parseInt(roomHeightInput.value));
});

const colorMap = {
  'round-table': '#6c8ebf', 'rect-table': '#d6ae6b', 'chair': '#82b366',
  'sofa': '#ae4132', 'stage': '#9b59b6', 'bar': '#e67e22',
  'plant': '#27ae60', 'dj-booth': '#2c3e50'
};

document.querySelectorAll('.furniture-item').forEach(item => {
  item.addEventListener('dragstart', e => {
    e.dataTransfer.setData('type', item.dataset.type);
    e.dataTransfer.setData('w', item.dataset.w);
    e.dataTransfer.setData('h', item.dataset.h);
  });
});

room.addEventListener('dragover', e => e.preventDefault());

room.addEventListener('drop', e => {
  e.preventDefault();
  const type = e.dataTransfer.getData('type');
  const w = parseInt(e.dataTransfer.getData('w'));
  const h = parseInt(e.dataTransfer.getData('h'));
  const rect = room.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left - w/2, room.offsetWidth - w));
  const y = Math.max(0, Math.min(e.clientY - rect.top - h/2, room.offsetHeight - h));
  createItem(type, x, y, w, h);
});

function createItem(type, x, y, w, h, label, rotate, color) {
  const el = document.createElement('div');
  el.className = 'placed-item ' + type;
  el.style.left = x + 'px';
  el.style.top = y + 'px';
  el.style.width = w + 'px';
  el.style.height = h + 'px';
  el.style.background = color || colorMap[type] || '#aaa';
  el.dataset.type = type;
  el.dataset.rotate = rotate || 0;
  el.style.transform = 'rotate(' + (rotate || 0) + 'deg)';
  const lbl = document.createElement('span');
  lbl.textContent = label || capitalize(type.replace('-', ' '));
  el.appendChild(lbl);
  const handle = document.createElement('div');
  handle.className = 'resize-handle';
  el.appendChild(handle);
  room.appendChild(el);
  bindItemEvents(el, handle);
  selectItem(el);
  return el;
}

function capitalize(s) { return s.charAt(0).toUpperCase() + s.slice(1); }

function bindItemEvents(el, handle) {
  el.addEventListener('mousedown', e => {
    if (e.target === handle) return;
    e.stopPropagation();
    selectItem(el);
    isDragging = true;
    const rect = room.getBoundingClientRect();
    dragOffsetX = e.clientX - rect.left - el.offsetLeft;
    dragOffsetY = e.clientY - rect.top - el.offsetTop;
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  });
  handle.addEventListener('mousedown', e => {
    e.stopPropagation();
    isResizing = true;
    selectItem(el);
    resizeStartX = e.clientX;
    resizeStartY = e.clientY;
    resizeStartW = el.offsetWidth;
    resizeStartH = el.offsetHeight;
    document.addEventListener('mousemove', onResize);
    document.addEventListener('mouseup', onResizeUp);
  });
  function onMove(e) {
    if (!isDragging) return;
    const rect = room.getBoundingClientRect();
    let nx = e.clientX - rect.left - dragOffsetX;
    let ny = e.clientY - rect.top - dragOffsetY;
    nx = Math.max(0, Math.min(nx, room.offsetWidth - el.offsetWidth));
    ny = Math.max(0, Math.min(ny, room.offsetHeight - el.offsetHeight));
    el.style.left = nx + 'px';
    el.style.top = ny + 'px';
  }
  function onUp() {
    isDragging = false;
    document.removeEventListener('mousemove', onMove);
    document.removeEventListener('mouseup', onUp);
  }
  function onResize(e) {
    if (!isResizing) return;
    const nw = Math.max(20, resizeStartW + e.clientX - resizeStartX);
    const nh = Math.max(20, resizeStartH + e.clientY - resizeStartY);
    el.style.width = nw + 'px';
    el.style.height = nh + 'px';
  }
  function onResizeUp() {
    isResizing = false;
    document.removeEventListener('mousemove', onResize);
    document.removeEventListener('mouseup', onResizeUp);
  }
}

function selectItem(el) {
  if (selectedEl) selectedEl.classList.remove('selected');
  selectedEl = el;
  el.classList.add('selected');
  noSelection.style.display = 'none';
  selectionPanel.style.display = '';
  const span = el.querySelector('span');
  itemLabel.value = span ? span.textContent : '';
  itemRotate.value = el.dataset.rotate || 0;
  itemColor.value = rgbToHex(el.style.background) || colorMap[el.dataset.type] || '#aaaaaa';
}

room.addEventListener('mousedown', e => {
  if (e.target === room || e.target.classList.contains('grid-overlay')) {
    if (selectedEl) { selectedEl.classList.remove('selected'); selectedEl = null; }
    noSelection.style.display = '';
    selectionPanel.style.display = 'none';
  }
});

itemLabel.addEventListener('input', () => {
  if (!selectedEl) return;
  const span = selectedEl.querySelector('span');
  if (span) span.textContent = itemLabel.value;
});

itemRotate.addEventListener('input', () => {
  if (!selectedEl) return;
  selectedEl.dataset.rotate = itemRotate.value;
  selectedEl.style.transform = 'rotate(' + itemRotate.value + 'deg)';
});

itemColor.addEventListener('input', () => {
  if (!selectedEl) return;
  selectedEl.style.background = itemColor.value;
});

deleteItem.addEventListener('click', () => {
  if (!selectedEl) return;
  selectedEl.remove();
  selectedEl = null;
  noSelection.style.display = '';
  selectionPanel.style.display = 'none';
});

clearBtn.addEventListener('click', () => {
  document.querySelectorAll('.placed-item').forEach(el => el.remove());
  selectedEl = null;
  noSelection.style.display = '';
  selectionPanel.style.display = 'none';
});

exportBtn.addEventListener('click', () => {
  if (selectedEl) { selectedEl.classList.remove('selected'); }
  import('https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js')
    .then(m => m.default(room, { useCORS: true, backgroundColor: '#fff' }))
    .then(canvas => {
      const a = document.createElement('a');
      a.href = canvas.toDataURL('image/png');
      a.download = 'room-layout.png';
      a.click();
      if (selectedEl) selectedEl.classList.add('selected');
    }).catch(() => {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js';
      script.onload = () => {
        if (selectedEl) selectedEl.classList.remove('selected');
        html2canvas(room, { backgroundColor: '#fff' }).then(canvas => {
          const a = document.createElement('a');
          a.href = canvas.toDataURL('image/png');
          a.download = 'room-layout.png';
          a.click();
          if (selectedEl) selectedEl.classList.add('selected');
        });
      };
      document.head.appendChild(script);
    });
});

function rgbToHex(rgb) {
  if (!rgb) return '#aaaaaa';
  if (rgb.startsWith('#')) return rgb;
  const result = rgb.match(/\d+/g);
  if (!result || result.length < 3) return '#aaaaaa';
  return '#' + result.slice(0, 3).map(n => parseInt(n).toString(16).padStart(2, '0')).join('');
}
