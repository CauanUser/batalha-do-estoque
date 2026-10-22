/* Batalha do Estoque — melhorias (adicione depois do script principal, antes de </body>) */
(()=>{
const $=id=>document.getElementById(id),MED=["🥇","🥈","🥉"];
const css=`
.timebar{height:6px;border-radius:99px;background:rgba(124,171,194,.16);overflow:hidden;margin-top:10px}
.timebar i{display:block;height:100%;width:0;background:var(--lime);border-radius:99px;transition:width .1s linear,background .3s}
.timebar.urgent i{background:#ff6b6b}
.timer.urgent{color:#ff6b6b;animation:tick .5s infinite}
@keyframes tick{50%{transform:scale(1.1)}}
.answers button.selected{background:#2a5a73!important;color:#fff!important;border-color:var(--lime)!important}
.answers button.correct{background:#2fbf71!important;color:#04210f!important;border-color:#2fbf71!important;opacity:1!important}
.answers button.wrong{background:#ff6b6b!important;color:#2a0505!important;border-color:#ff6b6b!important;opacity:1!important}
.pill.ok{background:rgba(47,191,113,.22);border-color:#2fbf71;color:#fff}
.rankrow.me{border-color:var(--lime);background:rgba(188,249,94,.12)}
#playfeedback{font-size:1.05rem;min-height:2em}
.podium{display:flex;align-items:flex-end;justify-content:center;gap:10px;margin:26px 0 18px}
.pod{flex:1;max-width:170px;min-width:0;text-align:center}
.pod .pn{font-weight:800;font-size:.95rem;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-bottom:6px}
.pod .bar{display:grid;place-items:center;border-radius:14px 14px 0 0;font-size:1.9rem;font-weight:950;color:#071b2b;background:linear-gradient(180deg,var(--lime2),#85c93e)}
.pod.p1 .bar{height:130px}.pod.p2 .bar{height:96px;background:linear-gradient(180deg,#e4eef3,#9db6c3)}.pod.p3 .bar{height:74px;background:linear-gradient(180deg,#ffd9a8,#d99a5b)}
.pod b{display:block;margin-top:6px;color:var(--lime);font-variant-numeric:tabular-nums}
.mypos{padding:14px 16px;border-radius:14px;border:1px solid var(--lime);background:rgba(188,249,94,.1);font-weight:800;margin:6px 0 14px}
.confetti{position:fixed;inset:0;pointer-events:none;overflow:hidden;z-index:50}
.confetti i{position:absolute;top:-16px;width:9px;height:14px;border-radius:2px;animation:fall linear forwards}
@keyframes fall{to{transform:translateY(112vh) rotate(720deg)}}`;
document.head.appendChild(Object.assign(document.createElement("style"),{textContent:css}));

/* regras do jogo */
const left=()=>roomData&&roomData.status==="question"&&roomData.question_started_at?Math.max(0,15-(Date.now()-new Date(roomData.question_started_at).getTime())/1000):0;
let pick=null,revealedFor=-1,confettiDone=false;
const intro=document.querySelector("#playerintro p");
if(intro)intro.textContent="Cada acerto vale de 100 a 150 pontos: quanto mais rápido você responde, mais pontos ganha. A resposta certa aparece quando o tempo acaba.";

/* barra de tempo (apresentador e jogador) */
const mk=(ref)=>{if(!ref)return null;const d=document.createElement("div");d.className="timebar";d.innerHTML="<i></i>";ref.after(d);return d};
const bars=[mk(document.querySelector(".quiz-topline")),mk(document.querySelector("#play .top"))].filter(Boolean);
setInterval(()=>{const l=left(),urg=l>0&&l<=5;bars.forEach(b=>{b.firstChild.style.width=(l/15*100)+"%";b.classList.toggle("urgent",urg)});["hosttimer","playtimer"].forEach(i=>$(i)&&$(i).classList.toggle("urgent",urg))},100);

/* resposta com pontos por velocidade */
window.answer=async function(i,el){
  if(answered||seconds<=0||!currentPlayer||!roomData||roomData.status!=="question")return;
  answered=true;document.querySelectorAll("#playoptions button").forEach(b=>b.disabled=true);el.classList.add("selected");
  if(navigator.vibrate)navigator.vibrate(30);
  const ok=i===questions[idx].a,pts=ok?100+Math.round(left()/15*50):0,fb=$("playfeedback");
  const {error}=await sb.from("answers").insert({room_id:roomData.id,player_id:currentPlayer.id,question_index:idx,selected_option:i,is_correct:ok});
  if(error){fb.textContent=error.code==="23505"?"Sua resposta desta pergunta já foi registrada.":"Não foi possível registrar a resposta: "+error.message;return}
  pick={q:idx,i,pts};
  if(ok){const {data,error:e2}=await sb.from("players").update({score:(currentPlayer.score||0)+pts}).eq("id",currentPlayer.id).select().single();
    if(e2){fb.textContent="Resposta salva, mas não consegui atualizar a pontuação. Avise o apresentador.";return}
    if(data)currentPlayer=data}
  fb.textContent="Resposta enviada! Aguarde o gabarito…";
};

/* gabarito colorido para o jogador */
window.revealPlayer=function(){
  if(idx<0)return;const q=questions[idx],mine=pick&&pick.q===idx?pick:null;
  document.querySelectorAll("#playoptions button").forEach((b,i)=>{b.disabled=true;if(i===q.a)b.classList.add("correct");else if(b.classList.contains("selected"))b.classList.add("wrong");b.classList.remove("selected")});
  $("playfeedback").textContent=!mine?"Tempo esgotado! Resposta certa: "+String.fromCharCode(65+q.a)+".":mine.i===q.a?"Acertou! +"+mine.pts+" pontos":"Errou. A resposta certa é a "+String.fromCharCode(65+q.a)+".";
};

/* gabarito destacado para o apresentador (sobrevive aos re-renders) */
const _rh=window.renderHost;
window.renderHost=function(){_rh();if(roomData&&roomData.revealed&&idx>=0&&idx<questions.length){const p=$("hostoptions").children[questions[idx].a];if(p)p.classList.add("ok")}};

/* contador de respostas + revelar sozinho quando o tempo acaba ou todos respondem */
const cnt=document.createElement("span");cnt.className="pill hidden";cnt.id="answeredcount";
const hp=$("hostprogress");if(hp)hp.after(cnt);
setInterval(async()=>{
  if(!host||!roomData)return;
  const on=roomData.status==="question"&&roomData.question_index>=0;cnt.classList.toggle("hidden",!on);if(!on)return;
  let n=null;
  try{const {count,error}=await sb.from("answers").select("id",{count:"exact",head:true}).eq("room_id",roomData.id).eq("question_index",roomData.question_index);if(!error)n=count}catch(e){}
  if(n!==null)cnt.textContent=n+"/"+participants.length+" responderam";
  const all=n!==null&&participants.length>0&&n>=participants.length;
  if(!roomData.revealed&&revealedFor!==roomData.question_index&&(seconds<=0||all)){revealedFor=roomData.question_index;reveal()}
},1000);

/* ranking da rodada com medalhas e destaque para você */
window.renderParticipantRanking=function(){
  const box=$("roundranking");if(!box)return;
  const s=[...(participants||[])].sort((a,b)=>(b.score||0)-(a.score||0));
  box.innerHTML=s.length?s.map((p,i)=>'<div class="rankrow'+(currentPlayer&&p.id===currentPlayer.id?" me":"")+'"><span>'+(MED[i]||(i+1)+".")+" "+esc(p.display_name||"Participante")+"</span><strong>"+(p.score||0)+" pts</strong></div>").join(""):'<p class="muted">Ainda não há participantes no ranking.</p>';
};

/* placar final: pódio, sua posição e confete */
function confetti(){
  if(matchMedia("(prefers-reduced-motion:reduce)").matches)return;
  const c=document.createElement("div");c.className="confetti";
  for(let i=0;i<70;i++){const e=document.createElement("i");e.style.cssText="left:"+Math.random()*100+"vw;background:"+["#bcf95e","#ffd166","#4cc9f0","#f72585","#fff"][i%5]+";animation-duration:"+(2.4+Math.random()*2.4)+"s;animation-delay:"+Math.random()*.8+"s";c.appendChild(e)}
  document.body.appendChild(c);setTimeout(()=>c.remove(),6500);
}
window.showResults=async function(){
  clearInterval(timer);
  if(roomData&&host&&roomData.status!=="results"){const {data,error}=await sb.from("rooms").update({status:"results"}).eq("id",roomData.id).select().single();if(error){alert("Não consegui liberar o ranking: "+error.message);return}roomData=data}
  show("results");if(roomData)await refreshPlayers();
  const s=[...(participants||[])].sort((a,b)=>(b.score||0)-(a.score||0)),box=$("ranking");
  if(!s.length){box.innerHTML="<p>Nenhum participante registrado.</p>";return}
  const nm=p=>esc(p.display_name||p.name||"Participante"),pos=currentPlayer?s.findIndex(p=>p.id===currentPlayer.id):-1;
  let h=pos>=0?'<div class="mypos">Você ficou em '+(pos+1)+'º lugar com '+(s[pos].score||0)+" pontos</div>":"";
  h+='<div class="podium">'+[1,0,2].filter(i=>s[i]).map(i=>'<div class="pod p'+(i+1)+'"><div class="pn">'+MED[i]+" "+nm(s[i])+'</div><div class="bar">'+(i+1)+"º</div><b>"+(s[i].score||0)+" pts</b></div>").join("")+"</div>";
  h+=s.slice(3).map((p,i)=>'<div class="rankrow'+(i+3===pos?" me":"")+'"><span>'+(i+4)+". "+nm(p)+"</span><strong>"+(p.score||0)+" pts</strong></div>").join("");
  box.innerHTML=h;
  if(!confettiDone){confettiDone=true;confetti()}
};

/* Enter envia o nome */
const nameInput=$("name");if(nameInput)nameInput.addEventListener("keydown",e=>{if(e.key==="Enter")join()});

/* lembra o jogador se a página for recarregada */
const _join=window.join;
window.join=async function(){await _join();if(currentPlayer&&room){try{localStorage.setItem("be_player",JSON.stringify({room,id:currentPlayer.id}))}catch(e){}}};
(async()=>{
  if(!initialRoom)return;let s=null;
  try{s=JSON.parse(localStorage.getItem("be_player")||"null")}catch(e){}
  if(!s||s.room!==initialRoom.toUpperCase())return;
  try{
    const {data:r}=await sb.from("rooms").select("*").eq("code",s.room).maybeSingle();
    const {data:p}=await sb.from("players").select("*").eq("id",s.id).maybeSingle();
    if(!r||!p)return;
    room=s.room;roomData=r;currentPlayer=p;show("play");$("playerroom").textContent="SALA "+room;
    await refreshPlayers();subscribeRoom();
    if(r.status==="results")showResults();else if(r.question_index>=0)syncPlayer(r);
  }catch(e){console.error(e)}
})();
})();
