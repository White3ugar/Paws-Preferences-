const NUM_CATS = 10;
const cardContainer = document.getElementById('card-container');
const summary = document.getElementById('summary');
const restartBtn = document.getElementById('restart');
const leftIndicator = document.getElementById('left-indicator');
const rightIndicator = document.getElementById('right-indicator');
const likeSound = document.getElementById('like-sound');
const dislikeSound = document.getElementById('dislike-sound');
const bgm = document.getElementById('bgm');
bgm.volume = 0.2;

let catImages = [];
let likedCats = [];
let hintTimeout;

// Play background music on page load, if cannot autoplay, wait for user interaction
bgm.play().catch(() => {
  // Autoplay was blocked, play on first user interaction
  function playOnInteraction() {
    bgm.play();
    document.removeEventListener('click', playOnInteraction);
  }
  document.addEventListener('click', playOnInteraction);
});

// Create a card element with swipe functionality
// Each card will display a cat image and allow swiping left or right
function createCard(url) {
  const card = document.createElement('div');
  card.className = 'card';
  card.style.backgroundImage = `url(${url})`;

  // Add swipe hints inside the card
  const likeHint = document.createElement('div');
  likeHint.className = 'swipe-hint like-hint';
  likeHint.textContent = '❤️';

  const dislikeHint = document.createElement('div');
  dislikeHint.className = 'swipe-hint dislike-hint';
  dislikeHint.textContent = '❌';

  card.appendChild(likeHint);
  card.appendChild(dislikeHint);

  let offsetX = 0;
  let startX = 0;
  let isDragging = false;

  const SWIPE_THRESHOLD = 100;

  // Update indicators based on swipe direction
  function updateIndicators() {
    const progress = Math.min(Math.abs(offsetX) / SWIPE_THRESHOLD, 1); // normalize to 0-1
    if (offsetX < 0) { // left swipe
      likeHint.style.opacity = progress;   // show ❤️
      dislikeHint.style.opacity = 0;
    } else if (offsetX > 0) { // right swipe
      dislikeHint.style.opacity = progress; // show ❌
      likeHint.style.opacity = 0;
    } else {
      likeHint.style.opacity = 0;
      dislikeHint.style.opacity = 0;
    }
  }

  // Touch events
  card.addEventListener('touchstart', stopHints);
  card.addEventListener('touchstart', (e) => {
    startX = e.touches[0].clientX;
  });

  card.addEventListener('touchmove', (e) => {
    offsetX = e.touches[0].clientX - startX;
    card.style.transform = `translateX(${offsetX}px) rotate(${offsetX * 0.1}deg)`;
    updateIndicators();
    resetHintTimer();
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
    stopHints();
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    offsetX = e.clientX - startX;
    card.style.transform = `translateX(${offsetX}px) rotate(${offsetX * 0.1}deg)`;
    updateIndicators();
    resetHintTimer();
  });

  document.addEventListener('mouseup', () => {
    if (!isDragging) return;
    isDragging = false;
    card.style.transition = '';
    handleSwipeEnd(card, offsetX);
    offsetX = 0;
    updateIndicators();
  });

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
    likeSound.currentTime = 0;  // rewind to start
    likeSound.volume = 0.5;
    likeSound.play();

    const url = card.style.backgroundImage.slice(5, -2);
    likedCats.push(url);
    card.style.transform = 'translateX(-100vw)';
    card.style.opacity = 0;
    removeCard(card);
    showSparkle('left');
}

function dislikeCard(card) {
    dislikeSound.currentTime = 0;  // rewind to start
    dislikeSound.play();

    card.style.transform = 'translateX(100vw)';
    card.style.opacity = 0;
    removeCard(card);
    showSparkle('right');
}

function removeCard(card) {
    setTimeout(() => {
        card.remove();
        if (cardContainer.childElementCount === 0) {
        showSummary();
        } else {
        startHintTimer(); // reset timer for the next card
        }
    }, 300);
}

function showSparkle(side) {
    const sparkle = side === 'left' ? document.getElementById('sparkle-left') : document.getElementById('sparkle-right');
    if (!sparkle) return;
    
    sparkle.style.animation = 'none';  // reset animation
    sparkle.style.opacity = '1';
    
    // force reflow to restart animation
    void sparkle.offsetWidth;
    
    sparkle.style.animation = 'sparkleAnim 1s ease forwards';
}

function showSummary() {
    clearTimeout(hintTimeout);  // Stop hint timer

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

        // Remove any hint animations from this summary card
        const card = document.querySelector('.card');
        if (card) {
            card.classList.remove('show-hints');
            const likeHint = card.querySelector('.like-hint');
            const dislikeHint = card.querySelector('.dislike-hint');
            if (likeHint && dislikeHint) {
                likeHint.style.opacity = 0;
                dislikeHint.style.opacity = 0;
            }
        }
    }

    // Make summary images clickable
    document.querySelectorAll('.liked-img').forEach(img => {
        img.addEventListener('click', () => {
            const index = img.getAttribute('data-index');
            displayCatInCard(likedCats[index]);

            // Also clear hints for this new card shown on click
            const card = document.querySelector('.card');
            if (card) {
                card.classList.remove('show-hints');
                const likeHint = card.querySelector('.like-hint');
                const dislikeHint = card.querySelector('.dislike-hint');
                if (likeHint && dislikeHint) {
                    likeHint.style.opacity = 0;
                    dislikeHint.style.opacity = 0;
                }
            }
        });
    });
}

// Display the first liked cat in the card position
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

    startHintTimer();
}

function resetHintTimer() {
    clearTimeout(hintTimeout);
    startHintTimer();
}

function startHintTimer() {
    clearTimeout(hintTimeout);
    hintTimeout = setTimeout(() => {
        const card = document.querySelector('.card');
        if (card) {
            card.classList.add('show-hints');
            const likeHint = card.querySelector('.like-hint');
            const dislikeHint = card.querySelector('.dislike-hint');
            if (likeHint && dislikeHint) {
                likeHint.style.opacity = 0.6;
                dislikeHint.style.opacity = 0.6;
            }
        }
    }, 5000);
}

function stopHints() {
    const card = document.querySelector('.card');
    if (card) {
        card.classList.remove('show-hints');
        const likeHint = card.querySelector('.like-hint');
        const dislikeHint = card.querySelector('.dislike-hint');
        if (likeHint && dislikeHint) {
            likeHint.style.opacity = 0;
            dislikeHint.style.opacity = 0;
        }
    }
    clearTimeout(hintTimeout);
    startHintTimer();
}


// Start
loadCats();

// Stop hints when user interacts
document.addEventListener('touchstart', stopHints);
document.addEventListener('mousedown', stopHints);
restartBtn.addEventListener('click', () => loadCats());