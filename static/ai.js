/* The AI helper prepares drafts; posting and reservations require confirmation. */
nav.splice(1, 0, ['ai', '✦', 'Harvest AI']);
let aiDraft = null;
const baseRender = render;
render = function () {
  if (page !== 'ai') return baseRender();
  const cfg = S.ai || {};
  const myRequests = S.demands.filter(d => d.buyer_id === actorId);
  $('content').innerHTML = title('SAVIPOLA · HARVEST AI', 'From a message to a market.',
    'Describe your harvest in Sinhala, Tamil or English. Review every detail before you list it.') +
    `<div class="callout"><strong>${cfg.configured ? 'Vertex AI project configured' : 'Vertex AI setup needed'}</strong>${cfg.configured ? 'Requests use Gemini on Vertex AI. Project configuration does not confirm API access; run a request to verify it.' : 'Open GOOGLE_CLOUD_SETUP.md in the project to connect your Google Cloud project. Marketplace functions work locally.'}</div>
    <div class="cards-two"><section class="surface"><div class="surface-head"><h2>Farmer: describe your harvest</h2><span class="badge">Review before posting</span></div>
    <label for="harvest-message">Your message</label><textarea id="harvest-message" rows="5" style="width:100%;margin:12px 0;padding:14px;border:1px solid #ccd8cc;border-radius:12px">I have 150 kg of tomatoes in Dambulla. I am asking Rs. 250 per kg.</textarea>
    <p class="tiny" style="margin-bottom:12px">සිංහල හෝ தமிழ் messages are welcome. Extraction accuracy needs local testing. Text input only in this prototype.</p>
    ${btn('ai-draft','✦ Prepare a listing draft','', cfg.configured && act().role==='farmer' ? '' : 'disabled')}
    ${act().role!=='farmer'?'<p class="subtitle">Switch to a farmer demo profile to prepare a listing.</p>':''}<div id="ai-draft-result" aria-live="polite"></div></section>
    <section class="surface"><div class="surface-head"><h2>Buyer: understand your sourcing plan</h2></div>
    <p class="subtitle">The server calculates quantities and totals. Gemini explains the plan, its shortfall, and the actions still needed.</p>
    <div class="field" style="margin-top:16px"><label for="ai-demand">Your buying request</label><select id="ai-demand">${myRequests.map(d=>`<option value="${d.id}">${esc(d.crop)} · ${nfmt(d.qty)} kg · Request #${d.id}</option>`).join('')}</select></div>
    <div class="field"><label for="ai-language">Explanation language</label><select id="ai-language"><option>English</option><option>Sinhala</option><option>Tamil</option></select></div>
    ${btn('ai-plan','✦ Explain my plan','secondary',cfg.configured && myRequests.length ? '' : 'disabled')}
    ${!myRequests.length?'<p class="subtitle">Switch to a buyer and post a buying request first.</p>':''}<div id="ai-plan-result" aria-live="polite"></div></section></div>
    <section class="surface" style="margin-top:22px"><div class="surface-head"><h2>Inspect what the AI actually did</h2><span class="badge gray">${esc(cfg.model || '')}</span></div>
    <p class="subtitle">Photo review is in My Harvest → Quality check. Photo observations stay provisional and do not change the seller’s grade.</p>
    <div class="table-wrap"><table><thead><tr><th>Operation</th><th>Model</th><th>Latency</th><th>Time (UTC)</th></tr></thead><tbody>${(S.ai_events||[]).map(e=>`<tr><td>${esc(e.operation)}</td><td>${esc(e.model)}</td><td>${nfmt(e.latency_ms)} ms</td><td>${esc(e.created)}</td></tr>`).join('')||'<tr><td colspan="4">No successful AI calls recorded. Sample results are never presented as live AI.</td></tr>'}</tbody></table></div></section>`;
  $('top-title').textContent = 'Harvest AI';
  drawNav();
};

function evidence(meta) {
  return `<p class="tiny" style="margin-top:12px">Vertex AI · ${esc(meta.model)} · ${nfmt(meta.latency_ms)} ms · Review AI suggestions</p>`;
}

document.addEventListener('click', async e => {
  const button = e.target.closest('[data-a]');
  if (!button) return;
  const action = button.dataset.a;
  if (action === 'ai-fill') {
    if (!aiDraft || act().role !== 'farmer') return toast('Switch to the farmer who prepared this draft.', true);
    openForm('addproduct');
    const f = document.querySelector('form[data-kind="addproduct"]');
    const crop = f.elements.namedItem('crop');
    if (![...crop.options].some(o => o.value === aiDraft.crop)) {
      crop.add(new Option(aiDraft.crop, aiDraft.crop));
    }
    for (const key of ['crop','qty','price','district']) f.elements.namedItem(key).value = aiDraft[key] ?? '';
    toast('Review the details and harvest date, then confirm to publish.');
    return;
  }
  if (!['ai-draft', 'ai-plan'].includes(action)) return;
  const target = $(action === 'ai-draft' ? 'ai-draft-result' : 'ai-plan-result');
  const requestedActor = actorId;
  const requestedPage = page;
  target.innerHTML = '<p class="subtitle">Requesting Gemini on Vertex AI…</p>';
  button.disabled = true;
  try {
    if (action === 'ai-draft') {
      aiDraft = null;
      const r = await request('/ai/listing-draft','POST',{actor_id:actorId,message:$('harvest-message').value});
      if (actorId !== requestedActor || page !== requestedPage || !target.isConnected) return;
      aiDraft = r.result;
      const d = aiDraft;
      const complete = d.crop && d.qty && d.price && d.district;
      target.innerHTML = `<div class="mini-report" style="margin-top:16px"><strong>Draft for your review</strong><p>${esc(d.summary)}</p><div class="hr"></div>${[['Crop',d.crop],['Quantity',d.qty == null?'Missing':d.qty+' kg'],['Asking price',d.price == null?'Missing':fmt(d.price)+'/kg'],['District',d.district]].map(([k,v])=>`<p><b>${k}:</b> ${esc(v??'Missing')}</p>`).join('')}${d.questions.map(q=>`<p style="margin-top:8px">${esc(q)}</p>`).join('')}${evidence(r.ai)}</div>${complete?btn('ai-fill','Review listing form →'): '<p class="subtitle">Add missing details to your message and prepare a new draft.</p>'}`;
    } else {
      const r = await request('/ai/explain-plan/'+$('ai-demand').value,'POST',{actor_id:actorId,language:$('ai-language').value});
      if (actorId !== requestedActor || page !== requestedPage || !target.isConnected) return;
      const d = r.result;
      target.innerHTML = `<div class="mini-report" style="margin-top:16px"><p>${esc(d.summary)}</p><h3 style="margin-top:14px">Next steps</h3><ul>${d.next_steps.map(s=>`<li>${esc(s)}</li>`).join('')}</ul><h3>Still to verify</h3><ul>${d.uncertainties.map(s=>`<li>${esc(s)}</li>`).join('')}</ul>${evidence(r.ai)}</div>`;
    }
    S = await request('/state');
  } catch (err) {
    if (target.isConnected) target.innerHTML = `<div class="callout"><strong>AI request unavailable</strong>${esc(err.message)}</div>`;
  } finally {
    if (button.isConnected) button.disabled = false;
  }
});
