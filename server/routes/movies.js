import express from 'express';
import axios from 'axios';

const router = express.Router();
const TMDB_BASE = 'https://api.themoviedb.org/3';
const TMDB_API_KEY = process.env.TMDB_API_KEY;

// Get trending movies
router.get('/trending', async (req, res) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      // Return mock data if no API key
      return res.json({
        page: 1,
        results: [
          {
            id: 572802,
            title: "Aquaman and the Lost Kingdom",
            poster_path: "/7lTnXOy0iNtBAdRP3TZvaKJ77F6.jpg",
            backdrop_path: "/jXJxMcVoEuXzym3vFnjqDW4ifo6.jpg",
            vote_average: 6.9,
            release_date: "2023-12-20",
            overview: "Black Manta seeks revenge on Aquaman for his father's death. With his kingdom under attack, Aquaman forges an uneasy alliance with his imprisoned brother Orm."
          },
          {
            id: 866398,
            title: "The Beekeeper",
            poster_path: "/A7EByudX0eOzlkQ2FIbogzyazm2.jpg",
            backdrop_path: "/nFsXmLUhA4TiA0vYwiXaGdtdiPV.jpg",
            vote_average: 7.4,
            release_date: "2024-01-10",
            overview: "One man's brutal campaign for vengeance takes on national stakes after he is revealed to be a former operative of a powerful organization."
          },
          {
            id: 787699,
            title: "Wonka",
            poster_path: "/qhb1qOilapbapxWQn9jtRCMwXJF.jpg",
            backdrop_path: "/yDHYTfA3R0jFYba16jBB1ef8oIt.jpg",
            vote_average: 7.2,
            release_date: "2023-12-06",
            overview: "The story of how the world's greatest inventor became the beloved Willy Wonka."
          },
          {
            id: 940551,
            title: "Migration",
            poster_path: "/ldfCF9RhR40mppkzmftxapaHeTo.jpg",
            backdrop_path: "/tLL1emByuro2PvrVctPNntmVQNY.jpg",
            vote_average: 7.4,
            release_date: "2023-12-06",
            overview: "A family of ducks decides to leave their safe pond and embark on an adventurous migration."
          },
          {
            id: 848538,
            title: "Argylle",
            poster_path: "/95VlSEfLMqeX36UVcHg1pQzIC55.jpg",
            backdrop_path: "/6lE2e6j8qbtQR8aHxQNJlwxdmKV.jpg",
            vote_average: 6.1,
            release_date: "2024-01-31",
            overview: "A reclusive author who writes espionage novels discovers her fiction mirrors real-life spy activities."
          },
          {
            id: 693134,
            title: "Dune: Part Two",
            poster_path: "/8b8R8l88Qje9dn9OE8PY05Nxl1X.jpg",
            backdrop_path: "/xOMo8BRK7PfcJv9JCnx7s5hj0PX.jpg",
            vote_average: 8.3,
            release_date: "2024-02-27",
            overview: "Follow the mythic journey of Paul Atreides as he unites with Chani and the Fremen while on a path of revenge."
          }
        ]
      });
    }
    
    const response = await axios.get(`${TMDB_BASE}/trending/movie/week`, {
      params: { api_key: TMDB_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching trending:', error.message);
    res.status(500).json({ error: 'Failed to fetch trending movies' });
  }
});

// Get popular movies
router.get('/popular', async (req, res) => {
  try {
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      // Return mock data if no API key
      return res.json({
        page: 1,
        results: [
          {
            id: 155,
            title: "The Dark Knight",
            poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            backdrop_path: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
            vote_average: 8.5,
            release_date: "2008-07-16",
            overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent."
          },
          {
            id: 27205,
            title: "Inception",
            poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
            backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
            vote_average: 8.4,
            release_date: "2010-07-15",
            overview: "Cobb steals information from his targets by entering their dreams."
          },
          {
            id: 238,
            title: "The Godfather",
            poster_path: "/3bhkrj58Vtu7enYsRolD1fZdja1.jpg",
            backdrop_path: "/tmU7GeKVybMWFButWEGl2M4GeiP.jpg",
            vote_average: 8.7,
            release_date: "1972-03-14",
            overview: "The aging patriarch of an organized crime dynasty transfers control of his clandestine empire to his reluctant son."
          },
          {
            id: 550,
            title: "Fight Club",
            poster_path: "/pB8BM7pdSp6B6Ih7QZ4DrQ3PmJK.jpg",
            backdrop_path: "/hZkgoQYus5vegHoetLkCJzb17zJ.jpg",
            vote_average: 8.4,
            release_date: "1999-10-15",
            overview: "An insomniac office worker and a devil-may-care soap maker form an underground fight club."
          },
          {
            id: 680,
            title: "Pulp Fiction",
            poster_path: "/d5iIlFn5s0ImszYzBPb8JPIfbXD.jpg",
            backdrop_path: "/suaEOtk1N1sgg2MTM7oZdQcfYbq.jpg",
            vote_average: 8.5,
            release_date: "1994-09-10",
            overview: "A burger-loving hit man and his philosophical partner have a series of violent and unexpected events."
          },
          {
            id: 12,
            title: "Finding Nemo",
            poster_path: "/huVwlW5Fy463PF1T04Nv2mXyJVP.jpg",
            backdrop_path: "/fxCXzXOI5LLrZOB7DtTvabOlUMV.jpg",
            vote_average: 7.9,
            release_date: "2003-05-30",
            overview: "A clown fish named Marlin goes on a journey to find his missing son, Nemo."
          }
        ]
      });
    }
    
    const { page = 1 } = req.query;
    const response = await axios.get(`${TMDB_BASE}/movie/popular`, {
      params: { api_key: TMDB_API_KEY, page }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching popular:', error.message);
    res.status(500).json({ error: 'Failed to fetch popular movies' });
  }
});

// Search movies
router.get('/search', async (req, res) => {
  try {
    const { query, page = 1 } = req.query;
    if (!query) {
      return res.status(400).json({ error: 'Query parameter required' });
    }
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      // Return mock search results
      return res.json({
        page: 1,
        total_results: 2,
        total_pages: 1,
        results: [
          {
            id: 155,
            title: "The Dark Knight",
            poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
            vote_average: 8.5,
            release_date: "2008-07-16",
            overview: "Batman raises the stakes in his war on crime."
          },
          {
            id: 49026,
            title: "The Dark Knight Rises",
            poster_path: "/3bgtNjh4pJ8n3zgvbMrK3WnQ9Xb.jpg",
            vote_average: 7.7,
            release_date: "2012-07-16",
            overview: "Batman emerges from eight years of seclusion."
          }
        ]
      });
    }
    
    const response = await axios.get(`${TMDB_BASE}/search/movie`, {
      params: { api_key: TMDB_API_KEY, query, page }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error searching:', error.message);
    res.status(500).json({ error: 'Failed to search movies' });
  }
});

// Get movie details
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      // Return mock movie details
      const mockMovies = {
        155: {
          id: 155,
          title: "The Dark Knight",
          poster_path: "/qJ2tW6WMUDux911r6m7haRef0WH.jpg",
          backdrop_path: "/nMKdUUepR0i5zn0y1T4CsSB5chy.jpg",
          vote_average: 8.5,
          release_date: "2008-07-16",
          runtime: 152,
          overview: "Batman raises the stakes in his war on crime with the help of Lt. Jim Gordon and District Attorney Harvey Dent. A young anarchist known as The Joker begins to create chaos in Gotham City.",
          imdb_id: "tt0468569",
          genres: [
            { id: 18, name: "Drama" },
            { id: 28, name: "Action" },
            { id: 80, name: "Crime" },
            { id: 53, name: "Thriller" }
          ],
          credits: {
            cast: [
              { id: 5132, name: "Christian Bale", character: "Bruce Wayne / Batman", profile_path: "/qCpZn2e3dimwptDXK5bTF5iBAU5.jpg" },
              { id: 5294, name: "Heath Ledger", character: "Joker", profile_path: "/5Y9HnYYa9jF5GQO8vXmS1LMnD6b.jpg" },
              { id: 5293, name: "Aaron Eckhart", character: "Harvey Dent", profile_path: "/5Hjpc7oH9UFpR0KxxqE6SXeAFVP.jpg" }
            ]
          }
        },
        27205: {
          id: 27205,
          title: "Inception",
          poster_path: "/oYuLEt3zVCKq57qu2F8dT7NIa6f.jpg",
          backdrop_path: "/8ZTVqvKDQ8emSGUEMjsS4yHAwrp.jpg",
          vote_average: 8.4,
          release_date: "2010-07-15",
          runtime: 148,
          overview: "Cobb steals information from his targets by entering their dreams. He is offered a chance to have his criminal history erased as payment for a task considered impossible.",
          imdb_id: "tt1375666",
          genres: [
            { id: 28, name: "Action" },
            { id: 878, name: "Science Fiction" },
            { id: 12, name: "Adventure" }
          ],
          credits: {
            cast: [
              { id: 27222, name: "Leonardo DiCaprio", character: "Dom Cobb", profile_path: "/wo2hJpn04vbtmh0B9utCFdsQhxM.jpg" },
              { id: 24045, name: "Joseph Gordon-Levitt", character: "Arthur", profile_path: "/zvpTRs6TKLwctQRc6Tfye4g4bVR.jpg" }
            ]
          }
        }
      };
      
      return res.json(mockMovies[id] || {
        id: parseInt(id),
        title: "Sample Movie",
        poster_path: null,
        backdrop_path: null,
        vote_average: 7.5,
        release_date: "2024-01-01",
        runtime: 120,
        overview: "This is a sample movie. Add a TMDB API key to see real movie data!",
        genres: [{ id: 18, name: "Drama" }],
        credits: { cast: [] }
      });
    }
    
    const [detailsRes, creditsRes] = await Promise.all([
      axios.get(`${TMDB_BASE}/movie/${id}`, {
        params: { api_key: TMDB_API_KEY }
      }),
      axios.get(`${TMDB_BASE}/movie/${id}/credits`, {
        params: { api_key: TMDB_API_KEY }
      })
    ]);
    
    res.json({
      ...detailsRes.data,
      credits: creditsRes.data
    });
  } catch (error) {
    console.error('Error fetching details:', error.message);
    res.status(500).json({ error: 'Failed to fetch movie details' });
  }
});

// Get movie recommendations
router.get('/:id/recommendations', async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!TMDB_API_KEY || TMDB_API_KEY === 'your_tmdb_api_key_here') {
      return res.json({
        page: 1,
        results: [
          {
            id: 49026,
            title: "The Dark Knight Rises",
            poster_path: "/3bgtNjh4pJ8n3zgvbMrK3WnQ9Xb.jpg",
            vote_average: 7.7,
            release_date: "2012-07-16"
          }
        ]
      });
    }
    
    const response = await axios.get(`${TMDB_BASE}/movie/${id}/recommendations`, {
      params: { api_key: TMDB_API_KEY }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Error fetching recommendations:', error.message);
    res.status(500).json({ error: 'Failed to fetch recommendations' });
  }
});

export default router;
