import { openDB } from 'idb';
import CONFIG from '../config';

const DATABASE_NAME = 'story-app-database';
const DATABASE_VERSION = 2;
const OBJECT_STORE_NAME = 'stories';
const OBJECT_STORE_OUTBOX_NAME = 'outbox_stories';

const dbPromise = openDB(DATABASE_NAME, DATABASE_VERSION, {
  upgrade(database, oldVersion) {
    if (oldVersion < 1) {
      database.createObjectStore(OBJECT_STORE_NAME, { keyPath: 'id' });
    }
    if (oldVersion < 2) {
      database.createObjectStore(OBJECT_STORE_OUTBOX_NAME, { autoIncrement: true, keyPath: 'id' });
    }
  },
});

const DatabaseHelper = {
  async getAllStories() {
    return (await dbPromise).getAll(OBJECT_STORE_NAME);
  },

  async clearStories() {
    return (await dbPromise).clear(OBJECT_STORE_NAME);
  },

  async putStories(stories) {
    const tx = (await dbPromise).transaction(OBJECT_STORE_NAME, 'readwrite');
    await Promise.all(
      stories.map((story) => {
        return tx.store.put(story);
      }),
    );
    return tx.done;
  },

  async putOutboxStory(story) {
    return (await dbPromise).put(OBJECT_STORE_OUTBOX_NAME, story);
  },

  async getAllOutboxStories() {
    return (await dbPromise).getAll(OBJECT_STORE_OUTBOX_NAME);
  },
  
  async deleteOutboxStory(id) {
    return (await dbPromise).delete(OBJECT_STORE_OUTBOX_NAME, id);
  },
};

export default DatabaseHelper;
