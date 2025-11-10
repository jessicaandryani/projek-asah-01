import L from 'leaflet';
import { addNewStory } from '../../data/api';
import DatabaseHelper from '../../utils/database-helper';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

export default class AddStoryPage {
  #map = null;
  #marker = null;
  #videoStream = null;
  #capturedPhotoFile = null;

  async render() {
    return `
      <section class="container">
        <h1>Add New Story</h1>
        <form id="add-story-form">
          <div class="form-group"> 
            <label for="story-description">Description:</label>
            <textarea id="story-description" class="form-control" rows="3" required></textarea>
          </div>
          <div class="form-group">
            <label for="story-photo">Photo (from file):</label>
            <input type="file" id="story-photo" class="form-control" accept="image/*">
            <small>Or use camera below.</small>
          </div>
          <div class="form-group">
            <button type="button" class="btn" id="open-camera-btn">Open Camera</button>
          </div>
          <div id="camera-container" class="camera-container" style="display: none;">
            <video id="camera-preview" autoplay playsinline></video>
            <button type="button" class="btn" id="capture-photo-btn">Jepret!</button>
          </div>
          <div id="photo-preview-container"></div>
          <p>Select location on the map:</p>
          <div id="map-picker" style="height: 300px; width: 100%;"></div> 
          <label for="story-lat" class="visually-hidden">Latitude</label>
          <input type="hidden" id="story-lat">
          <label for="story-lon" class="visually-hidden">Longitude</label>
          <input type="hidden" id="story-lon">
          <button type="submit" class="btn">Submit Story</button>
        </form>
      </section>
    `;
  }

  async afterRender() {
    this._initializeMapPicker();
    const openCameraBtn = document.querySelector('#open-camera-btn');
    openCameraBtn.addEventListener('click', () => {
      this._initializeCamera();
    });
    const capturePhotoBtn = document.querySelector('#capture-photo-btn');
    capturePhotoBtn.addEventListener('click', () => {
      this._takePhoto();
    });
    const addStoryForm = document.querySelector('#add-story-form');
    addStoryForm.addEventListener('submit', async (event) => {
      event.preventDefault();
      await this._handleSubmit(event);
    });
  }

  async _initializeCamera() {
    try {
      this.#videoStream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: 'environment' },
        audio: false 
      });
      const videoElement = document.querySelector('#camera-preview');
      videoElement.srcObject = this.#videoStream;
      document.querySelector('#camera-container').style.display = 'block';
      document.querySelector('#open-camera-btn').style.display = 'none';
    } catch (error) {
      console.error('Error accessing camera:', error);
      alert('Gagal mengakses kamera. Pastikan Anda memberi izin.');
    }
  }

  _takePhoto() {
    const videoElement = document.querySelector('#camera-preview');
    const previewContainer = document.querySelector('#photo-preview-container');
    const canvas = document.createElement('canvas');
    canvas.width = videoElement.videoWidth;
    canvas.height = videoElement.videoHeight;
    const context = canvas.getContext('2d');
    context.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
    previewContainer.innerHTML = '';
    previewContainer.appendChild(canvas);
    canvas.toBlob((blob) => {
      this.#capturedPhotoFile = new File([blob], 'captured_photo.jpg', { type: 'image/jpeg' });
      console.log('Photo captured!', this.#capturedPhotoFile);
      this._closeCamera();
    }, 'image/jpeg');
  }

  _closeCamera() {
    if (this.#videoStream) {
      this.#videoStream.getTracks().forEach(track => track.stop());
    }
    document.querySelector('#camera-container').style.display = 'none';
    document.querySelector('#open-camera-btn').style.display = 'block';
  }

  async _handleSubmit(event) {
    const token = localStorage.getItem('token');
    const description = document.querySelector('#story-description').value;
    const lat = document.querySelector('#story-lat').value;
    const lon = document.querySelector('#story-lon').value;

    let photo = this.#capturedPhotoFile; 
    if (!photo) {
      photo = document.querySelector('#story-photo').files[0];
    }

    if (!token || !description || !photo || !lat || !lon) {
      alert('Semua field (termasuk lokasi) wajib diisi!');
      return;
    }

    const submitButton = event.target.querySelector('button[type="submit"]');
    submitButton.innerText = 'Uploading...';
    submitButton.disabled = true;

    try {
      await addNewStory({ token, description, photo, lat, lon });
      
      alert('Story berhasil di-upload!');
      window.location.hash = '#/';
    } catch (error) {
      console.error('Upload gagal (Online):', error);
      
      const storyData = { token, description, photo, lat, lon };
      await DatabaseHelper.putOutboxStory(storyData);
      
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.sync.register('sync-new-stories');
        });
      }
      
      alert('Koneksi terputus. Cerita disimpan di Outbox dan akan di-upload saat kembali online.');
      window.location.hash = '#/';
    } finally {
      submitButton.innerText = 'Submit Story';
      submitButton.disabled = false;
      this.#capturedPhotoFile = null; 
    }
  }
  
  _initializeMapPicker() {
    const mapElement = document.querySelector('#map-picker');
    if (!mapElement) return;
    this.#map = L.map(mapElement).setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(this.#map);
    this.#map.on('click', (e) => this._handleMapClick(e));
  }

  _handleMapClick(event) {
    const { lat, lng } = event.latlng;
    document.querySelector('#story-lat').value = lat;
    document.querySelector('#story-lon').value = lng;
    if (this.#marker) {
      this.#marker.setLatLng(event.latlng);
    } else {
      this.#marker = L.marker(event.latlng).addTo(this.#map);
    }
    this.#marker.bindPopup('Lokasi cerita dipilih!').openPopup();
  }
}
