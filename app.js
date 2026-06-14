let cvReady = false;
const statusEl = document.getElementById('status');
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const thresholdSlider = document.getElementById('threshold');
const minAreaSlider = document.getElementById('minArea');
const thresholdValue = document.getElementById('thresholdValue');
const minAreaValue = document.getElementById('minAreaValue');

// Update slider values
thresholdSlider.oninput = () => thresholdValue.textContent = thresholdSlider.value;
minAreaSlider.oninput = () => minAreaValue.textContent = minAreaSlider.value;

document.addEventListener('DOMContentLoaded', () => {
    const cvScript = document.querySelector('script[src*="opencv.js"]');
    if (cvScript) {
        cvScript.onload = () => {
            if (typeof cv !== 'undefined') {
                cv.onRuntimeInitialized = () => {
                    cvReady = true;
                    statusEl.textContent = 'OpenCV.js Carregado com sucesso! Você pode processar a imagem.';
                    console.log('OpenCV.js pronto');
                };
            }
        };
    }
});

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
        alert('OpenCV.js ainda carregando. Aguarde um momento.');
        return;
    }
    processImage();
});

function processImage() {
    try {
        const src = cv.imread(canvas);
        const gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        const threshold = parseInt(thresholdSlider.value);
        const minArea = parseInt(minAreaSlider.value);

        const thresh = new cv.Mat();
        cv.threshold(gray, thresh, threshold, 255, cv.THRESH_BINARY_INV);

        // Morphological operations
        const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        cv.morphologyEx(thresh, thresh, cv.MORPH_OPEN, kernel);
        cv.morphologyEx(thresh, thresh, cv.MORPH_CLOSE, kernel);

        const contours = new cv.MatVector();
        const hierarchy = new cv.Mat();
        cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

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

        // Cleanup
        src.delete();
        gray.delete();
        thresh.delete();
        contours.delete();
        hierarchy.delete();
        kernel.delete();
    } catch (e) {
        console.error(e);
        alert('Erro no processamento: ' + e.message);
    }
}