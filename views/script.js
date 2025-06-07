// Handle paste button functionality
const pasteButton = document.getElementById('paste-button');
const videoUrlInput = document.getElementById('video-url');
const downloadForm = document.getElementById('download-form');
const loadingSpinner = document.getElementById('loading');
const resultContainer = document.getElementById('result');

// Function to toggle paste/clear button
function togglePasteButton() {
    const icon = pasteButton.querySelector('i');
    if (videoUrlInput.value) {
        icon.classList.replace('fa-paste', 'fa-times');
        pasteButton.setAttribute('title', 'Clear');
    } else {
        icon.classList.replace('fa-times', 'fa-paste');
        pasteButton.setAttribute('title', 'Paste');
    }
}

// Handle paste button click
pasteButton.addEventListener('click', async () => {
    if (videoUrlInput.value) {
        videoUrlInput.value = '';
    } else {
        try {
            // Meminta izin clipboard
            await navigator.permissions.query({ name: 'clipboard-read' }).then(async (result) => {
                if (result.state === 'granted' || result.state === 'prompt') {
                    const text = await navigator.clipboard.readText();
                    videoUrlInput.value = text;
                } else {
                    console.error('Clipboard read permission denied');
                    showAlert('Clipboard read permission denied', 'danger');
                }
            });
        } catch (err) {
            console.error('Failed to read clipboard:', err);
            showAlert('Failed to read clipboard contents', 'danger');
        }
    }
    togglePasteButton();
});

// Handle form submission
downloadForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    const url = videoUrlInput.value;
    loadingSpinner.style.display = 'block';

    try {
        // Encrypt URL
        const encryptedUrl = encryptURL(url);
        const response = await $.ajax({
            url: '/api/uplink',
            method: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({ url, hash: encryptedUrl }),
            dataType: 'json',
            headers: {
                'X-apikey': await generateApikey()
            }
        });

        if (response.data.images) {
            // Handle image content
            const htmlContent = generateImageContent(response.data);
            updateUI(htmlContent);
            showAlert('Images fetched successfully!', 'success');
        } else if (response.msg === 'success') {
            // Handle video content
            const htmlContent = generateVideoContent(response.data);
            updateUI(htmlContent);
            showAlert('Video fetched successfully!', 'success');
        } else {
            showAlert(response.msg, 'danger');
        }
    } catch (error) {
        console.error('Failed to fetch data:', error);
        showAlert('Failed to fetch video data', 'danger');
    } finally {
        loadingSpinner.style.display = 'none';
    }
});

// Generate HTML content for images
function generateImageContent(data) {
    return `
        <img id="video-thumbnail" src="${data.cover}" alt="Video Thumbnail">
        <div class="video-description">
            <h3 id="video-title">${data.title}</h3>
            <p id="video-author">Author: ${data.author.unique_id}</p>
            <p id="video-likes">${formatViews(data.digg_count)} Likes</p>
            <p id="video-views">${formatViews(data.play_count)} Views</p>
        </div>
        <a id="download-music" href="${data.music}" target="_blank">
            <button>Download Music</button>
        </a>
        ${data.images.map((element, index) => `
            <a id="download-link-no-wm" href="${element}" target="_blank">
                <button>Unduh Foto ${index + 1}</button>
            </a>
        `).join('')}
    `;
}

// Generate HTML content for videos
function generateVideoContent(data) {
    return `
        <img id="video-thumbnail" src="${data.cover}" alt="Video Thumbnail">
        <div class="video-description">
            <h3 id="video-title">${data.title}</h3>
            <p id="video-author">Author: ${data.author.unique_id}</p>
            <p id="video-likes">${formatViews(data.digg_count)} Likes</p>
            <p id="video-views">${formatViews(data.play_count)} Views</p>
        </div>
        <a id="download-link-no-wm" href="${data.play}" target="_blank">
            <button>Download Video No WM</button>
        </a>
        <a id="download-link-wm" href="${data.wmplay}" target="_blank">
            <button>Download Video With WM</button>
        </a>
        <a id="download-music" href="${data.music}" target="_blank">
            <button>Download Music Video</button>
        </a>
    `;
}

// Update UI with content
function updateUI(htmlContent) {
    resultContainer.innerHTML = htmlContent;
    resultContainer.style.display = 'block';
}

// Monitor input changes for paste button toggle
videoUrlInput.addEventListener('input', togglePasteButton);

// Function to show alert messages
function showAlert(message, type) {
    const alertContainer = document.getElementById('alert-container');
    const alertHTML = `
        <div class="alert alert-${type} alert-dismissible fade show" role="alert">
            ${message}
            <button type="button" class="close" data-dismiss="alert" aria-label="Close">
                <span aria-hidden="true">&times;</span>
            </button>
        </div>
    `;
    alertContainer.innerHTML = alertHTML;
}

// encrypt URL
function encryptURL(url) {
    // Enkripsi URL menggunakan AES
    const date_minute = new Date().getMinutes();
    const secretKey = 'allxddev';
    const encrypted = CryptoJS.AES.encrypt(`${url}-abc:${date_minute}`, secretKey).toString();
    return encodeURIComponent(encrypted); // Encode agar aman untuk URL
}

// views
function formatViews(views) {
    if (views < 1000) return views.toString();
    const units = ['K', 'M', 'B', 'T'];
    const unitIndex = Math.floor((views.toString().length - 1) / 3);
    const shortNumber = (views / Math.pow(1000, unitIndex)).toFixed(1);
    return shortNumber + units[unitIndex - 1];
}

// generate apikey
function generateApikey() {
  const secretKey = 'allxddev';
  const currentMinute = new Date().getUTCMinutes();
  const apikeyS = CryptoJS.HmacSHA256(currentMinute.toString(), secretKey).toString(CryptoJS.enc.Hex);
  return apikeyS
}
