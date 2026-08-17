let Count=0
let countEl = document.getElementById("count")
console.log(countEl)
let saveEl = document.getElementById("save-el")
function increment(){
    Count += 1
    countEl.textContent=Count
}

function save(){
    let countStr = Count + " - "
    saveEl.textContent += countStr
    countEl.textContent = 0
    Count = 0
}

