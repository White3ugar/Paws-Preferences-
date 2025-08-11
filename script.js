const NUM_CATS = 5;
const cardContainer = document.getElementById('card-container');
const summary = document.getElementById('summary');
const restartBtn = document.getElementById('restart');
const leftIndicator = document.getElementById('left-indicator');
const rightIndicator = document.getElementById('right-indicator');

let catImages = [];
let likedCats = [];

function createCard(url) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.backgroundImage = `url(${url})`;

  let offsetX = 0;
  let startX = 0;
  let isDragging = false;

  const leftIndicator = document.getElementById('left-indicator');
  const rightIndicator = document.getElementById('right-indicator');

  const SWIPE_THRESHOLD = 100; // px for full activation

  function updateIndicators() {
    const progress = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1);
    if (offsetX < 0) {
      leftIndicator.style.opacity = 0.2 + progress * 0.8;
      rightIndicator.style.opacity = 0.2;
    } else if (offsetX > 0) {
      rightIndicator.style.opacity = 0.2 + progress * 0.8;
      leftIndicator.style.opacity = 0.2;
    } else {
      leftIndicator.style.opacity = 0.2;
      rightIndicator.style.opacity = 0.2;
    }
  }

  // Touch events
  card.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener('touchmove', (e) => {
    offsetX = e.touches[0].clientX - startX;
    card.style.transform = `translateX(${offsetX}px) rotate(${offsetX * 0.1}deg)`;
    updateIndicators();
  });

  card.addEventListener('touchend', () => {
    handleSwipeEnd(card, offsetX);
    offsetX = 0;
    updateIndicators();
  });

  // Mouse events
  card.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    card.style.transition = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    card.style.transform = `translateX(${offsetX}px) rotate(${offsetX * 0.1}deg)`;
    updateIndicators();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = '';
    handleSwipeEnd(card, offsetX);
    offsetX = 0;
    updateIndicators();
  });

  // set default "always visible but dim" state
  leftIndicator.style.opacity = 0.2;
  rightIndicator.style.opacity = 0.2;

  return card;
}

function handleSwipeEnd(card, offsetX) {
  if (offsetX < -100) {  // Left swipe to like
    likeCard(card);      
  } else if (offsetX > 100) {  // Right swipe to dislike
    dislikeCard(card);  
  } else {
    card.style.transform = '';
  }
}

function likeCard(card) {
  const url = card.style.backgroundImage.slice(5, -2);
  likedCats.push(url);
  card.style.transform = 'translateX(-100vw)';
  card.style.opacity = 0;
  removeCard(card);
}

function dislikeCard(card) {
  card.style.transform = 'translateX(100vw)';
  card.style.opacity = 0;
  removeCard(card);
}

function removeCard(card) {
  setTimeout(() => {
    card.remove();
    if (cardContainer.childElementCount === 0) {
      showSummary();
    }
  }, 300);
}

function showSummary() {
  summary.style.display = 'block';
  restartBtn.style.display = 'inline-block';

  summary.innerHTML = `
    <h2>You liked ${likedCats.length} cats!</h2>
    ${likedCats.map((url, i) =>
      `<img class="liked-img" src="${url}" data-index="${i}" />`
    ).join('')}
  `;

  // Show first liked cat in card position
  if (likedCats.length > 0) {
    displayCatInCard(likedCats[0]);
  }

  // Make summary images clickable
  document.querySelectorAll('.liked-img').forEach(img => {
    img.addEventListener('click', () => {
      const index = img.getAttribute('data-index');
      displayCatInCard(likedCats[index]);
    });
  });
}

function displayCatInCard(url) {
  cardContainer.innerHTML = ''; // clear previous card
  const card = document.createElement('div');
  card.className = 'card';
  card.style.backgroundImage = `url(${url})`;
  card.style.transform = ''; // reset position/rotation
  cardContainer.appendChild(card);
}

async function loadCats() {
  summary.style.display = 'none';
  restartBtn.style.display = 'none';
  likedCats = [];
  cardContainer.innerHTML = '';

  // Show loading text
  document.getElementById('loading').style.display = 'block';

  const fetchedUrls = new Set();

  async function fetchUniqueCat() {
    let tries = 0;
    while (tries < 10) {
      const res = await fetch('https://cataas.com/cat?json=true');
      const data = await res.json();
      const url = data.url;

      if (!fetchedUrls.has(url)) {
        fetchedUrls.add(url);
        return url;
      }
      tries++;
    }
    console.warn('Could not find a unique cat after retries.');
    return null;
  }

  const promises = [];
  for (let i = 0; i < NUM_CATS; i++) {
    promises.push(fetchUniqueCat());
  }

  const urls = (await Promise.all(promises)).filter(Boolean);

  // Preload images before displaying
  await Promise.all(
    urls.map(
      (url) =>
        new Promise((resolve, reject) => {
          const img = new Image();
          img.src = url;
          img.onload = resolve;
          img.onerror = reject;
        })
    )
  );

  catImages = urls.reverse();

  // Hide loading text
  document.getElementById('loading').style.display = 'none';

  // Now that all are loaded, display cards
  catImages.forEach((url, index) => {
    const card = createCard(url);
    card.style.zIndex = catImages.length - index;
    cardContainer.appendChild(card);
  });
}

restartBtn.addEventListener('click', loadCats);

// Start
loadCats();
