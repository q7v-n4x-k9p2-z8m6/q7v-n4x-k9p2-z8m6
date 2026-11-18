const KEY='hisab_sarraf_v21_sandbox_ui_state_v1';
export async function loadVersion21LocalState(){try{return JSON.parse(localStorage.getItem(KEY)||'{}')||{};}catch{return {};}}
export async function saveVersion21LocalState(value){try{localStorage.setItem(KEY,JSON.stringify(value||{}));}catch{}}
