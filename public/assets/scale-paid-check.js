/* Scale Paid Check page calculator. Moved out of the page so the site's Content-Security-Policy (script-src 'self') allows it. */
(function(){
  var out=document.getElementById('sp-out');
  if(!out)return;
  var ids=['sp-cac','sp-arr','sp-limit','sp-margin'];
  function num(id){
    var el=document.getElementById(id);
    var s=(el&&el.value||'').replace(/\s/g,'').replace(/^[^\d.\-]*[A-Za-z]\.(?=\d)/,'').replace(/^[^\d.\-]+/,'').replace(/%$/,'');
    // "Rs." and "INR." lose their dot with the prefix. A comma before 1 or 2 final digits is a decimal comma (950,50 or 3.000,50).
    // Dot grouping such as 12.000 could mean twelve or twelve thousand, so it gets no answer rather than a wrong one.
    if(/^\d+(\.\d{3})*,\d{1,2}$/.test(s))s=s.replace(/\./g,'').replace(',','.');
    else if(/^\d{1,3}(\.\d{3})+$/.test(s))return null;
    else s=s.replace(/,/g,'');
    if(!/^(\d+\.?\d*|\.\d+)$/.test(s))return null;
    var n=parseFloat(s);
    return isFinite(n)&&n>0?n:null;
  }
  function r1(x){return Math.round((x+Number.EPSILON)*10)/10;}
  function calc(cac,arr,limit,margin){
    if(cac===null||arr===null)return null;
    if(margin!==null&&margin<1)margin=margin*100; // a margin typed as 0.7 means 70%
    var res={plain:r1(cac*12/arr),after:null,verdict:null,gap:null};
    if(margin!==null&&margin<=100)res.after=r1(cac*12*100/(arr*margin));
    if(limit!==null){
      var used=res.after!==null?res.after:res.plain;
      res.gap=r1(used-limit);
      res.verdict=res.gap>0?'over':'within';
    }
    return res;
  }
  window.spPayback=calc;
  var form=document.getElementById('sp-form');
  if(form)form.addEventListener('submit',function(e){e.preventDefault();});
  function p(cls,text){var e=document.createElement('p');e.className=cls;e.textContent=text;return e;}
  function show(){
    var res=calc(num('sp-cac'),num('sp-arr'),num('sp-limit'),num('sp-margin'));
    out.textContent='';
    if(!res)return;
    out.appendChild(p('sp-big','Payback: '+res.plain.toFixed(1)+' months'));
    if(res.after!==null)out.appendChild(p('sp-line','After gross margin: '+res.after.toFixed(1)+' months'));
    if(res.verdict==='within')out.appendChild(p('sp-verdict sp-ok','Within your limit.'));
    if(res.verdict==='over')out.appendChild(p('sp-verdict sp-over','Over your limit by '+res.gap.toFixed(1)+' months.'));
    out.appendChild(p('sp-sum',res.after!==null?'Sum: CAC ÷ (ARR ÷ 12 × margin). The verdict uses payback after margin.':'Sum: CAC ÷ (ARR ÷ 12).'));
  }
  for(var i=0;i<ids.length;i++){var el=document.getElementById(ids[i]);if(el){el.addEventListener('input',show);el.addEventListener('change',show);}}
  show();
})();
