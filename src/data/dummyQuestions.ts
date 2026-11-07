import { Question } from '../types';

export const DUMMY_QUESTIONS: Question[] = [
  // Task 1: Section A - Le Fait Divers (25 minutes, min 80 mots)
  {
    id: 't1-q1',
    taskType: 'task1',
    title: 'Un trésor découvert dans un vieux grenier',
    source: 'Le Journal de Montréal',
    prompt: `Vous lisez le début de ce fait divers dans un journal :

« Hier matin, en rénovant la toiture de sa maison ancestrale à Trois-Rivières, un charpentier a découvert une malle en bois scellée datant du XIXe siècle, dissimulée sous les combles... »

Rédigez la suite de cet article pour raconter l'événement (ce qu'elle contenait, la réaction des propriétaires et l'intervention des experts). Vous devez respecter le genre du fait divers. (Minimum 80 mots).`,
    timeLimitMinutes: 25,
    minWords: 80,
    maxWords: 120,
  },
  {
    id: 't1-q2',
    taskType: 'task1',
    title: 'Une panne d\'électricité paralyse la ville',
    source: 'La Presse',
    prompt: `Vous lisez ce début d'article :

« Vers 17 h 30, à l'heure de pointe, un incident technique majeur sur une ligne à haute tension a plongé tout le centre-ville dans le noir complet pendant près de quatre heures... »

Écrivez la suite de cet article pour relater le déroulement des faits, les perturbations subies par les usagers et le retour à la normale. (Minimum 80 mots).`,
    timeLimitMinutes: 25,
    minWords: 80,
    maxWords: 120,
  },
  {
    id: 't1-q3',
    taskType: 'task1',
    title: 'Un chien héroïque sauve son maître',
    source: 'Le Devoir',
    prompt: `Vous lisez l'amorce de ce fait divers :

« Lors d'une randonnée hivernale dans le parc national de la Jacques-Cartier, un homme de 45 ans a fait une chute de plusieurs mètres au fond d'un ravin enneigé... »

Rédigez la suite pour expliquer comment son chien a guidé les secouristes et permis de sauver son propriétaire sain et sauf. (Minimum 80 mots).`,
    timeLimitMinutes: 25,
    minWords: 80,
    maxWords: 120,
  },

  // Task 2: Section B - Lettre d'opinion / Argumentation (35 minutes, min 200 mots)
  {
    id: 't2-q1',
    taskType: 'task2',
    title: 'Faut-il interdire les téléphones portables dans les écoles ?',
    source: 'Courrier des lecteurs',
    prompt: `Vous lisez cet extrait d'un article dans un journal :

« Plusieurs pays ont déjà banni les smartphones de l'enceinte scolaire. Les partisans affirment que cela favorise la concentration et les relations humaines. Les opposants estiment au contraire que le numérique est indispensable à l'apprentissage moderne. »

Écrivez une lettre au rédacteur en chef pour exprimer votre point de vue argumenté sur ce sujet. Vous présenterez vos arguments et vos exemples de manière structurée et convaincante. (Minimum 200 mots).`,
    timeLimitMinutes: 35,
    minWords: 200,
    maxWords: 250,
  },
  {
    id: 't2-q2',
    taskType: 'task2',
    title: 'Le télétravail obligatoire : progrès ou isolement ?',
    source: 'Magazine Société & Travail',
    prompt: `Vous lisez l'avis d'un chroniqueur économique :

« Certaines entreprises envisagent d'imposer 3 à 4 jours de télétravail par semaine à tous leurs employés de bureau. Si cela réduit le trafic et le stress des transports, d'autres craignent la perte de cohésion sociale et la frontière floue entre vie privée et professionnelle. »

Participez au débat en envoyant votre contribution argumentée au journal. Exprimez clairement votre opinion avec des arguments étayés d'exemples précis. (Minimum 200 mots).`,
    timeLimitMinutes: 35,
    minWords: 200,
    maxWords: 250,
  },
  {
    id: 't2-q3',
    taskType: 'task2',
    title: 'Les transports en commun gratuits pour tous les résidents',
    source: 'Tribune Municipale',
    prompt: `Le maire d'une grande métropole propose :

« Dès l'an prochain, l'accès à l'ensemble du réseau d'autobus et de métro sera 100 % gratuit pour tous les résidents, afin d'accélérer la transition écologique et d'améliorer le pouvoir d'achat. »

Certains citoyens applaudissent cette mesure, tandis que d'autres s'inquiètent de la baisse de qualité du service et de la hausse des impôts locaux. Écrivez un texte argumenté pour donner votre avis. (Minimum 200 mots).`,
    timeLimitMinutes: 35,
    minWords: 200,
    maxWords: 250,
  }
];
