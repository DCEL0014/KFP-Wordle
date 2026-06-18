window.validWords = [];

window.loadValidWords = async function () {
  try {
    const response = await fetch('./data/dsdo_valid_words.json');
    if (!response.ok) {
      throw new Error('Failed to fetch word list');
    }

    const data = await response.json();

    window.validWords = data
      .map(word => word.toLowerCase())
      .filter(word => /^[a-zæøå]+$/i.test(word));

    console.log(`Loaded ${window.validWords.length} Danish words`);
  } catch (err) {
    // If the JSON file cannot be fetched, for example when opening index.html directly
    // without a local server, the game still works with the target word list.
    console.warn('Could not load full word list. Falling back to targetWords only.', err);
    window.validWords = [];
  }

  if (Array.isArray(window.targetWords)) {
    window.validWords = [
      ...new Set([
        ...window.validWords,
        ...window.targetWords.map(word => word.toLowerCase())
      ])
    ];
  }
};
