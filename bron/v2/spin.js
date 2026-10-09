/* de spin en de tabtitels, letterlijk overgenomen uit layout4.body.html */
  /* ---------- de spin ----------
     Ze hangt aan het scherm en niet aan de pagina, dus scrollen schudt haar
     er niet af. Ze wandelt in stappen rond, blijft af en toe staan, verdwijnt
     langs een rand en duikt later ergens anders weer op. Soms komt ze in de
     plaats daarvan aan een draad naar beneden. */
  (function spin(){
    if(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    var POTEN =
      /* de achterste vier */
      '<g class="poot-b">' +
        '<path d="M41,46 Q16,52 8,61"/><path d="M41,51 Q22,67 15,79"/>' +
        '<path d="M59,46 Q84,52 92,61"/><path d="M59,51 Q78,67 85,79"/>' +
      '</g>' +
      /* de voorste vier */
      '<g class="poot-a">' +
        '<path d="M41,36 Q19,17 8,21"/><path d="M41,41 Q15,34 5,40"/>' +
        '<path d="M59,36 Q81,17 92,21"/><path d="M59,41 Q85,34 95,40"/>' +
      '</g>';

    var TEKENING =
      '<svg viewBox="0 0 100 100" aria-hidden="true" focusable="false">' +
        '<g fill="none" stroke="#07030d" stroke-width="3.4" stroke-linecap="round">' + POTEN + '</g>' +
        '<g fill="#07030d">' +
          '<ellipse cx="50" cy="63" rx="15.5" ry="19"/>' +
          '<ellipse cx="50" cy="41" rx="10" ry="11"/>' +
          '<path d="M45,32 q-2,-5 -4,-7" stroke="#07030d" stroke-width="2.6" ' +
            'stroke-linecap="round" fill="none"/>' +
          '<path d="M55,32 q2,-5 4,-7" stroke="#07030d" stroke-width="2.6" ' +
            'stroke-linecap="round" fill="none"/>' +
        '</g>' +
        /* een streepje maanlicht op het achterlijf, zodat ze bol lijkt */
        '<ellipse cx="45" cy="56" rx="6" ry="8.5" fill="rgba(178,92,255,.13)" ' +
          'transform="rotate(-18 45 56)"/>' +
        /* en twee oogjes, anders is ze op zwart helemaal niet te zien */
        '<g class="ogen" fill="rgba(178,92,255,.5)">' +
          '<circle cx="46.6" cy="38" r="1.6"/><circle cx="53.4" cy="38" r="1.6"/>' +
        '</g>' +
      '</svg>';

    var veld = document.createElement("div");
    veld.className = "spinnenveld";
    veld.setAttribute("aria-hidden", "true");
    veld.innerHTML = '<div class="spin"><span class="spin-draad"></span>' +
                     '<div class="spin-lijf">' + TEKENING + '</div></div>';
    document.body.appendChild(veld);
    var beest = veld.firstChild;

    var x = 0, y = 0, bezigNu = false;
    /* maat van de spin nu, de beurtteller en of ze midden in een stap zit */
    var maat = 110, beurt = 0, stapt = false;
    function B(){ return window.innerWidth  || 1200; }
    function Hg(){ return window.innerHeight || 800; }
    function tussen(a, b){ return a + Math.random() * (b - a); }

    /* alles wat in de toekomst gepland staat hangt aan de huidige beurt.
       Schrikt ze, dan telt de beurt door en doen de oude plannen niets meer. */
    function later(fn, ms){
      var b = beurt;
      return setTimeout(function(){ if(b === beurt) fn(); }, ms);
    }
    function plaats(nx, ny){
      x = nx; y = ny;
      beest.style.setProperty("--x", Math.round(nx) + "px");
      beest.style.setProperty("--y", Math.round(ny) + "px");
    }
    function richt(g){ beest.style.setProperty("--r", g.toFixed(1) + "deg"); }
    /* zonder animatie ergens neerzetten */
    function spring(nx, ny){
      beest.style.setProperty("--dur", "0ms");
      void beest.offsetWidth;
      plaats(nx, ny);
      void beest.offsetWidth;
    }
    /* eerst draaien naar waar ze heen wil, dan pas lopen */
    function ga(nx, ny, tempo, soep, na){
      stapt = true;
      var dx = nx - x, dy = ny - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      var ms = Math.max(220, d / tempo * 1000);
      richt(Math.atan2(dy, dx) * 180 / Math.PI + 90);
      later(function(){
        beest.style.setProperty("--soep", soep || "linear");
        beest.style.setProperty("--dur", Math.round(ms) + "ms");
        void beest.offsetWidth;
        beest.classList.add("loopt");
        plaats(nx, ny);
        later(function(){
          beest.classList.remove("loopt");
          stapt = false;
          if(na) na();
        }, ms + 40);
      }, 190);
    }

    /* een punt net buiten beeld, om binnen te komen of te verdwijnen */
    function randpunt(){
      var m = 150, k = Math.floor(Math.random() * 4);
      if(k === 0) return [tussen(.1, .9) * B(), -m];
      if(k === 1) return [B() + m, tussen(.1, .9) * Hg()];
      if(k === 2) return [tussen(.1, .9) * B(), Hg() + m];
      return [-m, tussen(.1, .9) * Hg()];
    }
    function binnenpunt(){ return [tussen(.07, .93) * B(), tussen(.09, .9) * Hg()]; }

    /* rondwandelen: binnenkomen, een paar keer van hoek veranderen, weg */
    function zwerf(klaar){
      var p = randpunt();
      spring(p[0], p[1]);
      beest.classList.add("aan");
      var stappen = 2 + Math.floor(Math.random() * 4);
      (function volgende(){
        if(stappen-- <= 0){
          var u = randpunt();
          ga(u[0], u[1], tussen(500, 850), "cubic-bezier(.3,0,.7,1)", function(){
            beest.classList.remove("aan");
            klaar();
          });
          return;
        }
        var t = binnenpunt();
        /* soms slentert ze, soms schiet ze plots vooruit */
        var tempo = Math.random() < .35 ? tussen(430, 720) : tussen(140, 330);
        ga(t[0], t[1], tempo, "cubic-bezier(.35,0,.65,1)", function(){
          later(volgende, tussen(120, 1400));
        });
      })();
    }

    /* aan een draad naar beneden en dan omhoog of eraf en weglopen */
    function val(klaar){
      var px = tussen(.15, .85) * B(), diep = tussen(.2, .5) * Hg();
      spring(px, -170);
      richt(tussen(-6, 6));
      beest.classList.add("aan");
      beest.classList.add("draad");
      later(function(){
        beest.style.setProperty("--soep", "cubic-bezier(.3,1.45,.5,1)");
        beest.style.setProperty("--dur", "640ms");
        void beest.offsetWidth;
        beest.classList.add("loopt");
        plaats(px, diep);
        later(function(){
          beest.classList.remove("loopt");
          beest.classList.add("bengelt");
          later(function(){
            beest.classList.remove("bengelt");
            if(Math.random() < .5){
              /* ze laat los, valt op de pagina en gaat er lopend vandoor */
              beest.classList.remove("draad");
              beest.style.setProperty("--soep", "cubic-bezier(.4,0,.9,.5)");
              beest.style.setProperty("--dur", "430ms");
              void beest.offsetWidth;
              beest.classList.add("loopt");
              plaats(px, Hg() * tussen(.7, .93));
              later(function(){
                beest.classList.remove("loopt");
                var u = randpunt();
                ga(u[0], u[1], tussen(480, 780), "cubic-bezier(.3,0,.7,1)", function(){
                  beest.classList.remove("aan");
                  klaar();
                });
              }, 620);
            } else {
              /* of ze trekt zichzelf weer omhoog */
              beest.style.setProperty("--soep", "cubic-bezier(.5,0,.9,.55)");
              beest.style.setProperty("--dur", "540ms");
              void beest.offsetWidth;
              beest.classList.add("loopt");
              plaats(px, -170);
              later(function(){
                beest.classList.remove("loopt");
                beest.classList.remove("aan");
                beest.classList.remove("draad");
                klaar();
              }, 580);
            }
          }, tussen(900, 2200));
        }, 680);
      }, 60);
    }

    /* ---- ze merkt de cursor op ----
       Het spinnenveld blijft pointer-events:none. We luisteren op het venster
       en vergelijken de cursor met de plek die we zelf al bijhouden, dus ze
       vangt nooit een klik af en er wordt niets opgemeten. */
    var muisX = -9999, muisY = -9999, wacht = false, schrikt = false;

    /* te dichtbij: ze schiet langs de kortste weg het beeld uit */
    function vlucht(){
      if(schrikt) return;
      schrikt = true;
      beurt++;
      beest.classList.remove("bengelt");
      var nx = x, ny = y;
      if(beest.classList.contains("draad")){
        ny = -170;                       /* hangt ze, dan trekt ze zich omhoog */
      } else {
        var lk = x, re = B() - x, bo = y, on = Hg() - y;
        var m = Math.min(lk, re, bo, on);
        if(m === lk) nx = -170;
        else if(m === re) nx = B() + 170;
        else if(m === bo) ny = -170;
        else ny = Hg() + 170;
      }
      var dx = nx - x, dy = ny - y;
      var ms = Math.max(200, Math.sqrt(dx * dx + dy * dy) / 1500 * 1000);
      richt(Math.atan2(dy, dx) * 180 / Math.PI + 90);
      beest.style.setProperty("--soep", "cubic-bezier(.2,.75,.4,1)");
      beest.style.setProperty("--dur", Math.round(ms) + "ms");
      void beest.offsetWidth;
      beest.classList.add("loopt");
      plaats(nx, ny);
      later(function(){
        beest.classList.remove("loopt");
        beest.classList.remove("aan");
        beest.classList.remove("draad");
        schrikt = false;
        stapt = false;
        bezigNu = false;
      }, ms + 60);
    }

    function merkOp(){
      wacht = false;
      if(schrikt || !beest.classList.contains("aan")) return;
      var dx = muisX - x, dy = muisY - y;
      var d = Math.sqrt(dx * dx + dy * dy);
      if(d < maat * .8){ vlucht(); return; }
      /* staat ze stil, dan draait ze jouw kant op. Aan een draad niet, anders
         hangt het draadje scheef op haar rug. */
      if(!stapt && !beest.classList.contains("loopt") &&
         !beest.classList.contains("draad") && d < maat * 6){
        richt(Math.atan2(dy, dx) * 180 / Math.PI + 90);
      }
    }
    window.addEventListener("pointermove", function(e){
      muisX = e.clientX; muisY = e.clientY;
      if(wacht) return;
      wacht = true;
      requestAnimationFrame(merkOp);
    }, {passive:true});

    function bezet(){
      /* niet storen tijdens een venster, tijdens het verzenden, of als de
         bezoeker net in het formulier aan het typen is */
      if(document.querySelector("dialog[open]")) return true;
      var w = document.getElementById("wachten");
      if(w && w.classList.contains("aan")) return true;
      var a = document.activeElement;
      if(a && /^(INPUT|SELECT|TEXTAREA)$/.test(a.tagName)) return true;
      return false;
    }

    function toon(){
      if(bezigNu) return;
      bezigNu = true;
      maat = Math.round(Math.min(tussen(96, 175), B() * .36));
      schrikt = false;
      stapt = false;
      beest.style.setProperty("--sp", maat + "px");
      /* elke keer een ander moment om te knipperen, anders wordt het een klok */
      beest.style.setProperty("--knip", "-" + tussen(0, 4.6).toFixed(2) + "s");
      (Math.random() < .35 ? val : zwerf)(function(){ bezigNu = false; });
    }

    function plan(eerste){
      setTimeout(function(){
        if(!document.hidden && !bezet()) toon();
        plan(false);
      }, eerste ? tussen(5000, 10000) : tussen(9000, 22000));
    }
    plan(true);
  })();

  /* ---------- de tab roept je terug als je wegkijkt ---------- */
  var TITELS = [
    "BOE!!!!",
    "Waar ga jij naartoe???",
    function(){
      var d = Math.max(0, Math.ceil((AVOND - new Date()) / 86400000));
      return d === 1 ? "Nog \u00e9\u00e9n nacht..." : "Nog " + d + " nachten...";
    },
    "Ik zie je nog altijd",
    "KOM TERUG, LIJKWORMPJE",
    "Je hebt mijn deur open laten staan",
    "Ik wacht wel. Ik heb alle tijd."
  ];
  var echteTitel = document.title, titelKlok = null, titelIx = 0;

  function wisselTitel(){
    var t = TITELS[titelIx % TITELS.length];
    document.title = typeof t === "function" ? t() : t;
    titelIx++;
  }
  document.addEventListener("visibilitychange", function(){
    if(document.hidden){
      titelIx = 0;
      wisselTitel();
      titelKlok = setInterval(wisselTitel, 2400);
    } else {
      if(titelKlok){ clearInterval(titelKlok); titelKlok = null; }
      document.title = echteTitel;
    }
  });

