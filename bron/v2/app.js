/* ================================================================
   VERSIE 2: DE POORT
   De gegevens (ACTIVITEITEN, PARTNERS, REGELS, spelUitUrl) staan in
   data.js en worden er door maak.sh vlak voor geplakt. De spin en de
   tabtitels komen erna, uit spin.js.

   Regels die hier gelden:
   - tijdens het scrollen wordt niets opgemeten: meet() rekent alles uit
     bij het laden en bij het vergroten, schuif() schrijft alleen
   - geen browseropslag
   - wie minder beweging wil, krijgt alles meteen en stil
   ================================================================ */
  var R = document.documentElement;
  R.classList.remove("no-js");
  R.classList.add("js");
  var stil = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fijn = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  if(stil) R.classList.add("stil");
  if(fijn) R.classList.add("muis");

  var FB = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:-4px"><path fill="currentColor" d="M22 12a10 10 0 1 0-11.6 9.9v-7H7.9V12h2.5V9.8c0-2.5 1.5-3.9 3.8-3.9 1.1 0 2.2.2 2.2.2v2.5h-1.3c-1.2 0-1.6.8-1.6 1.6V12h2.8l-.4 2.9h-2.3v7A10 10 0 0 0 22 12z"/></svg>';
  var IG = '<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden="true" style="vertical-align:-4px"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.25" fill="currentColor"/></svg>';
  var FB_URL = "https://www.facebook.com/events/1445920600735035/";
  var IG_URL = "https://www.instagram.com/hbgn.be/";
  var MAIL = "mailto:depoortwachter666@gmail.com";
  var AVOND = new Date("2026-11-07T18:00:00+01:00");
  var SEIZOEN = new Date("2026-09-01T00:00:00+02:00");
  var VB = {
    dobbelsteen:"%%VB:dobbelsteen%%", jokerkaart:"%%VB:jokerkaart%%",
    schedel:"%%VB:schedel%%", zandloper:"%%VB:zandloper%%", meeple:"%%VB:meeple%%"
  };
  var ROMEINS = ["I", "II", "III", "IV", "V", "VI", "VII"];

  var app = document.getElementById("app");
  var dankVak = document.getElementById("dank");
  var venster = document.getElementById("infovenster");
  var bliksem = document.getElementById("bliksem");
  var vulling = document.querySelector(".voortgang i");
  var balk = document.getElementById("balk");
  var bord = document.getElementById("bord");

  var boeking = null, stap = 1, deelnemerIx = 0, laatsteInfoKnop = null;
  var klok = null, boeGezien = false;

  function sein(naam, detail){
    try { document.dispatchEvent(new CustomEvent("hbgn:" + naam, {detail:detail || {}})); } catch(e){}
  }
  function fig(naam){
    return '<svg viewBox="' + VB[naam] + '" aria-hidden="true" focusable="false"><use href="#s-' + naam + '"/></svg>';
  }
  function esc(s){ return String(s == null ? "" : s).replace(/[&<>"']/g, function(c){
    return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]; }); }
  function vind(id){ return ACTIVITEITEN.filter(function(a){ return a.id === id; })[0] || null; }
  function klem(x, a, b){ return x < a ? a : x > b ? b : x; }
  function deel(p, a, b){ return klem((p - a) / (b - a), 0, 1); }
  function inUit(t){ return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function inn(t){ return t * t * t; }
  function elk(sel, fn, wortel){ [].forEach.call((wortel || document).querySelectorAll(sel), fn); }

  /* ================================================================
     DE VASTE STUKKEN INVULLEN
     ================================================================ */
  document.getElementById("mail-knop").href = MAIL;
  document.getElementById("sociaal").innerHTML =
    '<a class="knop-lijn" href="' + FB_URL + '">' + FB + ' Volg het event op Facebook</a>' +
    '<a class="knop-lijn" href="' + IG_URL + '">' + IG + ' Volg mij op Instagram</a>';
  document.getElementById("tombola-tekst").textContent =
    "Daar moet je niets voor doen en niets voor invullen. Binnenkomen volstaat. De prijzen komen van mijn partners. " +
    (TELWOORD[PARTNERS.length] || PARTNERS.length) + ", voorlopig.";

  /* ---------- de klapklok ---------- */
  (function bouwKlok(){
    var eenheden = [["d","nachten"],["u","uren"],["m","minuten"],["s","tellen"]];
    document.getElementById("aftel").innerHTML = eenheden.map(function(p, i){
      return (i ? '<li class="punt" aria-hidden="true">:</li>' : '') +
        '<li data-t="' + p[0] + '"><span class="flap" aria-hidden="true">' +
          '<span class="flap-boven"><b></b></span><span class="flap-onder"><b></b></span>' +
          '<span class="flap-val flap-val-boven"><b></b></span><span class="flap-val flap-val-onder"><b></b></span>' +
        '</span><span class="cijfer vzw">&mdash;</span><span class="eenheid">' + p[1] + '</span></li>';
    }).join("");
  })();

  /* ---------- de kaarten ---------- */
  (function bouwHand(){
    document.getElementById("hand").innerHTML = ACTIVITEITEN.map(function(a, i){
      var achter = "kaart-" + a.id + "-achter";
      return '<article class="kaart" data-id="' + a.id + '" style="--k:' + i + '">' +
        '<div class="kaart-binnen">' +
          '<div class="kaart-voor">' +
            '<span class="kaart-nr">' + ROMEINS[i] + '</span>' +
            '<span class="kaart-prijs' + (a.kort === "gratis" ? " gratis" : "") + '">' + esc(a.kort) + '</span>' +
            '<span class="kaart-fig">' + fig(a.fig) + '</span>' +
            '<h3 class="kaart-naam">' + esc(a.naam) + '</h3>' +
            '<p class="kaart-sub">' + esc(a.duur) + ' &middot; ' + esc(a.voorWie) + '</p>' +
            '<button type="button" class="kaart-draai" aria-expanded="false" aria-controls="' + achter + '">' +
              'Draai om<span class="vzw">: ' + esc(a.naam) + '</span></button>' +
          '</div>' +
          '<div class="kaart-achter" id="' + achter + '" aria-hidden="true" inert>' +
            '<h3>' + esc(a.naam) + '</h3>' +
            '<p class="kaart-uitleg">' + esc(a.uitleg) + '</p>' +
            '<dl><dt>Voor wie</dt><dd>' + esc(a.voorWie) + '</dd><dt>Hoe lang</dt><dd>' + esc(a.duur) + '</dd>' +
              '<dt>Plaatsen</dt><dd>' + esc(a.plaatsen) + '</dd><dt>Prijs</dt><dd>' + esc(a.kort) + '</dd></dl>' +
            '<button type="button" class="kaart-kies" data-kies="' + a.id + '">Schrijf me hiervoor in</button>' +
            '<button type="button" class="kaart-terug">Draai terug</button>' +
          '</div>' +
        '</div></article>';
    }).join("");
  })();

  /* ---------- de wetten ---------- */
  (function bouwWetten(){
    document.getElementById("spoor").innerHTML = REGELS.map(function(r, i){
      return '<article class="wet" style="--w:' + i + '">' +
        '<span class="wet-nr" aria-hidden="true">' + r.nr + '</span>' +
        '<h3>' + r.kop + '</h3>' +
        '<p class="wet-lead">' + r.lead + '</p>' +
        '<p class="wet-tekst">' + r.tekst + '</p>' +
        (r.stempel ? '<span class="wet-stempel">' + r.stempel + '</span>' : '') +
      '</article>';
    }).join("");
  })();

  /* ---------- de loten van de tombola ---------- */
  (function bouwLoten(){
    var n = PARTNERS.length + 1;
    function hang(i){
      var m = (n - 1) / 2;
      return m ? (1 - Math.pow((i - m) / m, 2)) * 1.8 : 0;
    }
    function nr(i){ return "N&ordm; " + ("00" + (i + 1)).slice(-3); }
    document.getElementById("loten").innerHTML = PARTNERS.map(function(p, i){
      return '<li class="lot" style="--z:' + i + ';--h:' + hang(i).toFixed(2) + '">' +
        '<a href="' + p.url + '">' +
          '<span class="lot-nr">' + nr(i) + '</span>' +
          '<span class="lot-logo"><img class="' + (p.kaart ? "op-wit" : "") + '" src="' + p.logo + '" ' +
            'width="' + p.b + '" height="' + p.h + '" alt="" loading="lazy" decoding="async"></span>' +
          '<span class="lot-naam">' + esc(p.naam) + '</span>' +
        '</a></li>';
    }).join("") +
    '<li class="lot lot-vrij" style="--z:' + PARTNERS.length + ';--h:' + hang(PARTNERS.length).toFixed(2) + '">' +
      '<a href="' + MAIL + '">' +
        '<span class="lot-nr">' + nr(PARTNERS.length) + '</span>' +
        '<span class="lot-logo" aria-hidden="true">?</span>' +
        '<span class="lot-naam">Nog vrij. Wie durft, meldt zich. Ik bijt niet. Meestal.</span>' +
      '</a></li>';
  })();

  /* ---------- BOE: letters en woorden ---------- */
  (function bouwBoe(){
    var w = document.querySelector(".boe-woord");
    var tekst = w.textContent;
    w.innerHTML = '<span class="vzw">' + tekst + '</span>' + tekst.split("").map(function(c, i){
      return '<span class="boe-l" aria-hidden="true" style="--l:' + i + ';--lr:' +
        (Math.random() * 24 - 12).toFixed(1) + 'deg">' + c + '</span>';
    }).join("");
    /* woord per woord, met wat tussen sterretjes staat in het groen */
    var t = document.getElementById("boe-tekst");
    var ruw = t.textContent.replace(/\s+/g, " ").trim(), vet = false, i = 0;
    t.innerHTML = ruw.split(" ").map(function(woord){
      var begin = woord.charAt(0) === "*";
      if(begin){ woord = woord.slice(1); vet = true; }
      var eind = woord.indexOf("*") > -1;
      if(eind) woord = woord.replace("*", "");
      var uit = '<w style="--i:' + (i++) + '">' + esc(woord) + '</w>';
      if(vet) uit = '<b>' + uit + '</b>';
      if(eind) vet = false;
      return uit;
    }).join(" ");
    t.style.setProperty("--n", i);
  })();

  /* ================================================================
     DE SCROLLMOTOR
     Elke scène is een stuk pagina met een aanloop. Bij het meten wordt
     voor elke scène het begin en de lengte vastgelegd, bij het scrollen
     wordt daaruit alleen nog een getal van 0 tot 1 berekend.
     ================================================================ */
  var scenes = [], hoofdstukken = [], pagina = 0, loopt = false;
  var poortEl = document.getElementById("boven");
  var poortScene = poortEl.querySelector(".poort-scene");
  var boeEl = document.getElementById("boe");
  var wettenEl = document.getElementById("regels");
  var spoor = document.getElementById("spoor");
  var wetNu = document.getElementById("wet-nu");
  var breed = window.matchMedia("(min-width: 900px)");

  function scene(el, zet){ var s = {el:el, zet:zet, start:0, lengte:1, p:-1}; scenes.push(s); return s; }

  var poortS = scene(poortEl, function(p){
    var d = inUit(deel(p, 0, .5)) * 106;
    var s = 1 + 4.2 * inn(deel(p, .28, 1));
    poortScene.style.setProperty("--p", p.toFixed(4));
    poortScene.style.setProperty("--d", d.toFixed(2));
    poortScene.style.setProperty("--s", s.toFixed(4));
    poortEl.classList.toggle("voorbij", p > .12);
  });
  var boeS = scene(boeEl, function(p){ boeEl.style.setProperty("--p", p.toFixed(4)); });
  var wetS = scene(wettenEl, function(p){
    if(!wetS.zijwaarts) return;
    wettenEl.style.setProperty("--p", p.toFixed(4));
    spoor.style.setProperty("--schuif", (p * wetS.max).toFixed(1) + "px");
    var nr = Math.min(REGELS.length, 1 + Math.floor(p * REGELS.length * .999));
    wetNu.textContent = ("0" + nr).slice(-2);
  });

  function meet(){
    if(app.hidden) return;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight || 800;
    /* de wetten schuiven alleen zijwaarts op een breed scherm */
    wetS.zijwaarts = breed.matches && !stil;
    if(wetS.zijwaarts){
      var spoorBreed = spoor.scrollWidth;
      wetS.max = Math.max(0, spoorBreed - (window.innerWidth || 1200));
      wettenEl.style.setProperty("--spoor-h", Math.round(wetS.max + vh) + "px");
    } else {
      wettenEl.style.removeProperty("--spoor-h");
      spoor.style.removeProperty("--schuif");
    }
    scenes.forEach(function(s){
      var r = s.el.getBoundingClientRect();
      s.start = r.top + y;
      s.lengte = Math.max(1, r.height - vh);
      s.p = -1;
    });
    hoofdstukken = [].map.call(document.querySelectorAll("[data-vak]:not(a)"), function(el){
      return {vak:+el.getAttribute("data-vak"), top:el.getBoundingClientRect().top + y};
    });
    pagina = document.documentElement.scrollHeight - vh;
    var eerste = bord.querySelector("li");
    bord._stap = eerste ? eerste.offsetHeight + parseFloat(getComputedStyle(bord.querySelector("ol")).rowGap || 0) : 30;
    meetOgen();
    schuif();
    sein("gemeten");
  }

  var huidigVak = -1;
  function schuif(){
    loopt = false;
    if(app.hidden) return;
    var y = window.scrollY || window.pageYOffset;
    var vh = window.innerHeight || 800;
    scenes.forEach(function(s){
      var p = klem((y - s.start) / s.lengte, 0, 1);
      if(Math.abs(p - s.p) < .0004) return;
      s.p = p;
      s.zet(p);
    });
    if(vulling) vulling.style.setProperty("--sp", pagina > 0 ? Math.min(1, y / pagina).toFixed(4) : 0);
    var na = y > poortS.start + poortS.lengte * .92;
    balk.classList.toggle("aan", na);
    bord.classList.toggle("aan", na);
    var vak = 0;
    for(var i = 0; i < hoofdstukken.length; i++) if(hoofdstukken[i].top <= y + vh * .42) vak = hoofdstukken[i].vak;
    if(vak !== huidigVak){
      huidigVak = vak;
      elk("a[data-vak]", function(a){
        var v = +a.getAttribute("data-vak");
        a.classList.toggle("nu", v === vak);
        a.classList.toggle("gehad", v < vak);
        if(v === vak) a.setAttribute("aria-current", "true"); else a.removeAttribute("aria-current");
      }, bord);
      bord.style.setProperty("--pion", (vak * (bord._stap || 30)) + "px");
    }
  }
  window.addEventListener("scroll", function(){
    if(loopt) return;
    loopt = true;
    requestAnimationFrame(schuif);
  }, {passive:true});
  var maatKlok = null;
  window.addEventListener("resize", function(){ clearTimeout(maatKlok); maatKlok = setTimeout(meet, 160); }, {passive:true});
  window.addEventListener("load", function(){ meet(); setTimeout(meet, 1500); });
  if(document.fonts && document.fonts.ready) document.fonts.ready.then(function(){ meet(); });

  /* zelf zacht naar een plek scrollen, met een eigen curve. Wie zelf aan
     het wiel draait of veegt, neemt het meteen over. */
  function rolNaar(doel, ms, klaar){
    var van = window.scrollY || window.pageYOffset, t0 = performance.now(), weg = false;
    if(stil){ window.scrollTo(0, doel); if(klaar) klaar(); return; }
    function stop(){ weg = true; ruim(); }
    function ruim(){
      window.removeEventListener("wheel", stop); window.removeEventListener("touchstart", stop);
      window.removeEventListener("keydown", stop);
    }
    window.addEventListener("wheel", stop, {passive:true});
    window.addEventListener("touchstart", stop, {passive:true});
    window.addEventListener("keydown", stop);
    var w = R.style.scrollBehavior;
    R.style.scrollBehavior = "auto";
    (function stapje(t){
      if(weg){ R.style.scrollBehavior = w; return; }
      var f = Math.min(1, (t - t0) / ms);
      window.scrollTo(0, van + (doel - van) * inUit(f));
      if(f < 1) requestAnimationFrame(stapje);
      else { R.style.scrollBehavior = w; ruim(); if(klaar) klaar(); }
    })(t0);
  }

  /* ---------- de poort: aankloppen opent ze ---------- */
  document.getElementById("klop").addEventListener("click", function(){
    sein("klop");
    poortEl.classList.remove("klopt"); void poortEl.offsetWidth; poortEl.classList.add("klopt");
    setTimeout(function(){
      rolNaar(poortS.start + poortS.lengte, 2600);
    }, 650);
  });

  /* ================================================================
     BINNENKOMEN BIJ HET SCROLLEN
     ================================================================ */
  var waarnemer = null;
  function wekOp(wortel){
    var dingen = (wortel || document).querySelectorAll(".op:not(.in)");
    if(stil || !("IntersectionObserver" in window)){
      [].forEach.call(dingen, function(el){ el.classList.add("in"); });
      return;
    }
    if(!waarnemer){
      waarnemer = new IntersectionObserver(function(rijen){
        rijen.forEach(function(r){
          if(!r.isIntersecting) return;
          r.target.classList.add("in");
          waarnemer.unobserve(r.target);
        });
      }, {rootMargin:"0px 0px -12% 0px", threshold:.1});
    }
    [].forEach.call(dingen, function(el){ waarnemer.observe(el); });
  }
  elk(".tijd .vak-label,.tijd h2,.tijd .kopfijn,.loper-vak,.klok,.klokvoet," +
      ".kaarten .vak-label,.kaarten h2,.kaarten .kopfijn,.dobbel-vak,.kast," +
      ".register .vak-label,.register h2,.register .kopfijn,.boek," +
      ".tombola .vak-label,.tombola h2,.tombola-sticker,.tombola .kopfijn,.waslijn," +
      ".grote-ogen,.grafsteen,.handtekening,.vraagvak,.sociaal,.voet-klein", function(el, i){
    el.classList.add("op");
  });

  /* BOE knalt erin zodra het woord in beeld komt, met bliksem en een schok */
  (function boeKnal(){
    var w = document.querySelector(".boe-woord");
    function knal(){
      if(w.classList.contains("in")) return;
      w.classList.add("in");
      boeGezien = true;
      if(stil) return;
      flits();
      sein("boe");
      setTimeout(function(){
        R.classList.add("schok");
        setTimeout(function(){ R.classList.remove("schok"); }, 560);
      }, 7 * 75 + 180);
    }
    if(stil || !("IntersectionObserver" in window)){ w.classList.add("in"); return; }
    new IntersectionObserver(function(r){ if(r[0].isIntersecting) knal(); }, {threshold:.45}).observe(w);
  })();

  function flits(){
    if(stil) return;
    bliksem.classList.remove("flits");
    void bliksem.offsetWidth;
    bliksem.classList.add("flits");
    sein("flits");
  }
  (function onweer(){
    setTimeout(function(){
      if(boeGezien && !document.hidden && !stil) flits();
      onweer();
    }, 24000 + Math.random() * 28000);
  })();

  /* externe links openen in een nieuw venster */
  function blanko(wortel){
    elk("a[href]", function(a){
      var h = a.getAttribute("href") || "";
      if(/^https?:/i.test(h) && a.hostname && a.hostname !== location.hostname){
        a.target = "_blank";
        a.rel = "noopener noreferrer";
      }
    }, wortel);
  }

  /* ================================================================
     DE ZANDLOPER
     Het zand boven staat voor de tijd die nog rest tot de deur opengaat,
     gerekend vanaf het begin van september. Er valt altijd een straaltje.
     ================================================================ */
  (function zandloper(){
    var knop = document.getElementById("loper");
    var doek = document.getElementById("zand");
    var zin = document.getElementById("loper-zin");
    var ctx = doek.getContext && doek.getContext("2d");
    if(!ctx) return;
    var GLAS = "M50 40C50 120 102 150 106 190C102 230 50 260 50 340H170C170 260 118 230 114 190C118 150 170 120 170 40Z";
    var glas = window.Path2D ? new Path2D(GLAS) : null;
    var korrels = [], zichtbaar = false, schaal = 1, dpr = 1, vorige = 0;
    function maat(){
      var r = knop.getBoundingClientRect();
      dpr = Math.min(2, window.devicePixelRatio || 1);
      doek.width = Math.round(r.width * dpr); doek.height = Math.round(r.height * dpr);
      schaal = doek.width / 220;
    }
    function rest(){
      var nu = Date.now(), totaal = AVOND - SEIZOEN;
      return klem((AVOND - nu) / totaal, 0, 1);
    }
    function teken(t){
      if(!zichtbaar){ vorige = 0; return; }
      var dt = vorige ? Math.min(50, t - vorige) : 16; vorige = t;
      var f = rest();
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, doek.width, doek.height);
      ctx.setTransform(schaal, 0, 0, schaal, 0, 0);
      ctx.save();
      if(glas) ctx.clip(glas);
      var kleur = ctx.createLinearGradient(0, 40, 0, 340);
      kleur.addColorStop(0, "#9dffb6"); kleur.addColorStop(1, "#2c8a4a");
      ctx.fillStyle = kleur;
      ctx.shadowColor = "rgba(111,230,143,.7)"; ctx.shadowBlur = 10;
      /* boven: het zand ligt onderin de bovenste bol */
      var boven = 188 - f * 132;
      ctx.beginPath();
      ctx.moveTo(40, boven + 6); ctx.quadraticCurveTo(110, boven - 4, 180, boven + 6);
      ctx.lineTo(180, 192); ctx.lineTo(40, 192); ctx.closePath(); ctx.fill();
      /* onder: een heuveltje dat groeit */
      var h = (1 - f) * 120 + 8;
      ctx.beginPath();
      ctx.moveTo(40, 342); ctx.lineTo(40, 340 - h * .45);
      ctx.quadraticCurveTo(110, 340 - h * 1.35, 180, 340 - h * .45); ctx.lineTo(180, 342); ctx.closePath(); ctx.fill();
      /* het straaltje en de losse korrels */
      if(f > 0 && f < 1){
        ctx.shadowBlur = 6;
        ctx.fillRect(109.2, 190, 1.6, 340 - h * .9 - 190);
        if(!stil && korrels.length < 26 && Math.random() < .7) korrels.push({x:110 + Math.random() * 2 - 1, y:192, v:.04 + Math.random() * .05});
        for(var i = korrels.length - 1; i >= 0; i--){
          var k = korrels[i];
          k.v += .0009 * dt; k.y += k.v * dt; k.x += (Math.random() - .5) * .35;
          if(k.y > 340 - h * .9){ korrels.splice(i, 1); continue; }
          ctx.fillRect(k.x - .9, k.y, 1.8, 1.8);
        }
      }
      ctx.restore();
      if(!stil) requestAnimationFrame(teken);
    }
    maat();
    window.addEventListener("resize", function(){ maat(); if(stil) teken(0); }, {passive:true});
    if("IntersectionObserver" in window && !stil){
      new IntersectionObserver(function(r){
        var was = zichtbaar; zichtbaar = r[0].isIntersecting;
        if(zichtbaar && !was) requestAnimationFrame(teken);
      }).observe(knop);
    } else { zichtbaar = true; teken(0); }

    var ZINNEN = [
      "Leuk geprobeerd. De tijd draait niet terug, lijkwormpje.",
      "Draaien helpt niet. Ik heb het ook al geprobeerd.",
      "Het zand valt toch weer mijn kant op.",
      "Nog eens? Je wordt er niet jonger van."
    ];
    var beurt = 0, bezigMetDraaien = false;
    knop.addEventListener("click", function(){
      if(bezigMetDraaien) return;
      bezigMetDraaien = true;
      sein("draai");
      knop.classList.add("draait");
      setTimeout(function(){
        zin.textContent = ZINNEN[beurt++ % ZINNEN.length];
        knop.classList.remove("draait");
      }, 1150);
      setTimeout(function(){ bezigMetDraaien = false; }, 2300);
    });
  })();

  /* ---------- de klapklok tikt ---------- */
  function klap(li, oud, nieuw){
    var f = li.querySelector(".flap");
    var b = function(sel){ return f.querySelector(sel + " b"); };
    if(stil || !/\d/.test(oud)){
      b(".flap-boven").textContent = b(".flap-onder").textContent = nieuw;
      return;
    }
    b(".flap-boven").textContent = nieuw;
    b(".flap-onder").textContent = oud;
    b(".flap-val-boven").textContent = oud;
    b(".flap-val-onder").textContent = nieuw;
    f.classList.remove("klapt"); void f.offsetWidth; f.classList.add("klapt");
    clearTimeout(f._klaar);
    f._klaar = setTimeout(function(){ b(".flap-onder").textContent = nieuw; f.classList.remove("klapt"); }, 620);
  }
  function aftellen(){
    var vak = document.getElementById("aftel");
    var s = Math.floor(Math.max(0, AVOND - new Date()) / 1000);
    var w = {d:Math.floor(s / 86400), u:Math.floor(s % 86400 / 3600), m:Math.floor(s % 3600 / 60), s:s % 60};
    elk("li[data-t]", function(li){
      var t = li.getAttribute("data-t"), n = String(w[t]), c = li.querySelector(".cijfer");
      if(t !== "d" && n.length < 2) n = "0" + n;
      if(c.textContent === n) return;
      var oud = c.textContent;
      c.textContent = n;
      klap(li, oud, n);
      if(t === "s") sein("tik");
    }, vak);
  }
  aftellen();
  klok = setInterval(aftellen, 1000);

  /* ================================================================
     DE KAARTEN EN DE DOBBELSTEEN
     ================================================================ */
  var hand = document.getElementById("hand");
  function draaiKaart(kaart, open){
    elk(".kaart.open", function(k){ if(k !== kaart) zetKaart(k, false); }, hand);
    zetKaart(kaart, open);
    hand.classList.toggle("heeft-open", !!hand.querySelector(".kaart.open"));
    sein("kaart");
  }
  function zetKaart(kaart, open){
    kaart.classList.toggle("open", open);
    var knop = kaart.querySelector(".kaart-draai"), achter = kaart.querySelector(".kaart-achter");
    knop.setAttribute("aria-expanded", open ? "true" : "false");
    achter.setAttribute("aria-hidden", open ? "false" : "true");
    achter.inert = !open;
    if(open) setTimeout(function(){ var k = achter.querySelector(".kaart-kies"); if(k) k.focus({preventScroll:true}); }, 350);
  }
  hand.addEventListener("click", function(e){
    var draai = e.target.closest(".kaart-draai"), terug = e.target.closest(".kaart-terug"), kies = e.target.closest(".kaart-kies");
    if(draai){ var k = draai.closest(".kaart"); draaiKaart(k, !k.classList.contains("open")); return; }
    if(terug){ var k2 = terug.closest(".kaart"); draaiKaart(k2, false); k2.querySelector(".kaart-draai").focus({preventScroll:true}); return; }
    if(kies){ kiesSpel(kies.getAttribute("data-kies")); return; }
    if(!e.target.closest(".kaart")) elk(".kaart.open", function(k){ draaiKaart(k, false); }, hand);
  });
  document.addEventListener("keydown", function(e){
    if(e.key === "Escape") elk(".kaart.open", function(k){ draaiKaart(k, false); }, hand);
  });
  /* met een muis glanzen de kaarten waar je ze aanwijst */
  if(fijn && !stil){
    hand.addEventListener("pointermove", function(e){
      var k = e.target.closest(".kaart");
      if(!k || k.classList.contains("open")) return;
      var r = k._r && k._rT === huidigeScroll() ? k._r : (k._r = k.getBoundingClientRect(), k._rT = huidigeScroll(), k._r);
      var x = klem((e.clientX - r.left) / r.width, 0, 1), y = klem((e.clientY - r.top) / r.height, 0, 1);
      k.style.setProperty("--kx", x.toFixed(3)); k.style.setProperty("--ky", y.toFixed(3));
      var dx = x - .5, dy = y - .5, m = Math.sqrt(dx * dx + dy * dy);
      k.querySelector(".kaart-binnen").style.setProperty("--kr", m < .01 ? "0deg" :
        (-dy / m).toFixed(3) + " " + (dx / m).toFixed(3) + " 0 " + (m * 22).toFixed(1) + "deg");
    });
    hand.addEventListener("pointerout", function(e){
      var k = e.target.closest(".kaart");
      if(k && !k.contains(e.relatedTarget)){ k.querySelector(".kaart-binnen").style.setProperty("--kr", "0deg"); k._r = null; }
    });
  }
  function huidigeScroll(){ return Math.round(window.scrollY || window.pageYOffset); }

  /* een spel kiezen vanop een kaart of met de dobbelsteen: het staat dan klaar in het register */
  function kiesSpel(id){
    if(!vind(id)) return;
    var aantal = boeking ? boeking.aantal : 1;
    boeking = {act:id, aantal:aantal, mensen:[]};
    stap = 1; deelnemerIx = 0;
    tekenFormulier();
    elk(".kaart.open", function(k){ draaiKaart(k, false); }, hand);
    var doel = document.getElementById("inschrijven");
    rolNaar(doel.getBoundingClientRect().top + (window.scrollY || 0) - 60, 1100);
  }

  (function dobbelsteen(){
    var steen = document.getElementById("dobbel"), knop = document.getElementById("gooi"), uit = document.getElementById("uitslag");
    var STAND = {1:[0,0], 2:[0,-90], 3:[-90,0], 4:[90,0], 5:[0,90], 6:[0,180]};
    var GETAL = ["", "Eén", "Twee", "Drie", "Vier", "Vijf", "Zes"];
    var rx = 0, ry = 0, rolt = false;
    function verder(nu, doel){ var d = ((doel - nu) % 360 + 360) % 360; return nu + 720 + d; }
    knop.addEventListener("click", function(){
      if(rolt) return;
      rolt = true; knop.disabled = true;
      uit.textContent = "";
      var n = 1 + Math.floor(Math.random() * 6);
      rx = verder(rx, STAND[n][0]); ry = verder(ry, STAND[n][1]);
      steen.style.setProperty("--rx", rx + "deg"); steen.style.setProperty("--ry", ry + "deg");
      steen.classList.remove("rolt"); void steen.offsetWidth; steen.classList.add("rolt");
      sein("dobbel");
      setTimeout(function(){
        var a = n === 6 ? vind("atmosfear") : ACTIVITEITEN[n - 1];
        uit.innerHTML = n === 6
          ? "Zes. Dan kies ik voor je: <strong>" + esc(a.naam) + "</strong>. Daar zit ik zelf in."
          : GETAL[n] + ". Het lot heeft gesproken: <strong>" + esc(a.naam) + "</strong>. Ik zou niet tegenspreken.";
        var kaart = hand.querySelector('.kaart[data-id="' + a.id + '"]');
        if(kaart){
          kaart.classList.remove("aangewezen"); void kaart.offsetWidth; kaart.classList.add("aangewezen");
          if(breed.matches) setTimeout(function(){ draaiKaart(kaart, true); }, 700);
          else kaart.scrollIntoView({behavior:stil ? "auto" : "smooth", block:"nearest", inline:"center"});
        }
        rolt = false; knop.disabled = false;
      }, stil ? 50 : 1750);
    });
  })();

  /* ================================================================
     HET REGISTER: het formulier in stappen, in een boek
     ================================================================ */
  var STAPNAMEN = ["Spelletje", "Gegevens", "Nakijken"];
  var ZIJTEKST = [
    "Ze lopen allemaal tegelijk, dus je kan er maar aan <b>één</b> meedoen. Twijfel je? Duw op <b>Wat is dit?</b> bij een spelletje.",
    "Ik wil van elke persoon een naam. Het mailadres van de eerste volstaat, daar stuur ik alles naartoe.",
    "Nog niets ligt vast. Pas als je op de laatste knop duwt, sta je in mijn register."
  ];
  var NOTITIES = ["Kies wijs. Ik onthoud alles.", "Schrijf duidelijk. Ik lees slecht bij kaarslicht.", "Laatste kans om te vluchten."];
  var bladLinks = document.getElementById("blad-links");
  var omslag = document.getElementById("omslag");

  function tekenLinks(){
    bladLinks.innerHTML =
      '<p class="register-titel">Het register</p>' +
      '<p class="register-sub">van de Poortwachter, vierde editie</p>' +
      '<ol class="kaarsen" aria-label="Stap ' + stap + ' van 3">' + STAPNAMEN.map(function(t, i){
        var st = i + 1 < stap ? "af" : (i + 1 === stap ? "nu" : "");
        return '<li class="' + st + '"' + (i + 1 === stap ? ' aria-current="step"' : '') + '>' +
          '<span class="kaars" aria-hidden="true"><i></i></span><span>' + (i + 1) + '. ' + t + '</span></li>';
      }).join("") + '</ol>' +
      '<p class="zij-fijn">' + ZIJTEKST[stap - 1] + '</p>' +
      '<p class="notitie" aria-hidden="true">' + NOTITIES[stap - 1] + '</p>';
  }
  function raster(inhoud){ return '<div class="stapvlak">' + inhoud + '</div>'; }
  function infoKnop(a){
    return '<button type="button" class="infoknop" data-info="' + a.id + '">' +
      '<span class="teken" aria-hidden="true">i</span><span class="woord">Wat is dit?</span>' +
      '<span class="vzw">, uitleg over ' + esc(a.naam) + '</span></button>';
  }
  function hangInfo(doel){
    elk("button[data-info]", function(k){
      k.addEventListener("click", function(){ toonInfo(k.getAttribute("data-info"), k); });
    }, doel);
  }
  function toonFout(t){
    var f = document.getElementById("fout");
    if(!f) return;
    f.classList.remove("aan"); void f.offsetWidth;
    f.textContent = t; f.classList.add("aan");
    f.scrollIntoView({block:"nearest", behavior:stil ? "auto" : "smooth"});
  }
  function wisselt(){ var d = document.getElementById("formulier"); return !!(d && d.classList.contains("wisselt")); }

  /* Bij elke nieuwe stap slaat de bladzijde om. Het omslaande blad krijgt
     een kopie van de oude bladzijde, zodat het echt een blad lijkt. Zolang
     het omslaat, doen de knoppen van de oude stap niets meer. */
  var formulierGetekend = false, bladKlok = null;
  function tekenFormulier(){
    var doel = document.getElementById("formulier");
    if(!doel) return;
    var omslaan = formulierGetekend && !stil && !app.hidden;
    if(omslaan){
      var voor = omslag.querySelector(".omslag-voor");
      var kopie = doel.cloneNode(true);
      kopie.removeAttribute("id");
      elk("[id]", function(el){ el.removeAttribute("id"); }, kopie);
      elk("[name]", function(el){ el.removeAttribute("name"); }, kopie);
      voor.innerHTML = "";
      voor.appendChild(kopie);
      omslag.classList.remove("slaat"); void omslag.offsetWidth; omslag.classList.add("slaat");
      doel.classList.add("wisselt");
      doel.inert = true;
      sein("blad");
      /* zodra het blad over de helft is, zie je de nieuwe bladzijde en mag je erin werken;
         het blad zelf valt pas daarna helemaal neer */
      clearTimeout(bladKlok); clearTimeout(tekenFormulier._vrij);
      tekenFormulier._vrij = setTimeout(function(){ doel.classList.remove("wisselt"); doel.inert = false; }, 380);
      bladKlok = setTimeout(function(){ omslag.classList.remove("slaat"); voor.innerHTML = ""; }, 760);
    }
    if(stap === 1) stapKeuze(doel);
    else if(stap === 2) stapDeelnemer(doel);
    else stapOverzicht(doel);
    tekenLinks();
    blanko(doel);
    formulierGetekend = true;
    requestAnimationFrame(meet);
  }
  /* tussen de stappen naar het boek zelf, niet naar de titel erboven */
  function springNaarFormulier(){
    var k = document.getElementById("boek");
    if(k) k.scrollIntoView({block:"start"});
  }

  function stapKeuze(doel){
    var opties = ACTIVITEITEN.map(function(a){
      var aan = boeking && boeking.act === a.id;
      return '<div class="spelkeuze' + (aan ? " aan" : "") + '">' +
        '<label class="spelkaart" for="act-' + a.id + '">' +
          '<input type="radio" name="act" id="act-' + a.id + '" value="' + a.id + '"' + (aan ? " checked" : "") + '>' +
          '<span class="spelfiguur" aria-hidden="true">' + fig(a.fig) + '</span>' +
          '<span class="spelnaam">' + esc(a.naam) + '</span>' +
          '<span class="spelprijs">' + esc(a.kort) + '</span>' +
          '<span class="spelduur">' + esc(a.duur) + ' &middot; ' + esc(a.voorWie) + '</span>' +
        '</label>' + infoKnop(a) +
      '</div>';
    }).join("");
    doel.innerHTML = raster(
      '<form id="f" novalidate>' +
        '<fieldset class="naakt"><legend class="vzw">Welk spelletje kies je?</legend>' +
          '<p class="veldkop">Welk spelletje kies je?</p>' +
          '<div class="spellijst">' + opties + '</div>' +
        '</fieldset>' +
        '<div class="veld veld-smal"><label for="aantal">Met hoeveel personen kom je?</label>' +
          '<select id="aantal">' + [1,2,3,4,5].map(function(n){
            return '<option value="' + n + '"' + (boeking && boeking.aantal === n ? " selected" : "") + '>' +
              n + (n === 1 ? " persoon" : " personen") + '</option>';
          }).join("") + '</select>' +
          '<p class="fijn">Van elke persoon vraag ik daarna een naam.</p></div>' +
        '<p class="fout" id="fout" role="alert"></p>' +
        '<p class="acties"><button type="submit" class="hoofd">Verder</button></p>' +
      '</form>');
    hangInfo(doel);
    elk('input[name="act"]', function(r){
      r.addEventListener("change", function(){
        elk(".spelkeuze", function(d){ d.classList.remove("aan"); }, doel);
        r.closest(".spelkeuze").classList.add("aan");
      });
    }, doel);
    document.getElementById("f").addEventListener("submit", function(e){
      e.preventDefault();
      if(wisselt()) return;
      var g = doel.querySelector('input[name="act"]:checked');
      if(!g){ toonFout("KIEZEN. Nu. Welk spelletje kies je?"); return; }
      var aantal = parseInt(document.getElementById("aantal").value, 10);
      boeking = {act:g.value, aantal:aantal, mensen:[]};
      for(var i = 0; i < aantal; i++) boeking.mensen.push({naam:"", mail:"", antw:{}});
      stap = 2; deelnemerIx = 0; tekenFormulier(); springNaarFormulier();
    });
  }

  function stapDeelnemer(doel){
    var a = vind(boeking.act), p = boeking.mensen[deelnemerIx], eerste = deelnemerIx === 0;
    var vragen = a.vragen.map(function(v){
      return '<fieldset class="naakt"><legend class="vzw">' + esc(v.label) + '</legend>' +
        '<p class="veldkop">' + esc(v.label) + '</p>' +
        (v.hint ? '<p class="fijn fijn-boven">' + esc(v.hint) + '</p>' : "") +
        '<div class="chips' + (v.groot ? " chips-groot" : "") + '">' +
        v.opties.map(function(o, i){
          var tekst = o.t || o, uitleg = o.u || "";
          return '<label class="chip"><input type="radio" name="' + v.id + '" id="v-' + v.id + '-' + i +
            '" value="' + esc(tekst) + '"' + (p.antw[v.id] === tekst ? " checked" : "") +
            '><span>' + esc(tekst) + (uitleg ? '<em>' + esc(uitleg) + '</em>' : "") + '</span></label>';
        }).join("") + '</div></fieldset>';
    }).join("");
    doel.innerHTML = raster(
      '<p class="gekozen">Je schrijft in voor <strong>' + esc(a.naam) + '</strong>' + infoKnop(a) + '</p>' +
      '<p class="teller">Persoon ' + (deelnemerIx + 1) + ' van ' + boeking.aantal + '</p>' +
      '<form id="f" novalidate>' +
        '<div class="veld"><label for="naam">Naam</label>' +
        '<input id="naam" type="text" autocomplete="name" value="' + esc(p.naam) + '"></div>' +
        '<div class="veld"><label for="mail">E-mailadres' +
          (eerste ? ' <em class="vereist">verplicht</em>' : ' <em class="optioneel">mag leeg</em>') + '</label>' +
        '<input id="mail" type="email" autocomplete="email" value="' + esc(p.mail) + '">' +
        '<p class="fijn">' + (eerste
          ? "Hier stuur ik het uur van je spelletje naartoe zodra ik het beslist heb."
          : "Alleen invullen als deze persoon zelf bericht wil. Anders mail ik enkel de eerste.") + '</p></div>' +
        vragen +
        '<p class="fout" id="fout" role="alert"></p>' +
        '<p class="acties"><button type="submit" class="hoofd">' +
          (deelnemerIx + 1 < boeking.aantal ? "Volgende persoon" : "Alles nakijken") +
        '</button><button type="button" id="terug">Terug</button></p>' +
      '</form>');
    hangInfo(doel);
    document.getElementById("terug").addEventListener("click", function(){
      if(wisselt()) return;
      if(deelnemerIx === 0){ stap = 1; } else { deelnemerIx--; }
      tekenFormulier(); springNaarFormulier();
    });
    document.getElementById("f").addEventListener("submit", function(e){
      e.preventDefault();
      if(wisselt()) return;
      p.naam = document.getElementById("naam").value.trim();
      p.mail = document.getElementById("mail").value.trim();
      a.vragen.forEach(function(v){
        var g = doel.querySelector('input[name="' + v.id + '"]:checked');
        p.antw[v.id] = g ? g.value : "";
      });
      if(!p.naam){ toonFout("ANTWOORD MIJ!!! Hoe heet je?"); document.getElementById("naam").focus(); return; }
      if(eerste && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.mail)){
        toonFout("Dat mailadres klopt niet. Kijk nog eens goed."); document.getElementById("mail").focus(); return; }
      if(!eerste && p.mail && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(p.mail)){
        toonFout("Dat tweede mailadres klopt niet. Laat het leeg of doe het juist."); return; }
      var mist = a.vragen.filter(function(v){ return !p.antw[v.id]; });
      if(mist.length){ toonFout("GEEF ANTWOORD: " + mist[0].label); return; }
      if(deelnemerIx + 1 < boeking.aantal){ deelnemerIx++; } else { stap = 3; }
      tekenFormulier(); springNaarFormulier();
    });
  }

  function stapOverzicht(doel){
    var a = vind(boeking.act);
    var lijst = boeking.mensen.map(function(p){
      return '<li><p class="ticket-naam">' + esc(p.naam) + (p.mail ? '<span>' + esc(p.mail) + '</span>' : "") + '</p>' +
        '<dl class="ticket-antw">' + a.vragen.map(function(v){
          return '<dt>' + esc(v.label.replace(/\?$/, "")) + '</dt><dd>' + esc(p.antw[v.id]) + '</dd>';
        }).join("") + '</dl></li>';
    }).join("");
    doel.innerHTML = raster(
      '<div class="ticket">' +
        '<span class="stempel" id="stempel" aria-hidden="true">Genoteerd</span>' +
        '<div class="ticket-fig" aria-hidden="true">' + fig(a.fig) + '</div>' +
        '<p class="ticket-label">Toegangsbewijs</p>' +
        '<p class="ticket-kop">' + esc(a.naam) + '</p>' +
        '<dl class="ticket-feiten">' +
          '<dt>Wanneer</dt><dd>Za 7 nov 2026, uur volgt</dd>' +
          '<dt>Waar</dt><dd>Kerk Minnestraat, Lebbeke</dd>' +
          '<dt>Personen</dt><dd>' + boeking.aantal + '</dd>' +
          '<dt>Wat het kost</dt><dd>' + esc(a.kost) + '</dd>' +
        '</dl>' +
        '<ol class="ticket-lijst">' + lijst + '</ol>' +
      '</div>' +
      '<form id="f" novalidate>' +
        '<p class="vzw"><label for="gastenboek">Laat dit veld leeg</label>' +
        '<input id="gastenboek" name="gastenboek" type="text" tabindex="-1" autocomplete="off"></p>' +
        '<p class="fout" id="fout" role="alert"></p>' +
        '<p class="acties"><button type="submit" class="hoofd">Ja, mijn Poortwachter!</button>' +
        '<button type="button" id="terug">Terug</button></p>' +
      '</form>');
    var terugknop = document.getElementById("terug");
    terugknop.addEventListener("click", function(){
      if(wisselt()) return;
      stap = 2; deelnemerIx = boeking.aantal - 1; tekenFormulier(); springNaarFormulier();
    });
    document.getElementById("f").addEventListener("submit", function(e){
      e.preventDefault();
      if(wisselt()) return;
      verzend(e.target.querySelector('button[type="submit"]'), terugknop);
    });
  }

  /* ---------- versturen ---------- */
  var wachtvlak = document.getElementById("wachten");
  var bezig = false;
  function toonWacht(aan){
    wachtvlak.classList.toggle("aan", !!aan);
    R.style.overflow = aan ? "hidden" : "";
  }
  function verzend(knop, terugknop){
    if(bezig) return;
    bezig = true;
    var a = vind(boeking.act);
    knop.disabled = true; terugknop.disabled = true;
    var oudeTekst = knop.textContent;
    knop.textContent = "Ik noteer je...";
    toonWacht(true);
    var val = document.getElementById("gastenboek");
    fetch("/api/inschrijven", {
      method:"POST",
      headers:{"Content-Type":"application/json"},
      body:JSON.stringify({
        spelId:a.id,
        gastenboek:val ? val.value : "",
        mensen:boeking.mensen.map(function(p){
          return {naam:p.naam, email:p.mail, antwoorden:a.vragen.map(function(v){
            return {vraag:v.label, antwoord:p.antw[v.id] || ""};
          })};
        })
      })
    }).then(function(r){
      return r.json().then(function(j){ return {status:r.status, body:j}; })
                     .catch(function(){ return {status:r.status, body:{}}; });
    }).then(function(uit){
      toonWacht(false);
      if(uit.body && uit.body.ok){
        /* de stempel komt op het toegangsbewijs, dan pas de bedankpagina */
        var st = document.getElementById("stempel");
        if(st && !stil){ st.classList.add("slaat"); sein("stempel"); }
        setTimeout(function(){ bezig = false; location.hash = "#/bedankt"; }, stil ? 0 : 600);
        return;
      }
      knop.disabled = false; terugknop.disabled = false; knop.textContent = oudeTekst;
      bezig = false;
      var f = uit.body && uit.body.fout;
      if(f === "nog niet ingesteld") toonFout("Mijn register ligt nog bij de drukker. Mail me even, dan zet ik je er zelf in.");
      else if(f === "mailadres" || f === "tweede mailadres") toonFout("Dat mailadres klopt niet. Ga een stap terug en kijk nog eens goed.");
      else toonFout("Er ging iets mis bij het noteren. Probeer het nog eens. Blijft het misgaan, mail me dan, ik bijt niet. Meestal.");
    }).catch(function(){
      toonWacht(false);
      knop.disabled = false; terugknop.disabled = false; knop.textContent = oudeTekst;
      bezig = false;
      toonFout("Ik krijg geen verbinding. Kijk je internet na en probeer opnieuw.");
    });
  }

  /* ---------- het informatievenster ---------- */
  function sluitVenster(){ venster.close(); }
  document.getElementById("infosluit").addEventListener("click", sluitVenster);
  document.getElementById("infokruis").addEventListener("click", sluitVenster);
  venster.addEventListener("click", function(e){ if(e.target === venster) sluitVenster(); });
  venster.addEventListener("close", function(){ if(laatsteInfoKnop) laatsteInfoKnop.focus(); });
  function toonInfo(id, knop){
    var a = vind(id);
    if(!a) return;
    laatsteInfoKnop = knop || null;
    document.getElementById("infoinhoud").innerHTML =
      '<h2>' + esc(a.naam) + '</h2><p>' + esc(a.uitleg) + '</p>' +
      '<dl><dt>Voor wie</dt><dd>' + esc(a.voorWie) + '</dd><dt>Hoe lang</dt><dd>' + esc(a.duur) + '</dd>' +
      '<dt>Plaatsen</dt><dd>' + esc(a.plaatsen) + '</dd><dt>Wat het kost</dt><dd>' + esc(a.kost) + '</dd></dl>';
    venster.showModal();
  }

  /* ================================================================
     HET KERKHOF: ogen in het donker
     ================================================================ */
  var groteOgen = document.getElementById("grote-ogen");
  var ogenMaat = [], kerkhofZichtbaar = false;
  function meetOgen(){
    var y = window.scrollY || window.pageYOffset;
    ogenMaat = [].map.call(groteOgen.querySelectorAll(".oog"), function(o){
      var r = o.getBoundingClientRect();
      return {el:o.querySelector("i"), x:r.left + r.width / 2, y:r.top + r.height / 2 + y};
    });
  }
  if(!stil){
    var kijkWacht = false, mx = 0, my = 0;
    window.addEventListener("pointermove", function(e){
      if(!kerkhofZichtbaar) return;
      mx = e.clientX; my = e.clientY;
      if(kijkWacht) return;
      kijkWacht = true;
      requestAnimationFrame(function(){
        kijkWacht = false;
        var y = window.scrollY || window.pageYOffset;
        ogenMaat.forEach(function(o){
          var dx = mx - o.x, dy = my - (o.y - y), d = Math.sqrt(dx * dx + dy * dy) || 1;
          var k = Math.min(1, d / 260);
          o.el.style.setProperty("--ox", (dx / d * 9 * k).toFixed(1) + "px");
          o.el.style.setProperty("--oy", (dy / d * 3 * k).toFixed(1) + "px");
        });
      });
    }, {passive:true});
    /* kleine paartjes ogen die opengaan en dichtgaan in de randen */
    var veld = document.getElementById("ogen-veld");
    var paartjes = [];
    for(var i = 0; i < 7; i++){
      var p = document.createElement("span");
      p.className = "paartje";
      var links = Math.random() < .5;
      p.style.left = (links ? 2 + Math.random() * 18 : 78 + Math.random() * 18) + "%";
      p.style.top = (12 + Math.random() * 76) + "%";
      p.style.transform = "scale(" + (.6 + Math.random() * .9).toFixed(2) + ")";
      p.innerHTML = "<span></span><span></span>";
      veld.appendChild(p);
      paartjes.push(p);
    }
    (function knipperen(){
      if(kerkhofZichtbaar){
        var p = paartjes[Math.floor(Math.random() * paartjes.length)];
        p.classList.add("open");
        setTimeout(function(){ p.classList.remove("open"); }, 1200 + Math.random() * 2600);
      }
      setTimeout(knipperen, 500 + Math.random() * 1400);
    })();
    if("IntersectionObserver" in window){
      new IntersectionObserver(function(r){ kerkhofZichtbaar = r[0].isIntersecting; if(kerkhofZichtbaar) meetOgen(); })
        .observe(document.getElementById("kerkhof"));
    }
  }

  /* ================================================================
     GELUID, de sierletter en de zware tekeningen
     ================================================================ */
  var knopGeluid = document.getElementById("geluid"), band = null;
  knopGeluid.addEventListener("click", function(){
    if(!band){ band = new Audio("%%IMG:sfeer%%"); band.loop = true; band.volume = 0; }
    var aan = knopGeluid.classList.toggle("aan");
    knopGeluid.setAttribute("aria-pressed", aan ? "true" : "false");
    knopGeluid.setAttribute("aria-label", aan ? "Zet de sfeer uit" : "Zet de sfeer aan");
    sein("geluid", {aan:aan});
    if(aan) band.play().then(function(){ vervaag(band, .26, 1400); }).catch(function(){});
    else vervaag(band, 0, 500, function(){ band.pause(); });
  });
  function vervaag(a, naar, duur, klaar){
    var van = a.volume, t0 = performance.now();
    (function stapje(t){
      var p = Math.min(1, (t - t0) / duur);
      a.volume = van + (naar - van) * p;
      if(p < 1) requestAnimationFrame(stapje); else if(klaar) klaar();
    })(t0);
  }
  (function sierletter(){
    function aan(){ R.classList.add("laat"); requestAnimationFrame(meet); }
    if(document.readyState === "complete") setTimeout(aan, 1);
    else window.addEventListener("load", function(){
      (window.requestIdleCallback || function(c){ setTimeout(c, 300); })(aan, {timeout:1800});
    });
  })();
  (function figuren(){
    var bron = document.getElementById("fig-defs");
    if(!bron) return;
    function hang(){
      if(!bron.textContent) return;
      var svg = document.querySelector("svg.defs");
      var los = document.createElement("div");
      los.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg"><defs>' + bron.textContent + '</defs></svg>';
      var defs = svg.querySelector("defs"), nieuwe = los.firstChild.firstChild.childNodes;
      while(nieuwe.length) defs.appendChild(nieuwe[0]);
      bron.textContent = "";
      elk('use[href^="#s-"]', function(u){ var h = u.getAttribute("href"); u.removeAttribute("href"); u.setAttribute("href", h); });
    }
    (window.requestIdleCallback || function(c){ setTimeout(c, 200); })(hang, {timeout:1200});
  })();

  /* ================================================================
     NA HET INSCHRIJVEN, en de routering
     ================================================================ */
  function bedankt(){
    var a = boeking ? vind(boeking.act) : null;
    var eerste = boeking ? boeking.mensen[0] : null;
    dankVak.innerHTML = '<div class="dank-in">' +
      '<p class="vak-label">Vak 8</p>' +
      '<h1 class="dank-kop" id="dank-kop">Je staat in mijn register</h1>' +
      (a ? '<div class="dank-bevestiging"><strong>' + boeking.aantal + ' ' + (boeking.aantal === 1 ? "persoon" : "personen") +
             ' voor ' + esc(a.naam) + '</strong>Zaterdag 7 november 2026, Kerk Minnestraat, Lebbeke. Ontsnappen kan niet meer.</div>'
         : '<div class="dank-bevestiging"><strong>Genoteerd</strong>Ontsnappen kan niet meer.</div>') +
      '<h2>Wat er nu gebeurt</h2>' +
      '<ol class="dank-stappen">' +
        '<li>Je staat in mijn register' + (eerste && eerste.mail ? ", genoteerd bij " + esc(eerste.mail) : "") +
          '. Daar stuur ik alles naartoe, dus kijk af en toe in je spam. Daar woon ik graag.</li>' +
        '<li>Zodra ik het uur van je spelletje beslist heb, krijg je bericht van mij. Betalen doe je ter plaatse, cash of met je smartphone.</li>' +
        '<li>Kan je toch niet komen? Mail het me, dan geef ik je plaats aan iemand die wel durft. Zwijgen is erger dan afzeggen.</li>' +
      '</ol>' +
      '<p class="dank-lach">HHAHAHAHAAHAHAHAAAAA!!!!</p>' +
      '<h2>Blijf op de hoogte</h2>' +
      '<p>In de aanloop naar de avond zet ik alles wat ik beslis op mijn Facebook-event en op Instagram: ' +
        'de uren, de toelage en wat ik verder nog voor jullie in petto heb.</p>' +
      '<p class="sociaal" style="justify-content:flex-start"><a class="knop-lijn" href="' + FB_URL + '">' + FB + ' Volg het event op Facebook</a>' +
        '<a class="knop-lijn" href="' + IG_URL + '">' + IG + ' Volg mij op Instagram</a></p>' +
      '<p>Nog iets te vragen? <a href="' + MAIL + '">Mail de Poortwachter</a></p>' +
      '<p><a class="dank-terug" href="#/">Terug naar het begin</a></p>' +
    '</div>';
    app.hidden = true;
    dankVak.hidden = false;
    balk.classList.add("aan");
    bord.classList.remove("aan");
    blanko(dankVak);
    boeking = null; stap = 1; deelnemerIx = 0;
    formulierGetekend = false;
    tekenFormulier();
    window.scrollTo(0, 0);
    sein("bedankt");
  }

  /* bij een campagnelink meteen op het register openen, zonder te schuiven */
  function openOpFormulier(){
    var geroerd = false;
    function raak(){ geroerd = true; af(); }
    function af(){
      window.removeEventListener("wheel", raak); window.removeEventListener("touchstart", raak);
      window.removeEventListener("keydown", raak);
    }
    window.addEventListener("wheel", raak, {passive:true});
    window.addEventListener("touchstart", raak, {passive:true});
    window.addEventListener("keydown", raak);
    function zet(){
      if(geroerd) return;
      var k = document.getElementById("inschrijven");
      var w = R.style.scrollBehavior;
      R.style.scrollBehavior = "auto";
      k.scrollIntoView();
      R.style.scrollBehavior = w;
    }
    zet();
    requestAnimationFrame(function(){ requestAnimationFrame(zet); });
    setTimeout(zet, 300);
    if(document.readyState === "complete") setTimeout(af, 1200);
    else window.addEventListener("load", function(){ setTimeout(zet, 60); setTimeout(af, 600); });
  }

  var eersteBezoek = true;
  function toon(){
    var h = location.hash.replace(/^#/, "");
    if(h === "/bedankt"){ eersteBezoek = false; return bedankt(); }
    var wasVerborgen = app.hidden;
    app.hidden = false;
    dankVak.hidden = true;
    if(wasVerborgen){ meet(); window.scrollTo(0, 0); }
    if(eersteBezoek){
      if(!boeking){
        var voorkeur = spelUitUrl();
        if(voorkeur) boeking = {act:voorkeur, aantal:1, mensen:[]};
      }
      tekenFormulier();
      meet();
      if(spelUitUrl()) openOpFormulier();
      else if(h === "inschrijven") springNaarFormulier();
    }
    eersteBezoek = false;
  }
  window.addEventListener("hashchange", toon);
  blanko(document);
  toon();
  wekOp(document);
  sein("klaar");
