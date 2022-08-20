export function scaleElement(el){

    const curWidth = el.offsetWidth;
    const curHeight = el.offsetHeight;
    let multFactor = Math.min(((vh() * 0.9) / curHeight), ((vw() * 0.9) / curWidth));
    if(multFactor > 1) multFactor = 1;
    el.style.transform = `scale(${multFactor})`
    return multFactor;
}

export function formatMessage(message){
    let words = message.split(/ +/);
    let newWords = words.map(word => {
        if(word.length > 18){
            let parts = [];
            for(let i = 0; i < Math.floor(word.length / 18); i++){
                parts.push(word.slice(18*i, 18*(i+1)));
            }
            if(word.length % 18 > 0){
                parts.push(word.slice(Math.floor(word.length / 18) * 18));
            }
            return parts.join('\n');
        }else{
            return word;
        }
    })
    return newWords.join(' ');
}

function vh() {
    return Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
}
  
function vw() {
    return Math.max(document.documentElement.clientWidth, window.innerWidth || 0);
}
  
function vmin(v) {
    return Math.min(vh(), vw());
}
  
function vmax(v) {
    return Math.max(vh(), vw());
}