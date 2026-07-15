'use strict';
// Clientseitige Bildkomprimierung via Canvas — spart Speicher & Ladezeit.
// Optional exifr-ähnliches Drehen würde hier rein; hier: einfach skalieren + JPEG-Qualität.
window.compressImage = function (file, opts) {
  opts = opts || {};
  const maxDim = opts.maxDim || 1280;
  const quality = opts.quality || 0.8;
  return new Promise((resolve, reject) => {
    if (!file.type || file.type.indexOf('image/') !== 0) {
      return reject(new Error('Kein Bild'));
    }
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Lesen fehlgeschlagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Bild ungültig'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          const r = Math.min(maxDim / width, maxDim / height);
          width = Math.round(width * r);
          height = Math.round(height * r);
        }
        const canvas = document.createElement('canvas');
        canvas.width = width; canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        resolve({ dataUrl, width, height });
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
};

// Kamera-Live-Capture (nur Live, kein Upload alter Bilder) -> Selfie
window.captureSelfie = function (videoEl, canvasEl) {
  const v = videoEl, c = canvasEl;
  c.width = v.videoWidth; c.height = v.videoHeight;
  c.getContext('2d').drawImage(v, 0, 0, c.width, c.height);
  return c.toDataURL('image/jpeg', 0.85);
};
