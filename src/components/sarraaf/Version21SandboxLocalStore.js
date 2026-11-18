let tenant='anonymous';
export function setSandboxUiTenant(id){tenant=String(id||'anonymous').replace(/[^a-zA-Z0-9_-]/g,'_');}
const key=()=> 'hisab_sarraf_v21_sandbox_ui_state_v1_'+tenant;
export async function loadVersion21LocalState(){try{return JSON.parse(localStorage.getItem(key())||'{}')||{};}catch{return {};}}
export async function saveVersion21LocalState(value){try{localStorage.setItem(key(),JSON.stringify(value||{}));}catch{}}
