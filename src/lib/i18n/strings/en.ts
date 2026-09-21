/** The source-of-truth dictionary. Every other locale is a partial of this. */
export const en = {
  nav: {
    brand: 'Tajweed Engine',
    // Split so the second half can be set in the five anchor colours — the
    // masthead then demonstrates the thing the app does. Every locale needs
    // both halves; the comma belongs to the lead.
    taglineLead: 'Word-by-word,',
    taglineAccent: 'colour-coded',
    reader: 'Reader',
    curriculum: '30-Day Roadmap',
    quiz: 'Find the Rule',
    /**
     * Phone-width labels. "30-Day Roadmap" and "Find the Rule" are 128px and
     * 96px of the ~390px a phone has, which leaves the masthead unable to hold
     * the brand and the links at once. The full names return from `sm` up.
     */
    curriculumShort: 'Roadmap',
    quizShort: 'Quiz',
    toggleDark: 'Toggle dark mode',
    language: 'Language',
    progressLabel: 'days complete',
  },

  home: {
    eyebrow: 'Automated Tajweed curriculum',
    title: 'Every rule in the Qur’an, coloured at the character level — derived, not typed.',
    blurb:
      // The marks carry a dotted circle (U+25CC) because they are combining
      // characters: printed bare they reflow onto whatever precedes them.
      'The engine reads the Uthmani script itself — vowels, shadda, the small ◌۟ ◌ۢ ◌ٰ ◌ۥ marks — and works out all {count} rules from the orthography. Tap any word to isolate it, hear it, see exactly which rule fires where, and record yourself against the reciter.',
    startRoadmap: 'Start the 30-day roadmap',
    playQuiz: 'Play “Find the Hidden Rule”',
    statRules: 'Rules detected',
    statDays: 'Days',
    statTime: 'Total study time',
    statTagging: 'Manual tagging',
    statTaggingValue: 'None',
  },

  video: {
    eyebrow: 'Watch first',
    heading: 'The whole syllabus, in one sitting',
    blurb:
      'Before you start Day 1, watch this walk-through of every basic rule. The roadmap then takes the same material one rule at a time, with your own voice recorded against a reciter.',
    byChannel: 'by {channel}',
    play: 'Play the video',
    playAria: 'Play “{title}” by {channel} — loads from YouTube',
    watchOnYouTube: 'Open on YouTube',
    privacyNote: 'Nothing loads from YouTube until you press play.',
    duration: 'Full beginner course',
  },

  alphabet: {
    eyebrow: 'Every letter, one verse',
    heading: 'The complete-alphabet verses',
    blurb:
      'Āl-‘Imrān 3:154 and Al-Fath 48:29 each contain all 28 letters of the Arabic alphabet. That makes either one a complete tour of the mouth: read it carefully and you have visited every articulation point there is, instead of hunting for examples letter by letter.',
    verified:
      'Checked against the Uthmani text, not taken on trust — both come back 28 of 28.',
    statLetters: 'Alphabet',
    statZones: 'Articulation zones',
    statRules: 'Tajweed rules',
    statWords: 'Words',
    lettersHeading: 'Tap a letter to find it in the mouth',
    inThisVerse: 'in this verse',
    missing: 'not in this verse',
    zoneOf: '{letter} — {zone}',
    openReader: 'Open in the reader',
    // The nasal passage is not any letter's makhraj, so no letter maps to it.
    zoneNote:
      'Sixteen of the seventeen zones are letters. The seventeenth, al-khayshum, is the nasal passage — the exit for every ghunnah rather than the home of any single letter.',
  },

  reader: {
    eyebrow: 'The reader',
    heading: 'Tap any word. The script explains itself.',
    blurb:
      'Every colour below was worked out from the Uthmani orthography as the page loaded. Tap a word to isolate it at display size, hear it from the reciter, read which rule fires on which letter, and record your own voice against it.',
    surah: 'Surah',
    reciter: 'Reciter',
    colour: 'Colour',
    translation: 'Translation',
    transliteration: 'Transliteration',
    highContrast: 'High contrast',
    clearFilter: 'Clear filter',
    sourceGroup: 'What you are reading',
    displayGroup: 'Display',
    colourKey: 'Colour key — tap to filter',
    inThisSurah: 'In this selection',
    statVerses: 'Verses',
    statWords: 'Words',
    statRules: 'Rule hits',
    estimatedTiming: 'estimated timing',
    backToReading: 'Back to reading',
    inspecting: 'Inspecting',
    playVerse: 'Play verse {n}',
    pauseVerse: 'Pause verse {n}',
    offlineNotice:
      'Live Qur’an API unreachable — reading from the bundled Uthmani text. Word timings are estimated from phonological weight rather than forced alignment.',
    wordLevelEnglishNotice:
      'Word-by-word glosses are only published in English upstream, so the per-word meanings below stay English. Verse translations are in {language}.',
    loading: 'Loading verses…',
  },

  legend: {
    madd: 'Elongation — 2, 4, 5 or 6 counts',
    ghunnah: 'Nasalisation — hum in the khayshum',
    qalqalah: 'Echo — a firm, dry bounce',
    makharij: 'Heavy vs light articulation',
    silent: 'Written, but never pronounced',
    izhar: 'Clear — nothing changes',
  },

  families: {
    madd: 'Madd',
    ghunnah: 'Ghunnah',
    qalqalah: 'Qalqalah',
    makharij: 'Makharij',
    silent: 'Silent',
    izhar: 'Izhar',
  },

  inspector: {
    wordOf: 'Word {position} · {verse}',
    hearWord: 'Hear this word',
    articulation: 'Articulation',
    close: 'Close word inspector',
    rulesInWord: 'Tajweed rules in this word',
    noRules:
      'No special rule applies here — read every letter plainly from its own articulation point.',
    counts: '{counts} counts',
    timing: 'Timing',
    starts: 'Starts',
    length: 'Length',
    source: 'Source',
    sourceAligned: 'Aligned',
    sourceEstimated: 'Estimated',
    noTiming: 'No timing data for this word.',
  },

  recorder: {
    title: 'Listen & repeat',
    reciter: 'Reciter',
    you: 'You',
    record: 'Record',
    retry: 'Retry',
    stop: 'Stop',
    recordAria: 'Record your recitation{word}',
    recordAgain: 'Record again',
    stopAria: 'Stop recording. {seconds} seconds captured.',
    uploadInstead: 'Upload a recording',
    keyboardHint:
      'Keyboard: R record or stop · P play the reciter · Y play yours. Recording stops automatically after {seconds} seconds.',
    promptRecord: 'Press Record, or upload a recording below',
    promptUploadOnly: 'Recording is unavailable on this address — upload a recording below',
    promptRecording: 'Recording — recite now ({elapsed}s of {max}s)',
    promptArming: 'Waiting for microphone permission…',
    promptDecoding: 'Decoding your recording…',
    liveArming: 'Requesting microphone access.',
    liveRecording: 'Recording. Recite {word} now. Press R or the Stop button to finish.',
    liveStopped: 'Recording stopped, decoding.',
    liveUnavailable: 'Microphone unavailable.',
    errNoSupport:
      'This browser does not expose microphone recording. Use “Upload a recording” instead.',
    errInsecure:
      'The microphone is blocked because this page was opened over plain http. Open the https address shown below, or use “Upload a recording”.',
    blockedInsecureTitle: 'Microphone off — this page is not on a secure address',
    blockedInsecureBody:
      'Browsers only hand out the microphone to https pages (and to localhost). This page was opened over plain http on the local network, so no browser will offer recording here — switching browsers will not help. Open the https address below on this device instead; accept the certificate warning once, and recording works.',
    blockedUnsupportedTitle: 'Microphone off — this browser cannot record',
    blockedUnsupportedBody:
      'This browser does not implement MediaRecorder, so live capture is unavailable. Uploading a recording gives exactly the same comparison.',
    errDenied:
      'Microphone permission was declined. Allow it in your browser’s site settings, or use “Upload a recording” below.',
    errNoDevice: 'No microphone was available. Use “Upload a recording” below instead.',
    errDeviceBusy:
      'The microphone could not be opened — another app or tab may be holding it. Close that one and try again, or use “Upload a recording” below.',
    /** Appended to any capture failure so the real cause is never guesswork. */
    errDetail: 'Browser reported: {name}.',
    errDecode: 'That audio could not be decoded. Try a WAV, MP3, OGG or WebM file.',
    errMaster: 'The reciter’s audio for this word could not be loaded.',
    notRecorded: 'Not yet recorded.',
    waveformOf: '{track} waveform. Duration {duration}.',
    meterLabel: 'Length relative to the reciter',
    meterText: 'Your recitation is {pct} percent of the reciter’s length. {headline}.',
  },

  /**
   * The page-level microphone notice. Separate from `recorder` because it is
   * read by someone who has not reached the recorder yet — and very often on a
   * phone, where the whole feature is silently unavailable.
   */
  mic: {
    bannerTitle: 'Recording is off on this address',
    bannerBody:
      'This page was opened over plain http. Browsers only hand the microphone to https pages and to localhost, so no browser will offer recording here — switching browsers will not help. Open the secure address below on this device, accept the certificate warning once, and “Listen & repeat” starts working.',
    guessedBody:
      'This page was opened over plain http, and browsers only hand the microphone to https pages. The secure dev server does not look like it is running: start it with “npm run dev:https” on the computer serving this page, then open the address below on this device.',
    openSecure: 'Open the secure address',
    uploadStillWorks:
      'Uploading a recording works on this address and gives exactly the same comparison, so nothing about the lesson is lost either way.',
    dismiss: 'Dismiss',
    checkTitle: 'Microphone check',
    checkOrigin: 'Address',
    checkSecure: 'Secure context',
    checkDevices: 'getUserMedia',
    checkRecorder: 'MediaRecorder',
    checkPermission: 'Permission',
    yes: 'yes',
    no: 'no',
    unknown: 'not reported',
    phoneHandoffTitle: 'Reading this on a phone?',
    phoneHandoffBody:
      'The microphone needs an https address. Open this one on the phone and accept the certificate warning once.',
  },

  verdict: {
    unknownHeadline: 'No comparison yet',
    unknownDetail: 'Record yourself, or upload a recording, to compare against the reciter.',
    shortHeadline: 'Too short by {pct}%',
    shortDetail:
      'Noticeably shorter than the reciter — the usual cause is cutting a madd or dropping the ghunnah before it is finished.',
    longHeadline: 'Too long by {pct}%',
    longDetail:
      'Longer than the reciter. Check you are not over-stretching a natural 2-count madd, or pausing inside the word.',
    matchHeadline: 'Length matches',
    matchDetail: 'Your timing sits within the acceptable band around the reciter. Well done.',
    announce:
      'Recording complete. Yours is {user}, {direction} the reciter’s {master}. {headline}. {detail}',
    dirSame: 'the same as',
    dirLonger: '{amount} longer than',
    dirShorter: '{amount} shorter than',
    announceUnknown: 'Recording captured, but its length could not be measured.',
    msUnit: '{n} milliseconds',
    sUnit: '{n} seconds',
    unknownDuration: 'unknown',
  },

  envelope: {
    silent: 'Silent — no sound was detected.',
    dip: 'The sound dips through the middle — a held ghunnah or madd may be collapsing.',
    end: 'Energy builds towards the end — consistent with a madd held at the finish.',
    front: 'Energy is front-loaded, then falls away — the ending sounds clipped.',
    middle: 'Energy peaks in the middle and tails off at both ends.',
    even: 'Energy is spread evenly across the word.',
  },

  makhraj: {
    tapLetter: 'Tap a letter to locate it',
    tryIt: 'Try it: ',
    diagramLabel: 'Vocal tract diagram',
    diagramLabelActive: 'Vocal tract, highlighting {zone}',
    close: 'Close',
    modalTitle: 'Articulation point',
    modalTitleWord: 'Articulation — word {position} of {verse}',
    whereMade: 'Where is this sound made?',
    lips: 'lips',
    nasal: 'nasal',
    throat: 'throat',
    tongue: 'tongue',
  },

  curriculum: {
    eyebrow: '30-Day Tajweed Mastery',
    titleStart: 'Begin with the map of the mouth.',
    titleDone: 'Programme complete.',
    titleNext: 'Day {day} is next.',
    blurb:
      'Ten to fifteen minutes a day. Each day unlocks the next, opens its verses already filtered to that day’s rules, and ends with a drill that scores you on exactly what you just learned.',
    reset: 'Reset progress',
    resetConfirm: 'Reset all 30-day progress? This cannot be undone.',
    statComplete: 'Days complete',
    statRemaining: 'Time remaining',
    statTotal: 'Full programme',
    statFocus: 'Focus next',
    days: 'Days {from}–{to}',
    minutes: '{n} min',
    rulesCount: '{n} rules',
    day: 'Day {n}',
    lockedTitle: 'Day {day} is still locked',
    lockedBody:
      'Finish Day {prev} first — the roadmap is sequential on purpose, because every rule here builds on the one before it.',
    goToDay: 'Go to Day {day}',
    backToRoadmap: '← Roadmap',
    markComplete: 'Mark day complete',
    dayComplete: '✓ Day complete',
    rulesToday: 'Rules today',
    tabPractice: 'Practice verses',
    tabDrill: 'Drill',
    tabAnatomy: 'Articulation',
    practiceHint:
      'Words carrying today’s rules are in full colour; everything else is dimmed. Tap any word to isolate it, hear it, and record yourself against the reciter.',
    anatomyTitle: 'Articulation points for today',
    checkpointsTitle: 'Before you move on',
    drillBest: 'Drill best {correct}/{total}',
  },

  quiz: {
    eyebrow: 'Find the hidden rule',
    title: 'Spot the rule before the colours give it away.',
    blurb:
      'The board is rendered with the colour coding switched off. You are reading the orthography itself — the vowels, the shadda, the small Uthmani marks — which is exactly what you will have to do in a plain mushaf.',
    modeMixed: 'Mixed review',
    modeMadd: 'Madd',
    modeGhunnah: 'Ghunnah',
    modeQalqalah: 'Qalqalah',
    modeMakharij: 'Heavy / Light',
    modeSilent: 'Silent letters',
    questions: 'Questions',
    lifetime: 'Lifetime accuracy',
    bestStreak: '🔥 Best streak {n}',
    weakest: 'Weakest: {rule} ({pct}%)',
    prompt: 'Click on the word that contains a',
    questionOf: '{verse} · Question {index} of {total}',
    correctLabel: 'Correct',
    streakLabel: 'Streak',
    building: 'Building questions from the analysed verses…',
    emptyTitle: 'No questions could be built for these rules.',
    emptyBody:
      'The selected surahs contain no clean examples. Try a different day or a wider surah pool.',
    emptyError: 'Could not load any verses for the quiz.',
    correct: '✓ Correct — that is the one.',
    wrong: '✕ Not quite. Here is where it actually was:',
    ruleIsIn: 'The rule is in',
    why: 'Why',
    youChose: 'You chose',
    youChoseHasRule: '— that word does carry {rule}, but not {target}.',
    youChoseNoRule: '— that word carries no special rule at all.',
    showArticulation: 'Show articulation point',
    next: 'Next question',
    seeResults: 'See results',
    sessionComplete: 'Session complete',
    resultLine: '{correct} of {total} correct · best streak {streak}',
    verdictMastered: 'Mastered.',
    verdictSolid: 'Solid — one more pass will lock it in.',
    verdictRevisit: 'Worth revisiting the lesson.',
    playAgain: 'Play again',
  },

  /**
   * The masthead install control, and the offline page.
   *
   * `label` is the control's whole voice — it is one square, with a tooltip
   * and an accessible name and nothing else — so it has to say what tapping it
   * does rather than merely naming the app.
   *
   * The iOS keys are the popover, which exists because Safari has no install
   * API: the gesture has to be taught instead. "Add to Home Screen" is kept as
   * a separate key because it is quoting a menu item Safari renders in English
   * on many devices; a locale that ships a localised iOS translates it, and
   * one that does not leaves it matching what the learner will actually see.
   */
  install: {
    label: 'Install this app',
    iosTitle: 'Add this to your Home Screen',
    iosBody:
      'Tap Share in Safari, then “Add to Home Screen”. It opens full screen after that, and keeps working with no connection.',
    iosShareLabel: 'Share',
    iosAddLabel: 'Add to Home Screen',
  },

  offline: {
    eyebrow: 'No connection',
    title: 'This screen hasn’t been saved to your device yet.',
    body:
      'Everything you have already opened is stored here and still works. Open this one once while you are online and it will be available offline from then on.',
    retry: 'Try again',
    reader: 'Go to the reader',
    roadmap: 'Open the roadmap',
  },

  common: {
    of: 'of',
    counts: 'counts',
  },

  /**
   * The provenance notice. Two sentences that do different jobs: the first
   * bounds what the engine's output claims to be, the second says where every
   * stream on the page came from. Both are attribution copy rather than UI
   * text — if a locale leaves them untranslated the English stands, which is
   * the usual convention for a notice of this kind.
   */
  footer: {
    scope:
      'Generated analysis stays within mainstream classical Islamic understanding — a study aid only; not tafsīr, not fatwā.',
    sources:
      'Qur’anic text from the Uthmani muṣḥaf (api.quran.com) · tajweed marking per the standard colour-coded muṣḥaf scheme · audio streamed unaltered from licensed public sources · artwork is original symbolic line-work.',
    // Split so the studio name alone can carry the link — "Created by" is not
    // part of it, and interpolating a placeholder would give no way to wrap
    // just the name in an anchor.
    createdBy: 'Created by',
    studio: 'FS LabsCo',
    credit: 'Sitheek A HAMEED',
  },
};

/**
 * Deliberately NOT `as const`: with literal types, a translated value would
 * have to equal the English string to typecheck. Widening to `string` keeps
 * key-level safety (a typo in a key is still an error) while letting the
 * Tamil and Sinhala dictionaries supply real translations.
 */
export type Strings = typeof en;
