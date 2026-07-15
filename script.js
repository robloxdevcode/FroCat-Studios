const themeToggle = document.getElementById('themeToggle');
const progressBar = document.getElementById('progressBar');

if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('light');
    const isLight = document.body.classList.contains('light');
    themeToggle.textContent = isLight ? 'Switch to dark' : 'Switch vibe';
  });
}

const updateProgress = () => {
  const scrollTop = window.scrollY;
  const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
  const percentage = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 0;
  if (progressBar) {
    progressBar.style.width = `${Math.min(100, Math.max(0, percentage))}%`;
  }
};

window.addEventListener('scroll', updateProgress);
window.addEventListener('load', updateProgress);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.2 }
);

document.querySelectorAll('.reveal').forEach((item) => observer.observe(item));

const container = document.getElementById('globeScene');
const canvas = document.getElementById('globeCanvas');

if (container && canvas) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const particles = [];
  const rotation = { x: -0.3, y: 0.35 };
  const speed = 0.24;

  const isLand = (lat, lon) => {
    const normalizedLon = ((lon + 180) % 360 + 360) % 360 - 180;
    const regions = [
      { lat: [8, 72], lon: [-170, -55] },
      { lat: [-60, 15], lon: [-95, -30] },
      { lat: [-35, 70], lon: [-25, 60] },
      { lat: [-15, 75], lon: [60, 180] },
      { lat: [-45, 10], lon: [100, 160] },
      { lat: [-12, 16], lon: [165, 180] },
      { lat: [-35, 10], lon: [20, 65] },
      { lat: [-10, 20], lon: [-20, 25] }
    ];

    return regions.some((region) => lat >= region.lat[0] && lat <= region.lat[1] && normalizedLon >= region.lon[0] && normalizedLon <= region.lon[1]);
  };

  const latLonToPoint = (lat, lon) => {
    const theta = (90 - lat) * (Math.PI / 180);
    const phi = lon * (Math.PI / 180);
    return {
      x: Math.cos(theta) * Math.cos(phi),
      y: Math.sin(theta),
      z: Math.cos(theta) * Math.sin(phi)
    };
  };

  for (let i = 0; i < 24000 && particles.length < 11000; i += 1) {
    const lat = (Math.random() - 0.5) * 180;
    const lon = (Math.random() - 0.5) * 360;

    if (!isLand(lat, lon)) continue;

    particles.push(latLonToPoint(lat, lon));
  }

  const project = (point, rotationY, rotationX, width, height) => {
    const cosY = Math.cos(rotationY);
    const sinY = Math.sin(rotationY);
    const cosX = Math.cos(rotationX);
    const sinX = Math.sin(rotationX);

    let x = point.x * cosY + point.z * sinY;
    let z = -point.x * sinY + point.z * cosY;
    let y = point.y * cosX - z * sinX;
    z = point.y * sinX + z * cosX;

    const depth = z + 2.75;
    const scaleFactor = 1.35 / depth;

    return {
      x: x * scaleFactor * 128 + width / 2,
      y: y * scaleFactor * 128 + height / 2,
      depth,
      size: Math.max(0.7, 2.0 - depth * 0.38)
    };
  };

  const resize = () => {
    const width = container.clientWidth;
    const height = container.clientHeight;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  };

  const render = (deltaTime) => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    ctx.clearRect(0, 0, width, height);

    ctx.save();
    ctx.translate(width / 2, height / 2);
    const glow = ctx.createRadialGradient(0, 0, 24, 0, 0, 122);
    glow.addColorStop(0, 'rgba(255,255,255,0.18)');
    glow.addColorStop(0.45, 'rgba(255,255,255,0.08)');
    glow.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.beginPath();
    ctx.arc(0, 0, 122, 0, Math.PI * 2);
    ctx.fillStyle = glow;
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.beginPath();
    ctx.arc(0, 0, 109, 0, Math.PI * 2);
    ctx.strokeStyle = 'rgba(255,255,255,0.24)';
    ctx.lineWidth = 1.35;
    ctx.stroke();
    ctx.restore();

    rotation.y += speed * deltaTime;

    const visible = particles
      .map((point) => ({ ...point, projection: project(point, rotation.y, rotation.x, width, height) }))
      .filter((item) => item.projection.depth > 0.3);

    visible.sort((a, b) => b.projection.depth - a.projection.depth);

    visible.forEach((item, index) => {
      const { projection } = item;
      const alpha = 0.7 + (index % 5) * 0.04;
      ctx.beginPath();
      ctx.arc(projection.x, projection.y, projection.size * 0.45, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${Math.min(0.96, alpha)})`;
      ctx.fill();
    });
  };

  let lastTime = 0;
  const animate = (time) => {
    const deltaTime = (time - lastTime) / 1000 || 0.016;
    lastTime = time;
    render(deltaTime);
    requestAnimationFrame(animate);
  };

  resize();
  window.addEventListener('resize', resize);
  animate(0);
}
