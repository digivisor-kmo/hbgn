/* ================================================================
   VERSIE 2: de gegevens
   Letterlijk overgenomen uit layout4.body.html, zodat de spellen, de
   vragen, de partners en de regels op beide versies hetzelfde zijn.
   Pas je hier iets aan, pas het daar dan ook aan (of omgekeerd).
   ================================================================ */
  var ACTIVITEITEN = [
    { id:"dnd", naam:"D&D initiatie", kort:"\u20ac5", fig:"dobbelsteen",
      voorWie:"Wie het nog nooit speelde", duur:"3 tot 3.5 uur",
      plaatsen:"5 à 6 per tafel", kost:"\u20ac5 per persoon. Begeleiding, een hapje en een drankje inbegrepen.",
      uitleg:"Nog nooit gespeeld, lijkwormpje? PERFECT. Je krijgt een personage in je klamme handjes geduwd en een spelleider die je aan het handje meeneemt. Je hoeft niets te kennen en niets mee te brengen. Je gaat waarschijnlijk dood. Dat hoort zo.",
      vragen:[
        {id:"ervaring", label:"Heb je al eens D&D gespeeld?", opties:[
          "Nooit, ik weet niet eens hoe die dobbelstenen werken",
          "Ik heb het zien spelen, op Critical Role of in Stranger Things",
          "Ik heb het één of twee keer gedaan",
          "Al wat meer dan dat"]},
        {id:"leeftijd", label:"Hoe oud ben je?", opties:["Onder 12","12 tot 15","16 tot 17","18 of ouder"]},
        {id:"held", label:"Wat voor held wil je zijn?",
         hint:"Mijn spelleiders leggen een personage voor je klaar. Kies waar je zin in hebt, kennen hoef je er niets van.",
         groot:true, opties:[
          {t:"De frontliner", u:"Vooraan staan, zwaard zwaaien en klappen opvangen"},
          {t:"De magiër",     u:"Van een veilige afstand spreuken naar de vijand gooien"},
          {t:"De sluwe",      u:"Sluipen, sloten kraken, vallen ontmantelen, raak schieten"},
          {t:"De hoeder",     u:"Je vrienden oplappen, versterken en overeind houden"}]}
      ] },
    { id:"magic-leren", naam:"Magic leren spelen", kort:"\u20ac15", fig:"jokerkaart",
      voorWie:"Wie Magic nog niet kent", duur:"1.5 tot 2 uur",
      plaatsen:"Weet ik nog niet", kost:"\u20ac15 per persoon. Begeleiding, een hapje, een drankje en twee Jumpstart boosters die je mee naar huis neemt.",
      uitleg:"Jullie kennen Magic niet? BESCHAMEND. We beginnen vanaf nul met Foundations. Je leert wat een kaart doet en hoe een beurt werkt. Je gaat naar huis met twee Jumpstart boosters. Kijk mij eens een goede gastheer zijn.",
      vragen:[
        {id:"ervaring", label:"Speelde je al ooit een kaartspel?", opties:["Nooit","Wel andere, zoals Pokémon","Magic al eens gezien"]},
        {id:"leeftijd", label:"Hoe oud ben je?", opties:["Onder 12","12 tot 15","16 tot 17","18 of ouder"]}
      ] },
    { id:"magic-draft", naam:"Magic draft", kort:"\u20ac20", fig:"schedel",
      voorWie:"Wie Magic al kan spelen", duur:"2.5 tot 3 uur",
      plaatsen:"8 of 16", kost:"\u20ac20 per persoon. Drie boosters die je zelf opent en houdt, plus een hapje en een drankje.",
      uitleg:"Hier leg ik niets uit. Je opent drie boosters, je bouwt een deck en je verplettert de rest van je pod. Alles wat je opent is van jou. Of zij verpletteren jou. Mij maakt het niets uit. Ken je Magic nog niet, neem dan Magic leren spelen.",
      vragen:[
        {id:"ervaring", label:"Hoeveel keer heb je al gedraft?", opties:["Eerste keer","Een paar keer","Ik draft regelmatig"]},
        {id:"blijven", label:"De draft duurt 2.5 tot 3 uur. Kan je tot het einde blijven?", opties:["Ja","Ik moet vroeger weg"]}
      ] },
    { id:"atmosfear", naam:"Atmosfear", kort:"gratis", fig:"zandloper",
      voorWie:"Jong en oud", duur:"Ongeveer 1 uur",
      plaatsen:"Weet ik nog niet", kost:"Niets. Gratis.",
      uitleg:"Dat ben ik. Op de band. Ik roep, ik tel af en ik verban je naar HET ZWARTE GAT als je te traag bent. Donker, luid en niet voor bange harten.",
      vragen:[
        {id:"leeftijd", label:"Hoe oud ben je?", opties:["Onder 12","12 tot 15","16 tot 17","18 of ouder"]},
        {id:"schrik", label:"Kan je tegen donker, geschreeuw en plotse geluiden?", opties:["Ja","Liever wat zachter","Ik kijk liever toe"]}
      ] },
    { id:"unconscious", naam:"The Unconscious Mind: Nightmares", kort:"\u20ac5", fig:"meeple",
      voorWie:"Wie al zwaardere bordspellen speelt", duur:"3 tot 3.5 uur",
      plaatsen:"4 aan \u00e9\u00e9n tafel", kost:"\u20ac5 per persoon. Begeleiding, een hapje en een drankje inbegrepen.",
      uitleg:"Wenen, rond 1900. Jij bent psychoanalyticus en je pati\u00ebnten dromen dingen waar ze liever van af zijn. Dit is het zwaarste dat er die avond op tafel komt: veel regels, veel keuzes en drie uur nadenken. Speelde je nog nooit iets zwaarder dan een gezelschapsspel, kies dan iets anders. Er is \u00e9\u00e9n tafel en daar passen vier lijkwormpjes aan.",
      vragen:[
        {id:"ervaring", label:"Hoeveel bordspelervaring heb je?", opties:[
          "Gezelschapsspelletjes, meer niet",
          "Af en toe iets zwaarders",
          "Ik speel regelmatig zware spellen",
          "Ik ken dit spel al"]},
        {id:"leeftijd", label:"Hoe oud ben je?", opties:["Onder 12","12 tot 15","16 tot 17","18 of ouder"]},
        {id:"blijven", label:"Het duurt 3 tot 3.5 uur. Kan je tot het einde blijven?", opties:["Ja","Ik moet vroeger weg"]}
      ] }
  ];

  /* de partners die al vastliggen. Zijn het er minder dan PARTNERVAKKEN, dan vult
     de rest zich vanzelf met een vraagteken. Een logo komt uit bundle.json, zie
     CLAUDE.md. breed: een woordlogo, dat staat boven de naam in plaats van ernaast.
     kaart: een logo met een eigen witte achtergrond, dat krijgt afgeronde hoeken. */
  var PARTNERS = [
    {naam:"JumpSky Aalst", logo:"%%IMG:jumpsky%%", b:340, h:320,
     url:"https://jumpsky.be/trampolineparken/jumpsky-aalst-trampolinepark/"},
    {naam:"White Goblin Games", logo:"%%IMG:whitegoblin%%", b:300, h:269,
     url:"https://www.whitegoblingames.com/"},
    {naam:"Hintlabyrinth", logo:"%%IMG:hintlabyrinth%%", b:260, h:241,
     url:"https://www.hintlabyrinth.be/"},
    {naam:"Hermelijn Aalst", logo:"%%IMG:hermelijn%%", b:230, h:82, breed:true,
     url:"https://www.hermelijn.be/"},
    {naam:"Megableu", logo:"%%IMG:megableu%%", b:520, h:146, breed:true, kaart:true,
     url:"https://megableu.eu/"}
  ];
  var TELWOORD = ["Geen","E\u00e9n","Twee","Drie","Vier","Vijf","Zes","Zeven","Acht","Negen","Tien"];
  var RANGWOORD = ["eerste","tweede","derde","vierde","vijfde","zesde","zevende","achtste",
                   "negende","tiende","elfde"];
  var PARTNERVAKKEN = 3;

  var REGELS = [
    {nr:"01", kop:"Voor wie", lead:"Iedereen die durft.",
     tekst:"Ook wie nog nooit een bordspel heeft aangeraakt, ook wie alleen komt. Kleine lijkwormpjes laat ik binnen, maar dan wel met een volwassene die op hen let."},
    {nr:"02", kop:"Wanneer op mijn lijst", lead:"Alleen voor mijn vijf begeleide spelletjes.",
     tekst:"Die hebben een begeleider, een startuur en veel te weinig plaatsen. Ze lopen allemaal tegelijk, dus je kiest er <strong>één</strong>. Het uur krijg je van mij per mail, zodra ik het beslist heb.",
     stempel:"Te laat is niet meer mee"},
    {nr:"03", kop:"Wat het kost", lead:"Binnenkomen kost je niets.",
     tekst:"Atmosfear is ook gratis. D&amp;D kost <strong>&euro;5</strong> en The Unconscious Mind: Nightmares evenveel. Magic leren spelen kost <strong>&euro;15</strong> en je gaat naar huis met twee Jumpstart boosters. De draft kost <strong>&euro;20</strong> voor drie boosters die je zelf opent en houdt. Bij alles zit een hapje, een drankje en een begeleider. Betalen doe je ter plaatse, cash of met je smartphone.",
     stempel:"Gratis inkom"},
    {nr:"04", kop:"Zonder mijn lijst", lead:"De spellenkast staat de hele avond open.",
     tekst:"Daarnaast draait er een tombola met prijzen van mijn partners. Daar moet je niets voor doen en niets voor invullen. Binnenkomen volstaat."},
    {nr:"05", kop:"Eten en drinken", lead:"Er komt eten en er komt drank.",
     tekst:"Wat precies weet ik nog niet. Ik moet ook nog dingen beslissen en ik heb alle tijd. Jullie niet."}
  ];

  var BIJNAMEN = {
    dd:"dnd", dungeons:"dnd", dndinitiatie:"dnd",
    magic:"magic-leren", leren:"magic-leren", magicleren:"magic-leren",
    draft:"magic-draft", magicdraft:"magic-draft",
    unconsciousmind:"unconscious", nightmares:"unconscious",
    theunconsciousmindnightmares:"unconscious"
  };
  function sleutel(t){ return String(t).toLowerCase().replace(/[^a-z0-9]/g, ""); }
  function spelUitUrl(){
    var m = /[?&]spel=([^&#]*)/i.exec(location.search);
    if(!m) return null;
    var k = "";
    try { k = sleutel(decodeURIComponent(m[1].replace(/\+/g, " "))); }
    catch(e){ k = sleutel(m[1]); }
    if(!k) return null;
    var raak = null;
    ACTIVITEITEN.forEach(function(a){ if(sleutel(a.id) === k) raak = a.id; });
    return raak || (vind(BIJNAMEN[k]) ? BIJNAMEN[k] : null);
  }

