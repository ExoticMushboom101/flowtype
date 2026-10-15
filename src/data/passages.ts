import type { Category } from "../types";
// Practice prose written originally for FlowType. No remote service and no
// copyrighted excerpts. Everything ships with the bundle so typing works offline.
export const passages: Record<Exclude<Category, "mixed">, string[]> = {
  nature: [
    "The morning light moves softly across the lake as the world begins to wake. A gentle breeze carries the scent of pine and the promise of a new day. Somewhere beyond the trees, a river finds its patient way to the sea.",
    "At the edge of the forest, the trail opens into a meadow. Every blade of grass holds a small drop of rain. We stop for a moment and listen to the quiet work of the living world around us.",
    "The mountains do not hurry to meet the sky. They stand through seasons of snow and sunlight while small streams carve new paths below. There is something to learn from the way the landscape holds its own rhythm.",
    "As evening settles over the valley, the water turns the color of silver. A bird crosses the open sky and the reeds bend toward the shore. The simplest moments often leave the deepest impressions.",
    "Fog lifts slowly from the hills, revealing one ridge after another. The air is cool and clean, and every sound seems closer than before. A heron waits at the water's edge, perfectly still, perfectly patient.",
  ],
  travel: [
    "We arrived at the station just as the town was waking up. A small cafe had opened its doors, and the smell of fresh bread followed us down the narrow street. With no map in hand, we decided to follow our curiosity.",
    "The road curved along the coast through quiet villages and open fields. Each turn revealed another stretch of blue water. We stopped not because we had reached a destination, but because the view invited us to stay.",
    "A journey can change the shape of an ordinary day. You learn the names of unfamiliar streets and discover that kindness needs very few words. Sometimes the best souvenir is a new way of seeing home.",
    "The night train hummed across the plains while the passengers drifted into sleep. Through the window, small towns appeared as clusters of light and then vanished again. By morning, the air smelled of salt and rain.",
  ],
  science: [
    "Discovery begins with a question that refuses to go away. We observe, make a prediction, and test our ideas against the world. A surprising result is not a failure but an invitation to look a little closer.",
    "Light from a distant star crosses an enormous stretch of space before reaching our eyes. To look into the night sky is to look into the past. Each point of light carries a story that began long before our own.",
    "Under the lens, a drop of water becomes an entire world. Tiny structures move and change in patterns we can measure. The closer we look at familiar things, the more extraordinary they become.",
    "A good experiment is honest about what it cannot know. It controls what it can, records what it sees, and leaves room for the result to disagree. Careful notes today become reliable knowledge tomorrow.",
  ],
  creativity: [
    "A blank page is not an empty place. It is a small clearing where an idea can begin to take shape. Put one mark down, then another, and let the work show you where it wants to go.",
    "Good ideas often arrive while we are busy doing something else. A walk, a conversation, or a quiet afternoon can connect thoughts that seemed unrelated. Leave a little room for the unexpected.",
    "The first version does not need to be beautiful. It only needs to exist. With each careful revision, the rough edges become part of a clearer whole, and the work begins to sound like you.",
    "Constraints can be generous. A small canvas, a short deadline, or a limited palette asks us to choose with care. Within those edges, a surprising amount of freedom is waiting to be found.",
  ],
  learning: [
    "Progress is rarely a straight line. Some days a new skill feels natural, and other days the same task takes all of our attention. Keep returning to the work with patience. Small efforts gather into lasting change.",
    "When we learn something new, we make room for a different version of ourselves. Ask the simple question, try the unfamiliar method, and be willing to begin again. Confidence grows from practice, not perfection.",
    "Rest is part of learning. A quiet pause gives the mind time to connect what it has discovered. Return with fresh attention and notice how much of the path is already familiar.",
    "Discipline is not a loud promise made once. It is a quiet choice made again each morning. Show up, do the small task well, and trust that the steady days will carry you further than the dramatic ones.",
  ],
  everyday: [
    "The kettle begins to sing while the house is still quiet. You open the window, pour a cup of tea, and make a short list for the day. There is a kind of comfort in these small and ordinary rituals.",
    "On the way home, we stopped at the corner shop for apples and a loaf of bread. The afternoon light fell across the pavement. Nothing remarkable happened, and somehow that made it a very good day.",
    "A good conversation does not always need an answer. Sometimes it is enough to listen carefully, leave space between words, and let another person know that they have been heard.",
    "Rain tapped against the window while the soup simmered on the stove. Someone laughed in the next room, and a dog settled by the door. It was the kind of evening that asks for nothing more.",
  ],
};
export const categories: Category[] = [
  "nature",
  "travel",
  "science",
  "creativity",
  "learning",
  "everyday",
  "mixed",
];
export interface Quote {
  text: string;
  author: string;
  /** Where the words come from. Public-domain works are cited by title and year. */
  source?: string;
}
export const quotes: Quote[] = [
  {
    text: "Give your attention to the step in front of you. The path will reveal itself one small, steady movement at a time.",
    author: "FlowType notes",
  },
  {
    text: "A quiet mind is not a mind without thoughts. It is a mind that lets each thought pass like a cloud above the lake.",
    author: "FlowType notes",
  },
  {
    text: "Practice is the art of returning. Not to the place where you were, but to the work that helps you grow.",
    author: "FlowType notes",
  },
  {
    text: "There is no need to race the river. Find your own current, trust your direction, and keep moving.",
    author: "FlowType notes",
  },
  // Public-domain works (19th and early 20th century), wording checked against
  // Project Gutenberg / Digital Thoreau editions.
  {
    text: "I went to the woods because I wished to live deliberately, to front only the essential facts of life, and see if I could not learn what it had to teach.",
    author: "Henry David Thoreau",
    source: "Walden, 1854",
  },
  {
    text: "If one advances confidently in the direction of his dreams, and endeavors to live the life which he has imagined, he will meet with a success unexpected in common hours.",
    author: "Henry David Thoreau",
    source: "Walden, 1854",
  },
  {
    text: "In the woods, we return to reason and faith.",
    author: "Ralph Waldo Emerson",
    source: "Nature, 1836",
  },
  {
    text: "Thousands of tired, nerve-shaken, over-civilized people are beginning to find out that going to the mountains is going home.",
    author: "John Muir",
    source: "Our National Parks, 1901",
  },
];
/** Short, local, secondary lines for the results screen. Chosen from the result id. */
export const motivations = [
  "A steady rhythm takes you further than a hurried start.",
  "Accuracy first. Speed follows the hands that know the way.",
  "Every test is a small conversation between attention and habit.",
  "The calm keystroke is usually the fast one.",
  "You showed up and practiced. That is the whole secret.",
  "Rest your hands for a moment. The next run will feel lighter.",
];
