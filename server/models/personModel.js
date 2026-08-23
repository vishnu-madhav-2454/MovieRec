import axios from 'axios';
import dotenv from 'dotenv';

dotenv.config();

const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// In-memory cache
const cache = new Map();

const tmdbAxios = axios.create({
  timeout: 10000,
  headers: {
    'Authorization': `Bearer ${TMDB_API_KEY}`,
    'Content-Type': 'application/json'
  }
});

async function fetchWithRetry(url, retries = 3, delay = 1000) {
  for (let i = 0; i < retries; i++) {
    try {
      const response = await tmdbAxios.get(url);
      return response.data;
    } catch (error) {
      if (i === retries - 1) throw error;
      await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
    }
  }
}

class PersonModel {
  static hasApiKey() {
    return TMDB_API_KEY && TMDB_API_KEY !== 'your_tmdb_api_key_here';
  }

  /**
   * Get person details (bio, birthday, profile path, etc.)
   */
  static async getDetails(personId) {
    if (!this.hasApiKey()) {
      return this.getMockPerson(personId);
    }

    const cacheKey = `person_${personId}`;
    if (cache.has(cacheKey)) return cache.get(cacheKey);

    const [details, combinedCredits] = await Promise.all([
      fetchWithRetry(`${TMDB_BASE}/person/${personId}`),
      fetchWithRetry(`${TMDB_BASE}/person/${personId}/combined_credits`)
    ]);

    // Separate credits by department/job
    const directing = (combinedCredits.crew || [])
      .filter(c => c.job === 'Director')
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const writing = (combinedCredits.crew || [])
      .filter(c => ['Screenplay', 'Writer', 'Story'].includes(c.job))
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const acting = (combinedCredits.cast || [])
      .sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));

    const data = {
      ...details,
      filmography: {
        directing,
        writing,
        acting,
        total_works: (combinedCredits.cast?.length || 0) + (combinedCredits.crew?.length || 0)
      }
    };

    cache.set(cacheKey, data);
    return data;
  }

  static getMockPerson(personId) {
    return {
      id: parseInt(personId),
      name: "Christopher Nolan",
      biography: "British-American film director, producer, and screenwriter.",
      known_for_department: "Directing",
      place_of_birth: "London, England, UK",
      birthday: "1970-07-30",
      profile_path: "/xuAIuYSmsUzKlUMBFGVZaWsY3DZ.jpg",
      filmography: {
        directing: [
          { id: 155, title: "The Dark Knight", release_date: "2008-07-16", vote_average: 8.5 }
        ],
        writing: [],
        acting: [],
        total_works: 1
      }
    };
  }
}

export default PersonModel;
