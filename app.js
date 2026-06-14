let cvReady = false;
const statusEl = document.getElementById('status');

document.addEventListener('DOMContentLoaded', () => {
    const opencvScript = document.querySelector('script[src="opencv.js"]');
    if (opencvScript) {
        opencvScript.onload = () => {
            if (typeof cv !== 'undefined' && cv.onRuntimeInitialized) {
                cv.onRuntimeInitialized = () => {
                    cvReady = true;
                    statusEl.textContent = 'OpenCV.js Carregado com sucesso! Você pode processar a imagem.';
                    console.log('OpenCV.js initialized');
                };
            } else {
                cvReady = true;
                statusEl.textContent = 'OpenCV.js Carregado (sem WASM detectado).';
            }
        };
    }
});

const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');

const thresholdSlider = document.getElementById('threshold');
const minAreaSlider = document.getElementById('minArea');
const thresholdValue = document.getElementById('thresholdValue');
const minAreaValue = document.getElementById('minAreaValue');

thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);
minAreaSlider.addEventListener('input', () => minAreaValue.textContent = minAreaSlider.value);

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
        let src = cv.imread(canvas);
        let gray = new cv.Mat();
        cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

        let threshold = parseInt(thresholdSlider.value);
        let minArea = parseInt(minAreaSlider.value);

        let thresh = new cv.Mat();
        cv.threshold(gray, thresh, threshold, 255, cv.THRESH_BINARY_INV);

        // Morphology to clean up
        let kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(3, 3));
        let opened = new cv.Mat();
        cv.morphologyEx(thresh, opened, cv.MORPH_OPEN, kernel);

        let contours = new cv.MatVector();
        let hierarchy = new cv.Mat();
        cv.findContours(opened, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

        let count = 0;
        for (let i = 0; i < contours.size(); ++i) {
            let area = cv.contourArea(contours.get(i));
            if (area > minArea) {
                count++;
                let rect = cv.boundingRect(contours.get(i));
                let point1 = new cv.Point(rect.x, rect.y);
                let point2 = new cv.Point(rect.x + rect.width, rect.y + rect.height);
                cv.rectangle(src, point1, point2, new cv.Scalar(0, 255, 0, 255), 2);
            }
        }

        cv.imshow(canvas, src);
        countEl.textContent = count;

        // Cleanup
        src.delete(); gray.delete(); thresh.delete(); opened.delete(); contours.delete(); hierarchy.delete(); kernel.delete();
    } catch (e) {
        console.error(e);
        alert('Erro no processamento: ' + e.message);
    }
}