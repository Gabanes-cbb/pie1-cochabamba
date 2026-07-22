const territoryTabs=[...document.querySelectorAll('[role="tab"][data-territory-tab]')];
const territoryPanels=[...document.querySelectorAll('[role="tabpanel"][data-territory-panel]')];

function activateTerritoryTab(tab,moveFocus=false){
  territoryTabs.forEach(item=>{const active=item===tab;item.setAttribute('aria-selected',String(active));item.tabIndex=active?0:-1;});
  territoryPanels.forEach(panel=>{panel.hidden=panel.id!==tab.getAttribute('aria-controls');});
  if(moveFocus)tab.focus();
}

territoryTabs.forEach((tab,index)=>{
  tab.addEventListener('click',()=>activateTerritoryTab(tab));
  tab.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;
    event.preventDefault();let next=index;
    if(event.key==='ArrowRight')next=(index+1)%territoryTabs.length;
    if(event.key==='ArrowLeft')next=(index-1+territoryTabs.length)%territoryTabs.length;
    if(event.key==='Home')next=0;
    if(event.key==='End')next=territoryTabs.length-1;
    activateTerritoryTab(territoryTabs[next],true);
  });
});

document.querySelectorAll('[data-territory-link]').forEach(link=>{
  link.addEventListener('click',()=>{
    const tab=document.getElementById(link.dataset.territoryLink);
    if(tab)activateTerritoryTab(tab);
  });
});
