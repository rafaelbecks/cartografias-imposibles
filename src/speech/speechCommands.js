const COMMAND_GROUPS = [
  {
    id: "wireframe",
    words: ["cuerda", "tejido"],
  },
  {
    id: "particles",
    words: ["fragmento", "sedimento"],
  },
  {
    id: "dither",
    words: ["delirio", "vertico", "vertigo", "extasis", "ecstasis"],
  },
  {
    id: "oceanCycle",
    words: ["cienaga", "manglar"],
  },
];

function normalize(text) {
  return text
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();
}

function textContainsWord(text, word) {
  const normalized = normalize(text);
  const target = normalize(word);
  const tokens = normalized.split(/[^\p{L}\p{N}]+/u).filter(Boolean);
  return tokens.some((token) => token === target || token.startsWith(target));
}

/** Returns command ids detected in a finalized transcript (at most once per group). */
export function matchSpeechCommands(text) {
  const matched = [];
  for (const group of COMMAND_GROUPS) {
    if (group.words.some((word) => textContainsWord(text, word))) {
      matched.push(group.id);
    }
  }
  return matched;
}

export function createSpeechCommandHandler({
  toggleWireframe,
  toggleParticles,
  toggleDither,
  cycleOceanShape,
}) {
  const handlers = {
    wireframe: toggleWireframe,
    particles: toggleParticles,
    dither: toggleDither,
    oceanCycle: cycleOceanShape,
  };

  let lastCommandKey = "";
  let lastCommandAt = 0;
  const COMMAND_COOLDOWN_MS = 1200;

  function dispatchCommands(text) {
    const ids = matchSpeechCommands(text);
    if (!ids.length) return;

    const key = ids.join(",");
    const now = Date.now();
    if (key === lastCommandKey && now - lastCommandAt < COMMAND_COOLDOWN_MS) return;

    lastCommandKey = key;
    lastCommandAt = now;

    for (const id of ids) {
      handlers[id]?.();
    }
  }

  return {
    handleFinalText: dispatchCommands,
    handleInterimText: dispatchCommands,
  };
}
