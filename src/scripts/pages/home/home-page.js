import { getAllStories } from '../../data/api';
import L from 'leaflet';
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

export default class HomePage {
  #map = null;
  #stories = []; // Simpan data cerita di sini

  async render() {
    return `
      <section class="container">
        <h1>Stories Map</h1>
        <div id="map-container"></div>
        <a href="#/add-story" class="btn" id="add-story-button">Add New Story</a>
        <h2>Stories List</h2>
        <div id="stories-list-container">
          <p>Loading stories...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Anda harus login terlebih dahulu!');
      window.location.hash = '#/login';
      return;
    }
    const map = this._initializeMap();
    const storiesContainer = document.querySelector('#stories-list-container');
    
    try {
      console.log('Mencoba mengambil data dari API...');
      const stories = await getAllStories(token);
      this.#stories = stories; // Simpan cerita ke properti class
      
      console.log('Berhasil! Data dari API:', stories);
      this._renderStories(storiesContainer, stories);
      this._addMarkersToMap(map, stories);
      
      console.log('Menyimpan data ke IndexedDB...');
      await DatabaseHelper.clearStories();
      await DatabaseHelper.putStories(stories);
      console.log('Data berhasil disimpan di IndexedDB.');
    } catch (error) {
      console.warn('Gagal mengambil dari API. Mencoba mengambil dari IndexedDB...', error);
      const stories = await DatabaseHelper.getAllStories();
      this.#stories = stories; // Ambil cerita dari cache
      
      if (stories && stories.length > 0) {
        console.log('Berhasil! Menampilkan data dari IndexedDB:', stories);
        this._renderStories(storiesContainer, stories);
        this._addMarkersToMap(map, stories);
      } else {
        console.error('Offline dan IndexedDB kosong.', error);
        storiesContainer.innerHTML = `<p>Anda sedang offline dan data belum tersimpan.</p>`;
      }
    }
    
    this._attachFavoriteButtonListeners();
  }

  _initializeMap() {
    if (this.#map) {
      this.#map.remove();
      this.#map = null;
    }
    const map = L.map('map-container').setView([-2.5489, 118.0149], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(map);
    this.#map = map; 
    return map;
  }

  _addMarkersToMap(map, stories) {
    stories.forEach(story => {
      if (story.lat && story.lon) {
        const marker = L.marker([story.lat, story.lon]).addTo(map);
        marker.bindPopup(`
          <div class="popup-content">
            <img src="${story.photoUrl}" alt="${story.name}" style="width:100px;">
            <p>${story.description}</p>
          </div>
        `);
      }
    });
  }

  _renderStories(storiesContainer, stories) {
    storiesContainer.innerHTML = '';
    if (stories.length === 0) {
      storiesContainer.innerHTML = '<p>Tidak ada cerita untuk ditampilkan.</p>';
      return;
    }

    stories.forEach(story => {
      storiesContainer.innerHTML += `
        <article class="story-item">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-image">
          <div class="story-details">
            <h3 class="story-name">${story.name}</h3>
            <p class="story-description">${story.description}</p>
            <p class="story-date">Dibuat pada: ${new Date(story.createdAt).toLocaleDateString()}</p>
            
            <button 
              type="button" 
              class="btn-favorite" 
              aria-label="Tambahkan ke favorit" 
              data-id="${story.id}">
              ❤️
            </button>

          </div>
        </article>
      `;
    });
  }
  
  _attachFavoriteButtonListeners() {
    const favoriteButtons = document.querySelectorAll('.btn-favorite');
    favoriteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.dataset.id;
        
        // Cari cerita lengkap dari data yang sudah kita simpan
        const storyToFavorite = this.#stories.find(story => story.id === storyId);
        
        if (storyToFavorite) {
          try {
            await DatabaseHelper.addFavorite(storyToFavorite);
            alert('Cerita berhasil ditambahkan ke Favorit!');
            event.target.disabled = true;
            event.target.innerText = '✅';
          } catch (error) {
            console.error('Gagal menambah favorit:', error);
            alert('Gagal menyimpan ke favorit.');
          }
        }
      });
    });
  }
}
