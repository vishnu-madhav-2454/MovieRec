import { useState } from 'react';
import axios from 'axios';
import { FiX, FiUploadCloud, FiSearch, FiFilm, FiImage } from 'react-icons/fi';

export default function MemeUpload({ isOpen, onClose, currentUser, onUploaded }) {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const [caption, setCaption] = useState('');
  const [movieId, setMovieId] = useState('');
  const [movieTitle, setMovieTitle] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  if (!isOpen) return null;

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      alert('Image size must be less than 5MB');
      return;
    }

    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onloadend = () => {
      setImagePreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleSearchMovie = async (query) => {
    setSearchQuery(query);
    if (!query.trim() || query.length < 2) {
      setSearchResults([]);
      return;
    }
    try {
      const res = await axios.get('/api/movies/search?query=' + encodeURIComponent(query));
      setSearchResults(res.data.results?.slice(0, 5) || []);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSelectMovie = (movie) => {
    setMovieId(movie.id);
    setMovieTitle(movie.title);
    setSearchResults([]);
    setSearchQuery('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!imageFile) {
      alert('Please select an image');
      return;
    }

    try {
      setSubmitting(true);
      setUploading(true);

      // Convert image to base64
      const reader = new FileReader();
      const base64Promise = new Promise((resolve, reject) => {
        reader.onloadend = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(imageFile);
      });

      const base64Image = await base64Promise;
      setUploading(false);

      // Create meme in database with base64 image
      const res = await axios.post('/api/memes', {
        user_id: currentUser?.id || 1,
        username: currentUser?.displayName || currentUser?.username || 'MovieBuff',
        user_avatar: currentUser?.photoURL || null,
        movie_id: movieId ? parseInt(movieId, 10) : null,
        movie_title: movieTitle || null,
        image_url: base64Image,
        caption,
      });

      if (onUploaded) onUploaded(res.data);
      
      // Reset form
      setImageFile(null);
      setImagePreview('');
      setCaption('');
      setMovieId('');
      setMovieTitle('');
      
      onClose();
    } catch (err) {
      console.error('Failed to create meme:', err);
      alert(err.response?.data?.error || 'Failed to upload meme. Please try again.');
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
      <div className="bg-dark-900 border border-dark-800 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        <button type="button" onClick={onClose} className="absolute top-5 right-5 text-dark-400 hover:text-white p-1 rounded-lg hover:bg-dark-800">
          <FiX className="w-5 h-5" />
        </button>
        <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
          <FiUploadCloud className="text-primary-500" /> Post a cinema meme
        </h2>
        <p className="text-xs text-dark-400 mb-6">Upload a moment from your movie life and share it with your circle.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Image Upload */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-2">Upload Image *</label>
            <div className="relative">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileSelect}
                className="hidden"
                id="meme-image-upload"
              />
              <label
                htmlFor="meme-image-upload"
                className="w-full bg-dark-950 border-2 border-dashed border-dark-800 hover:border-primary-500 rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-2"
              >
                <FiImage className="w-12 h-12 text-dark-600" />
                <span className="text-sm text-dark-400 font-medium">
                  {imageFile ? imageFile.name : 'Click to select image'}
                </span>
                <span className="text-xs text-dark-500">PNG, JPG, GIF up to 5MB</span>
              </label>
            </div>
          </div>

          {/* Image Preview */}
          {imagePreview && (
            <div className="rounded-xl overflow-hidden border border-dark-800 max-h-64 flex justify-center bg-black/40 relative">
              <img src={imagePreview} alt="Preview" className="object-contain max-h-64 w-full" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview('');
                }}
                className="absolute top-2 right-2 bg-red-600 hover:bg-red-500 text-white p-2 rounded-lg"
              >
                <FiX className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Caption */}
          <div>
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">Caption</label>
            <textarea
              rows={2}
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a funny caption..."
              className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500 resize-none"
            />
          </div>

          {/* Movie Tag */}
          <div className="relative">
            <label className="block text-xs font-semibold text-dark-300 uppercase tracking-wider mb-1">Tag a movie (optional)</label>
            {movieTitle ? (
              <div className="flex items-center justify-between bg-primary-950/40 border border-primary-800/60 p-2.5 rounded-xl text-sm text-primary-300">
                <span className="flex items-center gap-2 font-medium">
                  <FiFilm className="w-4 h-4" /> {movieTitle}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setMovieId('');
                    setMovieTitle('');
                  }}
                  className="text-xs hover:text-white"
                >
                  Change
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => handleSearchMovie(e.target.value)}
                  placeholder="Search movie..."
                  className="w-full bg-dark-950 border border-dark-800 rounded-xl p-3 pl-9 text-sm text-white placeholder-dark-500 focus:outline-none focus:border-primary-500"
                />
                <FiSearch className="absolute left-3 top-3.5 text-dark-500 w-4 h-4" />
                {searchResults.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-dark-900 border border-dark-700 rounded-xl shadow-xl z-20 overflow-hidden max-h-64 overflow-y-auto">
                    {searchResults.map((m) => (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => handleSelectMovie(m)}
                        className="w-full p-2.5 hover:bg-dark-800 text-left flex items-center gap-3 border-b border-dark-800 last:border-0"
                      >
                        {m.poster_path && (
                          <img
                            src={'https://image.tmdb.org/t/p/w92' + m.poster_path}
                            alt={m.title}
                            className="w-7 h-10 object-cover rounded"
                          />
                        )}
                        <div>
                          <p className="text-sm font-semibold">{m.title}</p>
                          <p className="text-xs text-dark-400">{m.release_date?.substring(0, 4)}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || !imageFile}
            className="w-full py-3 rounded-xl font-bold bg-primary-600 hover:bg-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {uploading ? 'Uploading image...' : submitting ? 'Publishing...' : 'Post meme'}
          </button>
        </form>
      </div>
    </div>
  );
}
