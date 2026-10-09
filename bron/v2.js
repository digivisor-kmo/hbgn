/* ================================================================
   VERSIE 2: de sfeerlaag
   Alles hier is versiering bovenop de pagina. Het hoofdscript tekent de
   inhoud en het formulier en stuurt seintjes: hbgn:home, hbgn:formulier,
   hbgn:flits, hbgn:tik, hbgn:geluid en hbgn:bedankt. Dit script luistert.
   Valt hier iets weg, dan werkt de site verder zoals versie 1.

   Regels die hier gelden, net als in het hoofdscript:
   - tijdens het scrollen wordt niets opgemeten, alleen geschreven
   - niets houdt een klik tegen: alle lagen hebben pointer-events:none
   - geen browseropslag
   - wie minder beweging wil, krijgt een stille versie
   ================================================================ */
(function(){
  "use strict";
  var W = window, D = document, R = D.documentElement;
  var stil = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fijn = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var spaar = !!(navigator.connection && navigator.connection.saveData);
  var smal = W.matchMedia("(max-width: 760px)");

  R.classList.add("v2");
  if(stil) R.classList.add("v2-stil");
  if(fijn) R.classList.add("v2-fijn");

  function op(naam, fn){ D.addEventListener("hbgn:" + naam, function(e){ fn(e.detail || {}); }); }
  function klem(x, a, b){ return x < a ? a : x > b ? b : x; }
  function tussen(a, b){ return a + Math.random() * (b - a); }
  function nu(){ return W.performance && performance.now ? performance.now() : Date.now(); }

  /* ---------- de testversie maakt zichzelf bekend, behalve op hbgn.be ---------- */
  (function lint(){
    var h = location.hostname;
    if(h === "hbgn.be" || h === "www.hbgn.be") return;
    var el = D.createElement("div");
    el.className = "testlint";
    el.setAttribute("role", "note");
    el.innerHTML = "<b>Testversie</b><span>Inschrijvingen tellen hier niet mee</span>";
    D.body.appendChild(el);
  })();

  /* ================================================================
     DE MUIS, OF ZONDER MUIS EEN DWAALLICHT
     ================================================================ */
  var muis = {x:.5, y:.42, doelX:.5, doelY:.42, gezien:false, laatst:-1e9, tikT:-1e9};
  if(fijn){
    W.addEventListener("pointermove", function(e){
      if(e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      muis.doelX = e.clientX / (W.innerWidth || 1);
      muis.doelY = e.clientY / (W.innerHeight || 1);
      muis.gezien = true;
      muis.laatst = nu();
    }, {passive:true});
  } else {
    /* op een telefoon dwaalt het licht zelf rond. Een tik trekt het even naar je toe */
    W.addEventListener("pointerdown", function(e){
      muis.doelX = e.clientX / (W.innerWidth || 1);
      muis.doelY = e.clientY / (W.innerHeight || 1);
      muis.tikT = nu();
    }, {passive:true});
  }
  function volgMuis(t, dt){
    if(!fijn && t - muis.tikT > 2600){
      muis.doelX = .5 + .3 * Math.sin(t * .00021) + .09 * Math.sin(t * .00067 + 1.7);
      muis.doelY = .46 + .2 * Math.sin(t * .00016 + 1.1) + .07 * Math.sin(t * .00051);
    }
    var k = 1 - Math.exp(-dt * (fijn ? .011 : .0035));
    muis.x += (muis.doelX - muis.x) * k;
    muis.y += (muis.doelY - muis.y) * k;
  }
  /* hoe fel de lantaarn brandt: vol als je de muis beweegt, gedimd als ze stilligt */
  function lichtSterkte(t){
    if(!fijn) return .6;
    if(!muis.gezien) return .38;
    var stilte = t - muis.laatst;
    return stilte < 2500 ? 1 : Math.max(.45, 1 - (stilte - 2500) / 3000 * .55);
  }

  /* ================================================================
     HOOFDSTUKKEN: elke plek op de pagina heeft een eigen kleur en dikte
     van de mist. Gemeten bij het tekenen en bij het vergroten, nooit
     tijdens het scrollen.
     ================================================================ */
  var HOOFDSTUK = [
    ["header.hero",  [.62, .26, .95], .95],
    [".boe-sectie",  [.56, .22, .88], .7],
    ["#aftellen",    [.30, .86, .46], .55],
    ["#regels",      [.60, .30, .95], 1.0],
    ["#inschrijven", [.48, .24, .85], .32],
    ["#contact",     [.34, .80, .50], .7],
    ["footer",       [.50, .56, .82], 1.3]
  ];
  var vakken = [];
  var held = {el:null, beeld:null, merk:null, top:0, hoog:1, breed:1, zichtbaar:true};

  function meten(){
    var y = W.scrollY || W.pageYOffset || 0;
    vakken = [];
    HOOFDSTUK.forEach(function(h){
      var el = D.querySelector(h[0]);
      if(!el) return;
      var r = el.getBoundingClientRect();
      vakken.push({top:r.top + y, bodem:r.bottom + y, tint:h[1], dicht:h[2]});
    });
    if(held.el && D.body.contains(held.el)){
      var r = held.el.getBoundingClientRect();
      held.top = r.top + y; held.hoog = Math.max(1, r.height); held.breed = Math.max(1, r.width);
    }
  }
  var meetKlok = null;
  function straksMeten(ms){
    clearTimeout(meetKlok);
    meetKlok = setTimeout(meten, ms || 120);
  }
  W.addEventListener("resize", function(){ straksMeten(200); }, {passive:true});
  W.addEventListener("load", function(){ straksMeten(60); setTimeout(meten, 2200); });

  var sfeer = {tint:[.62, .26, .95], dicht:.95};
  function volgHoofdstuk(dt){
    var y = (W.scrollY || W.pageYOffset || 0) + (W.innerHeight || 800) * .55;
    var doelTint = [.56, .26, .9], doelDicht = .8;
    for(var i = 0; i < vakken.length; i++){
      if(y >= vakken[i].top && y < vakken[i].bodem){ doelTint = vakken[i].tint; doelDicht = vakken[i].dicht; break; }
    }
    var k = 1 - Math.exp(-dt * .0022);
    for(var c = 0; c < 3; c++) sfeer.tint[c] += (doelTint[c] - sfeer.tint[c]) * k;
    sfeer.dicht += (doelDicht - sfeer.dicht) * k;
  }

  /* ================================================================
     DE MIST, IN WEBGL
     Eén scherm vol mist met een lantaarn erin, vonken die opstijgen en
     bliksem die alles even oplicht. De laag wordt met mix-blend-mode:screen
     over de pagina gelegd: zwart doet niets, licht telt op.
     De kwaliteit past zich aan: wordt het te traag, dan rekent de mist
     op een kleiner beeld, en helpt ook dat niet, dan gaat ze uit en
     komen de oude vonken terug.
     ================================================================ */
  var VERT = "attribute vec2 a;void main(){gl_Position=vec4(a,0.0,1.0);}";
  var FRAG = [
    "precision mediump float;",
    "uniform vec2 uRes;uniform float uTijd;uniform vec2 uMuis;uniform float uLicht;",
    "uniform float uScroll;uniform vec3 uTint;uniform float uFlits;uniform float uDicht;",
    "float hash(vec2 p){p=fract(p*vec2(123.34,456.21));p+=dot(p,p+45.32);return fract(p.x*p.y);}",
    "float ruis(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.0-2.0*f);",
    "  float a=hash(i),b=hash(i+vec2(1.0,0.0)),c=hash(i+vec2(0.0,1.0)),d=hash(i+vec2(1.0,1.0));",
    "  return mix(mix(a,b,f.x),mix(c,d,f.x),f.y);}",
    "float fbm(vec2 p){float v=0.0,a=0.5;mat2 m=mat2(1.6,1.2,-1.2,1.6);",
    "  for(int i=0;i<OCT;i++){v+=a*ruis(p);p=m*p;a*=0.5;}return v;}",
    "float vonk(vec2 p,float schaal,float snel,float zaad){",
    "  vec2 g=p*schaal;g.y-=uTijd*snel;g.x+=sin(g.y*0.9+zaad)*0.35;",
    "  vec2 id=floor(g);vec2 f=fract(g)-0.5;float h=hash(id+zaad);",
    "  vec2 o=vec2(hash(id*1.37+zaad),hash(id*2.11+zaad))-0.5;",
    "  float r=length(f-o*0.6);",
    "  float flak=0.55+0.45*sin(uTijd*(2.0+h*3.0)+h*40.0);",
    "  return step(0.86,h)*smoothstep(0.075,0.0,r)*flak;}",
    "void main(){",
    "  vec2 uv=gl_FragCoord.xy/uRes;float asp=uRes.x/uRes.y;",
    "  vec2 p=vec2(uv.x*asp,uv.y);float t=uTijd*0.04;",
    /* twee lagen ruis die elkaar vervormen: dat geeft trage, krullende mist */
    "  vec2 m=p*1.9+vec2(0.0,uScroll*0.35);",
    "  vec2 q=vec2(fbm(m+vec2(0.0,t)),fbm(m+vec2(5.2,-t*1.3)));",
    "  float n=fbm(m+1.7*q+vec2(t*0.7,-t*0.25));",
    /* onderaan en aan de zijkanten dikker, in het midden waar de tekst staat dunner */
    "  float onder=smoothstep(0.85,0.0,uv.y);",
    "  float zij=smoothstep(0.3,1.0,abs(uv.x-0.5)*2.0);",
    "  float vorm=0.32+0.68*max(onder,zij*0.8);",
    "  float mist=smoothstep(0.38,0.92,n)*vorm*uDicht;",
    /* de lantaarn duwt de mist opzij en licht de rand ervan op */
    "  vec2 lp=vec2(uMuis.x*asp,uMuis.y);float d=distance(p,lp);",
    "  float poel=exp(-d*d*10.0);float rand=exp(-pow((d-0.16)*9.0,2.0));",
    "  mist*=1.0-0.75*uLicht*exp(-d*d*28.0);",
    "  vec3 kleur=uTint*mist*0.5;",
    /* aan de rand van de lantaarn is de mist warm verlicht, niet paars */
    "  vec3 licht=mix(uTint,vec3(1.0,0.84,0.66),0.45);",
    "  kleur+=licht*0.95*mist*rand*uLicht;",
    "  kleur+=vec3(1.0,0.82,0.55)*poel*0.05*uLicht;",
    /* vonken: drie lagen op verschillende diepte, groen, paars en wit */
    "  float hoogte=0.35+0.65*smoothstep(1.0,0.1,uv.y);",
    "  float glans=0.55+1.6*poel*uLicht;",
    "  kleur+=vec3(0.43,0.9,0.56)*vonk(p,7.0,0.05,1.0)*hoogte*glans;",
    "  kleur+=vec3(0.7,0.36,1.0)*vonk(p,12.0,0.085,7.3)*0.75*hoogte*glans;",
    "  kleur+=vec3(0.85,0.82,1.0)*vonk(p,19.0,0.12,3.1)*0.45*hoogte*glans;",
    /* bliksem: de mist licht op, bovenaan het felst */
    "  kleur+=vec3(0.72,0.78,1.0)*uFlits*(0.16+mist*1.4)*(0.55+0.45*uv.y);",
    "  gl_FragColor=vec4(kleur,1.0);",
    "}"
  ].join("\n");

  var nevel = null;
  function maakNevel(){
    if(stil || spaar) return null;
    var c = D.createElement("canvas");
    c.className = "nevel";
    c.setAttribute("aria-hidden", "true");
    var gl = null;
    try {
      gl = c.getContext("webgl", {alpha:false, antialias:false, depth:false, stencil:false,
        premultipliedAlpha:false, preserveDrawingBuffer:false, powerPreference:"low-power"});
    } catch(e){}
    if(!gl) return null;

    var n = {c:c, gl:gl, prog:null, loc:{}, schaal:smal.matches ? .36 : .5,
             oct:smal.matches ? 4 : 5, niveau:0, aan:true, b:0, h:0,
             meting:{n:0, som:0, vanaf:0}, laatsteBeeld:0, flitsT:-1e9};

    function shader(soort, bron){
      var s = gl.createShader(soort);
      gl.shaderSource(s, bron);
      gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ gl.deleteShader(s); return null; }
      return s;
    }
    n.bouw = function(){
      var vs = shader(gl.VERTEX_SHADER, VERT);
      var fs = shader(gl.FRAGMENT_SHADER, "#define OCT " + n.oct + "\n" + FRAG);
      if(!vs || !fs) return false;
      var p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if(!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
      if(n.prog) gl.deleteProgram(n.prog);
      n.prog = p;
      gl.useProgram(p);
      ["uRes","uTijd","uMuis","uLicht","uScroll","uTint","uFlits","uDicht"].forEach(function(u){
        n.loc[u] = gl.getUniformLocation(p, u);
      });
      return true;
    };
    if(!n.bouw()) return null;

    /* één driehoek die het hele scherm bedekt */
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    n.maat = function(){
      var b = Math.max(1, Math.round((W.innerWidth || 1) * n.schaal));
      var h = Math.max(1, Math.round((W.innerHeight || 1) * n.schaal));
      if(b !== n.b || h !== n.h){ c.width = n.b = b; c.height = n.h = h; gl.viewport(0, 0, b, h); }
    };
    n.stop = function(){
      if(!n.aan) return;
      n.aan = false;
      c.classList.remove("aan");
      R.classList.remove("v2-nevel");
      setTimeout(function(){ if(c.parentNode) c.parentNode.removeChild(c); }, 1700);
    };
    c.addEventListener("webglcontextlost", function(e){ e.preventDefault(); n.stop(); });

    D.body.appendChild(c);
    n.maat();
    R.classList.add("v2-nevel");
    requestAnimationFrame(function(){ c.classList.add("aan"); });
    W.addEventListener("resize", function(){ if(n.aan) n.maat(); }, {passive:true});
    n.meting.vanaf = nu() + 3000;
    return n;
  }

  /* bliksem: een dubbele flits die uitdooft */
  function flitsKracht(ms){
    if(ms < 0 || ms > 1600) return 0;
    var a = Math.exp(-ms / 70);
    var b = ms > 130 ? .85 * Math.exp(-(ms - 130) / 110) : 0;
    var c = ms > 330 ? .5 * Math.exp(-(ms - 330) / 260) : 0;
    return Math.min(1.25, a + b + c);
  }

  function tekenNevel(t, dt){
    var n = nevel;
    if(!n || !n.aan) return;
    /* op een telefoon volstaat dertig beelden per seconde */
    if(!fijn && t - n.laatsteBeeld < 30) return;
    var stap = t - n.laatsteBeeld;
    n.laatsteBeeld = t;

    /* meten of het vlot genoeg gaat, één keer na het laden en na elke verlaging */
    if(t > n.meting.vanaf && n.meting.n < 80){
      n.meting.som += Math.min(stap, 200); n.meting.n++;
      if(n.meting.n === 80){
        var gem = n.meting.som / 80, grens = fijn ? 24 : 46;
        if(gem > grens){
          n.niveau++;
          if(n.niveau === 1){
            n.schaal *= .68; n.oct = Math.max(3, n.oct - 1);
            if(!n.bouw()){ n.stop(); return; }
            n.maat();
            n.meting = {n:0, som:0, vanaf:t + 800};
          } else { n.stop(); return; }
        }
      }
    }

    var gl = n.gl, L = n.loc;
    gl.uniform2f(L.uRes, n.b, n.h);
    gl.uniform1f(L.uTijd, t / 1000);
    gl.uniform2f(L.uMuis, muis.x, 1 - muis.y);
    gl.uniform1f(L.uLicht, lichtSterkte(t));
    gl.uniform1f(L.uScroll, (W.scrollY || W.pageYOffset || 0) / (W.innerHeight || 800));
    gl.uniform3f(L.uTint, sfeer.tint[0], sfeer.tint[1], sfeer.tint[2]);
    gl.uniform1f(L.uFlits, flitsKracht(t - n.flitsT));
    gl.uniform1f(L.uDicht, sfeer.dicht);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  /* ================================================================
     DE HERO: de lantaarn, het zwevende woordmerk, het bandje dat
     opstart en de vleermuizen
     ================================================================ */
  var BOODSCHAPPEN = [
    {t:"ik zie je",      x:7,  y:70, r:-8},
    {t:"kom dichter",    x:71, y:18, r:5},
    {t:"niet omkijken",  x:9,  y:20, r:7},
    {t:"7 november",     x:77, y:77, r:-4}
  ];
  var eersteHome = true;

  function opHome(){
    held.el = D.querySelector(".hero");
    held.beeld = D.querySelector(".hero-beeld");
    held.merk = D.querySelector(".merk-vlak");
    if(held.el && held.beeld && !stil && !held.beeld.querySelector(".hero-lamp")){
      var lamp = D.createElement("div");
      lamp.className = "hero-lamp";
      lamp.setAttribute("aria-hidden", "true");
      lamp.innerHTML = BOODSCHAPPEN.map(function(b){
        return '<p class="verborgen" style="left:' + b.x + '%;top:' + b.y + '%;--r:' + b.r + 'deg">' +
          b.t + '</p>';
      }).join("");
      held.beeld.appendChild(lamp);
      requestAnimationFrame(function(){ lamp.classList.add("aan"); });
    }
    if(held.el && "IntersectionObserver" in W){
      new IntersectionObserver(function(r){ held.zichtbaar = r[0].isIntersecting; }).observe(held.el);
    }
    if(held.el && eersteHome) bandjeStart();
    eersteHome = false;
    boe();
    klokOor();
    meten();
    if(held.el && !stil) planZwerm(5200);
  }

  /* de lantaarn en het woordmerk volgen de muis. De tekening schuift bij
     het scrollen mee (het hoofdscript doet dat), dus rekenen we de plek
     van de muis terug naar de coördinaten van de tekening zelf. */
  function volgHeld(t){
    if(!held.el || !held.zichtbaar || stil) return;
    var Bw = W.innerWidth || 1, Hv = W.innerHeight || 1;
    var y = W.scrollY || W.pageYOffset || 0;
    var q = klem((y - held.top) / held.hoog, 0, 1);
    var s = 1 + q * .1, ty = q * .16 * held.hoog;
    var px = muis.x * Bw, py = muis.y * Hv + y - held.top;
    var lx = held.breed / 2 + (px - held.breed / 2) / s;
    var ly = held.hoog / 2 + (py - held.hoog / 2 - ty) / s;
    var flak = 1 + .045 * Math.sin(t * .013) + .03 * Math.sin(t * .031 + 1.3);
    var straal = (fijn ? 25 : 30) * flak * (.75 + .25 * lichtSterkte(t));
    var st = held.beeld.style;
    st.setProperty("--lx", (lx / held.breed * 100).toFixed(2) + "%");
    st.setProperty("--ly", (ly / held.hoog * 100).toFixed(2) + "%");
    st.setProperty("--lr", straal.toFixed(2) + "vmax");
    if(fijn && held.merk){
      held.merk.style.setProperty("--hx", ((muis.x - .5) * 10).toFixed(2) + "deg");
      held.merk.style.setProperty("--hy", ((.5 - muis.y) * 8).toFixed(2) + "deg");
    }
  }

  /* het bandje start: een oude videorecorder die aanspringt, met PLAY in de hoek */
  function bandjeStart(){
    if(stil || !held.el) return;
    /* wie via een campagnelink of #inschrijven binnenkomt, ziet de affiche niet */
    if(/[?&]spel=/i.test(location.search) || location.hash === "#inschrijven") return;
    var vhs = D.createElement("div");
    vhs.className = "vhs";
    vhs.setAttribute("aria-hidden", "true");
    vhs.innerHTML = '<div class="vhs-lijnen"></div><div class="vhs-band"></div>' +
      '<div class="vhs-zwart"></div><div class="vhs-aan-lijn"></div>';
    var osd = D.createElement("div");
    osd.className = "vhs-osd";
    osd.setAttribute("aria-hidden", "true");
    osd.innerHTML = '<span>&#9654; PLAY</span><small>SP 0:00:00</small>';
    held.el.appendChild(vhs);
    held.el.appendChild(osd);
    held.el.classList.add("vhs-aan");
    setTimeout(function(){ osd.classList.add("aan"); }, 450);
    var tel = osd.querySelector("small"), s = 0;
    var teller = setInterval(function(){
      s++;
      tel.textContent = "SP 0:00:" + (s < 10 ? "0" : "") + s;
    }, 1000);
    setTimeout(function(){
      held.el.classList.remove("vhs-aan");
      if(vhs.parentNode) vhs.parentNode.removeChild(vhs);
    }, 1900);
    setTimeout(function(){
      clearInterval(teller);
      if(osd.parentNode) osd.parentNode.removeChild(osd);
    }, 4400);
  }

  /* ---------- vleermuizen ---------- */
  var VLEUGEL = "M50,23 C45,15 34,7 20,8 C13,9 7,12 2,15 C8,17 11,21 12,27 C17,23 22,24 25,29 " +
                "C29,25 35,26 38,32 C42,28 46,28 50,31 Z";
  function spiegel(d){
    return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function(_, x, y){
      return (100 - parseFloat(x)) + "," + y;
    });
  }
  var VLEERMUIS = '<svg viewBox="0 0 100 46" aria-hidden="true" focusable="false">' +
    '<path class="vl" d="' + VLEUGEL + '"/><path class="vr" d="' + spiegel(VLEUGEL) + '"/>' +
    '<ellipse class="lijf" cx="50" cy="27" rx="4.2" ry="7.5"/>' +
    '<path class="lijf" d="M46.6,21.5 L45.2,15.5 L48.6,20 Z M53.4,21.5 L54.8,15.5 L51.4,20 Z"/>' +
    '<circle class="oog" cx="48.3" cy="23.4" r=".95"/><circle class="oog" cx="51.7" cy="23.4" r=".95"/>' +
    '</svg>';
  var zwermKlok = null;
  function planZwerm(ms){
    clearTimeout(zwermKlok);
    zwermKlok = setTimeout(zwerm, ms);
  }
  function zwerm(){
    if(!held.el || !D.body.contains(held.el)) return;
    if(D.hidden || !held.zichtbaar){ planZwerm(4000); return; }
    var vak = held.el.querySelector(".vleermuizen");
    if(!vak){
      vak = D.createElement("div");
      vak.className = "vleermuizen";
      vak.setAttribute("aria-hidden", "true");
      held.el.appendChild(vak);
    }
    var B = held.breed, H = held.hoog;
    var rechts = Math.random() < .5;
    var basis = H * tussen(.1, .42);
    var aantal = 3 + Math.floor(Math.random() * (smal.matches ? 3 : 5));
    for(var i = 0; i < aantal; i++) (function(i){
      var b = tussen(18, smal.matches ? 34 : 50);
      var el = D.createElement("div");
      el.className = "vleermuis";
      el.style.setProperty("--b", b.toFixed(0) + "px");
      el.style.setProperty("--f", tussen(.12, .2).toFixed(3) + "s");
      el.style.opacity = (.55 + b / 120).toFixed(2);
      el.innerHTML = VLEERMUIS;
      vak.appendChild(el);
      var y0 = basis + tussen(-.1, .1) * H, amp = tussen(14, 46), golf = tussen(.8, 2.2), fase = tussen(0, 6);
      var frames = [];
      for(var k = 0; k <= 12; k++){
        var f = k / 12;
        var x = rechts ? (B + 80) - f * (B + 220) : -140 + f * (B + 220);
        var yy = y0 + Math.sin(f * Math.PI * 2 * golf + fase) * amp - f * H * .1;
        var helling = Math.cos(f * Math.PI * 2 * golf + fase) * amp * golf * .004;
        frames.push({transform:"translate3d(" + x.toFixed(1) + "px," + yy.toFixed(1) + "px,0) rotate(" +
          ((rechts ? -1 : 1) * helling * 30).toFixed(1) + "deg)"});
      }
      var duur = tussen(5200, 8400) - b * 25;
      var a = el.animate(frames, {duration:duur, delay:i * 170 + tussen(0, 450), easing:"linear", fill:"both"});
      a.onfinish = function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(i);
    planZwerm(tussen(15000, 32000));
  }

  /* ================================================================
     BOE: letter per letter, en de pagina schudt
     ================================================================ */
  function boe(){
    var w = D.querySelector(".boe-woord");
    if(!w || w.querySelector(".boe-l")) return;
    var tekst = w.textContent;
    w.innerHTML = '<span class="vzw">' + tekst + '</span>' + tekst.split("").map(function(c, i){
      return '<span class="boe-l" aria-hidden="true" style="--l:' + i + ';--lr:' +
        tussen(-12, 12).toFixed(1) + 'deg">' + c + '</span>';
    }).join("");
    if(stil || !("MutationObserver" in W)) return;
    var mo = new MutationObserver(function(){
      if(!w.classList.contains("in")) return;
      mo.disconnect();
      dreun();
      setTimeout(function(){
        R.classList.add("v2-schok");
        setTimeout(function(){ R.classList.remove("v2-schok"); }, 560);
      }, tekst.length * 75 + 180);
    });
    mo.observe(w, {attributes:true, attributeFilter:["class"]});
  }

  /* ================================================================
     KAARTEN DIE KANTELEN
     Eén luisteraar voor de hele pagina. De maat van de kaart wordt pas
     opgemeten bij de eerste beweging erover, en opnieuw nadat er
     gescrold is. In de scrollluisteraar zelf wordt niets gemeten.
     ================================================================ */
  var KANTEL = ".spelkeuze,.regelkaart,.partnerrij li.partner-echt,.grafsteen";
  var kaart = null, kRect = null, kVuil = true, kx = .5, ky = .5, kWacht = false;
  function kantelLos(){
    if(!kaart) return;
    kaart.classList.remove("kantelt");
    kaart.style.rotate = "";
    kaart = null; kRect = null;
  }
  function kantelSchrijf(){
    kWacht = false;
    if(!kaart) return;
    var dx = kx - .5, dy = ky - .5;
    var max = kaart.classList.contains("regelkaart") ? 7 : kaart.classList.contains("grafsteen") ? 9 : 12;
    var mag = Math.sqrt(dx * dx + dy * dy);
    kaart.style.setProperty("--kx", kx.toFixed(3));
    kaart.style.setProperty("--ky", ky.toFixed(3));
    kaart.style.rotate = mag < .002 ? "" :
      (-dy / mag).toFixed(3) + " " + (dx / mag).toFixed(3) + " 0 " + (mag * 2 * max).toFixed(2) + "deg";
  }
  if(fijn && !stil){
    D.addEventListener("pointerover", function(e){
      if(e.pointerType && e.pointerType !== "mouse") return;
      var k = e.target && e.target.closest ? e.target.closest(KANTEL) : null;
      if(k === kaart) return;
      kantelLos();
      if(k){ kaart = k; kVuil = true; k.classList.add("kantelt"); }
    }, {passive:true});
    D.addEventListener("pointermove", function(e){
      if(!kaart || (e.pointerType && e.pointerType !== "mouse")) return;
      if(kVuil || !kRect){ kRect = kaart.getBoundingClientRect(); kVuil = false; }
      kx = klem((e.clientX - kRect.left) / (kRect.width || 1), 0, 1);
      ky = klem((e.clientY - kRect.top) / (kRect.height || 1), 0, 1);
      if(!kWacht){ kWacht = true; requestAnimationFrame(kantelSchrijf); }
    }, {passive:true});
    D.addEventListener("pointerout", function(e){
      if(!kaart) return;
      var naar = e.relatedTarget;
      if(!naar || !kaart.contains(naar)) kantelLos();
    }, {passive:true});
    W.addEventListener("scroll", function(){ kVuil = true; }, {passive:true});
  }

  /* ================================================================
     GELUID, ZELF OPGEWEKT
     Geen extra bestanden: donder, het tikken van de klok en de dreun bij
     BOE worden ter plekke gemaakt met WebAudio. Alleen als de bezoeker
     het geluid zelf aanzet.
     ================================================================ */
  var oor = {aan:false, ctx:null, uit:null, bruin:null};
  function oorKlaar(){
    if(!oor.ctx){
      var AC = W.AudioContext || W.webkitAudioContext;
      if(!AC) return false;
      try { oor.ctx = new AC(); } catch(e){ return false; }
      oor.uit = oor.ctx.createDynamicsCompressor();
      oor.uit.threshold.value = -14; oor.uit.ratio.value = 6;
      oor.uit.connect(oor.ctx.destination);
    }
    if(oor.ctx.state === "suspended"){ try { oor.ctx.resume(); } catch(e){} }
    return true;
  }
  function bruineRuis(){
    if(oor.bruin) return oor.bruin;
    var c = oor.ctx, lengte = Math.floor(c.sampleRate * 5);
    var b = c.createBuffer(1, lengte, c.sampleRate), d = b.getChannelData(0), laatst = 0;
    for(var i = 0; i < lengte; i++){
      var wit = Math.random() * 2 - 1;
      laatst = (laatst + .02 * wit) / 1.02;
      d[i] = laatst * 3.4;
    }
    return (oor.bruin = b);
  }
  function donder(){
    if(!oor.aan || !oorKlaar()) return;
    var c = oor.ctx, t = c.currentTime + tussen(.25, .9);
    var bron = c.createBufferSource(); bron.buffer = bruineRuis();
    bron.playbackRate.value = tussen(.8, 1.15);
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .6;
    lp.frequency.setValueAtTime(1600, t);
    lp.frequency.exponentialRampToValueAtTime(160, t + 1.1);
    lp.frequency.exponentialRampToValueAtTime(55, t + 4.2);
    var g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.62, t + .05);
    g.gain.exponentialRampToValueAtTime(.3, t + .7);
    g.gain.exponentialRampToValueAtTime(.38, t + 1.2);
    g.gain.exponentialRampToValueAtTime(.0001, t + 4.6);
    bron.connect(lp); lp.connect(g); g.connect(oor.uit);
    bron.start(t); bron.stop(t + 4.8);
  }
  var tikHoog = false, klokZichtbaar = false;
  function tikGeluid(){
    if(!oor.aan || !klokZichtbaar || !oorKlaar()) return;
    var c = oor.ctx, t = c.currentTime;
    tikHoog = !tikHoog;
    var o = c.createOscillator(); o.type = "triangle";
    o.frequency.setValueAtTime(tikHoog ? 2100 : 1600, t);
    o.frequency.exponentialRampToValueAtTime(tikHoog ? 900 : 700, t + .03);
    var g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.05, t + .002);
    g.gain.exponentialRampToValueAtTime(.0001, t + .05);
    o.connect(g); g.connect(oor.uit);
    o.start(t); o.stop(t + .06);
  }
  function dreun(){
    if(!oor.aan || !oorKlaar()) return;
    var c = oor.ctx, t = c.currentTime + .02;
    var o = c.createOscillator(); o.type = "sine";
    o.frequency.setValueAtTime(96, t);
    o.frequency.exponentialRampToValueAtTime(30, t + .75);
    var g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(.75, t + .012);
    g.gain.exponentialRampToValueAtTime(.0001, t + .95);
    o.connect(g); g.connect(oor.uit);
    o.start(t); o.stop(t + 1);
    var bron = c.createBufferSource(); bron.buffer = bruineRuis();
    var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.frequency.value = 380;
    var g2 = c.createGain();
    g2.gain.setValueAtTime(.0001, t);
    g2.gain.exponentialRampToValueAtTime(.5, t + .01);
    g2.gain.exponentialRampToValueAtTime(.0001, t + .4);
    bron.connect(lp); lp.connect(g2); g2.connect(oor.uit);
    bron.start(t); bron.stop(t + .45);
  }
  function klokOor(){
    var k = D.getElementById("aftel");
    if(!k || !("IntersectionObserver" in W)) return;
    new IntersectionObserver(function(r){ klokZichtbaar = r[0].isIntersecting; }).observe(k);
  }

  /* ================================================================
     BLIKSEM, EN WIE "boe" TIKT, ROEPT HEM ZELF
     ================================================================ */
  function opFlits(){
    if(nevel && nevel.aan) nevel.flitsT = nu();
    donder();
  }
  var getypt = "";
  D.addEventListener("keydown", function(e){
    var a = e.target;
    if(a && (/^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName) || a.isContentEditable)) return;
    if(!e.key || e.key.length !== 1) return;
    getypt = (getypt + e.key.toLowerCase()).slice(-3);
    if(getypt !== "boe") return;
    getypt = "";
    var b = D.getElementById("bliksem");
    if(b && !stil){ b.classList.remove("flits"); void b.offsetWidth; b.classList.add("flits"); }
    dreun();
    opFlits();
  });

  /* ================================================================
     EEN LUS VOOR ALLES
     ================================================================ */
  var vorige = 0, draait = false;
  function lus(t){
    if(D.hidden){ draait = false; return; }
    var dt = vorige ? Math.min(100, t - vorige) : 16;
    vorige = t;
    volgMuis(t, dt);
    volgHoofdstuk(dt);
    volgHeld(t);
    tekenNevel(t, dt);
    requestAnimationFrame(lus);
  }
  function start(){
    if(draait || stil) return;
    draait = true; vorige = 0;
    requestAnimationFrame(lus);
  }
  D.addEventListener("visibilitychange", function(){ if(!D.hidden) start(); });

  /* ================================================================
     WAKKER WORDEN
     Het hoofdscript heeft de startpagina al getekend voor dit script
     luisterde, dus doen we de eerste keer zelf wat hbgn:home zou doen.
     ================================================================ */
  op("home", opHome);
  op("bedankt", function(){ held.el = null; meten(); });
  op("formulier", function(){ straksMeten(80); });
  op("flits", opFlits);
  op("tik", tikGeluid);
  op("geluid", function(d){
    oor.aan = !!d.aan;
    if(oor.aan) oorKlaar();
  });

  nevel = maakNevel();
  if(D.querySelector(".hero")) opHome(); else meten();
  start();
})();
