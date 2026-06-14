let cvReady = false;
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const statusEl = document.getElementById('status');

// Improved OpenCV loading
function checkCvReady() {
  if (typeof cv !== 'undefined' && cv.getBuildInformation) {
    cvReady = true;
    if (statusEl) statusEl.textContent = 'OpenCV.js Carregado com sucesso! Você pode processar a imagem.';
    console.log('OpenCV.js pronto');
  } else {
    setTimeout(checkCvReady, 500);
  }
}

if (typeof cv !== 'undefined') {
  cv.onRuntimeInitialized = () => {
    cvReady = true;
    if (statusEl) statusEl.textContent = 'OpenCV.js Carregado com sucesso! Você pode processar a imagem.';
  };
} else {
  setTimeout(checkCvReady, 1000);
}

imageInput.addEventListener('change', (e) => {
  const file = e.target.files[0];
  if (!file) return;
  const img = new Image();
  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    ctx.drawImage(img, 0, 0);
  };
  img.src = URL.createObjectURL(file);
});

processBtn.addEventListener('click', () => {
  if (!cvReady) {
    alert('OpenCV.js ainda está carregando. Aguarde um momento.');
    return;
  }
  processImage();
});

function processImage() {
  try {
    const src = cv.imread(canvas);
    const gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    let threshold = parseInt(document.getElementById('threshold').value) || 80;
    let minArea = parseInt(document.getElementById('minArea').value) || 25;

    const thresh = new cv.Mat();
    cv.threshold(gray, thresh, threshold, 255, cv.THRESH_BINARY_INV);

    // Morphological operations to clean up
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
    const cleaned = new cv.Mat();
    cv.morphologyEx(thresh, cleaned, cv.MORPH_OPEN, kernel);
    cv.morphologyEx(cleaned, cleaned, cv.MORPH_CLOSE, kernel);

    const contours = new cv.MatVector();
    const hierarchy = new cv.Mat();
    cv.findContours(cleaned, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let count = 0;
    for (let i = 0; i < contours.size(); ++i) {
      const contour = contours.get(i);
      const area = cv.contourArea(contour);
      if (area > minArea) {
        count++;
        const rect = cv.boundingRect(contour);
        const pt1 = new cv.Point(rect.x, rect.y);
        const pt2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
        cv.rectangle(src, pt1, pt2, new cv.Scalar(0, 255, 0, 255), 2);
      }
    }

    cv.imshow(canvas, src);
    countEl.textContent = count;

    // Safe cleanup
    src.delete(); gray.delete(); thresh.delete(); cleaned.delete(); contours.delete(); hierarchy.delete();
    if (kernel) kernel.delete();

    console.log(`Contagem: ${count}`);
  } catch (e) {
    console.error('Erro no processamento:', e);
    alert('Erro ao processar imagem: ' + e.message);
  }
}