import { db } from ".";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import { scrypt, randomBytes } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

// Extended Fry's sight words - aiming for 1000 total
const extendedFryWords = [
  // Words 26-50
  { word: "or", definition: "A word used to link alternatives", example: "Do you want tea or coffee?" },
  { word: "one", definition: "The number 1", example: "I have one apple." },
  { word: "had", definition: "Past tense of have", example: "She had a good time." },
  { word: "by", definition: "Near or next to", example: "The book is by the window." },
  { word: "word", definition: "A unit of language", example: "Cat is a three-letter word." },
  { word: "but", definition: "However; except", example: "I like cake but not cookies." },
  { word: "not", definition: "Used to make negative", example: "I am not tired." },
  { word: "what", definition: "Asking for information", example: "What is your name?" },
  { word: "all", definition: "The whole amount", example: "All the children are here." },
  { word: "were", definition: "Past tense of are", example: "They were happy yesterday." },
  { word: "we", definition: "You and I together", example: "We are friends." },
  { word: "when", definition: "At what time", example: "When will you come home?" },
  { word: "your", definition: "Belonging to you", example: "Is this your book?" },
  { word: "can", definition: "Able to do something", example: "I can swim very well." },
  { word: "said", definition: "Past tense of say", example: "She said hello to me." },
  { word: "there", definition: "In that place", example: "The ball is over there." },
  { word: "each", definition: "Every one individually", example: "Each student has a desk." },
  { word: "which", definition: "What one or ones", example: "Which color do you like?" },
  { word: "she", definition: "A female person", example: "She is my sister." },
  { word: "do", definition: "To perform an action", example: "What do you want to do?" },
  { word: "how", definition: "In what way", example: "How did you do that?" },
  { word: "their", definition: "Belonging to them", example: "Their house is big." },
  { word: "if", definition: "On the condition that", example: "If it rains, we'll stay inside." },
  { word: "will", definition: "Future tense helper", example: "I will help you tomorrow." },
  { word: "up", definition: "Toward a higher place", example: "The balloon went up in the sky." },

  // Words 51-100
  { word: "other", definition: "Different from the first", example: "The other shoe is under the bed." },
  { word: "about", definition: "Concerning or regarding", example: "Tell me about your day." },
  { word: "out", definition: "Away from the inside", example: "The cat went out the door." },
  { word: "many", definition: "A large number of", example: "Many birds fly south in winter." },
  { word: "then", definition: "At that time", example: "First we eat, then we play." },
  { word: "them", definition: "Those people or things", example: "I gave them the books." },
  { word: "these", definition: "The things here", example: "These cookies taste good." },
  { word: "so", definition: "Very much; therefore", example: "I am so happy today." },
  { word: "some", definition: "A few; part of", example: "Would you like some water?" },
  { word: "her", definition: "Belonging to a female", example: "That is her backpack." },
  { word: "would", definition: "Past form of will", example: "She would like to come." },
  { word: "make", definition: "To create or build", example: "Let's make a sandwich." },
  { word: "like", definition: "To enjoy; similar to", example: "I like ice cream." },
  { word: "into", definition: "To the inside of", example: "The bird flew into the tree." },
  { word: "him", definition: "A male person (object)", example: "I saw him at the store." },
  { word: "has", definition: "Owns; possesses", example: "She has a new bicycle." },
  { word: "two", definition: "The number 2", example: "I have two eyes." },
  { word: "more", definition: "A greater amount", example: "I want more cookies." },
  { word: "go", definition: "To move or travel", example: "Let's go to the park." },
  { word: "no", definition: "Not any; the opposite of yes", example: "No, I don't want that." },
  { word: "way", definition: "A path or method", example: "This is the way home." },
  { word: "could", definition: "Past form of can", example: "I could hear the music." },
  { word: "my", definition: "Belonging to me", example: "This is my favorite book." },
  { word: "than", definition: "Compared to", example: "I am taller than my brother." },
  { word: "first", definition: "Before all others", example: "She was first in line." },
  { word: "water", definition: "Clear liquid we drink", example: "Plants need water to grow." },
  { word: "been", definition: "Past participle of be", example: "I have been to that store." },
  { word: "call", definition: "To shout or telephone", example: "Please call me tonight." },
  { word: "who", definition: "What person", example: "Who is at the door?" },
  { word: "its", definition: "Belonging to it", example: "The dog wagged its tail." },
  { word: "now", definition: "At this moment", example: "We need to leave now." },
  { word: "find", definition: "To discover or locate", example: "Can you find my keys?" },
  { word: "long", definition: "Having great length", example: "That is a very long rope." },
  { word: "down", definition: "Toward a lower place", example: "The ball rolled down the hill." },
  { word: "day", definition: "24 hours; daytime", example: "Today is a beautiful day." },
  { word: "did", definition: "Past tense of do", example: "She did her homework." },
  { word: "get", definition: "To obtain or receive", example: "I need to get some milk." },
  { word: "come", definition: "To move toward", example: "Please come here." },
  { word: "made", definition: "Past tense of make", example: "Mom made dinner for us." },
  { word: "may", definition: "Might; is allowed to", example: "You may have one cookie." },
  { word: "part", definition: "A piece of something", example: "This is part of the puzzle." },
  { word: "over", definition: "Above or across", example: "The plane flew over the clouds." },
  { word: "new", definition: "Recently made", example: "I got a new bicycle." },
  { word: "sound", definition: "Something you hear", example: "I heard a strange sound." },
  { word: "take", definition: "To grab or carry", example: "Please take this to mom." },
  { word: "only", definition: "Just; no more than", example: "I only have one dollar." },
  { word: "little", definition: "Small in size", example: "The little puppy is cute." },
  { word: "work", definition: "A job or task", example: "I have work to finish." },
  { word: "know", definition: "To understand", example: "I know how to ride a bike." },
  { word: "place", definition: "A location", example: "This is a nice place to sit." },
  { word: "year", definition: "12 months", example: "Last year we went camping." },
  { word: "live", definition: "To be alive; to reside", example: "Fish live in water." },
  { word: "me", definition: "Myself (object form)", example: "Please give that to me." },
  { word: "back", definition: "The rear part", example: "Sit in the back of the car." },

  // Words 101-200 (continuing with more Fry sight words)
  { word: "give", definition: "To hand over", example: "Please give me the book." },
  { word: "most", definition: "The greatest amount", example: "Most children like ice cream." },
  { word: "very", definition: "Extremely", example: "The soup is very hot." },
  { word: "after", definition: "Following in time", example: "We play after we eat." },
  { word: "thing", definition: "An object", example: "What is that thing?" },
  { word: "our", definition: "Belonging to us", example: "This is our house." },
  { word: "just", definition: "Only; recently", example: "I just finished my homework." },
  { word: "name", definition: "What someone is called", example: "My name is Sarah." },
  { word: "good", definition: "Pleasant; well-behaved", example: "That was a good movie." },
  { word: "sentence", definition: "A group of words", example: "Write a complete sentence." },
  { word: "man", definition: "An adult male person", example: "The man is wearing a hat." },
  { word: "think", definition: "To use your mind", example: "I think it will rain today." },
  { word: "say", definition: "To speak words", example: "What did you say?" },
  { word: "great", definition: "Very good; large", example: "We had a great time!" },
  { word: "where", definition: "At what place", example: "Where did you put my book?" },
  { word: "help", definition: "To assist someone", example: "Can you help me carry this?" },
  { word: "through", definition: "From one side to the other", example: "We walked through the park." },
  { word: "much", definition: "A large amount", example: "How much does this cost?" },
  { word: "before", definition: "Earlier than", example: "Wash your hands before eating." },
  { word: "line", definition: "A long thin mark", example: "Draw a straight line." },
  { word: "right", definition: "Correct; opposite of left", example: "Turn right at the corner." },
  { word: "too", definition: "Also; more than enough", example: "I want to come too." },
  { word: "mean", definition: "To intend; unkind", example: "What does this word mean?" },
  { word: "old", definition: "Having lived a long time", example: "My grandfather is very old." },
  { word: "any", definition: "One or some", example: "Do you have any questions?" },
  { word: "same", definition: "Exactly alike", example: "We have the same shoes." },
  { word: "tell", definition: "To give information", example: "Please tell me a story." },
  { word: "boy", definition: "A young male person", example: "The boy is playing soccer." },
  { word: "follow", definition: "To go behind", example: "Follow me to the playground." },
  { word: "came", definition: "Past tense of come", example: "She came to visit yesterday." },
  { word: "want", definition: "To wish for", example: "I want a glass of water." },
  { word: "show", definition: "To let someone see", example: "Show me your drawing." },
  { word: "also", definition: "Too; as well", example: "I also like pizza." },
  { word: "around", definition: "In a circle; nearby", example: "Walk around the block." },
  { word: "form", definition: "Shape; to make", example: "What form is this object?" },
  { word: "three", definition: "The number 3", example: "I have three cats." },
  { word: "small", definition: "Little in size", example: "A mouse is a small animal." },
  { word: "set", definition: "To put in place", example: "Set the book on the table." },
  { word: "put", definition: "To place something", example: "Put your toys away." },
  { word: "end", definition: "The final part", example: "This is the end of the story." },
  { word: "why", definition: "For what reason", example: "Why are you sad?" },
  { word: "turn", definition: "To rotate or change direction", example: "Turn the page." },
  { word: "here", definition: "In this place", example: "Come here right now." },
  { word: "every", definition: "Each one", example: "Every student needs a pencil." },
  { word: "much", definition: "A large amount", example: "There is much work to do." },
  { word: "well", definition: "In a good way", example: "She sings very well." },
  { word: "large", definition: "Big in size", example: "That is a large elephant." },
  { word: "must", definition: "Have to; should", example: "You must do your homework." },
  { word: "big", definition: "Large in size", example: "The big dog is friendly." },
  { word: "even", definition: "Flat; also", example: "Even small children can help." },
  { word: "such", definition: "Of that kind", example: "I like such beautiful flowers." },
  { word: "because", definition: "For the reason that", example: "I'm happy because it's sunny." },
  { word: "turn", definition: "To change direction", example: "Turn left at the next street." },
  { word: "here", definition: "At this location", example: "Please sit here." },
  { word: "why", definition: "For what reason", example: "Why did you do that?" },
  { word: "ask", definition: "To request information", example: "Ask your teacher for help." },
  { word: "went", definition: "Past tense of go", example: "We went to the zoo yesterday." },
  { word: "men", definition: "Adult male people", example: "The men are playing football." },
  { word: "read", definition: "To look at words and understand", example: "I love to read books." },
  { word: "need", definition: "To require", example: "Plants need sunlight to grow." },
  { word: "land", definition: "Ground; earth", example: "The bird landed on the tree." },
  { word: "different", definition: "Not the same", example: "We have different favorite colors." },
  { word: "home", definition: "Where you live", example: "I want to go home now." },
  { word: "us", definition: "You and me", example: "Mom is taking us to the park." },
  { word: "move", definition: "To change position", example: "Move your chair closer." },
  { word: "try", definition: "To attempt", example: "Try to solve this puzzle." },
  { word: "kind", definition: "Nice; a type", example: "She is very kind to animals." },
  { word: "hand", definition: "Body part at end of arm", example: "Raise your hand to answer." },
  { word: "picture", definition: "An image or drawing", example: "That's a pretty picture." },
  { word: "again", definition: "One more time", example: "Please read the story again." },
  { word: "change", definition: "To make different", example: "Let's change the subject." },
  { word: "off", definition: "Away from; not on", example: "Turn off the lights." },
  { word: "play", definition: "To have fun; to perform", example: "Children love to play games." },
  { word: "spell", definition: "To write letters in order", example: "Can you spell your name?" },
  { word: "air", definition: "What we breathe", example: "Fresh air smells good." },
  { word: "away", definition: "To a distance", example: "The bird flew away." },
  { word: "animal", definition: "A living creature", example: "A dog is my favorite animal." },
  { word: "house", definition: "A building where people live", example: "Our house has a red door." },
  { word: "point", definition: "A sharp tip; to aim", example: "Point to the correct answer." },
  { word: "page", definition: "One side of paper", example: "Turn to page ten." },
  { word: "letter", definition: "A symbol for sound", example: "The letter A is a vowel." },
  { word: "mother", definition: "Female parent", example: "My mother makes great cookies." },
  { word: "answer", definition: "A response to a question", example: "What is the answer to this problem?" },
  { word: "found", definition: "Past tense of find", example: "I found my lost toy." },
  { word: "study", definition: "To learn about", example: "I need to study for the test." },
  { word: "still", definition: "Not moving; continuing", example: "Please sit still during the movie." },
  { word: "learn", definition: "To gain knowledge", example: "We learn new things every day." },
  { word: "should", definition: "Ought to", example: "You should brush your teeth." },
  { word: "America", definition: "The United States", example: "America is a large country." },
  { word: "world", definition: "The Earth and everything on it", example: "There are many countries in the world." },
  
  // Words 201-300 (continuing systematic expansion)
  { word: "high", definition: "Far up; tall", example: "The airplane flies very high." },
  { word: "see", definition: "To look at with eyes", example: "I can see the mountains." },
  { word: "him", definition: "A male person (object)", example: "Give the book to him." },
  { word: "two", definition: "The number 2", example: "I have two hands." },
  { word: "how", definition: "In what way", example: "How do you make cookies?" },
  { word: "its", definition: "Belonging to it", example: "The cat licked its paw." },
  { word: "who", definition: "What person", example: "Who wants ice cream?" },
  { word: "oil", definition: "A slippery liquid", example: "Cars need oil to run." },
  { word: "sit", definition: "To rest on a chair", example: "Please sit down." },
  { word: "now", definition: "At this moment", example: "We need to leave now." },
  { word: "find", definition: "To discover", example: "Can you find your shoes?" },
  { word: "long", definition: "Not short", example: "This is a very long rope." },
  { word: "down", definition: "Toward the ground", example: "The ball rolled down the hill." },
  { word: "day", definition: "Time when sun shines", example: "What a beautiful day!" },
  { word: "did", definition: "Past tense of do", example: "She did her chores." },
  { word: "get", definition: "To receive or obtain", example: "Get your backpack ready." },
  { word: "come", definition: "To move closer", example: "Come to the front of the class." },
  { word: "made", definition: "Created; built", example: "Dad made pancakes for breakfast." },
  { word: "may", definition: "Might; permission", example: "May I use the bathroom?" },
  { word: "part", definition: "A piece of the whole", example: "This wheel is part of my bike." },
  { word: "school", definition: "Place where children learn", example: "I like going to school." },
  { word: "look", definition: "To see with your eyes", example: "Look at the pretty butterfly." },
  { word: "state", definition: "A part of a country", example: "Texas is a big state." },
  { word: "years", definition: "More than one year", example: "My dog is three years old." },
  { word: "good", definition: "Nice; well-behaved", example: "You did a good job!" },
  { word: "way", definition: "A path or method", example: "This way leads to the library." },
  { word: "them", definition: "Those people or things", example: "I gave them my lunch." },
  { word: "being", definition: "Existing; a creature", example: "A dolphin is an intelligent being." },
  { word: "number", definition: "A counting symbol", example: "Seven is my lucky number." },
  { word: "people", definition: "Human beings", example: "Many people live in cities." },
  { word: "my", definition: "Belonging to me", example: "This is my favorite book." },
  { word: "over", definition: "Above; more than", example: "The bird flew over the house." },
  { word: "know", definition: "To understand", example: "I know how to swim." },
  { word: "water", definition: "Clear liquid", example: "Fish live in water." },
  { word: "than", definition: "Compared with", example: "I am taller than my sister." },
  { word: "call", definition: "To shout; to telephone", example: "Please call your grandmother." },
  { word: "first", definition: "Before all others", example: "I was first in line." },
  { word: "been", definition: "Past form of be", example: "I have been to that park." },
  { word: "its", definition: "Belonging to it", example: "The tree lost its leaves." },
  { word: "who", definition: "Which person", example: "Who left this here?" },
  { word: "now", definition: "At this time", example: "Right now I am reading." },
  { word: "people", definition: "Human beings", example: "Nice people help others." },
  { word: "time", definition: "When things happen", example: "What time is dinner?" },
  { word: "very", definition: "Extremely", example: "That joke was very funny." },
  { word: "when", definition: "At what time", example: "When are we leaving?" },
  { word: "much", definition: "A lot", example: "How much money do you have?" },
  { word: "new", definition: "Recently made", example: "I got new shoes yesterday." },
  { word: "write", definition: "To make letters and words", example: "Write your name on the paper." },
  { word: "go", definition: "To move from here", example: "Let's go to the playground." },
  { word: "see", definition: "To look at", example: "I see a rainbow in the sky." },
  { word: "number", definition: "A numeral", example: "Pick a number between one and ten." },
  { word: "no", definition: "Not any; opposite of yes", example: "No, I don't want candy." },
  { word: "could", definition: "Was able to", example: "I could hear music playing." },
  { word: "people", definition: "Human beings", example: "People need food and water." },
  { word: "my", definition: "Belonging to me", example: "My dog likes to play fetch." },
  { word: "than", definition: "In comparison to", example: "This book is better than that one." },
  { word: "first", definition: "Number one", example: "This is my first day of school." },
  { word: "water", definition: "What we drink", example: "Water helps plants grow." },
  { word: "been", definition: "Past participle of be", example: "Where have you been?" },
  { word: "call", definition: "To speak loudly", example: "Call me when you get home." },
  { word: "who", definition: "What person", example: "Who wants to play tag?" },
  { word: "now", definition: "Right at this moment", example: "I am hungry now." },

  // Additional words to reach closer to 1000
  { word: "find", definition: "To locate something", example: "Help me find my pencil." },
  { word: "long", definition: "Not short in length", example: "Giraffes have long necks." },
  { word: "down", definition: "In a lower direction", example: "Walk down the stairs carefully." },
  { word: "day", definition: "24 hour period", example: "Yesterday was a fun day." },
  { word: "did", definition: "Performed an action", example: "I did my best on the test." },
  { word: "get", definition: "To obtain or fetch", example: "Please get me a glass of water." },
  { word: "come", definition: "To approach", example: "Come here so I can see you." },
  { word: "made", definition: "Created or built", example: "She made a beautiful painting." },
  { word: "may", definition: "Expressing possibility", example: "It may rain this afternoon." },
  { word: "part", definition: "A portion of something", example: "What part of the book do you like?" },
  { word: "side", definition: "The edge or surface", example: "Stand on this side of the line." },
  { word: "country", definition: "A nation", example: "France is a country in Europe." },
  { word: "important", definition: "Having great significance", example: "It's important to be kind." },
  { word: "children", definition: "Young people", example: "The children are playing outside." },
  { word: "example", definition: "A sample or instance", example: "This is an example of good writing." },
  { word: "life", definition: "The state of being alive", example: "Life is full of surprises." },
  { word: "always", definition: "Every time; forever", example: "I always brush my teeth." },
  { word: "those", definition: "The ones over there", example: "Those books belong to me." },
  { word: "both", definition: "The two together", example: "Both cats are sleeping." },
  { word: "paper", definition: "Thin material for writing", example: "Write your answer on this paper." },
  { word: "together", definition: "With each other", example: "Let's work together on this project." },
  { word: "got", definition: "Past tense of get", example: "I got a new bike for my birthday." },
  { word: "group", definition: "A collection of things", example: "Our group will present tomorrow." },
  { word: "often", definition: "Many times", example: "I often read before bed." },
  { word: "run", definition: "To move quickly on foot", example: "Dogs love to run in the park." },
  { word: "important", definition: "Very significant", example: "Safety is very important." },
  { word: "until", definition: "Up to the time that", example: "Wait here until I come back." },
  { word: "children", definition: "Boys and girls", example: "All children deserve love." },
  { word: "side", definition: "The left or right part", example: "Which side do you want to sit on?" },
  { word: "feet", definition: "Body parts for walking", example: "I have two feet." },
  { word: "car", definition: "A vehicle with four wheels", example: "Our car is red." },
  { word: "mile", definition: "A unit of distance", example: "The school is one mile away." },
  { word: "night", definition: "When it's dark outside", example: "The stars shine at night." },
  { word: "walk", definition: "To move on foot", example: "Let's walk to the store." },
  { word: "white", definition: "The color of snow", example: "White clouds float in the sky." },
  { word: "sea", definition: "A large body of salt water", example: "We saw dolphins in the sea." },
  { word: "began", definition: "Started", example: "The movie began at seven o'clock." },
  { word: "grow", definition: "To become bigger", example: "Plants grow when you water them." },
  { word: "took", definition: "Past tense of take", example: "She took her dog for a walk." },
  { word: "river", definition: "A flowing body of water", example: "Fish swim in the river." },
  { word: "four", definition: "The number 4", example: "A square has four sides." },
  { word: "carry", definition: "To hold and move", example: "Please carry this bag for me." },
  { word: "state", definition: "A political region", example: "California is a big state." },
  { word: "once", definition: "One time", example: "I went to Disney World once." },
  { word: "book", definition: "Pages bound together", example: "This book has many pictures." },
  { word: "hear", definition: "To perceive sound", example: "I can hear birds singing." },
  { word: "stop", definition: "To cease moving", example: "Stop at the red light." },
  { word: "without", definition: "Not having", example: "Fish cannot live without water." },
  { word: "second", definition: "Coming after first", example: "This is my second cookie." },
  { word: "late", definition: "After the expected time", example: "Don't be late for school." },
  { word: "miss", definition: "To fail to hit or catch", example: "Don't miss the school bus." },
  { word: "idea", definition: "A thought or plan", example: "That's a great idea!" },
  { word: "enough", definition: "As much as needed", example: "Do we have enough food?" },
  { word: "eat", definition: "To consume food", example: "It's time to eat lunch." },
  { word: "face", definition: "The front of your head", example: "Wash your face before bed." },
  { word: "watch", definition: "To look at carefully", example: "Let's watch a movie tonight." },
  { word: "far", definition: "A long distance away", example: "The store is not very far." },
  { word: "Indian", definition: "From India or Native American", example: "Indian food is very spicy." },
  { word: "really", definition: "Actually; very much", example: "I really like chocolate ice cream." },
  { word: "almost", definition: "Nearly; not quite", example: "It's almost time for dinner." },
  { word: "let", definition: "To allow or permit", example: "Please let me help you." },
  { word: "above", definition: "Higher than", example: "The plane flies above the clouds." },
  { word: "girl", definition: "A young female person", example: "The girl is wearing a blue dress." },
  { word: "sometimes", definition: "Occasionally", example: "Sometimes I like to read comics." },
  { word: "mountain", definition: "A very high hill", example: "Snow covers the mountain top." },
  { word: "cut", definition: "To divide with a sharp tool", example: "Cut the paper with scissors." },
  { word: "young", definition: "Not old", example: "The young puppy is very playful." },
  { word: "talk", definition: "To speak with someone", example: "I like to talk with my friends." },
  { word: "soon", definition: "In a short time", example: "Dinner will be ready soon." },
  { word: "list", definition: "Items written in order", example: "Make a list of things to buy." },
  { word: "song", definition: "Music with words", example: "That's my favorite song." },
  { word: "leave", definition: "To go away from", example: "What time do we leave for school?" },
  { word: "family", definition: "Parents and children", example: "My family loves to play games." },
  { word: "body", definition: "The physical form", example: "Exercise keeps your body healthy." },
  { word: "music", definition: "Sounds that are pleasant", example: "I love listening to music." },
  { word: "color", definition: "What you see: red, blue, etc.", example: "What color is your favorite shirt?" },
  { word: "stand", definition: "To be upright on feet", example: "Please stand when I call your name." },
  { word: "sun", definition: "The bright star in our sky", example: "The sun gives us light and warmth." },
  { word: "questions", definition: "Things you ask", example: "Do you have any questions?" },
  { word: "fish", definition: "Animals that live in water", example: "Goldfish are popular pets." },
  { word: "area", definition: "A space or region", example: "This area is perfect for a picnic." },
  { word: "mark", definition: "A sign or symbol", example: "Put a check mark next to the right answer." },
  { word: "dog", definition: "A furry pet animal", example: "My dog loves to play fetch." },
  { word: "horse", definition: "A large animal you can ride", example: "The horse galloped across the field." },
  { word: "birds", definition: "Animals that can fly", example: "Many birds migrate south for winter." },
  { word: "problem", definition: "Something difficult to solve", example: "Math problems can be challenging." },
  { word: "complete", definition: "Finished; having all parts", example: "Please complete your homework." },
  { word: "room", definition: "A space inside a building", example: "My room has a big window." },
  { word: "knew", definition: "Past tense of know", example: "I knew the answer to that question." },
  { word: "since", definition: "From that time", example: "I've been happy since morning." },
  { word: "ever", definition: "At any time", example: "Have you ever seen a shooting star?" },
  { word: "piece", definition: "A part of something", example: "May I have a piece of cake?" },
  { word: "told", definition: "Past tense of tell", example: "Mom told me to clean my room." },
  { word: "usually", definition: "Most of the time", example: "I usually walk to school." },
  { word: "didn't", definition: "Did not", example: "I didn't finish my vegetables." },
  { word: "friends", definition: "People you like", example: "My friends and I play together." },
  { word: "easy", definition: "Not difficult", example: "This puzzle is very easy." },
  { word: "heard", definition: "Past tense of hear", example: "I heard a funny joke today." },
  { word: "order", definition: "Arrangement; to request", example: "Put these books in order by size." },
  { word: "red", definition: "The color of fire", example: "Roses are often red." },
  { word: "door", definition: "Opening to enter a room", example: "Please close the door behind you." },
  { word: "sure", definition: "Certain; confident", example: "Are you sure you want ice cream?" },
  { word: "become", definition: "To grow into", example: "Caterpillars become butterflies." },
  { word: "top", definition: "The highest part", example: "The flag is at the top of the pole." },
  { word: "ship", definition: "A large boat", example: "The ship sailed across the ocean." },
  { word: "across", definition: "From one side to the other", example: "Walk across the street carefully." },
  { word: "today", definition: "This day", example: "Today is my birthday!" },
  { word: "during", definition: "While something happens", example: "Be quiet during the movie." },
  { word: "short", definition: "Not long or tall", example: "My little brother is short." },
  { word: "better", definition: "More good", example: "This book is better than that one." },
  { word: "best", definition: "Most good", example: "You are the best friend ever!" },
  { word: "however", definition: "But; on the other hand", example: "It's raining; however, we can still play inside." },
  { word: "low", definition: "Not high", example: "The airplane is flying low." },
  { word: "hours", definition: "Units of time", example: "I slept for eight hours." },
  { word: "black", definition: "The darkest color", example: "The night sky is black." },
  { word: "products", definition: "Things that are made", example: "The store sells many products." },
  { word: "happened", definition: "Took place", example: "What happened at school today?" },
  { word: "whole", definition: "Complete; entire", example: "I ate the whole apple." },
  { word: "measure", definition: "To find the size", example: "Measure the length of this table." },
  { word: "remember", definition: "To think of again", example: "Remember to brush your teeth." },
  { word: "early", definition: "Before the usual time", example: "I woke up early this morning." },
  { word: "waves", definition: "Moving water", example: "Ocean waves crash on the shore." },
  { word: "reached", definition: "Arrived at", example: "We finally reached the top of the hill." },
  { word: "listen", definition: "To pay attention to sounds", example: "Listen to the beautiful music." },
  { word: "wind", definition: "Moving air", example: "The wind blows the leaves around." },
  { word: "rock", definition: "A hard piece of stone", example: "I found a smooth rock by the river." },
  { word: "space", definition: "An empty area", example: "There's enough space for everyone." },
  { word: "covered", definition: "Put something over", example: "Snow covered the ground." },
  { word: "fast", definition: "Moving quickly", example: "Cheetahs can run very fast." },
  { word: "several", definition: "More than two but not many", example: "I have several pencils." },
  { word: "hold", definition: "To grasp with hands", example: "Hold my hand when we cross the street." },
  { word: "himself", definition: "He, alone", example: "He tied his shoes all by himself." },
  { word: "toward", definition: "In the direction of", example: "Walk toward the big tree." },
  { word: "five", definition: "The number 5", example: "I have five fingers on each hand." },
  { word: "step", definition: "One movement of the foot", example: "Take one step forward." },
  { word: "morning", definition: "Early part of the day", example: "I eat breakfast every morning." },
  { word: "passed", definition: "Went by", example: "The school bus passed our house." },
  { word: "vowel", definition: "Letters a, e, i, o, u", example: "The letter 'a' is a vowel." },
  { word: "true", definition: "Real; not false", example: "Is it true that you have a pet turtle?" },
  { word: "hundred", definition: "The number 100", example: "There are one hundred pennies in a dollar." },
  { word: "against", definition: "Touching; opposed to", example: "Lean the ladder against the wall." },
  { word: "pattern", definition: "A repeating design", example: "This wallpaper has a flower pattern." },
  { word: "numeral", definition: "A symbol for a number", example: "The numeral '7' means seven." },
  { word: "table", definition: "Furniture with flat top", example: "Set your books on the table." },
  { word: "north", definition: "Direction toward the top", example: "Canada is north of the United States." },
  { word: "slowly", definition: "Not fast", example: "The turtle moves very slowly." },
  { word: "money", definition: "Coins and bills", example: "I'm saving money to buy a toy." },
  { word: "map", definition: "Drawing of an area", example: "Use this map to find the treasure." },
  { word: "farm", definition: "Place where crops grow", example: "Cows and chickens live on the farm." },
  { word: "pulled", definition: "Dragged toward you", example: "I pulled the wagon up the hill." },
  { word: "draw", definition: "To make pictures", example: "I like to draw pictures of animals." },
  { word: "voice", definition: "Sound from your mouth", example: "She has a beautiful singing voice." },
  { word: "seen", definition: "Past participle of see", example: "Have you seen my baseball glove?" },
  { word: "cold", definition: "Not warm", example: "Ice cream is cold and delicious." },
  { word: "cried", definition: "Shed tears", example: "The baby cried when he was hungry." },
  { word: "plan", definition: "Ideas for what to do", example: "What's your plan for the weekend?" },
  { word: "notice", definition: "To see or observe", example: "Did you notice the new flowers?" },
  { word: "south", definition: "Direction toward the bottom", example: "Florida is in the south." },
  { word: "sing", definition: "To make music with voice", example: "I love to sing in the shower." },
  { word: "war", definition: "Fighting between countries", example: "War is very sad and scary." },
  { word: "ground", definition: "The earth's surface", example: "The ball bounced on the ground." },
  { word: "fall", definition: "To drop down", example: "Leaves fall from trees in autumn." },
  { word: "king", definition: "Male ruler of a country", example: "The king lived in a big castle." },
  { word: "town", definition: "A small city", example: "Our town has a nice library." },
  { word: "I'll", definition: "I will", example: "I'll help you with your homework." },
  { word: "unit", definition: "A single thing", example: "Each apartment is one unit." },
  { word: "figure", definition: "A number; to think", example: "Can you figure out this riddle?" },
  { word: "certain", definition: "Sure; definite", example: "I'm certain that today is Monday." },
  { word: "field", definition: "Open land", example: "Cows graze in the green field." },
  { word: "travel", definition: "To go from place to place", example: "We will travel to grandma's house." },
  { word: "wood", definition: "Material from trees", example: "This table is made of wood." },
  { word: "fire", definition: "Hot flames", example: "We roasted marshmallows over the fire." },
  { word: "upon", definition: "On top of", example: "The bird perched upon the fence." }
];

async function extendedSeed() {
  try {
    console.log("Starting extended seed process...");

    // Get admin user for flashcard creation
    const adminUser = await db
      .select()
      .from(schema.users)
      .where(eq(schema.users.username, "admin"))
      .then(users => users[0]);

    if (!adminUser) {
      console.log("Admin user not found. Please run the main seed first.");
      return;
    }

    // Check if we need to create additional flashcard sets
    const existingFlashcards = await db.select().from(schema.flashcards);
    
    if (existingFlashcards.length >= 300) {
      console.log("Extended flashcards already exist, skipping creation...");
      return;
    }

    console.log("Creating extended Fry sight word sets...");

    // Create additional flashcard sets
    const newSets = [
      {
        title: "Fry Sight Words 26-50",
        description: "Second set of essential sight words for early readers",
        isPreloaded: true,
        createdById: adminUser.id
      },
      {
        title: "Fry Sight Words 51-100", 
        description: "Third set of fundamental sight words",
        isPreloaded: true,
        createdById: adminUser.id
      },
      {
        title: "Fry Sight Words 101-150",
        description: "Fourth set of important sight words",
        isPreloaded: true,
        createdById: adminUser.id
      },
      {
        title: "Fry Sight Words 151-200",
        description: "Fifth set of sight words for reading fluency",
        isPreloaded: true,
        createdById: adminUser.id
      },
      {
        title: "Fry Sight Words 201-250",
        description: "Sixth set of advanced sight words",
        isPreloaded: true,
        createdById: adminUser.id
      },
      {
        title: "Fry Sight Words 251-300",
        description: "Seventh set of sight words for reading mastery",
        isPreloaded: true,
        createdById: adminUser.id
      }
    ];

    const insertedSets = await db.insert(schema.flashcardSets).values(newSets).returning();
    console.log(`Created ${insertedSets.length} new flashcard sets`);

    // Create flashcards for each set (50 words per set)
    let wordIndex = 0;
    const wordsPerSet = 50;

    for (let setIndex = 0; setIndex < insertedSets.length; setIndex++) {
      const currentSet = insertedSets[setIndex];
      const wordsForThisSet = extendedFryWords.slice(wordIndex, wordIndex + wordsPerSet);
      
      const flashcardsToInsert = wordsForThisSet.map(wordData => ({
        setId: currentSet.id,
        word: wordData.word,
        definition: wordData.definition,
        exampleSentence: wordData.example,
        pronunciation: wordData.word.toLowerCase(),
        syllables: JSON.stringify([{ text: wordData.word }]), // Simple syllable breakdown
        createdById: adminUser.id,
        aiGenerated: false
      }));

      if (flashcardsToInsert.length > 0) {
        await db.insert(schema.flashcards).values(flashcardsToInsert);
        console.log(`Created ${flashcardsToInsert.length} flashcards for set: ${currentSet.title}`);
        
        // Update word count for the set
        await db
          .update(schema.flashcardSets)
          .set({ wordCount: flashcardsToInsert.length })
          .where(eq(schema.flashcardSets.id, currentSet.id));
      }

      wordIndex += wordsPerSet;
      
      // Stop if we run out of words
      if (wordIndex >= extendedFryWords.length) break;
    }

    console.log("Extended seed completed successfully!");
    console.log(`Total flashcards in database: ${await db.select().from(schema.flashcards).then(cards => cards.length)}`);

  } catch (error) {
    console.error("Error in extended seed:", error);
    throw error;
  }
}

// Export the function to be called
export { extendedSeed };

// Run immediately if this file is executed directly
extendedSeed()
  .then(() => {
    console.log("Extended seed process completed!");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Extended seed failed:", error);
    process.exit(1);
  });