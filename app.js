let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let imageInput = document.getElementById('imageInput');
let processBtn = document.getElementById('processBtn');
let countEl = document.getElementById('count');
let threshSlider = document.getElementById('threshold');
let minAreaSlider = document.getElementById('minArea');
let threshValue = document.getElementById('threshValue');
let areaValue = document.getElementById('areaValue');

threshSlider.oninput = () => threshValue.textContent = threshSlider.value;
minAreaSlider.oninput = () => areaValue.textContent = minAreaSlider.value;

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
  const src = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = src.data;
  const threshold = parseInt(threshSlider.value);
  const minArea = parseInt(minAreaSlider.value);

  // Simple grayscale and threshold
  for (let i = 0; i < data.length; i += 4) {
    const gray = (data[i] + data[i+1] + data[i+2]) / 3;
    const isCricket = gray < threshold;
    data[i] = data[i+1] = data[i+2] = isCricket ? 0 : 255;
    data[i+3] = 255;
  }

  ctx.putImageData(src, 0, 0);

  // Basic blob detection simulation
  let count = Math.floor(Math.random() * 30) + 100; // Placeholder - will improve
  countEl.textContent = count;
});
