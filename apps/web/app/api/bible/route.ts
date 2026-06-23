import { NextResponse } from 'next/server'

// Substantial built-in KJV Bible data covering the most-used passages
const KJV: Record<string, Record<number, Record<number, string>>> = {
  Genesis: {
    1: {
      1:'In the beginning God created the heaven and the earth.',
      2:'And the earth was without form, and void; and darkness was upon the face of the deep. And the Spirit of God moved upon the face of the waters.',
      3:'And God said, Let there be light: and there was light.',
      4:'And God saw the light, that it was good: and God divided the light from the darkness.',
      5:'And God called the light Day, and the darkness he called Night. And the evening and the morning were the first day.',
    }
  },
  Psalms: {
    23: {
      1:'The LORD is my shepherd; I shall not want.',
      2:'He maketh me to lie down in green pastures: he leadeth me beside the still waters.',
      3:'He restoreth my soul: he leadeth me in the paths of righteousness for his name\'s sake.',
      4:'Yea, though I walk through the valley of the shadow of death, I will fear no evil: for thou art with me; thy rod and thy staff they comfort me.',
      5:'Thou preparest a table before me in the presence of mine enemies: thou anointest my head with oil; my cup runneth over.',
      6:'Surely goodness and mercy shall follow me all the days of my life: and I will dwell in the house of the LORD for ever.',
    },
    46: {
      1:'God is our refuge and strength, a very present help in trouble.',
      2:'Therefore will not we fear, though the earth be removed, and though the mountains be carried into the midst of the sea;',
      10:'Be still, and know that I am God: I will be exalted among the heathen, I will be exalted in the earth.',
    },
    91: {
      1:'He that dwelleth in the secret place of the most High shall abide under the shadow of the Almighty.',
      2:'I will say of the LORD, He is my refuge and my fortress: my God; in him will I trust.',
      4:'He shall cover thee with his feathers, and under his wings shalt thou trust: his truth shall be thy shield and buckler.',
    },
    100: {
      1:'Make a joyful noise unto the LORD, all ye lands.',
      2:'Serve the LORD with gladness: come before his presence with singing.',
      3:'Know ye that the LORD he is God: it is he that hath made us, and not we ourselves; we are his people, and the sheep of his pasture.',
      4:'Enter into his gates with thanksgiving, and into his courts with praise: be thankful unto him, and bless his name.',
      5:'For the LORD is good; his mercy is everlasting; and his truth endureth to all generations.',
    },
    119: {
      105:'Thy word is a lamp unto my feet, and a light unto my path.',
    },
  },
  Proverbs: {
    3: {
      5:'Trust in the LORD with all thine heart; and lean not unto thine own understanding.',
      6:'In all thy ways acknowledge him, and he shall direct thy paths.',
    },
  },
  Isaiah: {
    40: {
      28:'Hast thou not known? hast thou not heard, that the everlasting God, the LORD, the Creator of the ends of the earth, fainteth not, neither is weary? there is no searching of his understanding.',
      29:'He giveth power to the faint; and to them that have no might he increaseth strength.',
      30:'Even the youths shall faint and be weary, and the young men shall utterly fall:',
      31:'But they that wait upon the LORD shall renew their strength; they shall mount up with wings as eagles; they shall run, and not be weary; and they shall walk, and not faint.',
    },
    53: {
      5:'But he was wounded for our transgressions, he was bruised for our iniquities: the chastisement of our peace was upon him; and with his stripes we are healed.',
      6:'All we like sheep have gone astray; we have turned every one to his own way; and the LORD hath laid on him the iniquity of us all.',
    },
  },
  Jeremiah: {
    29: {
      11:'For I know the thoughts that I think toward you, saith the LORD, thoughts of peace, and not of evil, to give you an expected end.',
    },
  },
  Matthew: {
    5: {
      3:'Blessed are the poor in spirit: for theirs is the kingdom of heaven.',
      4:'Blessed are they that mourn: for they shall be comforted.',
      5:'Blessed are the meek: for they shall inherit the earth.',
      6:'Blessed are they which do hunger and thirst after righteousness: for they shall be filled.',
      7:'Blessed are the merciful: for they shall obtain mercy.',
      8:'Blessed are the pure in heart: for they shall see God.',
      9:'Blessed are the peacemakers: for they shall be called the children of God.',
    },
    6: {
      9:'After this manner therefore pray ye: Our Father which art in heaven, Hallowed be thy name.',
      10:'Thy kingdom come. Thy will be done in earth, as it is in heaven.',
      11:'Give us this day our daily bread.',
      12:'And forgive us our debts, as we forgive our debtors.',
      13:'And lead us not into temptation, but deliver us from evil: For thine is the kingdom, and the power, and the glory, for ever. Amen.',
      33:'But seek ye first the kingdom of God, and his righteousness; and all these things shall be added unto you.',
    },
    28: {
      18:'And Jesus came and spake unto them, saying, All power is given unto me in heaven and in earth.',
      19:'Go ye therefore, and teach all nations, baptizing them in the name of the Father, and of the Son, and of the Holy Ghost:',
      20:'Teaching them to observe all things whatsoever I have commanded you: and, lo, I am with you always, even unto the end of the world. Amen.',
    },
  },
  John: {
    1: {
      1:'In the beginning was the Word, and the Word was with God, and the Word was God.',
      2:'The same was in the beginning with God.',
      3:'All things were made by him; and without him was not any thing made that was made.',
      4:'In him was life; and the life was the light of men.',
      14:'And the Word was made flesh, and dwelt among us, (and we beheld his glory, the glory as of the only begotten of the Father,) full of grace and truth.',
    },
    3: {
      16:'For God so loved the world, that he gave his only begotten Son, that whosoever believeth in him should not perish, but have everlasting life.',
      17:'For God sent not his Son into the world to condemn the world; but that the world through him might be saved.',
      18:'He that believeth on him is not condemned: but he that believeth not is condemned already, because he hath not believed in the name of the only begotten Son of God.',
    },
    10: {
      10:'The thief cometh not, but for to steal, and to kill, and to destroy: I am come that they might have life, and that they might have it more abundantly.',
      11:'I am the good shepherd: the good shepherd giveth his life for the sheep.',
      14:'I am the good shepherd, and know my sheep, and am known of mine.',
    },
    11: {
      25:'Jesus said unto her, I am the resurrection, and the life: he that believeth in me, though he were dead, yet shall he live:',
      26:'And whosoever liveth and believeth in me shall never die. Believest thou this?',
    },
    14: {
      1:'Let not your heart be troubled: ye believe in God, believe also in me.',
      2:'In my Father\'s house are many mansions: if it were not so, I would have told you. I go to prepare a place for you.',
      6:'Jesus saith unto him, I am the way, the truth, and the life: no man cometh unto the Father, but by me.',
      27:'Peace I leave with you, my peace I give unto you: not as the world giveth, give I unto you. Let not your heart be troubled, neither let it be afraid.',
    },
  },
  Acts: {
    2: {
      38:'Then Peter said unto them, Repent, and be baptized every one of you in the name of Jesus Christ for the remission of sins, and ye shall receive the gift of the Holy Ghost.',
    },
  },
  Romans: {
    3: {
      23:'For all have sinned, and come short of the glory of God;',
    },
    5: {
      8:'But God commendeth his love toward us, in that, while we were yet sinners, Christ died for us.',
    },
    6: {
      23:'For the wages of sin is death; but the gift of God is eternal life through Jesus Christ our Lord.',
    },
    8: {
      1:'There is therefore now no condemnation to them which are in Christ Jesus, who walk not after the flesh, but after the Spirit.',
      28:'And we know that all things work together for good to them that love God, to them who are the called according to his purpose.',
      38:'For I am persuaded, that neither death, nor life, nor angels, nor principalities, nor powers, nor things present, nor things to come,',
      39:'Nor height, nor depth, nor any other creature, shall be able to separate us from the love of God, which is in Christ Jesus our Lord.',
    },
    10: {
      9:'That if thou shalt confess with thy mouth the Lord Jesus, and shalt believe in thine heart that God hath raised him from the dead, thou shalt be saved.',
      10:'For with the heart man believeth unto righteousness; and with the mouth confession is made unto salvation.',
    },
    12: {
      1:'I beseech you therefore, brethren, by the mercies of God, that ye present your bodies a living sacrifice, holy, acceptable unto God, which is your reasonable service.',
      2:'And be not conformed to this world: but be ye transformed by the renewing of your mind, that ye may prove what is that good, and acceptable, and perfect, will of God.',
    },
  },
  '1 Corinthians': {
    13: {
      1:'Though I speak with the tongues of men and of angels, and have not charity, I am become as sounding brass, or a tinkling cymbal.',
      4:'Charity suffereth long, and is kind; charity envieth not; charity vaunteth not itself, is not puffed up,',
      5:'Doth not behave itself unseemly, seeketh not her own, is not easily provoked, thinketh no evil;',
      13:'And now abideth faith, hope, charity, these three; but the greatest of these is charity.',
    },
  },
  Galatians: {
    5: {
      22:'But the fruit of the Spirit is love, joy, peace, longsuffering, gentleness, goodness, faith,',
      23:'Meekness, temperance: against such there is no law.',
    },
  },
  Ephesians: {
    2: {
      8:'For by grace are ye saved through faith; and that not of yourselves: it is the gift of God:',
      9:'Not of works, lest any man should boast.',
    },
    6: {
      10:'Finally, my brethren, be strong in the Lord, and in the power of his might.',
      11:'Put on the whole armour of God, that ye may be able to stand against the wiles of the devil.',
    },
  },
  Philippians: {
    4: {
      4:'Rejoice in the Lord always: and again I say, Rejoice.',
      6:'Be careful for nothing; but in every thing by prayer and supplication with thanksgiving let your requests be made known unto God.',
      7:'And the peace of God, which passeth all understanding, shall keep your hearts and minds through Christ Jesus.',
      8:'Finally, brethren, whatsoever things are true, whatsoever things are honest, whatsoever things are just, whatsoever things are pure, whatsoever things are lovely, whatsoever things are of good report; if there be any virtue, and if there be any praise, think on these things.',
      13:'I can do all things through Christ which strengtheneth me.',
    },
  },
  Colossians: {
    3: {
      23:'And whatsoever ye do, do it heartily, as to the Lord, and not unto men;',
    },
  },
  '2 Timothy': {
    3: {
      16:'All scripture is given by inspiration of God, and is profitable for doctrine, for reproof, for correction, for instruction in righteousness:',
      17:'That the man of God may be perfect, throughly furnished unto all good works.',
    },
  },
  Hebrews: {
    11: {
      1:'Now faith is the substance of things hoped for, the evidence of things not seen.',
    },
    13: {
      8:'Jesus Christ the same yesterday, and to day, and for ever.',
    },
  },
  James: {
    1: {
      2:'My brethren, count it all joy when ye fall into divers temptations;',
      3:'Knowing this, that the trying of your faith worketh patience.',
    },
  },
  '1 John': {
    4: {
      7:'Beloved, let us love one another: for love is of God; and every one that loveth is born of God, and knoweth God.',
      8:'He that loveth not knoweth not God; for God is love.',
      9:'In this was manifested the love of God toward us, because that God sent his only begotten Son into the world, that we might live through him.',
    },
  },
  Revelation: {
    21: {
      1:'And I saw a new heaven and a new earth: for the first heaven and the first earth were passed away; and there was no more sea.',
      4:'And God shall wipe away all tears from their eyes; and there shall be no more death, neither sorrow, nor crying, neither shall there be any more pain: for the former things are passed away.',
    },
  },
}

// Book name aliases
const ALIASES: Record<string, string> = {
  gen:'Genesis', genesis:'Genesis',
  ex:'Exodus', exo:'Exodus', exodus:'Exodus',
  ps:'Psalms', psa:'Psalms', psalm:'Psalms', psalms:'Psalms',
  prov:'Proverbs', proverbs:'Proverbs',
  isa:'Isaiah', isaiah:'Isaiah',
  jer:'Jeremiah', jeremiah:'Jeremiah',
  matt:'Matthew', mat:'Matthew', matthew:'Matthew',
  mk:'Mark', mar:'Mark', mark:'Mark',
  lk:'Luke', luk:'Luke', luke:'Luke',
  jn:'John', joh:'John', john:'John',
  acts:'Acts',
  rom:'Romans', romans:'Romans',
  '1cor':'1 Corinthians', '1 cor':'1 Corinthians', '1corinthians':'1 Corinthians',
  '2cor':'2 Corinthians', '2 cor':'2 Corinthians',
  gal:'Galatians', galatians:'Galatians',
  eph:'Ephesians', ephesians:'Ephesians',
  phil:'Philippians', php:'Philippians', philippians:'Philippians',
  col:'Colossians', colossians:'Colossians',
  '2tim':'2 Timothy', '2 tim':'2 Timothy', '2timothy':'2 Timothy',
  heb:'Hebrews', hebrews:'Hebrews',
  jas:'James', james:'James',
  '1jn':'1 John', '1 jn':'1 John', '1john':'1 John',
  rev:'Revelation', revelation:'Revelation',
}

function resolveBook(raw: string): string {
  const key = raw.toLowerCase().replace(/\s+/g,'')
  return ALIASES[key] || ALIASES[raw.toLowerCase()] || raw
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const ref = searchParams.get('ref')
  const q = searchParams.get('q')

  if (ref) {
    // Parse reference like "John 3:16" or "John 3:16-18"
    const m = ref.match(/^(.+?)\s+(\d+):(\d+)(?:-(\d+))?$/)
    if (!m) return NextResponse.json({ error: 'Invalid reference' }, { status: 400 })
    const book = resolveBook(m[1])
    const ch = parseInt(m[2])
    const vs = parseInt(m[3])
    const ve = m[4] ? parseInt(m[4]) : vs
    const chData = KJV[book]?.[ch]
    if (!chData) return NextResponse.json({ error: `${book} ${ch} not found` }, { status: 404 })
    const verses = []
    for (let v = vs; v <= ve; v++) {
      if (chData[v]) verses.push({ book, chapter: ch, verse: v, text: chData[v], translation_id:'KJV' })
    }
    if (!verses.length) return NextResponse.json({ error: 'Verses not found' }, { status: 404 })
    return NextResponse.json({
      translation_id:'KJV', book, chapter: ch,
      verse_start: vs, verse_end: ve, verses,
      reference: ve > vs ? `${book} ${ch}:${vs}-${ve}` : `${book} ${ch}:${vs}`
    })
  }

  if (q) {
    // Keyword search across all loaded verses
    const term = q.toLowerCase()
    const results: any[] = []
    for (const [book, chapters] of Object.entries(KJV)) {
      for (const [ch, verses] of Object.entries(chapters)) {
        for (const [v, text] of Object.entries(verses as Record<number,string>)) {
          if (text.toLowerCase().includes(term)) {
            results.push({ book, chapter: parseInt(ch), verse: parseInt(v), text, translation_id:'KJV',
              reference: `${book} ${ch}:${v}` })
          }
        }
      }
    }
    return NextResponse.json(results.slice(0, 30))
  }

  return NextResponse.json({ books: Object.keys(KJV) })
}
