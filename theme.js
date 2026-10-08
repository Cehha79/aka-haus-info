(() => {
  'use strict';
  const root = document.documentElement;
  const main = document.getElementById('inhalt');
  const pageName = document.body.dataset.page;
  const $ = (selector, scope = document) => scope.querySelector(selector);
  const $$ = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const read = key => { try { return sessionStorage.getItem(key); } catch { return null; } };
  const save = (key, value) => { try { sessionStorage.setItem(key, value); } catch {} };
  // Ohne nutzbaren Sitzungsspeicher trägt die Adresse die Farbwahl von Seite zu Seite.
  const storageWorks = (() => { try { sessionStorage.setItem('mt-test','1'); sessionStorage.removeItem('mt-test'); return true; } catch { return false; } })();
  const normalize = value => value.toLocaleLowerCase('de').normalize('NFD').replace(/\p{Diacritic}/gu, '').replaceAll('ß','ss');
  const themeButton = $('.theme-toggle');
  const menuButton = $('.menu-toggle');
  const navigation = $('.site-nav');
  function closeMenu() { navigation.classList.remove('is-open'); menuButton.setAttribute('aria-expanded','false'); }
  menuButton.addEventListener('click', () => {
    const open = menuButton.getAttribute('aria-expanded') !== 'true';
    navigation.classList.toggle('is-open',open);
    menuButton.setAttribute('aria-expanded',String(open));
    if(open) $('a',navigation).focus();
  });
  document.addEventListener('keydown', event => { if(event.key === 'Escape' && navigation.classList.contains('is-open')) { closeMenu(); menuButton.focus(); } });
  document.addEventListener('click', event => { if(!event.target.closest('.site-header')) closeMenu(); });
  matchMedia('(min-width:851px)').addEventListener('change',closeMenu);
  $('.skip-link').addEventListener('click', event => { event.preventDefault(); main.focus(); });
  $$('details.faq-section').forEach(section => { section.open = true; });
  // Für den Druck alle aufklappbaren Themen öffnen und danach den vorherigen Zustand herstellen.
  window.addEventListener('beforeprint', () => $$('details').forEach(item => { item.dataset.printOpen = String(item.open); item.open = true; }));
  window.addEventListener('afterprint', () => $$('details[data-print-open]').forEach(item => { item.open = item.dataset.printOpen === 'true'; delete item.dataset.printOpen; }));

  function themeInUrl() {
    return new URLSearchParams(location.search).get('mt') || new URLSearchParams(location.hash.slice(1)).get('mt');
  }
  // Reihenfolge: Farbwahl aus der Adresse, dann aus dieser Sitzung, dann die Einstellung des Geräts; sonst dunkel.
  const chosenTheme = [themeInUrl(), read('mt-theme')].find(value => value === 'dark' || value === 'light');
  const initialTheme = chosenTheme || (matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark');
  // Alte Farbadressen bleiben gültig; die Reiter behalten ihre eigenen Anker.
  if (/^#mt=(dark|light)$/.test(location.hash)) {
    const url = new URL(location.href);
    url.hash = '';
    history.replaceState(null,'',url.pathname+url.search);
  }
  function themeUrl(url) {
    if(storageWorks) url.searchParams.delete('mt'); else url.searchParams.set('mt',root.dataset.theme);
    return url.pathname+url.search+url.hash;
  }
  document.addEventListener('click',event => {
    if(storageWorks) return;
    const link = event.target.closest('a[href]');
    if(!link || link.hasAttribute('download') || link.getAttribute('href').startsWith('#')) return;
    const url = new URL(link.href,location.href);
    if(url.origin !== location.origin || !/\.html$/.test(url.pathname)) return;
    url.searchParams.set('mt',root.dataset.theme);
    link.href = url.pathname+url.search+url.hash;
  },true);
  function setTheme(dark) {
    root.dataset.theme = dark ? 'dark' : 'light';
    save('mt-theme',root.dataset.theme);
    history.replaceState(null,'',themeUrl(new URL(location.href)));
    themeButton.setAttribute('aria-label',dark ? 'Helles Design einschalten' : 'Dunkles Design einschalten');
    $('use',themeButton).setAttribute('href',dark ? '#ic-sun' : '#ic-moon');
    $$('img[data-theme-light]').forEach(img => { img.src = dark ? img.dataset.themeDark : img.dataset.themeLight; });
    document.dispatchEvent(new Event('themechange'));
  }
  $$('img[src*="aka-haus/"][src*="-hell.jpg"]').forEach(img => { img.dataset.themeLight = img.getAttribute('src'); img.dataset.themeDark = img.dataset.themeLight.replace('-hell.jpg','-dunkel.jpg'); });
  setTheme(initialTheme !== 'light');
  themeButton.addEventListener('click', () => setTheme(root.dataset.theme !== 'dark'));

  // Eigenständige Seiten; Unterbereiche wechseln innerhalb der jeweiligen Seite.
  const tabs = $$('[data-tab]');
  // Die Sprungmarken in den Bereichen dienen nur dem Betrieb ohne JavaScript; hier übernehmen die Reiter.
  $$('.tab-anchor').forEach(anchor => anchor.remove());
  window.addEventListener('load', () => { if(tabs.some(tab => tab.dataset.tab === location.hash.slice(1))) window.scrollTo({top:0,behavior:'instant'}); });
  const legalSelect = $('[data-legal-select]');
  function selectTab(focus = false) {
    const key = location.hash.slice(1);
    const selected = tabs.find(tab => tab.dataset.tab === key) || tabs[0];
    if(!selected) return;
    tabs.forEach(tab => {
      const active = tab === selected;
      tab.setAttribute('aria-selected',String(active)); tab.tabIndex = active ? 0 : -1;
      document.getElementById(tab.getAttribute('aria-controls')).hidden = !active;
    });
    if(legalSelect) legalSelect.value = selected.dataset.tab;
    if(focus) {
      window.scrollTo({top:0,behavior:'instant'});
      if(!document.activeElement.matches('[data-tab]')) document.getElementById(selected.getAttribute('aria-controls')).focus({preventScroll:true});
    }
  }
  tabs.forEach((tab,index) => {
    tab.addEventListener('click', () => { if(location.hash === '#'+tab.dataset.tab) selectTab(); else location.hash = tab.dataset.tab; });
    tab.addEventListener('keydown', event => {
      let next;
      if(event.key === 'ArrowRight') next = (index+1)%tabs.length;
      if(event.key === 'ArrowLeft') next = (index+tabs.length-1)%tabs.length;
      if(event.key === 'Home') next = 0;
      if(event.key === 'End') next = tabs.length-1;
      if(next !== undefined) { event.preventDefault(); tabs[next].focus(); tabs[next].click(); }
    });
  });
  window.addEventListener('hashchange', () => selectTab(true));
  selectTab();
  if(legalSelect) legalSelect.addEventListener('change',() => { location.hash = legalSelect.value; });
  $$('[data-legal-expand]').forEach(button => {
    const topics = $$('.legal-topic',button.closest('.legal-panel'));
    function syncTopics() {
      const allOpen = topics.every(topic => topic.open);
      button.setAttribute('aria-expanded',String(allOpen));
      button.textContent = allOpen ? 'Alle Themen schließen' : 'Alle Themen öffnen';
    }
    button.addEventListener('click',() => {
      const open = !topics.every(topic => topic.open);
      topics.forEach(topic => { topic.open = open; });
      syncTopics();
    });
    topics.forEach(topic => topic.addEventListener('toggle',syncTopics));
    syncTopics();
  });

  // Technikprofil: zwei Ansichten, je Einsatzgebiet ein kompakter Bereich.
  const toolkit = $('.toolkit');
  if(toolkit) {
    const viewButtons = $$('[data-toolkit-view]',toolkit);
    function selectToolkitView(key) {
      const selected = viewButtons.find(button => button.dataset.toolkitView === key) || viewButtons[0];
      viewButtons.forEach(button => {
        const active = button === selected;
        button.setAttribute('aria-selected',String(active));
        button.tabIndex = active ? 0 : -1;
        document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
      });
      save('mt-toolkit-view',selected.dataset.toolkitView);
    }
    viewButtons.forEach((button,index) => {
      button.addEventListener('click',() => selectToolkitView(button.dataset.toolkitView));
      button.addEventListener('keydown',event => {
        let next;
        if(event.key === 'ArrowRight') next = (index+1)%viewButtons.length;
        if(event.key === 'ArrowLeft') next = (index+viewButtons.length-1)%viewButtons.length;
        if(event.key === 'Home') next = 0;
        if(event.key === 'End') next = viewButtons.length-1;
        if(next !== undefined) { event.preventDefault(); viewButtons[next].focus(); viewButtons[next].click(); }
      });
    });
    $$('.toolkit-view',toolkit).forEach(view => {
      const buttons = $$('[data-toolkit-category]',view);
      const select = $('[data-toolkit-select]',view);
      const key = 'mt-'+view.id;
      function chooseCategory(id) {
        const selected = buttons.find(button => button.dataset.toolkitCategory === id) || buttons[0];
        buttons.forEach(button => {
          const active = button === selected;
          button.setAttribute('aria-pressed',String(active));
          document.getElementById(button.getAttribute('aria-controls')).hidden = !active;
        });
        select.value = selected.dataset.toolkitCategory;
        save(key,select.value);
      }
      buttons.forEach(button => button.addEventListener('click',() => chooseCategory(button.dataset.toolkitCategory)));
      select.addEventListener('change',() => chooseCategory(select.value));
      chooseCategory(read(key));
    });
    selectToolkitView(read('mt-toolkit-view'));
  }

  // Vollständige Projektübersicht mit durchsuchbaren Detailinhalten.
  const projectCards = $$('[data-project-card]');
  if(projectCards.length) {
    const search = $('#project-search'), group = $('#project-group'), pages = $('#project-pagination');
    const params = new URLSearchParams(location.search || read('mt-project-query') || '');
    search.value = params.get('suche') || ''; group.value = params.get('bereich') || '';
    let number = Math.max(1,Number(params.get('seite')) || 1);
    const size = 6;
    const data = new Map($$('#projDaten article').map(article => [article.dataset.proj,article.textContent]));
    function render(scroll = false) {
      const words = normalize(search.value.trim()).split(/\s+/).filter(Boolean);
      const found = projectCards.filter(card => (!group.value || group.value === card.dataset.group) && words.every(word => normalize(card.textContent+' '+(data.get(card.dataset.projectCard)||'')).includes(word)));
      const total = Math.max(1,Math.ceil(found.length/size));
      number = Math.min(number,total);
      projectCards.forEach(card => { card.hidden = true; });
      found.slice((number-1)*size,number*size).forEach(card => { card.hidden = false; });
      $('#project-count').textContent = `${found.length} ${found.length===1?'Projekt':'Projekte'}${found.length ? ` · Seite ${number} von ${total}` : ''}`;
      $('#project-empty').hidden = found.length > 0;
      pages.replaceChildren();
      for(let index=1;index<=total && total>1;index++) {
        const button = document.createElement('button'); button.type='button'; button.textContent=String(index); button.setAttribute('aria-label',`Projektseite ${index}`);
        if(index===number) button.setAttribute('aria-current','page');
        button.addEventListener('click', () => { number=index; render(true); const current=$('[aria-current]',pages); if(current)current.focus({preventScroll:true}); }); pages.append(button);
      }
      const state = new URLSearchParams();
      if(search.value) state.set('suche',search.value);
      if(group.value) state.set('bereich',group.value);
      if(number>1) state.set('seite',number);
      if(!storageWorks) state.set('mt',root.dataset.theme);
      const query = state.toString() ? '?'+state.toString() : '';
      history.replaceState(null,'',location.pathname+query);
      save('mt-project-query',query);
      if(scroll) window.scrollTo({top:0,behavior:'instant'});
    }
    search.addEventListener('input', () => { number=1;render(); });
    group.addEventListener('change', () => { number=1;render(); });
    $('#project-reset').addEventListener('click', () => { search.value='';group.value='';number=1;render();search.focus(); });
    projectCards.forEach(card => card.addEventListener('click', () => { save('mt-project-scroll',String(window.scrollY)); }));
    render();
    if(document.referrer.includes('/projekt.html')) requestAnimationFrame(() => { window.scrollTo({top:Number(read('mt-project-scroll'))||0,behavior:'instant'}); });
  }

  function setupDialog(dialog) {
    $$('[data-close]',dialog).forEach(button => button.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('click', event => {
      if(event.target!==dialog) return;
      const rect=dialog.getBoundingClientRect();
      if(event.clientX<rect.left || event.clientX>rect.right || event.clientY<rect.top || event.clientY>rect.bottom) dialog.close();
    });
  }
  $$('dialog').forEach(setupDialog);

  // Ein vollständiges Projekt auf seiner eigenen Detailseite.
  if(pageName==='Projekt') {
    const id=new URLSearchParams(location.search).get('id');
    const article=$$('#projDaten article').find(entry => entry.dataset.proj===id);
    $('#back-projects').href='projekte.html'+(read('mt-project-query')||'');
    if(!article) { $('#project-detail').hidden=true; $('#project-not-found').hidden=false; }
    else {
      const ds=article.dataset;
      const title=$('h3',article).textContent;
      document.title=title+' · MikaTec';
      $('#detail-title').textContent=title; $('#detail-sub').textContent=ds.sub; $('#detail-status').textContent=ds.status;
      $('#detail-icon').src=ds.icon;
      $('#detail-description').textContent=$('p',article).textContent;
      $('#detail-points').replaceChildren(...$$('.pd-punkte li',article).map(item=>item.cloneNode(true)));
      const tech=$$('.pd-technik li',article);
      $('#detail-tech-title').hidden=!tech.length;
      tech.forEach(item=>{const span=document.createElement('span');span.className='tech';span.textContent=item.textContent;$('#detail-tech').append(span);});
      if(ds.live) {const link=$('#detail-live');link.hidden=false;link.href=ds.live;const external=/^https?:/.test(ds.live);link.textContent=external?'Webseite öffnen ↗':'Ausführliche Projektbeschreibung →';if(external){link.target='_blank';link.rel='noopener';}}
      let index=0;
      const parse = value => value ? JSON.parse(value) : [];
      const captions=parse(ds.caps);
      const images=()=>root.dataset.theme==='dark' ? parse(ds.bilderDunkel || ds.bilderLight).concat(ds.bilderDunkel || ds.bilderLight ? [] : [ds.bildDark || ds.bild || ds.bildLight].filter(Boolean)) : parse(ds.bilderLight || ds.bilderDunkel).concat(ds.bilderLight || ds.bilderDunkel ? [] : [ds.bildLight || ds.bild || ds.bildDark].filter(Boolean));
      const dialog=$('#project-image-dialog');
      function showImage() {
        const list=images();index=Math.min(index,Math.max(0,list.length-1));
        $('#detail-zoom').hidden=!list.length;$('#detail-no-image').hidden=!!list.length;$('.gallery-controls').hidden=!list.length;
        if(!list.length)return;
        const caption=title+(captions[index]?' · '+captions[index]:'');
        $('#detail-image').src=list[index];$('#detail-image').alt=caption;
        $('#gallery-caption').textContent=`${index+1} / ${list.length}${captions[index]?' · '+captions[index]:''}`;
        $('#gallery-prev').disabled=index===0;$('#gallery-next').disabled=index===list.length-1;
        if(dialog.open){$('#project-large-image').src=list[index];$('#project-large-image').alt=caption;$('#project-large-caption').textContent=caption;}
      }
      $('#gallery-prev').addEventListener('click',()=>{index--;showImage();});
      $('#gallery-next').addEventListener('click',()=>{index++;showImage();});
      $('#detail-zoom').addEventListener('click',()=>{const img=$('#detail-image');$('#project-large-image').src=img.src;$('#project-large-image').alt=img.alt;$('#project-large-caption').textContent=img.alt;dialog.showModal();});
      dialog.addEventListener('keydown',event=>{const list=images();if(event.key==='ArrowLeft'&&index>0){event.preventDefault();index--;showImage();}if(event.key==='ArrowRight'&&index<list.length-1){event.preventDefault();index++;showImage();}});
      document.addEventListener('themechange',showImage);showImage();
    }
  }

  // Vorhandene ausführliche Fallstudien behalten sämtliche Bilder, kompakt als Galerie.
  if(pageName==='AKA-Haus' || pageName==='AKA-Recht') {
    const shots=$$('#panel-einblick .shot');
    if(shots.length) {
      let selected=0;const parent=shots[0].parentElement;
      parent.style.display='block';
      const controls=document.createElement('div');controls.className='gallery-controls';
      const prev=document.createElement('button'),next=document.createElement('button'),caption=document.createElement('span');
      prev.type=next.type='button';prev.textContent='←';next.textContent='→';prev.setAttribute('aria-label','Vorheriges Bild');next.setAttribute('aria-label','Nächstes Bild');
      controls.append(prev,caption,next);parent.after(controls);
      function render(){shots.forEach((shot,index)=>{shot.hidden=index!==selected;});caption.textContent=`${selected+1} / ${shots.length} · ${$('.t',shots[selected]).textContent}`;prev.disabled=selected===0;next.disabled=selected===shots.length-1;}
      prev.addEventListener('click',()=>{selected--;render();});next.addEventListener('click',()=>{selected++;render();});render();
      const dialog=document.createElement('dialog');dialog.className='image-dialog';dialog.setAttribute('aria-label','Projektbild vergrößert');
      const close=document.createElement('button');close.type='button';close.textContent='×';close.setAttribute('aria-label','Bildansicht schließen');close.dataset.close='';
      const large=document.createElement('img');large.alt='';dialog.append(close,large);document.body.append(dialog);setupDialog(dialog);
      shots.forEach(shot=>{const img=$('img',shot);img.style.maxHeight='400px';img.style.objectFit='contain';const button=document.createElement('button');button.className='detail-image-button';button.type='button';button.setAttribute('aria-label',img.alt+' vergrößern');img.replaceWith(button);button.append(img);button.addEventListener('click',()=>{large.src=img.src;large.alt=img.alt;dialog.showModal();});});
      document.addEventListener('themechange',()=>{if(dialog.open){const img=$('img',shots[selected]);large.src=img.src;large.alt=img.alt;}});
    }
  }

  // Nativer POST an den vorhandenen Versanddienst, auch ohne JavaScript nutzbar.
  const form=$('[data-contact-form]');
  if(form) {
    const inquiryType=$('#f-art',form);
    const requestedType=new URLSearchParams(location.search).get('anliegen');
    const requestedOption=[...inquiryType.options].find(option=>option.dataset.inquiry===requestedType);
    if(requestedOption) inquiryType.value=requestedOption.value;
    const submit=$('button[type="submit"]',form),submitLabel=$('[data-submit-label]',form);
    const feedback=$('.form-feedback',form);
    let submitting=false;
    const resetSubmission=()=>{
      submitting=false;submit.disabled=false;submitLabel.textContent='Anfrage senden';
      form.removeAttribute('aria-busy');
      if(feedback.dataset.state==='pending'){feedback.hidden=true;feedback.textContent='';}
    };
    ['#f-name','#f-msg'].forEach(selector=>{
      const field=$(selector,form);
      field.addEventListener('input',()=>field.setCustomValidity(''));
    });
    form.addEventListener('submit',event=>{
      if(submitting){event.preventDefault();return;}
      ['#f-name','#f-email','#f-phone','#f-msg'].forEach(selector=>{
        const field=$(selector,form);field.value=field.value.trim();
      });
      $('#f-name',form).setCustomValidity($('#f-name',form).value?'':'Bitte geben Sie Ihren Namen ein.');
      $('#f-msg',form).setCustomValidity($('#f-msg',form).value?'':'Bitte schreiben Sie eine Nachricht.');
      if(!form.reportValidity()){event.preventDefault();return;}
      const next=new URL('https://mika-tec.com/kontakt.html?versand=angenommen#anfrage');
      next.searchParams.set('mt',root.dataset.theme);
      $('[name="_next"]',form).value=next.href;
      $('[name="_subject"]',form).value='MikaTec: '+inquiryType.selectedOptions[0].textContent.trim();
      submitting=true;submit.disabled=true;submitLabel.textContent='Weiter zum Versand …';
      form.setAttribute('aria-busy','true');
      feedback.dataset.state='pending';feedback.textContent='Die Anfrage wird an FormSubmit übergeben. Bitte schließen Sie dort gegebenenfalls die Sicherheitsprüfung ab.';feedback.hidden=false;
    });
    // Beim Zurückkehren mit der Browser-Zurück-Taste erneut senden ermöglichen.
    window.addEventListener('pageshow',resetSubmission);
    if(new URLSearchParams(location.search).get('versand')==='angenommen') {
      feedback.dataset.state='accepted';
      feedback.textContent='Vielen Dank für Ihre Anfrage. Der Versanddienst hat sie angenommen. Ich melde mich persönlich bei Ihnen.';
      feedback.hidden=false;
      $('#tab-anfrage').click();
      feedback.focus({preventScroll:true});feedback.scrollIntoView({block:'nearest'});
      const clean=new URL(location.href);clean.searchParams.delete('versand');
      history.replaceState(null,'',clean);
    }
  }

  const categories=$$('[data-category]');
  if(categories.length) {
    const dialog=$('#category-dialog'),search=$('#category-search');
    categories.forEach(card=>card.addEventListener('click',()=>{const title=$('h3',card).cloneNode(true);$$('br',title).forEach(br=>br.replaceWith(' '));$('#category-dialog-title').textContent=title.textContent;$('#category-content').replaceChildren($('#category-'+card.dataset.category).content.cloneNode(true));dialog.showModal();}));
    function filter(){const words=normalize(search.value.trim()).split(/\s+/).filter(Boolean);let count=0;categories.forEach(card=>{const visible=words.every(word=>normalize(card.textContent+' '+card.dataset.tags).includes(word));card.hidden=!visible;if(visible)count++;});$('#search-count').textContent=`${count} ${count===1?'Bereich':'Bereiche'}`;$('#empty-state').hidden=count>0;}
    search.addEventListener('input',filter);$('#reset-search').addEventListener('click',()=>{search.value='';filter();search.focus();});
  }
  // Bestehende Reichweitenmessung nur auf der veröffentlichten Domain laden.
  if (['mika-tec.com','www.mika-tec.com'].includes(location.hostname)) {
    const analytics=document.createElement('script');
    analytics.dataset.goatcounter='https://mikatec.goatcounter.com/count';
    analytics.src='https://gc.zgo.at/count.js';
    analytics.async=true;
    document.body.append(analytics);
  }
})();
