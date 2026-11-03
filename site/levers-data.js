// The free 5 Levers course: lessons, questions and results copy.
// Shared by the course on the homepage, the /my-levers results page and the
// Netlify function that sends the results to Flodesk, so the email always says
// exactly what the page said. Edit the words here; keep each note short
// (under about 220 characters) so it fits in a Flodesk custom field.

export const STAGES = [
  "Not sure yet, but something's changed",
  "I think I'm in perimenopause",
  "I'm in menopause or post menopause",
  "I've been managing this for years and want to go deeper",
];

export const GOALS = [
  { label: "More energy", phrase: "more energy" },
  { label: "A stronger, more capable body", phrase: "a stronger, more capable body" },
  { label: "More emotional steadiness", phrase: "more steadiness, in your mood and your days" },
  { label: "Confidence in my body again", phrase: "to feel confident in your body again" },
];

// Order matters: when two levers tie for the lowest score, the earlier one
// becomes the lever to start with (sleep first, because the others stand on it).
// Each option is [answer, points]. notes[n] is what she reads for a score of n.
export const LEVERS = [
  {
    id: "sleep", n: "I", name: "Sleep",
    lesson: [
      "Sleep is the lever the other four stand on.",
      "As estrogen and progesterone shift, sleep often gets lighter and more broken. That's a change in your body, not a failing on your part. And it touches everything: your appetite, your mood, your recovery and how your body handles stress.",
    ],
    q: "Most nights, how does your sleep go?",
    options: [
      ["I sleep through the night and wake up rested", 3],
      ["I fall asleep fine but wake up during the night", 2],
      ["I have trouble falling asleep, staying asleep, or both", 1],
      ["I don't remember the last time I slept well", 0],
    ],
    notes: [
      "Sleep is asking for your attention, and that's where we start. Keep the same wake-up time every day and give yourself 20 screen-free minutes before bed.",
      "Sleep is asking for your attention. Start small: the same wake-up time every day, and 20 screen-free minutes before bed.",
      "You fall asleep well but wake in the night. A cooler, darker room and a steady wake-up time, weekends included, are the simplest places to start.",
      "Your sleep is a real strength. Protect it: keep the wind-down you already have, even on busy weeks.",
    ],
    step: "Choose one wake-up time and keep it for seven days, weekends included.",
  },
  {
    id: "protein", n: "II", name: "Protein",
    lesson: [
      "After 40, your muscles respond less to the protein you eat, so the same breakfast does less than it used to.",
      "Muscle is what keeps your metabolism, your bones and your balance strong. The good news: spreading protein across the day is one of the simplest changes with the biggest return.",
    ],
    q: "How intentional are you about protein?",
    options: [
      ["I plan it, and I know I'm getting enough", 3],
      ["I eat protein but don't think much about how much", 2],
      ["I probably don't get enough, most days", 1],
      ["I've never really thought about it", 0],
    ],
    notes: [
      "Protein is your quiet opportunity. Begin with breakfast: Greek yogurt, eggs or cottage cheese, and build from there.",
      "You're likely eating less protein than your muscles need now. Add one source to breakfast and let that become a habit before adding more.",
      "You eat protein, just without a plan. Aim for a palm-sized portion at every meal, starting with breakfast.",
      "You're already intentional about protein. Keep spreading it across the day, rather than saving most of it for dinner.",
    ],
    step: "Add a source of protein to your breakfast every day this week.",
  },
  {
    id: "carbs", n: "III", name: "Strategic carbs",
    lesson: [
      "Carbs are not the enemy.",
      "In midlife, the right carbs at the right time fuel your workouts, support your mood and help you sleep. What matters is the kind and the timing: fibre-rich carbs, paired with protein, around the times you move the most.",
    ],
    q: "What's your relationship with carbs right now?",
    options: [
      ["I eat them without guilt and feel good", 3],
      ["I eat them, but often feel guilty or confused", 1],
      ["I actively avoid or restrict them", 1],
      ["I swing between cutting them out and overeating them", 0],
    ],
    notes: [
      "Swinging between cutting carbs and overeating them is common, and very human. Steady carbs at meals usually ends the cycle faster than willpower does.",
      "Carbs feel complicated right now. Instead of cutting them, pair them with protein and fibre, and notice how your energy feels.",
      "You're finding your way with carbs. Pair them with protein and fibre, and place them around the times you move.",
      "You have a calm relationship with carbs. That's rarer than you'd think, and it makes every other lever easier.",
    ],
    step: "Pair every carb you eat with a protein this week, and notice your energy.",
  },
  {
    id: "exercise", n: "IV", name: "Exercise",
    lesson: [
      "Strength training is the most protective thing you can do for your body in this stage.",
      "It builds the muscle and bone that your hormones used to help you keep. It doesn't have to be long: 25 to 35 minutes, two or three times a week, changes how you feel. And it's never punishment for what you ate.",
    ],
    q: "How does movement fit into your week?",
    options: [
      ["I have a steady routine that includes strength work", 3],
      ["I move regularly, but it's mostly cardio, or on and off", 2],
      ["I move now and then, when I can make myself", 1],
      ["I've mostly stopped, or it feels impossible to start", 0],
    ],
    notes: [
      "Starting again can feel like the hardest part. One 10-minute strength session this week is a real start, not a small one.",
      "Movement comes and goes for you right now. Two 20-minute strength sessions a week, booked like appointments, will change the most.",
      "You move regularly. Adding two short strength sessions a week is the shift that will make the biggest difference.",
      "You have a strength routine. Your next gains come from progressing: a little heavier, a little more control, over time.",
    ],
    step: "Book two short strength sessions in your calendar this week, and keep them.",
  },
  {
    id: "recovery", n: "V", name: "Fueling & recovery",
    lesson: [
      "Recovery is part of the training, not time away from it.",
      "Your body gets stronger while it rests and refuels, not while it works. In midlife this matters even more: pushing through without food or rest raises stress and slows your progress.",
    ],
    q: "After a workout or a hard day, what do you usually do?",
    options: [
      ["I rest and refuel on purpose. It's part of my plan", 3],
      ["I mean to rest, but usually push through", 1],
      ["I feel guilty resting, so I rarely let myself", 1],
      ["I don't really have a recovery routine", 0],
    ],
    notes: [
      "You don't have a recovery routine yet. A protein-rich snack after you move, and one true rest day a week, is a strong start.",
      "You know rest matters, but it's easy to skip or feel guilty about. Treat your rest day as part of your training plan, because it is.",
      "You're building a recovery habit. Keep refuelling soon after you move, and protect at least one true rest day.",
      "Rest and refuelling are already part of your plan. That's what lets the other four levers keep working.",
    ],
    step: "Eat a protein-rich snack within an hour after you move this week.",
  },
];

export function levelOf(score) {
  return score >= 3 ? "Strong" : score === 2 ? "Building" : "Start here";
}

// A result is stored as 7 digits: stage, the five lever scores, goal.
// It holds no name or email, so it is safe to put in a link.
export function encode(r) {
  return [r.stage, ...r.scores, r.goal].join("");
}

export function decode(code) {
  if (!/^[0-3]{7}$/.test(code || "")) return null;
  const d = code.split("").map(Number);
  const scores = d.slice(1, 6);
  // Only scores an answer could actually give (carbs and recovery have no 2).
  if (!scores.every((s, i) => LEVERS[i].options.some((o) => o[1] === s))) return null;
  return { stage: d[0], scores, goal: d[6] };
}

export function results(r) {
  let top = 0;
  r.scores.forEach((s, i) => { if (s < r.scores[top]) top = i; });
  const total = r.scores.reduce((a, b) => a + b, 0);
  const band =
    total <= 5 ? "You're at the very start, and that's a good place to be. Every lever has room to grow, so small steps will show up fast."
    : total <= 10 ? "You have real strengths to build from. A little focus on one lever will make the others easier."
    : "You're doing more right than you think. Now it's about sharpening, not starting over.";
  const lever = LEVERS[top];
  const goal = GOALS[r.goal] || GOALS[0];
  const closing = `You told me you want ${goal.phrase}. Starting with ${lever.name.toLowerCase()} is the most direct way there, and you don't have to change everything at once.`;
  return {
    top: lever, total, band, closing, goal: goal.label, stage: STAGES[r.stage] || STAGES[0],
    levers: LEVERS.map((l, i) => ({ ...l, score: r.scores[i], level: levelOf(r.scores[i]), note: l.notes[r.scores[i]] })),
  };
}
