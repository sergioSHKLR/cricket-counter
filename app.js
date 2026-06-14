let cvReady = false;
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
let statusEl;

function updateStatus(msg) {
  if (!statusEl) {
    statusEl = document.createElement('div');
    statusEl.style.color = '#0066cc';
    statusEl.style.margin = '10px 0';
    statusEl.style.fontWeight = 'bold';
    const result = document.getElementById('result');
    if (result) result.parentNode.insertBefore(statusEl, result);
  }
  statusEl.textContent = msg;
  console.log('[Status]', msg);
}

document.addEventListener('DOMContentLoaded', () => {
  updateStatus('Carregando OpenCV.js...');
  const script = document.createElement('script');
  script.src = 'https://docs.opencv.org/4.10.0/opencv.js';
  script.async = true;
  script.onload = () => {
    if (typeof cv !== 'undefined' && cv.onRuntimeInitialized) {
      cv.onRuntimeInitialized = () => {
        cvReady = true;
        updateStatus('✅ OpenCV.js pronto para uso. Carregue a imagem e processe.');
      };
    } else {
      updateStatus('OpenCV.js carregado, aguardando inicialização...');
    }
  };
  document.head.appendChild(script);
});

// Rest of event listeners and processImage function (adaptive threshold version)
imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
    updateStatus('Imagem carregada. Ajuste sliders e clique em Processar.');
  };
  img.src = URL.createObjectURL(file);
});

processBtn.addEventListener('click', () => {
  if (!cvReady) {
    alert('OpenCV ainda carregando. Tente novamente em alguns segundos.');
    return;
  }
  processImage();
});

function processImage() {
  updateStatus('Processando imagem com detecção aprimorada...');
  try {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const minArea = parseInt(document.getElementById('minArea').value) || 30;

    const thresh = new cv.Mat();
    cv.adaptiveThreshold(gray, thresh, 255, cv.ADAPTIVE_THRESH_GAUSSIAN_C, cv.THRESH_BINARY_INV, 11, 2);

    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2));
    cv.morphologyEx(thresh, thresh, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let count = 0;
    for (let i = 0; i < contours.size(); ++i) {
      const area = cv.contourArea(contours.get(i));
      if (area > minArea) {
        count++;
        const rect = cv.boundingRect(contours.get(i));
        cv.rectangle(src, rect.tl(), rect.br(), new cv.Scalar(0, 255, 0, 255), 2);
      }
    }

    cv.imshow(canvas, src);
    countEl.textContent = count;
    updateStatus(`✅ Processamento concluído. Contagem estimada: ${count} grilos.`);

    src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete(); kernel.delete();
  } catch (err) {
    updateStatus('❌ Erro: ' + err.message);
    console.error(err);
  }
}