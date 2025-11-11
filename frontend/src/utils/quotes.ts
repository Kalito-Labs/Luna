export interface Quote {
  text: string;
  author: string;
}

export const inspirationalQuotes: Quote[] = [
  // Ralph Waldo Emerson
  {
    text: "To be yourself in a world that is constantly trying to make you something else is the greatest accomplishment.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "The only person you are destined to become is the person you decide to be.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Do not go where the path may lead, go instead where there is no path and leave a trail.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Adopt the pace of nature: her secret is patience.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Make the most of yourself, for that is all there is of you.",
    author: "Ralph Waldo Emerson"
  },
  {
    text: "Nothing great was ever achieved without enthusiasm.",
    author: "Ralph Waldo Emerson"
  },

  // Henry David Thoreau
  {
    text: "What you get by achieving your goals is not as important as what you become by achieving your goals.",
    author: "Henry David Thoreau"
  },
  {
    text: "It's not what you look at that matters, it's what you see.",
    author: "Henry David Thoreau"
  },
  {
    text: "Go confidently in the direction of your dreams. Live the life you have imagined.",
    author: "Henry David Thoreau"
  },

  // Marcus Aurelius
  {
    text: "You have power over your mind—not outside events. Realize this, and you will find strength.",
    author: "Marcus Aurelius"
  },
  {
    text: "The happiness of your life depends upon the quality of your thoughts.",
    author: "Marcus Aurelius"
  },
  {
    text: "Waste no more time arguing about what a good man should be. Be one.",
    author: "Marcus Aurelius"
  },

  // Seneca
  {
    text: "We suffer more often in imagination than in reality.",
    author: "Seneca"
  },
  {
    text: "True happiness is to enjoy the present, without anxious dependence upon the future.",
    author: "Seneca"
  },
  {
    text: "He who is brave is free.",
    author: "Seneca"
  },

  // Lao Tzu
  {
    text: "A journey of a thousand miles begins with a single step.",
    author: "Lao Tzu"
  },
  {
    text: "Mastering others is strength; mastering yourself is true power.",
    author: "Lao Tzu"
  },
  {
    text: "Nature does not hurry, yet everything is accomplished.",
    author: "Lao Tzu"
  },

  // Confucius
  {
    text: "It does not matter how slowly you go as long as you do not stop.",
    author: "Confucius"
  },
  {
    text: "Wherever you go, go with all your heart.",
    author: "Confucius"
  },

  // Epictetus
  {
    text: "It's not what happens to you, but how you react to it that matters.",
    author: "Epictetus"
  },
  {
    text: "No man is free who is not master of himself.",
    author: "Epictetus"
  },
  {
    text: "Make the best use of what is in your power, and take the rest as it happens.",
    author: "Epictetus"
  },

  // Rumi
  {
    text: "Yesterday I was clever, so I wanted to change the world. Today I am wise, so I am changing myself.",
    author: "Rumi"
  }
];

/**
 * Returns a random quote from the inspirational quotes collection
 */
export function getRandomQuote(): Quote {
  const randomIndex = Math.floor(Math.random() * inspirationalQuotes.length);
  const quote = inspirationalQuotes[randomIndex];
  if (!quote) {
    // Fallback quote in case of error
    return {
      text: "What lies behind us and what lies before us are tiny matters compared to what lies within us.",
      author: "Ralph Waldo Emerson"
    };
  }
  return quote;
}

/**
 * Returns a specific quote by index
 */
export function getQuoteByIndex(index: number): Quote | null {
  if (index >= 0 && index < inspirationalQuotes.length) {
    const quote = inspirationalQuotes[index];
    return quote || null;
  }
  return null;
}

/**
 * Returns all quotes by a specific author
 */
export function getQuotesByAuthor(author: string): Quote[] {
  return inspirationalQuotes.filter(quote => 
    quote.author.toLowerCase() === author.toLowerCase()
  );
}

/**
 * Returns the total number of quotes available
 */
export function getQuoteCount(): number {
  return inspirationalQuotes.length;
}