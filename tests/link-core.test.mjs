import assert from 'node:assert/strict';
import { LinkStore, normalizedUrl, cleanFields, SETTINGS, ITEM_PREFIX } from '../link-core.mjs';

class FakeEvent {
  constructor(){this.callbacks=new Set();}
  addListener(fn){this.callbacks.add(fn)}
  removeListener(fn){this.callbacks.delete(fn)}
  emit(changes,area){for(const fn of this.callbacks)queueMicrotask(()=>fn(changes,area));}
}
class FakeArea {
  constructor(name,remote,ev){this.name=name;this.remote=remote;this.ev=ev;this.data={};this.fail=false;}
  async get(keys){
    if(this.fail)throw Error('simulated network failure');
    if(keys===null)return structuredClone(this.data);
    if(typeof keys==='string')return {[keys]:structuredClone(this.data[keys])};
    if(Array.isArray(keys))return Object.fromEntries(keys.map(k=>[k,structuredClone(this.data[k])]));
    return Object.fromEntries(Object.entries(keys).map(([key,def])=>[key,structuredClone(this.data[key]??def)]));
  }
  async set(values){
    if(this.fail)throw Error('simulated network failure');
    const changes={};
    for(const [k,val] of Object.entries(values)){
      changes[k]={oldValue:this.data[k],newValue:structuredClone(val)};
      this.data[k]=structuredClone(val);
    }
    for(const ev of this.remote)this.ev === ev && this.name==='local' ? ev.emit(changes,this.name) : ev.emit(changes,this.name);
  }
}
const cloudEvent = new FakeEvent();
const cloud = new FakeArea('sync',[cloudEvent],cloudEvent);
function makeApi(legacy=[]){
  const ev=new FakeEvent();
  const local=new FakeArea('local',[ev],ev);
  if(legacy.length)local.data.links=legacy;
  const sync={
    get(...args){return cloud.get(...args)},
    set(...args){return cloud.set(...args)}
  };
  cloudEvent.addListener((changes,area)=>ev.emit(changes,area));
  return {storage:{local,sync,onChanged:ev}};
}
async function settle(...stores){
  // Let microtasks and event-driven queued writes flush, then read queues.
  for(let i=0;i<8;i++){
    await Promise.resolve();
    for(const s of stores)await s.queue;
  }
}

assert.equal(normalizedUrl('intranet.local:8080/zabbix'),'https://intranet.local:8080/zabbix');
assert.equal(normalizedUrl('http://172.16.0.1:8080/'),'http://172.16.0.1:8080/');
assert.throws(()=>normalizedUrl('javascript:alert(1)'));
assert.throws(()=>normalizedUrl('data:text/html,abc'));
assert.throws(()=>normalizedUrl('ftp://example.com'));
assert.throws(()=>normalizedUrl('https://foo bar.com'));
assert.throws(()=>normalizedUrl('https://user:password@example.com/'));
assert.equal(cleanFields({title:' Hi ',url:'site.test'}).category,'سایر لینک‌ها');

const aApi=makeApi([{id:'123',title:'Legacy A',url:'legacy.test',category:'پیشین'}]);
const bApi=makeApi();
const a=new LinkStore(aApi),b=new LinkStore(bApi);
await a.init();await b.init();
assert.equal(a.snapshot().length,1);
assert.equal(aApi.storage.local.data.links[0].title,'Legacy A');
assert.equal(cloud.data[Object.keys(cloud.data)[0]],undefined);
await a.toggleSync(true);
await settle(a,b);
assert.equal(Object.keys(cloud.data).length,1);
await b.toggleSync(true);
await settle(a,b);
assert.equal(b.snapshot().length,1);
await b.add({title:'Zabbix',url:'https://monitoring.test',category:'نظارت'});
await settle(a,b);
assert.equal(a.snapshot().length,2);
const bz=b.snapshot().find(x=>x.title==='Zabbix');
assert.ok(bz);
await a.edit(bz.id,{title:'Zabbix 7',url:'https://monitoring.test/',category:'مانیتورینگ'});
await settle(a,b);
assert.equal(b.snapshot().find(x=>x.id===bz.id).title,'Zabbix 7');
await b.remove(bz.id);
await settle(a,b);
assert.equal(a.snapshot().length,1);
assert.equal(b.snapshot().length,1);
assert.equal(cloud.data[ITEM_PREFIX+bz.id].deleted,true);
await a.toggleSync(false);
await a.add({title:'Offline',url:'offline.local:8085'});
await settle(a,b);
assert.equal(b.snapshot().length,1);
await a.toggleSync(true);
await settle(a,b);
assert.equal(b.snapshot().length,2);
assert.equal(a.exportData().links.length,2);
const imported=await b.importData({links:[
  {title:'Already',url:'https://offline.local:8085/'},
  {title:'Imported',url:'http://192.168.1.1:8080'},
  {title:'Bad',url:'javascript:alert(1)'}
]});
await settle(a,b);
assert.deepEqual(imported,{added:1,skipped:2});
assert.equal(a.snapshot().length,3);
await assert.rejects(a.add({title:'Duplicate',url:'http://192.168.1.1:8080/'}),/قبلاً/);
await b.toggleSync(false);
await b.edit(a.snapshot().find(x=>x.title==='Offline').id,{title:'Edited while sync disabled',url:'offline.local:8085',category:'Work'});
await settle(a,b);
assert.notEqual(a.snapshot().find(x=>x.url==='https://offline.local:8085/').title,'Edited while sync disabled');
await b.toggleSync(true);
await settle(a,b);
assert.equal(a.snapshot().find(x=>x.url==='https://offline.local:8085/').title,'Edited while sync disabled');
const cApi=makeApi(); cApi.storage.sync.get=async()=>{throw Error('Simulated Chrome Sync failure')}; cApi.storage.sync.set=async()=>{throw Error('Simulated Chrome Sync failure')};
const c=new LinkStore(cApi);
await c.init();await c.toggleSync(true);
assert.ok(c.status().error.includes('Simulated'));
await c.add({title:'Local survives outage',url:'fallback.local'});
assert.equal(c.snapshot().length,1);
assert.ok(c.status().error);

// Same-ID record comparison and tombstone remain stable.
assert.equal(cloud.data[ITEM_PREFIX+bz.id].deleted,true);
console.log('PASS: URL validation, legacy migration, cross-device add/edit/delete, tombstones, offline edits, JSON import/export, duplicate control, sync failure fallback');


// v1.3: first reorder migrates only this category, with IDs and URLs intact.
const cat = 'Ordered test group';
for (const [title, url] of [['Gamma','https://gamma.example'], ['Alpha','https://alpha.example'], ['Beta','https://beta.example']]) {
  await a.add({title,url,category:cat});
}
await settle(a,b);
const titles = store => store.snapshot().filter(link => link.category === cat).map(link => link.title);
const record = title => a.snapshot().find(link => link.category === cat && link.title === title);
assert.deepEqual(titles(a), ['Alpha','Beta','Gamma']);
const ids = Object.fromEntries(['Alpha','Beta','Gamma'].map(title=>[title,record(title).id]));
assert.equal(await a.moveWithinCategory(cat,ids.Gamma,ids.Alpha,false),true);
await settle(a,b);
assert.deepEqual(titles(a),['Gamma','Alpha','Beta']);
assert.deepEqual(titles(b),titles(a));
const firstRanks = a.snapshot().filter(link=>link.category===cat);
assert.ok(firstRanks.every(link=>Number.isFinite(link.position)));
assert.deepEqual(Object.fromEntries(firstRanks.map(x=>[x.title,x.id])),ids);

// Subsequent moves edit only one record, avoiding a full-category rewrite.
const beforeMove = new Map(firstRanks.map(link=>[link.id,link.updatedAt]));
assert.equal(await a.moveWithinCategory(cat,ids.Beta,ids.Gamma,false),true);
await settle(a,b);
assert.deepEqual(titles(a), ['Beta','Gamma','Alpha']);
assert.deepEqual(titles(b),titles(a));
assert.ok(a.records.get(ids.Beta).updatedAt > beforeMove.get(ids.Beta));
assert.equal(a.records.get(ids.Gamma).updatedAt,beforeMove.get(ids.Gamma));
assert.equal(a.records.get(ids.Alpha).updatedAt,beforeMove.get(ids.Alpha));
assert.equal(await a.moveWithinCategory(cat,ids.Beta,ids.Gamma,false),false); // no-op
await assert.rejects(a.moveWithinCategory(cat,ids.Beta,bz.id,false),/پیدا نشد/);

// Edits retain position; additional records in an ordered category append.
await a.edit(ids.Gamma,{title:'Gamma renamed',url:'https://gamma.example',category:cat});
await settle(a,b);
assert.deepEqual(titles(b),['Beta','Gamma renamed','Alpha']);
await b.add({title:'A-new',url:'https://another.example',category:cat});
await settle(a,b);
assert.deepEqual(titles(a),['Beta','Gamma renamed','Alpha','A-new']);

// Offline reorder survives reconciliation once Chrome Sync is reenabled.
await b.toggleSync(false);
await b.moveWithinCategory(cat,ids.Alpha,ids.Beta,false);
await settle(a,b);
assert.notDeepEqual(titles(a),titles(b));
await b.toggleSync(true);
await settle(a,b);
assert.deepEqual(titles(a),titles(b));
assert.deepEqual(titles(a),['Alpha','Beta','Gamma renamed','A-new']);

// A JSON backup carries the visible order to a fresh (offline) installation.
const backup=a.exportData();
const fresh=new LinkStore(makeApi());
await fresh.init();
const recovered=await fresh.importData(backup);
assert.equal(recovered.skipped,0);
assert.deepEqual(titles(fresh), titles(a));
assert.deepEqual(new Set(fresh.snapshot().map(x=>x.url)),new Set(a.snapshot().map(x=>x.url)));

// Separate categories maintain their own ordering; moving a record between
// categories does not disturb other category records or the old category.
const otherCat='Other ordered group';
await a.add({title:'One',url:'https://one.example',category:otherCat});
await a.add({title:'Two',url:'https://two.example',category:otherCat});
await settle(a,b);
const one=a.snapshot().find(x=>x.title==='One');
const two=a.snapshot().find(x=>x.title==='Two');
await a.moveWithinCategory(otherCat,two.id,one.id,false);
await settle(a,b);
assert.deepEqual(a.snapshot().filter(x=>x.category===otherCat).map(x=>x.title),['Two','One']);
await a.edit(ids.Alpha,{title:'Alpha',url:'https://alpha.example',category:otherCat});
await settle(a,b);
assert.deepEqual(a.snapshot().filter(x=>x.category===otherCat).map(x=>x.title),['Two','One','Alpha']);
assert.deepEqual(titles(a),['Beta','Gamma renamed','A-new']);
assert.deepEqual(titles(a),titles(b));

fresh.destroy();a.destroy();b.destroy();c.destroy();
console.log('PASS: category-scoped drag order, sparse updates, sync/offline convergence, add/edit, backup restore');
