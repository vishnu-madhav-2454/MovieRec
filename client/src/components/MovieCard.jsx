import { Link } from 'react-router-dom';
import { FiStar, FiCalendar } from 'react-icons/fi';

function MovieCard({ movie }) {
  const imageUrl = movie.poster_path
    ? `https://image.tmdb.org/t/p/w500${movie.poster_path}`
    : 'https://via.placeholder.com/500x750?text=No+Image';

  const rating = movie.vote_average?.toFixed(1) || 'N/A';
  const year = movie.release_date?.split('-')[0] || 'TBA';

  return (
    <Link to={`/movie/${movie.id}`} className="movie-card group">
      <div className="relative bg-dark-800 rounded-xl overflow-hidden shadow-lg">
        {/* Poster Image */}
        <div className="aspect-[2/3] overflow-hidden">
          <img
            src={imageUrl}
            alt={movie.title}
            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
            loading="lazy"
          />
          <div className="absolute inset-0 gradient-overlay opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        </div>

        {/* Info Overlay */}
        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-dark-950 via-dark-950/95 to-transparent">
          <div className="space-y-2">
            {/* Title */}
            <h3 className="font-semibold text-white text-sm line-clamp-2">
              {movie.title}
            </h3>

            {/* Rating & Year */}
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <FiStar className="w-4 h-4 text-yellow-500" />
                <span className="text-dark-200 font-medium">{rating}</span>
              </div>
              <div className="flex items-center gap-1.5 text-dark-400">
                <FiCalendar className="w-3.5 h-3.5" />
                <span>{year}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-dark-950/90 backdrop-blur-sm px-2 py-1 rounded-lg">
          <div className="flex items-center gap-1">
            <FiStar className="w-4 h-4 text-yellow-500 fill-yellow-500" />
            <span className="text-sm font-semibold text-white">{rating}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default MovieCard;
