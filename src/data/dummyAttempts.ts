import { Attempt } from '../types';

export const DUMMY_ATTEMPTS: Attempt[] = [
  {
    id: 'att-001',
    timestamp: '2026-11-06T14:30:00Z',
    taskType: 'task1',
    questionId: 't1-q1',
    questionTitle: 'Un trésor découvert dans un vieux grenier',
    questionPrompt: `« Hier matin, en rénovant la toiture de sa maison ancestrale à Trois-Rivières, un charpentier a découvert une malle en bois scellée datant du XIXe siècle, dissimulée sous les combles... »

Rédigez la suite de cet article pour raconter l'événement (ce qu'elle contenait, la réaction des propriétaires et l'intervention des experts). (Minimum 80 mots).`,
    userResponse: `Intrigué par cette trouvaille, l'artisan a immédiatement appelé les propriétaire de la demeure. Ensemble, ils ont ouvert la boîte avec précaution. À l'intérieur, ils ont découverts des lettres d'amour jaunies, plusieurs pièces de monnaie en or et un vieux journal intime. 

La famille était très ému par cette découverte inattendue. Selon le maire de la ville qui est venu sur place, ces objets ont une grande valeur historique. Les experts du musée régional sont arrivé rapidement pour examiner chaque document. La malle sera bientôt exposé dans l'hôtel de ville pour le plaisir de tous les habitants.`,
    wordCount: 97,
    timeSpentSeconds: 1240, // ~20 min 40 s
    nclcScore: 7,
    nclcLevelDescription: 'NCLC 7 - Level B2 (Upper Intermediate)',
    subScores: {
      coherence: 8,
      vocabulary: 7,
      taskCompletion: 8,
      grammar: 6,
    },
    evaluationSummary: `Great structure for a "fait divers" news snippet! You adhered to the journalistic tone, chronological flow, and your word count (97 words) meets the 80-word minimum requirement. However, several missed agreements (plural endings, past participles with "être") lowered your syntax accuracy. Review the English tips below to reach NCLC 8+.`,
    correctedResponse: `Intrigué par cette trouvaille, l'artisan a immédiatement appelé les propriétaires de la demeure. Ensemble, ils ont ouvert la boîte avec précaution. À l'intérieur, ils ont découvert des lettres d'amour jaunies, plusieurs pièces de monnaie en or et un vieux journal intime.

La famille était très émue par cette découverte inattendue. Selon le maire de la ville qui est venu sur place, ces objets possèdent une valeur historique inestimable. Les experts du musée régional sont arrivés rapidement pour examiner chaque document avec minutie. La malle sera prochainement exposée à l'hôtel de ville pour le plus grand plaisir des résidents.`,
    mistakes: [
      {
        id: 'm1-1',
        category: 'Plural Agreement (Nouns)',
        original: 'les propriétaire',
        correction: 'les propriétaires',
        explanation: 'The noun "propriétaire" is preceded by the plural article "les", so it must end with an "s".',
        howToAvoid: 'During your final proofread, scan every article ("les", "des", "ces") and ensure the following noun carries its plural "-s".'
      },
      {
        id: 'm1-2',
        category: 'Past Participle with Avoir',
        original: 'ils ont découverts',
        correction: 'ils ont découvert',
        explanation: 'With the auxiliary verb "avoir", the past participle does NOT agree with the subject ("ils"). It only agrees with a direct object if that object comes BEFORE the verb (here, the object "des lettres" comes after).',
        howToAvoid: 'Ask yourself: "ils ont découvert what?". Because the answer comes AFTER the verb with "avoir", keep the default neutral ending (-ert).'
      },
      {
        id: 'm1-3',
        category: 'Gender Agreement (Adjectives)',
        original: 'très ému',
        correction: 'très émue',
        explanation: '"Famille" is feminine singular in French ("la famille"). The adjective describing it must be in the feminine form ("émue").',
        howToAvoid: 'Remember that collective nouns like "la famille", "l\'équipe", or "la foule" are feminine singular (she/elle), so add an "-e" to adjectives.'
      },
      {
        id: 'm1-4',
        category: 'Past Participle with Être',
        original: 'sont arrivé',
        correction: 'sont arrivés',
        explanation: 'With the auxiliary verb "être", the past participle must ALWAYS agree in gender and number with the subject ("les experts" = masculine plural).',
        howToAvoid: 'Whenever you write "être" in the passé composé (est, sont, était...), mentally link it back to the subject and add "-s" for plural or "-es" for feminine plural.'
      },
      {
        id: 'm1-5',
        category: 'Past Participle in Passive Voice',
        original: 'sera bientôt exposé',
        correction: 'sera bientôt exposée',
        explanation: 'The passive subject is "la malle" (feminine singular). In passive voice constructions, the participle always agrees with the subject.',
        howToAvoid: 'Spot passive sentences ("sera fait", "a été vu") and identify what is receiving the action ("la malle" = feminine -> "exposée").'
      }
    ]
  },

  {
    id: 'att-002',
    timestamp: '2026-11-04T15:45:00Z',
    taskType: 'task2',
    questionId: 't2-q1',
    questionTitle: 'Faut-il interdire les téléphones portables dans les écoles ?',
    questionPrompt: `Consigne : Vous venez de lire un article d'actualité sur l'interdiction totale des smartphones pour les collégiens et lycéens. Exprimez votre point de vue dans le journal en développant au moins 3 arguments illustrés pour convaincre les lecteurs. (Minimum 200 mots).`,
    userResponse: `Monsieur le Rédacteur en chef,

Je vous écris cette lettre pour partager mon point de vue suite à la publication de votre article sur l'interdiction des téléphones portables dans les établissements scolaires. Bien que cette mesure est séduisante à première vue, je reste fermement convaincu qu'une telle prohibition absolue constitue une erreur pédagogique majeure.

En premier lieu, à l'ère du numérique, l'école doit avoir pour vocation d'éduquer les jeunes à un usage responsable des écrans plutôt que de simplement les diaboliser. Les outils digitaux sont devenu indispensables au quotidien. Si nous privons les élèves de toute interaction encadrée avec ces technologies, ils vont continuer à les utiliser en cachette, sans développer le moindre discernement critique.

En second lieu, les smartphones représentent un support d'apprentissage dynamique et interactif. De nombreuses applications permettent aux enseignants d'illustrer des concepts complexes en temps réel. Plusieurs professeurs avec qui j'ai parlé ont constaté un engagement renouvelé lorsque les téléphones sont intégrés intelligemment aux ateliers de travail.

Pour conclure, je préconise une régulation constructive au lieu d'un bannissement punitif. En espérant que vous prendrez en compte mon témoignage, je vous prie d'agréer, Monsieur, mes salutations distinguées.`,
    wordCount: 206,
    timeSpentSeconds: 1980, // ~33 min sur 35 min
    nclcScore: 8,
    nclcLevelDescription: 'NCLC 8.0 (Niveau B2+)',
    evaluationSummary: `Solid argumentative structure meeting official TEF Canada requirements. The letter demonstrates good coherence and a formal register. However, recurring grammatical slips in subjunctive mood and auxiliary agreements keep this below NCLC 9.`,
    correctedResponse: `Monsieur le Rédacteur en chef,

Je me permets de vous adresser cette lettre afin de partager ma réflexion suite à la publication de votre article sur l'interdiction des téléphones portables dans les établissements scolaires. Bien que cette mesure paraisse séduisante à première vue, elle élude la mission fondamentale de l'institution républicaine : armer les esprits face aux dérives technologiques plutôt que de fuir stérilement l'inévitable déferlement numérique.

En premier lieu, l'école doit avoir pour vocation d'éduquer les jeunes à un usage responsable des écrans plutôt que de les ostraciser. Les outils digitaux sont devenus indispensables au quotidien. Si nous privons les élèves de toute interaction encadrée, ils continueront de les exploiter clandestinement.

En second lieu, le numérique constitue un levier pédagogique remarquable. De multiples applications permettent aux enseignants d'illustrer des concepts abstraits avec une vivacité inédite.

Pour conclure, je préconise une régulation constructive et concertée. En espérant que vous saurez prendre en considération mon témoignage, je vous prie d'agréer, Monsieur le Rédacteur en chef, l'expression de mes salutations distinguées.`,
    subScores: {
      coherence: 8,
      vocabulary: 8,
      taskCompletion: 9,
      grammar: 6,
    },
    mistakes: [
      {
        id: 'm2-1',
        category: 'Subjonctif post-locution concessive',
        original: 'Bien que cette mesure est séduisante',
        correction: 'Bien que cette mesure soit séduisante',
        explanation: 'Any conjunction introducing doubt or concession ("bien que", "quoique", "pourvu que") triggers the subjunctive mood. This is a decisive criterion for NCLC 7+.',
        howToAvoid: 'Whenever you use "bien que" or "quoique", immediately shift the verb into the subjunctive (soit, puisse, fasse).'
      },
      {
        id: 'm2-2',
        category: 'Accord du participe passé avec Être',
        original: 'sont devenu',
        correction: 'sont devenus',
        explanation: 'The verb "devenir" always conjugates with the auxiliary "être". The participle must agree in gender and number with the masculine plural subject "les outils digitaux".',
        howToAvoid: 'Whenever you write "sont + participle", pause and check the subject to add the plural "-s".'
      },
      {
        id: 'm2-3',
        category: 'Rehaussement stylistique (B2 -> C1)',
        original: 'vont continuer à les utiliser',
        correction: 'continueront de les exploiter',
        explanation: 'Instead of the near future ("vont continuer"), prefer the simple future with sophisticated vocabulary ("continueront de les exploiter") to demonstrate C1 mastery.',
        howToAvoid: 'In formal TEF letters, favor the simple future over "aller + infinitive" to elevate your linguistic register.'
      },
      {
        id: 'm2-4',
        category: 'Accord du participe passé avec Être',
        original: 'parlé',
        correction: 'parlé (invariable ici : COI avec "avec qui")',
        explanation: 'With "parler avec quelqu\'un", the pronoun is an indirect object (COI), so the past participle remains invariable.',
        howToAvoid: 'Only direct objects placed before the verb trigger agreement with "avoir". Prepositional phrases (avec qui, à qui) do not.'
      },
      {
        id: 'm2-5',
        category: 'Formule de politesse & clôture',
        original: 'prendrez en compte',
        correction: 'saurez prendre en considération',
        explanation: 'Correct conversational phrasing, but using "saurez prendre en considération" signals high diplomatic formality.',
        howToAvoid: 'Memorize elevated formal closing clauses like "prendre en considération" or "accueillir favorablement".'
      }
    ]
  },

  {
    id: 'att-003',
    timestamp: '2026-11-01T16:45:00Z',
    taskType: 'task2',
    questionId: 't2-q2',
    questionTitle: 'Le télétravail obligatoire : progrès ou isolement ?',
    questionPrompt: `« Certaines entreprises envisagent d'imposer 3 à 4 jours de télétravail par semaine à tous leurs employés de bureau. Si cela réduit le trafic et le stress des transports, d'autres craignent la perte de cohésion sociale et la frontière floue entre vie privée et professionnelle. »

Participez au débat en envoyant votre contribution argumentée au journal. (Minimum 200 mots).`,
    userResponse: `Madame, Monsieur,

Je souhaite réagir à l'article récent concernant l'imposition du télétravail pour les salariés. Bien que cette mesure semble moderne, je pense qu'elle comporte des risques considérables pour les travailleurs.

En premier lieu, le travail à distance prolongé engendre un isolement psychologique profond. Les relations humaine informelles autour d'une pause-café ou lors d'un échange spontané dans le couloir sont essentiel pour maintenir un bon esprit d'équipe. Quand les employés sont isolé chez eux, le sentiment d'appartenance à l'entreprise disparaît rapidement.

En second lieu, la frontière entre la vie personnelle et professionnelle devient presque inexistante. Beaucoup de travailleurs reçoivent des courriels tard le soir et se sentent obligés d'y répondre. Cette surcharge mentale a provoqué des cas de burnout chez plusieurs collègue que j'ai côtoyé.

Il faut que les entreprises trouvent un équilibre flexible au lieu d'imposer une politique rigide. Un compromis de deux jours par semaine permettrait de profiter des avantages du travail à la maison tout en préservant le lien social.

Cordialement,`,
    wordCount: 182,
    timeSpentSeconds: 2100, // ~35 min (Time out)
    nclcScore: 6,
    nclcLevelDescription: 'NCLC 6 - Level B1 High / Early B2',
    subScores: {
      coherence: 6,
      vocabulary: 6,
      taskCompletion: 5,
      grammar: 6,
    },
    evaluationSummary: `Good coherent structure and strong paragraph separation. However, you fell short of the required 200-word minimum (182 words), which triggers an automatic score penalty on the official TEF rubric. Under time pressure, several plural noun and adjective agreements were also dropped. Check the tips below!`,
    correctedResponse: `Madame, Monsieur,

Je me permets de vous soumettre ma contribution au débat suscité par l'éventualité d'imposer plusieurs journées hebdomadaires de télétravail. Bien que cette formule présente des avantages indéniables, notamment en matière de mobilité urbaine, j'estime qu'une telle contrainte comporte des risques substantiels pour la santé mentale des salariés et la synergie organisationnelle.

En premier lieu, le travail à distance imposé et prolongé favorise un isolement relationnel délétère. Les interactions humaines informelles qui ponctuent la journée en entreprise s'avèrent essentielles pour cimenter l'esprit de corps et stimuler la créativité. Lorsque les collaborateurs demeurent isolés à leur domicile, le sentiment d'appartenance collective s'effrite inévitablement.

En second lieu, la porosité grandissante entre sphère privée et vie professionnelle constitue un danger manifeste. Nombreux sont les employés sollicités en dehors des heures ouvrées, ce qui engendre un état de stress chronique. J'ai moi-même constaté l'épuisement professionnel de plusieurs collègues que j'ai côtoyés au cours de ces derniers mois.

En somme, il me semble impératif que les directions d'entreprise privilégient une flexibilité concertée plutôt qu'une directive uniforme. Un modèle hybride modéré permettrait de concilier efficacité personnelle et cohésion d'équipe.

Je vous prie de recevoir mes salutations les plus cordiales.`,
    mistakes: [
      {
        id: 'm3-1',
        category: 'Plural Agreement (Nouns & Adjectives)',
        original: 'Les relations humaine informelles',
        correction: 'Les relations humaines informelles',
        explanation: 'The adjective "humain" describes "les relations" (feminine plural) and must be spelled "humaines".',
        howToAvoid: 'When a noun has multiple adjectives ("humaines informelles"), remember to agree EVERY adjective in gender and number.'
      },
      {
        id: 'm3-2',
        category: 'Gender Agreement (Adjectives)',
        original: 'sont essentiel',
        correction: 'sont essentielles',
        explanation: 'The subject is "Les relations" (feminine plural). The predicate adjective after "être" must agree: "essentielles".',
        howToAvoid: 'When verbs separate an adjective from its subject ("Les relations [...] sont"), look back to the original subject to carry over the "-es".'
      },
      {
        id: 'm3-3',
        category: 'Past Participle with Être',
        original: 'Quand les employés sont isolé',
        correction: 'Quand les employés sont isolés',
        explanation: 'The subject "les employés" is masculine plural. With "être", the participle requires an "-s".',
        howToAvoid: 'Form a reflex: whenever you see "sont + participle", immediately add the plural "-s".'
      },
      {
        id: 'm3-4',
        category: 'Plural Agreement (Nouns)',
        original: 'plusieurs collègue',
        correction: 'plusieurs collègues',
        explanation: '"Plusieurs" indicates several items and strictly requires a plural noun.',
        howToAvoid: 'Remember words like "plusieurs", "quelques", and "différents" are always followed by plural nouns.'
      },
      {
        id: 'm3-5',
        category: 'Past Participle with Avoir (Preceding Direct Object)',
        original: 'que j\'ai côtoyé',
        correction: 'que j\'ai côtoyés',
        explanation: 'The relative pronoun "que" refers back to "plusieurs collègues" (masculine plural direct object placed BEFORE the auxiliary "avoir").',
        howToAvoid: 'In sentences with "... que j\'ai [verb]", always check the word right before "que". If it is plural or feminine, add "-s" or "-e" to the participle.'
      },
      {
        id: 'm3-6',
        category: 'Word Count & Time Management',
        original: '182 words written',
        correction: '200 words minimum required',
        explanation: 'In TEF Section B, writing fewer than 200 words results in an automatic penalty on the official scoring grid.',
        howToAvoid: 'Keep an eye on the live word counter during the exam. If you are under 200 words with 5 minutes left, add a supporting example to your second argument.'
      }
    ]
  }
];
