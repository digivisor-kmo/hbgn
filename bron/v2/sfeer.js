/* ================================================================
   VERSIE 2: de sfeerlaag
   Mist in WebGL met een lantaarn, vonken en bliksem, een videorecorder
   die opstart voor de poort, vleermuizen en zelf opgewekt geluid.
   Het hoofdscript stuurt seintjes (hbgn:...), dit script luistert.
   Valt hier iets weg, dan werkt de pagina gewoon verder.
   ================================================================ */
(function(){
  "use strict";
  var W = window, D = document, R = D.documentElement;
  var stil = W.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fijn = W.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var spaar = !!(navigator.connection && navigator.connection.saveData);
  var smal = W.matchMedia("(max-width: 760px)");

  function op(naam, fn){ D.addEventListener("hbgn:" + naam, function(e){ fn(e.detail || {}); }); }
  function klem(x, a, b){ return x < a ? a : x > b ? b : x; }
  function tussen(a, b){ return a + Math.random() * (b - a); }
  function nu(){ return performance.now(); }

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
  var muis = {x:.5, y:.45, doelX:.5, doelY:.45, gezien:false, laatst:-1e9, tikT:-1e9};
  if(fijn){
    W.addEventListener("pointermove", function(e){
      if(e.pointerType && e.pointerType !== "mouse" && e.pointerType !== "pen") return;
      muis.doelX = e.clientX / (W.innerWidth || 1);
      muis.doelY = e.clientY / (W.innerHeight || 1);
      muis.gezien = true; muis.laatst = nu();
    }, {passive:true});
  } else {
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
  function lichtSterkte(t){
    if(!fijn) return .6;
    if(!muis.gezien) return .4;
    var stilte = t - muis.laatst;
    return stilte < 2500 ? 1 : Math.max(.45, 1 - (stilte - 2500) / 3000 * .55);
  }

  /* ================================================================
     HOOFDSTUKKEN: elke plek heeft een eigen kleur en dikte van de mist
     ================================================================ */
  var HOOFDSTUK = [
    ["#boven",       [.62, .26, .95], .9],
    ["#boe",         [.56, .22, .88], .75],
    ["#aftellen",    [.30, .86, .46], .6],
    ["#kaarten",     [.62, .30, .95], .7],
    ["#regels",      [.55, .36, .95], 1.0],
    ["#inschrijven", [.70, .48, .30], .28],
    ["#contact",     [.34, .80, .50], .7],
    ["#kerkhof",     [.50, .56, .82], 1.3],
    ["#dank",        [.30, .86, .46], .6]
  ];
  var vakken = [];
  function meten(){
    var y = W.scrollY || W.pageYOffset || 0;
    vakken = [];
    HOOFDSTUK.forEach(function(h){
      var el = D.querySelector(h[0]);
      if(!el || el.hidden || el.closest("[hidden]")) return;
      var r = el.getBoundingClientRect();
      if(!r.height) return;
      vakken.push({top:r.top + y, bodem:r.bottom + y, tint:h[1], dicht:h[2]});
    });
  }
  var sfeer = {tint:[.62, .26, .95], dicht:.9};
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
     bliksem die alles even oplicht. Met mix-blend-mode:screen over de
     pagina: zwart doet niets, licht telt op. De kwaliteit past zich aan:
     te traag, dan rekent ze op een kleiner beeld, nog steeds te traag,
     dan gaat ze uit.
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
    "  vec2 m=p*1.9+vec2(0.0,uScroll*0.35);",
    "  vec2 q=vec2(fbm(m+vec2(0.0,t)),fbm(m+vec2(5.2,-t*1.3)));",
    "  float n=fbm(m+1.7*q+vec2(t*0.7,-t*0.25));",
    "  float onder=smoothstep(0.85,0.0,uv.y);",
    "  float zij=smoothstep(0.3,1.0,abs(uv.x-0.5)*2.0);",
    "  float vorm=0.32+0.68*max(onder,zij*0.8);",
    "  float mist=smoothstep(0.38,0.92,n)*vorm*uDicht;",
    "  vec2 lp=vec2(uMuis.x*asp,uMuis.y);float d=distance(p,lp);",
    "  float poel=exp(-d*d*10.0);float rand=exp(-pow((d-0.16)*9.0,2.0));",
    "  mist*=1.0-0.75*uLicht*exp(-d*d*28.0);",
    "  vec3 kleur=uTint*mist*0.5;",
    "  vec3 licht=mix(uTint,vec3(1.0,0.84,0.66),0.45);",
    "  kleur+=licht*0.95*mist*rand*uLicht;",
    "  kleur+=vec3(1.0,0.82,0.55)*poel*0.05*uLicht;",
    "  float hoogte=0.35+0.65*smoothstep(1.0,0.1,uv.y);",
    "  float glans=0.55+1.6*poel*uLicht;",
    "  kleur+=vec3(0.43,0.9,0.56)*vonk(p,7.0,0.05,1.0)*hoogte*glans;",
    "  kleur+=vec3(0.7,0.36,1.0)*vonk(p,12.0,0.085,7.3)*0.75*hoogte*glans;",
    "  kleur+=vec3(0.85,0.82,1.0)*vonk(p,19.0,0.12,3.1)*0.45*hoogte*glans;",
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
    var n = {c:c, gl:gl, prog:null, loc:{}, schaal:smal.matches ? .36 : .5, oct:smal.matches ? 4 : 5,
             niveau:0, aan:true, b:0, h:0, meting:{n:0, som:0, vanaf:0}, laatsteBeeld:0, flitsT:-1e9};
    function shader(soort, bron){
      var s = gl.createShader(soort);
      gl.shaderSource(s, bron); gl.compileShader(s);
      if(!gl.getShaderParameter(s, gl.COMPILE_STATUS)){ gl.deleteShader(s); return null; }
      return s;
    }
    n.bouw = function(){
      var vs = shader(gl.VERTEX_SHADER, VERT), fs = shader(gl.FRAGMENT_SHADER, "#define OCT " + n.oct + "\n" + FRAG);
      if(!vs || !fs) return false;
      var p = gl.createProgram();
      gl.attachShader(p, vs); gl.attachShader(p, fs);
      gl.bindAttribLocation(p, 0, "a");
      gl.linkProgram(p);
      if(!gl.getProgramParameter(p, gl.LINK_STATUS)) return false;
      if(n.prog) gl.deleteProgram(n.prog);
      n.prog = p; gl.useProgram(p);
      ["uRes","uTijd","uMuis","uLicht","uScroll","uTint","uFlits","uDicht"].forEach(function(u){ n.loc[u] = gl.getUniformLocation(p, u); });
      return true;
    };
    if(!n.bouw()) return null;
    var buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 3,-1, -1,3]), gl.STATIC_DRAW);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    n.maat = function(){
      var b = Math.max(1, Math.round((W.innerWidth || 1) * n.schaal)), h = Math.max(1, Math.round((W.innerHeight || 1) * n.schaal));
      if(b !== n.b || h !== n.h){ c.width = n.b = b; c.height = n.h = h; gl.viewport(0, 0, b, h); }
    };
    n.stop = function(){
      if(!n.aan) return;
      n.aan = false;
      c.classList.remove("aan");
      R.classList.remove("nevel-aan");
      setTimeout(function(){ if(c.parentNode) c.parentNode.removeChild(c); }, 1700);
    };
    c.addEventListener("webglcontextlost", function(e){ e.preventDefault(); n.stop(); });
    D.body.appendChild(c);
    n.maat();
    R.classList.add("nevel-aan");
    requestAnimationFrame(function(){ c.classList.add("aan"); });
    W.addEventListener("resize", function(){ if(n.aan) n.maat(); }, {passive:true});
    n.meting.vanaf = nu() + 3000;
    return n;
  }
  function flitsKracht(ms){
    if(ms < 0 || ms > 1600) return 0;
    var a = Math.exp(-ms / 70), b = ms > 130 ? .85 * Math.exp(-(ms - 130) / 110) : 0, c = ms > 330 ? .5 * Math.exp(-(ms - 330) / 260) : 0;
    return Math.min(1.25, a + b + c);
  }
  function tekenNevel(t){
    var n = nevel;
    if(!n || !n.aan) return;
    if(!fijn && t - n.laatsteBeeld < 30) return;
    var stap = t - n.laatsteBeeld;
    n.laatsteBeeld = t;
    if(t > n.meting.vanaf && n.meting.n < 80){
      n.meting.som += Math.min(stap, 200); n.meting.n++;
      if(n.meting.n === 80 && n.meting.som / 80 > (fijn ? 24 : 46)){
        n.niveau++;
        if(n.niveau === 1){
          n.schaal *= .68; n.oct = Math.max(3, n.oct - 1);
          if(!n.bouw()){ n.stop(); return; }
          n.maat(); n.meting = {n:0, som:0, vanaf:t + 800};
        } else { n.stop(); return; }
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
     VOOR DE POORT: een videorecorder die opstart, en vleermuizen
     ================================================================ */
  var scene = D.querySelector(".poort-scene");
  var sceneZichtbaar = true;
  if(scene && "IntersectionObserver" in W){
    new IntersectionObserver(function(r){ sceneZichtbaar = r[0].isIntersecting; }).observe(scene);
  }
  (function bandjeStart(){
    if(stil || !scene) return;
    if(/[?&]spel=/i.test(location.search) || /^#(inschrijven|\/bedankt)/.test(location.hash)) return;
    var vhs = D.createElement("div");
    vhs.className = "vhs";
    vhs.setAttribute("aria-hidden", "true");
    vhs.innerHTML = '<div class="vhs-lijnen"></div><div class="vhs-band"></div><div class="vhs-zwart"></div><div class="vhs-aan-lijn"></div>';
    var osd = D.createElement("div");
    osd.className = "vhs-osd";
    osd.setAttribute("aria-hidden", "true");
    osd.innerHTML = '<span>&#9654; PLAY</span><small>SP 0:00:00</small>';
    scene.appendChild(vhs); scene.appendChild(osd);
    scene.classList.add("vhs-aan");
    setTimeout(function(){ osd.classList.add("aan"); }, 450);
    var tel = osd.querySelector("small"), s = 0;
    var teller = setInterval(function(){ s++; tel.textContent = "SP 0:00:" + (s < 10 ? "0" : "") + s; }, 1000);
    setTimeout(function(){ scene.classList.remove("vhs-aan"); if(vhs.parentNode) vhs.parentNode.removeChild(vhs); }, 1900);
    setTimeout(function(){ clearInterval(teller); if(osd.parentNode) osd.parentNode.removeChild(osd); }, 4400);
  })();

  var VLEUGEL = "M50,23 C45,15 34,7 20,8 C13,9 7,12 2,15 C8,17 11,21 12,27 C17,23 22,24 25,29 " +
                "C29,25 35,26 38,32 C42,28 46,28 50,31 Z";
  function spiegel(d){
    return d.replace(/(-?\d+(?:\.\d+)?),(-?\d+(?:\.\d+)?)/g, function(_, x, y){ return (100 - parseFloat(x)) + "," + y; });
  }
  var VLEERMUIS = '<svg viewBox="0 0 100 46" aria-hidden="true" focusable="false">' +
    '<path class="vl" d="' + VLEUGEL + '"/><path class="vr" d="' + spiegel(VLEUGEL) + '"/>' +
    '<ellipse class="lijf" cx="50" cy="27" rx="4.2" ry="7.5"/>' +
    '<path class="lijf" d="M46.6,21.5 L45.2,15.5 L48.6,20 Z M53.4,21.5 L54.8,15.5 L51.4,20 Z"/>' +
    '<circle class="oog-v" cx="48.3" cy="23.4" r=".95"/><circle class="oog-v" cx="51.7" cy="23.4" r=".95"/></svg>';
  var zwermKlok = null;
  function planZwerm(ms){ clearTimeout(zwermKlok); zwermKlok = setTimeout(zwerm, ms); }
  function zwerm(){
    if(!scene) return;
    if(D.hidden || !sceneZichtbaar){ planZwerm(4000); return; }
    var vak = scene.querySelector(".vleermuizen");
    if(!vak){
      vak = D.createElement("div"); vak.className = "vleermuizen"; vak.setAttribute("aria-hidden", "true");
      scene.appendChild(vak);
    }
    var B = scene.clientWidth, H = scene.clientHeight;
    var rechts = Math.random() < .5, basis = H * tussen(.06, .3);
    var aantal = 3 + Math.floor(Math.random() * (smal.matches ? 3 : 5));
    for(var i = 0; i < aantal; i++) (function(i){
      var b = tussen(18, smal.matches ? 32 : 46);
      var el = D.createElement("div");
      el.className = "vleermuis";
      el.style.setProperty("--b", b.toFixed(0) + "px");
      el.style.setProperty("--f", tussen(.12, .2).toFixed(3) + "s");
      el.style.opacity = (.55 + b / 120).toFixed(2);
      el.innerHTML = VLEERMUIS;
      vak.appendChild(el);
      var y0 = basis + tussen(-.08, .08) * H, amp = tussen(14, 46), golf = tussen(.8, 2.2), fase = tussen(0, 6), frames = [];
      for(var k = 0; k <= 12; k++){
        var f = k / 12;
        var x = rechts ? (B + 80) - f * (B + 220) : -140 + f * (B + 220);
        var yy = y0 + Math.sin(f * Math.PI * 2 * golf + fase) * amp - f * H * .08;
        var helling = Math.cos(f * Math.PI * 2 * golf + fase) * amp * golf * .004;
        frames.push({transform:"translate3d(" + x.toFixed(1) + "px," + yy.toFixed(1) + "px,0) rotate(" + ((rechts ? -1 : 1) * helling * 30).toFixed(1) + "deg)"});
      }
      var a = el.animate(frames, {duration:tussen(5200, 8400) - b * 25, delay:i * 170 + tussen(0, 450), easing:"linear", fill:"both"});
      a.onfinish = function(){ if(el.parentNode) el.parentNode.removeChild(el); };
    })(i);
    planZwerm(tussen(14000, 28000));
  }
  if(!stil && scene) planZwerm(5200);

  /* ================================================================
     GELUID, ZELF OPGEWEKT
     Geen extra bestanden: alles wordt ter plekke gemaakt met WebAudio,
     en alleen als de bezoeker het geluid zelf aanzet.
     ================================================================ */
  var oor = {aan:false, ctx:null, uit:null, bruin:null, wit:null};
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
  function ruisBuffer(soort){
    if(oor[soort]) return oor[soort];
    var c = oor.ctx, lengte = Math.floor(c.sampleRate * 5);
    var b = c.createBuffer(1, lengte, c.sampleRate), d = b.getChannelData(0), laatst = 0;
    for(var i = 0; i < lengte; i++){
      var w = Math.random() * 2 - 1;
      if(soort === "bruin"){ laatst = (laatst + .02 * w) / 1.02; d[i] = laatst * 3.4; } else d[i] = w;
    }
    return (oor[soort] = b);
  }
  /* een stoot ruis door een filter, met een omhullende */
  function stoot(soort, filter, freq, q, piek, duur, wanneer, eindFreq){
    var c = oor.ctx, t = c.currentTime + (wanneer || 0);
    var bron = c.createBufferSource(); bron.buffer = ruisBuffer(soort);
    var f = c.createBiquadFilter(); f.type = filter; f.frequency.setValueAtTime(freq, t); f.Q.value = q;
    if(eindFreq) f.frequency.exponentialRampToValueAtTime(eindFreq, t + duur);
    var g = c.createGain();
    g.gain.setValueAtTime(.0001, t);
    g.gain.exponentialRampToValueAtTime(piek, t + Math.min(.012, duur / 4));
    g.gain.exponentialRampToValueAtTime(.0001, t + duur);
    bron.connect(f); f.connect(g); g.connect(oor.uit);
    bron.start(t, Math.random() * 3); bron.stop(t + duur + .05);
  }
  function toon(type, van, naar, piek, duur, wanneer){
    var c = oor.ctx, t = c.currentTime + (wanneer || 0);
    var o = c.createOscillator(); o.type = type;
    o.frequency.setValueAtTime(van, t); o.frequency.exponentialRampToValueAtTime(naar, t + duur);
    var g = c.createGain();
    g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(piek, t + .01);
    g.gain.exponentialRampToValueAtTime(.0001, t + duur);
    o.connect(g); g.connect(oor.uit); o.start(t); o.stop(t + duur + .05);
  }
  function klaar(){ return oor.aan && oorKlaar(); }
  var GELUID = {
    donder:function(){
      var c = oor.ctx, t = c.currentTime + tussen(.25, .9);
      var bron = c.createBufferSource(); bron.buffer = ruisBuffer("bruin"); bron.playbackRate.value = tussen(.8, 1.15);
      var lp = c.createBiquadFilter(); lp.type = "lowpass"; lp.Q.value = .6;
      lp.frequency.setValueAtTime(1600, t); lp.frequency.exponentialRampToValueAtTime(160, t + 1.1);
      lp.frequency.exponentialRampToValueAtTime(55, t + 4.2);
      var g = c.createGain();
      g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.62, t + .05);
      g.gain.exponentialRampToValueAtTime(.3, t + .7); g.gain.exponentialRampToValueAtTime(.38, t + 1.2);
      g.gain.exponentialRampToValueAtTime(.0001, t + 4.6);
      bron.connect(lp); lp.connect(g); g.connect(oor.uit); bron.start(t); bron.stop(t + 4.8);
    },
    dreun:function(){ toon("sine", 96, 30, .75, .95, .02); stoot("bruin", "lowpass", 380, .7, .5, .4, .02); },
    tik:(function(){ var hoog = false; return function(){
      hoog = !hoog; toon("triangle", hoog ? 2100 : 1600, hoog ? 900 : 700, .05, .05); }; })(),
    klop:function(){
      [0, .3, .6].forEach(function(w){ toon("sine", 140, 60, .6, .22, w); stoot("bruin", "lowpass", 900, 1, .45, .12, w); });
    },
    dobbel:function(){
      for(var i = 0; i < 9; i++){ var w = .05 + i * .11 + Math.random() * .05;
        stoot("wit", "bandpass", tussen(1800, 3400), 6, .3 * (1 - i / 11), .04, w); }
    },
    kaart:function(){ stoot("wit", "bandpass", 2400, .8, .16, .28, 0, 700); },
    blad:function(){ stoot("wit", "bandpass", 1600, .7, .14, .5, 0, 500); stoot("wit", "highpass", 4000, .5, .05, .2, .3); },
    stempel:function(){ toon("sine", 120, 45, .7, .3); stoot("bruin", "lowpass", 600, 1, .6, .18); },
    draai:function(){ stoot("wit", "bandpass", 300, 1.5, .18, 1.0, 0, 1400); }
  };
  function speel(naam){ if(klaar() && GELUID[naam]) try { GELUID[naam](); } catch(e){} }
  var klokZichtbaar = false;
  (function(){
    var k = D.getElementById("aftel");
    if(k && "IntersectionObserver" in W) new IntersectionObserver(function(r){ klokZichtbaar = r[0].isIntersecting; }).observe(k);
  })();

  /* ================================================================
     BLIKSEM, en wie ergens "boe" tikt, roept hem zelf
     ================================================================ */
  function opFlits(){ if(nevel && nevel.aan) nevel.flitsT = nu(); speel("donder"); }
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
    speel("dreun"); opFlits();
  });

  /* ================================================================
     EEN LUS VOOR ALLES
     ================================================================ */
  var vorige = 0, draait = false;
  function lus(t){
    if(D.hidden){ draait = false; return; }
    var dt = vorige ? Math.min(100, t - vorige) : 16;
    vorige = t;
    volgMuis(t, dt); volgHoofdstuk(dt); tekenNevel(t);
    requestAnimationFrame(lus);
  }
  function start(){ if(draait || stil) return; draait = true; vorige = 0; requestAnimationFrame(lus); }
  D.addEventListener("visibilitychange", function(){ if(!D.hidden) start(); });

  op("gemeten", meten);
  op("bedankt", function(){ setTimeout(meten, 50); });
  op("flits", opFlits);
  op("tik", function(){ if(klokZichtbaar) speel("tik"); });
  op("boe", function(){ speel("dreun"); });
  ["klop", "dobbel", "kaart", "blad", "stempel", "draai"].forEach(function(n){ op(n, function(){ speel(n); }); });
  op("geluid", function(d){ oor.aan = !!d.aan; if(oor.aan) oorKlaar(); });
  W.addEventListener("resize", function(){ setTimeout(meten, 250); }, {passive:true});

  nevel = maakNevel();
  meten();
  start();
})();
