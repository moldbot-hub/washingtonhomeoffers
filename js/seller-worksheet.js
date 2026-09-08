(function(root){
  "use strict";
  function compareNet(v){
    const keys=['cash','list','cashCosts','listCosts','commission','repairs','monthly','cashMonths','listMonths','payoff'];
    const n={};
    keys.forEach(k=>{if(v[k] === '' || v[k] == null || !Number.isFinite(Number(v[k])) || Number(v[k]) < 0) throw new Error('Enter a non-negative number in every field, including 0 when appropriate.');n[k]=Number(v[k]);});
    if(n.commission>100) throw new Error('Commission must be between 0 and 100 percent.');
    const cash=n.cash-n.cashCosts-n.monthly*n.cashMonths-n.payoff;
    const list=n.list-n.listCosts-n.list*n.commission/100-n.repairs-n.monthly*n.listMonths-n.payoff;
    return {cash,list,difference:list-cash};
  }
  if(typeof module==='object' && module.exports) module.exports={compareNet};
  if(typeof document==='undefined') return;
  const tool=document.querySelector('[data-seller-tool]');if(!tool)return;
  const result=tool.querySelector('[data-tool-result]');
  const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
  function update(){
    const v={};tool.querySelectorAll('input[type=number]').forEach(input=>v[input.name]=input.value);
    try{const n=compareNet(v);result.textContent='Estimated cash-sale net: '+money(n.cash)+'. Estimated listing net: '+money(n.list)+'. Listing minus cash: '+money(n.difference)+'. Negative net means these assumptions leave a shortfall. Verify all costs and payoffs before making a decision.';}
    catch(error){result.textContent=error.message;}
  }
  tool.addEventListener('input',event=>{if(event.target.matches('input[type=number]'))update();});
  tool.querySelector('[data-print]').addEventListener('click',()=>window.print());
  tool.querySelector('[data-reset]').addEventListener('click',()=>{tool.querySelectorAll('input,textarea').forEach(i=>i.value='');update();});
})(typeof globalThis!=='undefined'?globalThis:this);
