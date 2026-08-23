import Joi from 'joi';

/**
 * Validation middleware using Joi
 * Validates request body, query, and params
 */

// Helper function to validate request
const validate = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));
      
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }

    // Replace request body with validated and sanitized data
    req.body = value;
    next();
  };
};

// Review validation schemas
export const reviewSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    username: Joi.string().max(50),
    user_avatar: Joi.string().uri().allow(null),
    movie_id: Joi.number().integer().positive().required(),
    movie_title: Joi.string().max(255).required(),
    movie_poster: Joi.string().allow(null),
    rating: Joi.number().min(0).max(5).required(),
    content: Joi.string().min(10).max(5000).required(),
    vibes: Joi.array().items(Joi.string().max(50)).max(5),
    has_spoilers: Joi.boolean().default(false)
  }),

  update: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    rating: Joi.number().min(0).max(5),
    content: Joi.string().min(10).max(5000),
    vibes: Joi.array().items(Joi.string().max(50)).max(5),
    has_spoilers: Joi.boolean()
  }).min(2) // At least one field besides user_id
};

// User validation schemas
export const userSchemas = {
  create: Joi.object({
    firebase_uid: Joi.string().max(128),
    username: Joi.string().min(3).max(50).required(),
    email: Joi.string().email().max(100).required(),
    avatar_url: Joi.string().uri().allow(null),
    bio: Joi.string().max(500).allow('')
  }),

  update: Joi.object({
    username: Joi.string().min(3).max(50),
    bio: Joi.string().max(500).allow(''),
    avatar_url: Joi.string().uri().allow(null)
  }).min(1)
};

// Social post validation schemas
export const postSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    username: Joi.string().max(50).required(),
    user_avatar: Joi.string().uri().allow(null),
    content: Joi.string().min(1).max(2000).required(),
    movie_id: Joi.number().integer().positive().allow(null),
    movie_title: Joi.string().max(255).allow(null),
    movie_poster: Joi.string().allow(null),
    rating: Joi.number().min(0).max(5).allow(null),
    vibes: Joi.array().items(Joi.string().max(50)).max(5),
    has_spoilers: Joi.boolean().default(false)
  })
};

// Meme validation schemas
export const memeSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    username: Joi.string().max(50).required(),
    image_url: Joi.string().uri().required(),
    caption: Joi.string().max(500).allow(''),
    movie_id: Joi.number().integer().positive().allow(null),
    movie_title: Joi.string().max(255).allow(null),
    vibes: Joi.array().items(Joi.string().max(50)).max(5)
  })
};

// List validation schemas
export const listSchemas = {
  create: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(255).required(),
    description: Joi.string().max(1000).allow(''),
    is_public: Joi.boolean().default(true),
    movies: Joi.array().items(
      Joi.object({
        id: Joi.number().integer().positive().required(),
        title: Joi.string().required(),
        poster_path: Joi.string().allow(null)
      })
    ).max(100)
  }),

  update: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    title: Joi.string().min(1).max(255),
    description: Joi.string().max(1000).allow(''),
    is_public: Joi.boolean()
  }).min(2),

  addMovie: Joi.object({
    user_id: Joi.number().integer().positive().required(),
    movie: Joi.object({
      id: Joi.number().integer().positive().required(),
      title: Joi.string().required(),
      poster_path: Joi.string().allow(null)
    }).required()
  })
};

// Comment validation schema
export const commentSchema = Joi.object({
  userId: Joi.number().integer().positive().required(),
  username: Joi.string().max(50).required(),
  content: Joi.string().min(1).max(1000).required()
});

// Direct message validation schema
export const messageSchema = Joi.object({
  senderId: Joi.number().integer().positive().required(),
  receiverId: Joi.number().integer().positive().required(),
  content: Joi.string().min(1).max(2000).required(),
  memeId: Joi.number().integer().positive().allow(null)
});

// Watchlist validation schema
export const watchlistSchema = Joi.object({
  user_id: Joi.number().integer().positive().required(),
  movie_id: Joi.number().integer().positive().required(),
  movie_title: Joi.string().max(255).required(),
  poster_path: Joi.string().allow(null)
});

// Export validate function
export const validateRequest = validate;

// Pre-configured validators
export const validators = {
  review: {
    create: validate(reviewSchemas.create),
    update: validate(reviewSchemas.update)
  },
  user: {
    create: validate(userSchemas.create),
    update: validate(userSchemas.update)
  },
  post: {
    create: validate(postSchemas.create)
  },
  meme: {
    create: validate(memeSchemas.create)
  },
  list: {
    create: validate(listSchemas.create),
    update: validate(listSchemas.update),
    addMovie: validate(listSchemas.addMovie)
  },
  comment: validate(commentSchema),
  message: validate(messageSchema),
  watchlist: validate(watchlistSchema)
};
