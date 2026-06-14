let cvReady = false;
const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const thresholdSlider = document.getElementById('threshold');
const minAreaSlider = document.getElementById('minArea');
const thresholdValue = document.getElementById('thresholdValue');
const minAreaValue = document.getElementById('minAreaValue');

// Update slider values display
document.addEventListener('DOMContentLoaded', () => {
    thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);
    minAreaSlider.addEventListener('input', () => minAreaValue.textContent = minAreaSlider.value);

    // Wait for OpenCV.js
    const checkCv = setInterval(() => {
        if (typeof cv !== 'undefined' && cv.getBuildInformation) {
            clearInterval(checkCv);
            cvReady = true;
            console.log('OpenCV.js carregado com sucesso');
        }
    }, 500);
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
        alert('OpenCV.js ainda está carregando. Aguarde um momento e tente novamente.');
        return;
    }
    processImage();
});

function processImage() {
    let src = cv.imread(canvas);
    let gray = new cv.Mat();
    cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY);

    const threshold = parseInt(thresholdSlider.value);
    const minArea = parseInt(minAreaSlider.value);

    let thresh = new cv.Mat();
    cv.threshold(gray, thresh, threshold, 255, cv.THRESH_BINARY_INV);

    let contours = new cv.MatVector();
    let hierarchy = new cv.Mat();
    cv.findContours(thresh, contours, hierarchy, cv.RETR_EXTERNAL, cv.CHAIN_APPROX_SIMPLE);

    let count = 0;
    for (let i = 0; i < contours.size(); ++i) {
        const area = cv.contourArea(contours.get(i));
        if (area > minArea) {
            count++;
            const rect = cv.boundingRect(contours.get(i));
            cv.rectangle(src, rect.tl(), rect.br(), new cv.Scalar(0, 255, 0, 255), 3);
        }
    }

    cv.imshow(canvas, src);
    countEl.textContent = count;

    // Memory cleanup
    src.delete(); gray.delete(); thresh.delete(); contours.delete(); hierarchy.delete();
}
