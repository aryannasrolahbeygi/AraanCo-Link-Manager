import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {initializeTabs} from '../tab-navigation.mjs';
import {translate, MESSAGES, DEFAULT_LANGUAGE} from '../i18n.mjs';

function makeUI(dir = 'ltr') {
  const panels = Object.fromEntries(['homePanel','settingsPanel'].map(id => [id, {id, hidden:id === 'settingsPanel'}]));
  const document = {documentElement:{dir},getElementById(id){return panels[id]}};
  const tabs = ['homeTab','settingsTab'].map((id,i) => ({
    id,tabIndex:i===0?0:-1,focused:false,
    attrs:{'aria-controls':i===0?'homePanel':'settingsPanel','aria-selected':i===0?'true':'false'},
    events:{},
    getAttribute(name){return this.attrs[name]},
    setAttribute(name,value){this.attrs[name]=value},
    addEventListener(type,fn){this.events[type]=fn},
    focus(){this.focused=true}
  }));
  const tablist = {ownerDocument:document,querySelectorAll(){return tabs}};
  initializeTabs(tablist);
  function key(index,key) {
    let prevented=false;
    tabs[index].events.keydown({key,preventDefault(){prevented=true}});
    return prevented;
  }
  function selected(){return tabs.find(x=>x.getAttribute('aria-selected')==='true')?.id}
  return {tabs, panels, key, selected};
}

test('Home is default; Settings selection hides Home without changing link data',()=>{
  const ui=makeUI();
  assert.equal(ui.selected(),'homeTab');
  assert.equal(ui.panels.homePanel.hidden,false);
  assert.equal(ui.panels.settingsPanel.hidden,true);
  ui.tabs[1].events.click();
  assert.equal(ui.selected(),'settingsTab');
  assert.equal(ui.tabs[0].tabIndex,-1);
  assert.equal(ui.tabs[1].tabIndex,0);
  assert.equal(ui.panels.homePanel.hidden,true);
  assert.equal(ui.panels.settingsPanel.hidden,false);
  ui.tabs[0].events.click();
  assert.equal(ui.selected(),'homeTab');
});

test('LTR arrow keys, Home/End, and focus control',()=>{
  const ui=makeUI();
  assert.equal(ui.key(0,'ArrowRight'),true);
  assert.equal(ui.selected(),'settingsTab');
  assert.equal(ui.tabs[1].focused,true);
  assert.equal(ui.key(1,'ArrowRight'),true);
  assert.equal(ui.selected(),'homeTab');
  assert.equal(ui.key(0,'End'),true);
  assert.equal(ui.selected(),'settingsTab');
  assert.equal(ui.key(1,'Home'),true);
  assert.equal(ui.selected(),'homeTab');
  assert.equal(ui.key(0,'Enter'),false);
});

test('RTL arrow keys reverse direction',()=>{
  const ui=makeUI('rtl');
  assert.equal(ui.key(0,'ArrowLeft'),true);
  assert.equal(ui.selected(),'settingsTab');
  assert.equal(ui.key(1,'ArrowRight'),true);
  assert.equal(ui.selected(),'homeTab');
});

test('tab structure and controls are located on their respective pages',()=>{
  const html=readFileSync(new URL('../popup.html',import.meta.url),'utf8');
  const home = html.split('id="homePanel"')[1].split('id="settingsPanel"')[0];
  const settings = html.split('id="settingsPanel"')[1].split('</main>')[0];
  for (const id of ['addForm','searchInput','categoriesContainer']) {
    assert.match(home,new RegExp(`id="${id}"`));
    assert.doesNotMatch(settings,new RegExp(`id="${id}"`));
  }
  for (const id of ['syncToggle','retrySyncBtn','exportBtn','importBtn','languageSelect','themeBtn']) {
    assert.match(settings,new RegExp(`id="${id}"`));
    assert.doesNotMatch(home,new RegExp(`id="${id}"`));
  }
  assert.match(html,/id="homeTab"[^>]*role="tab"[^>]*aria-controls="homePanel"/);
  assert.match(html,/id="settingsTab"[^>]*role="tab"[^>]*aria-controls="settingsPanel"/);
});

test('localized navigation labels exist and English remains default',()=>{
  assert.equal(DEFAULT_LANGUAGE,'en');
  for (const lang of ['en','fa']) {
    for (const key of ['homeTab','settingsTab','appearance','themeLabel','navigationLabel']) {
      assert.equal(typeof MESSAGES[lang][key], 'string');
      assert.ok(translate(lang,key).length > 0);
    }
  }
  assert.equal(translate('en','homeTab'),'Home');
  assert.equal(translate('fa','settingsTab'),'تنظیمات');
});

test('version increments while preserving stable extension ID and sync permissions',()=>{
  const current=JSON.parse(readFileSync(new URL('../manifest.json',import.meta.url),'utf8'));
  assert.equal(current.version,'1.4.0');
  assert.deepEqual(current.permissions,['storage','activeTab']);
  assert.ok(current.key.startsWith('MIIBIj'));
});
