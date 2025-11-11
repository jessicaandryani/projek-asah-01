import DatabaseHelper from '../../utils/database-helper';

export default class FavoritePage {
  async render() {
    return `
      <section class="container">
        <h1>Favorite Stories</h1>
        <div id="favorite-list-container">
          <p>Loading favorite stories...</p>
        </div>
      </section>
    `;
  }

  async afterRender() {
    const storiesContainer = document.querySelector('#favorite-list-container');

    try {
      const favoriteStories = await DatabaseHelper.getAllFavorites();
      
      this._renderFavoriteStories(storiesContainer, favoriteStories);
      this._attachDeleteButtonListeners(storiesContainer);
      
    } catch (error) {
      console.error('Gagal memuat favorit:', error);
      storiesContainer.innerHTML = '<p>Gagal memuat daftar favorit.</p>';
    }
  }

  _renderFavoriteStories(container, stories) {
    container.innerHTML = '';
    
    if (stories.length === 0) {
      container.innerHTML = '<p>Kamu belum punya cerita favorit.</p>';
      return;
    }

    stories.forEach(story => {
      container.innerHTML += `
        <article class="story-item" id="story-${story.id}">
          <img src="${story.photoUrl}" alt="Foto cerita oleh ${story.name}" class="story-image">
          <div class="story-details">
            <h3 class="story-name">${story.name}</h3>
            <p class="story-description">${story.description}</p>
            <p class="story-date">Dibuat pada: ${new Date(story.createdAt).toLocaleDateString()}</p>
            
            <button 
              type="button" 
              class="btn-delete-favorite" 
              aria-label="Hapus dari favorit" 
              data-id="${story.id}">
              Hapus ❌
            </button>

          </div>
        </article>
      `;
    });
  }

  _attachDeleteButtonListeners(container) {
    const deleteButtons = container.querySelectorAll('.btn-delete-favorite');
    deleteButtons.forEach(button => {
      button.addEventListener('click', async (event) => {
        const storyId = event.target.dataset.id;
        
        try {
          await DatabaseHelper.deleteFavorite(storyId);
          alert('Cerita berhasil dihapus dari Favorit!');
          
          const storyElement = document.querySelector(`#story-${storyId}`);
          if (storyElement) {
            storyElement.remove();
          }
          
          if (container.children.length === 0) {
            container.innerHTML = '<p>Kamu belum punya cerita favorit.</p>';
          }
          
        } catch (error) {
          console.error('Gagal menghapus favorit:', error);
          alert('Gagal menghapus cerita dari favorit.');
        }
      });
    });
  }
}
