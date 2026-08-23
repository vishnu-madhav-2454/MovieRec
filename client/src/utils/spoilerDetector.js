/**
 * Advanced spoiler detector for movie reviews
 * 
 * Letterboxd Approach:
 * 1. AI/ML model trained on spoilers (we'll use heuristics)
 * 2. Manual user flag "Contains spoilers" checkbox
 * 3. Community reports
 * 
 * Our Approach (Phase 2):
 * 1. Enhanced keyword detection with context
 * 2. Plot structure detection (beginning/middle/end mentions)
 * 3. Character death patterns
 * 4. Twist/reveal language
 * 5. Sentence-level scoring
 * 
 * Phase 3: Can add AI/ML with OpenAI API or custom model
 */

const SPOILER_PATTERNS = {
  // High confidence spoilers
  HIGH_PRIORITY: [
    /dies (in|at) the end/i,
    /killed (by|off|in)/i,
    /(he|she|they) (was|were) dead (the whole time|all along)/i,
    /(turns out|revealed) to be/i,
    /the (twist|reveal|surprise) (is|was)/i,
    /the killer (is|was|turns out)/i,
    /the (real |actual )?villain (is|was)/i,
    /ending explained/i,
    /(final|last|closing) scene (shows|reveals)/i,
    /post.?credits scene/i,
    /sacrifices (himself|herself|themselves)/i,
    /(was|is) (the|a) (murderer|traitor|spy)/i,
    /(is|was) actually (his|her|their) (father|mother|brother|sister)/i,
    /(is|was) the bad guy/i,
    /(was|is) (all )?imagination/i,
    /dream sequence/i,
    /spoiler alert/i,
    /spoiler:/i,
    /\*\*spoiler\*\*/i,
    /plot twist/i
  ],
  
  // Medium confidence - needs context
  MEDIUM_PRIORITY: [
    /in the end/i,
    /at the end/i,
    /final (act|chapter|scene)/i,
    /third act/i,
    /climax/i,
    /conclusion/i,
    /resolution/i,
    /(big |major )?reveal/i,
    /plot point/i,
    /character arc/i,
    /redemption arc/i,
    /character development/i,
    /backstory/i,
    /origin story/i,
    /true identity/i,
    /secret/i,
    /hidden/i,
    /twist/i,
    /surprise/i,
    /unexpected/i,
    /shocking/i,
    /dies/i,
    /death/i,
    /survives/i,
    /betrays/i,
    /betrayal/i
  ],
  
  // Character fate indicators
  CHARACTER_FATE: [
    /character (dies|survives|escapes|betrays)/i,
    /protagonist (dies|survives|wins|loses)/i,
    /antagonist (dies|survives|wins|loses)/i,
    /ends up (dead|alive|together|alone)/i,
    /fate (of|is)/i,
    /what happens to/i
  ],
  
  // Plot structure reveals
  PLOT_REVEALS: [
    /it turns out/i,
    /we learn that/i,
    /reveals that/i,
    /discovers that/i,
    /finds out/i,
    /realizes that/i,
    /the truth (is|was)/i,
    /in reality/i,
    /actually/i
  ]
};

// Words that reduce spoiler confidence when nearby
const SPOILER_NEGATORS = [
  'without spoiling',
  'no spoilers',
  'spoiler-free',
  'won\'t spoil',
  'trying not to spoil',
  'avoid spoilers',
  'not going to spoil',
  'without revealing'
];

// Common false positives to ignore
const FALSE_POSITIVES = [
  'without spoiling the ending',
  'i won\'t spoil',
  'trying not to reveal',
  'spoiler-free review'
];

/**
 * Calculate spoiler probability score
 * 0-30: Low risk
 * 31-60: Medium risk
 * 61-100: High risk
 */
export function detectSpoilers(text, options = {}) {
  if (!text || typeof text !== 'string') {
    return { 
      hasSpoilers: false, 
      confidence: 0, 
      score: 0,
      matches: [],
      riskLevel: 'none'
    };
  }

  const lowerText = text.toLowerCase();
  let score = 0;
  const matchedPhrases = [];
  const matchedPatterns = [];

  // Check for false positives first
  for (const fp of FALSE_POSITIVES) {
    if (lowerText.includes(fp)) {
      return { 
        hasSpoilers: false, 
        confidence: 0,
        score: 0,
        matches: [],
        riskLevel: 'none',
        reason: 'Spoiler-free declaration detected'
      };
    }
  }

  // Check for spoiler negators (reduces score)
  let hasNegator = false;
  for (const negator of SPOILER_NEGATORS) {
    if (lowerText.includes(negator)) {
      hasNegator = true;
      break;
    }
  }

  // High priority patterns (30 points each)
  for (const pattern of SPOILER_PATTERNS.HIGH_PRIORITY) {
    if (pattern.test(text)) {
      score += 30;
      const match = text.match(pattern);
      if (match) {
        matchedPhrases.push(match[0]);
        matchedPatterns.push('HIGH_PRIORITY');
      }
    }
  }

  // Medium priority patterns (15 points each)
  for (const pattern of SPOILER_PATTERNS.MEDIUM_PRIORITY) {
    if (pattern.test(text)) {
      score += 15;
      const match = text.match(pattern);
      if (match) {
        matchedPhrases.push(match[0]);
        matchedPatterns.push('MEDIUM_PRIORITY');
      }
    }
  }

  // Character fate patterns (20 points each)
  for (const pattern of SPOILER_PATTERNS.CHARACTER_FATE) {
    if (pattern.test(text)) {
      score += 20;
      const match = text.match(pattern);
      if (match) {
        matchedPhrases.push(match[0]);
        matchedPatterns.push('CHARACTER_FATE');
      }
    }
  }

  // Plot reveal patterns (18 points each)
  for (const pattern of SPOILER_PATTERNS.PLOT_REVEALS) {
    if (pattern.test(text)) {
      score += 18;
      const match = text.match(pattern);
      if (match) {
        matchedPhrases.push(match[0]);
        matchedPatterns.push('PLOT_REVEALS');
      }
    }
  }

  // Reduce score if spoiler negators present
  if (hasNegator) {
    score = Math.max(0, score - 40);
  }

  // Cap score at 100
  score = Math.min(100, score);

  // Determine risk level
  let riskLevel = 'none';
  let hasSpoilers = false;
  
  if (score >= 61) {
    riskLevel = 'high';
    hasSpoilers = true;
  } else if (score >= 31) {
    riskLevel = 'medium';
    hasSpoilers = true;
  } else if (score >= 15) {
    riskLevel = 'low';
  }

  return {
    hasSpoilers,
    confidence: score,
    score,
    matches: [...new Set(matchedPhrases)], // Remove duplicates
    patterns: [...new Set(matchedPatterns)],
    riskLevel,
    recommendation: getRiskRecommendation(riskLevel)
  };
}

function getRiskRecommendation(riskLevel) {
  switch (riskLevel) {
    case 'high':
      return 'This review likely contains major spoilers. Consider marking it with a spoiler warning.';
    case 'medium':
      return 'This review may contain some plot details. Use caution if you haven\'t seen the film.';
    case 'low':
      return 'This review mentions some story elements but likely doesn\'t spoil major plot points.';
    default:
      return 'No spoiler concerns detected.';
  }
}

/**
 * Sentence-level spoiler detection
 * Splits text into sentences and scores each one
 */
export function detectSpoilersBySentence(text) {
  if (!text || typeof text !== 'string') {
    return [];
  }

  const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
  return sentences.map(sentence => ({
    sentence: sentence.trim(),
    ...detectSpoilers(sentence)
  })).filter(result => result.hasSpoilers);
}

/**
 * Check if user manually marked review as containing spoilers
 * This should be stored in the database review record
 */
export function shouldBlurReview(review) {
  // Priority 1: User manually flagged as spoiler
  if (review.contains_spoilers === true || review.spoiler_warning === true) {
    return {
      shouldBlur: true,
      reason: 'User marked as containing spoilers',
      confidence: 100
    };
  }

  // Priority 2: Auto-detection
  const detection = detectSpoilers(review.content || '');
  
  return {
    shouldBlur: detection.hasSpoilers,
    reason: detection.recommendation,
    confidence: detection.score,
    riskLevel: detection.riskLevel,
    autoDetected: true
  };
}

/**
 * Generate spoiler warning message
 */
export function getSpoilerWarning(riskLevel) {
  switch (riskLevel) {
    case 'high':
      return '⚠️ Warning: Contains Major Spoilers';
    case 'medium':
      return '⚠️ Caution: May Contain Plot Details';
    case 'low':
      return 'ℹ️ Minor Story Details Mentioned';
    default:
      return '';
  }
}

