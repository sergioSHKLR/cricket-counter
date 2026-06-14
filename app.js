let cvReady = false;
let cvInstance = null;

const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const thresholdSlider = document.getElementById('threshold');
const minAreaSlider = document.getElementById('minArea');
const thresholdValue = document.getElementById('thresholdValue');
const minAreaValue = document.getElementById('minAreaValue');

// Improved OpenCV loading with better WASM support
function initializeOpenCV() {
    if (typeof cv !== 'undefined') {
        if (cv.getBuildInformation) {
            cvReady = true;
            cvInstance = cv;
            console.log('OpenCV.js carregado com sucesso (sincrono)');
        } else {
            // WASM version
            cv['onRuntimeInitialized'] = function() {
                cvReady = true;
                cvInstance = cv;
                console.log('OpenCV.js WASM runtime inicializado');
            };
        }
    }
}

// Update slider values
document.addEventListener('DOMContentLoaded', () => {
    thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);
    minAreaSlider.addEventListener('input', () => minAreaValue.textContent = minAreaSlider.value);

    // Periodic check for loading
    const checkInterval = setInterval(() => {
        if (cvReady) {
            clearInterval(checkInterval);
        }
    }, 800);

    initializeOpenCV();
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
        alert('OpenCV.js ainda está carregando. Aguarde mais alguns segundos e tente novamente.');
        return;
    }
    processImage();
});

function processImage() {
    if (!cvInstance) return;

    let src = cvInstance.imread(canvas);
    let gray = new cvInstance.Mat();
    cvInstance.cvtColor(src, gray, cvInstance.COLOR_RGBA2GRAY);

    const threshold = parseInt(thresholdSlider.value);
    const minArea = parseInt(minAreaSlider.value);

    let thresh = new cvInstance.Mat();
    cvInstance.threshold(gray, thresh, threshold, 255, cvInstance.THRESH_BINARY_INV);

    let contours = new cvInstance.MatVector();
    let hierarchy = new cvInstance.Mat();
    cvInstance.findContours(thresh, contours, hierarchy, cvInstance.RETR_EXTERNAL, cvInstance.CHAIN_APPROX_SIMPLE);

    let count = 0;
    for (let i = 0; i < contours.size(); ++i) {
        const area = cvInstance.contourArea(contours.get(i));
        if (area > minArea) {
            count++;
            const rect = cvInstance.boundingRect(contours.get(i));
            cvInstance.rectangle(src, rect.tl(), rect.br(), new cvInstance.Scalar(0, 255, 0, 255), 3);
        }
    }

    cvInstance.imshow(canvas, src);
    countEl.textContent = count;

    // Cleanup
    src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
}
