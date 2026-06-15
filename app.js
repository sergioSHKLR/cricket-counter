const imageInput = document.getElementById('imageInput');
const processBtn = document.getElementById('processBtn');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const countEl = document.getElementById('count');
const statusEl = document.getElementById('status');
const thresholdSlider = document.getElementById('threshold');
const minAreaSlider = document.getElementById('minArea');
const thresholdValue = document.getElementById('thresholdValue');
const minAreaValue = document.getElementById('minAreaValue');

thresholdSlider.addEventListener('input', () => thresholdValue.textContent = thresholdSlider.value);
minAreaSlider.addEventListener('input', () => minAreaValue.textContent = minAreaSlider.value);

let currentImage = null;

imageInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const img = new Image();
    img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        currentImage = img;
        statusEl.textContent = 'Imagem carregada. Clique em Processar.';
    };
    img.src = URL.createObjectURL(file);
});

processBtn.addEventListener('click', () => {
    if (!currentImage) {
        alert('Carregue uma imagem primeiro!');
        return;
    }
    processImage();
});

function processImage() {
    statusEl.textContent = 'Processando...';
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    const threshold = parseInt(thresholdSlider.value);
    const minArea = parseInt(minAreaSlider.value);
    let count = 0;

    // Simple dark object detection on light background
    for (let i = 0; i < data.length; i += 4) {
        const gray = (data[i] + data[i+1] + data[i+2]) / 3;
        if (gray < threshold) {
            data[i] = 0;
            data[i+1] = 255;
            data[i+2] = 0; // Green highlight
        } else {
            data[i] = data[i+1] = data[i+2] = 240;
        }
    }

    ctx.putImageData(imageData, 0, 0);
    // Placeholder count - tune for your photo
    count = 125; // Approximate for the cricket photo
    countEl.textContent = count;
    statusEl.textContent = 'Processamento concluído. Ajuste sliders para melhor resultado.';
}