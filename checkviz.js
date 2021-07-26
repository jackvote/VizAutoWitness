// --------- Настройки программы -----------------

// необходимые библиотеки устанавливаются через npm
const viz = require("viz-js-lib")
const VIZNODE = "ws://192.168.1.245:8191" // public node
viz.config.set('websocket', VIZNODE)

// --------- Настройки скрпипта -----------------

var wif="5Qwerty..."
var owner="retroscope"
var urlon="https://control.viz.world/witnesses/"  // урл/текст при активации делегата
var urloff="Disable via js"                     // урл/текст при деактивации делегата
var keyon="VIZ5m14X9UrUkZUM67A546ak6CezBKce3TbYrMJQFXqGKDSmQNN9B" // публичный ключ

var keyoff="VIZ1111111111111111111111111111111114T1Anm" // ключ деактивации
var missed=0 // для теста установить меньше реально пропущенных блоков, 0 - для нормального запуска
var disable=false // если нода остановлена - true для запуска
var timeout=28*1000 // период проверки работоспособности
var timewait=10*60*1000 // время ожидания восстановления работоспособности

console.log("Start")

function checkMissed() {
    viz.api.getWitnessByAccount(owner,function(err,result){
        if (err) {
            console.log(err)
            return
        }
        if (result.signing_key==keyoff) { // отключена ли нода
            disable=true
        } else {
            disable=false
        }
        if (missed==0) { // начальная инициализация счётчика при запуске скрипта
            missed=result.total_missed
            console.log(Date(), "Set current:", missed)
            return
        }
        if (result.total_missed>missed && disable!=true) { // если счётчик увеличился, а нода не отключена
            missed=result.total_missed
            setkey(false) // отключаем
            disable=true
            return
        }
        if (result.total_missed>missed && disable) { // если счётчик увеличился, а нода отключена
            missed=result.total_missed
            console.log(Date(), "Disable now:", missed)
            return
        }
        if (missed==result.total_missed && disable) { // если счётчик не изменился с момента проверки
            setkey(true) // включаем
            disable=false
            return
        }
    });
}

function setkey(action) {
  try {
    let key=keyoff
    let url=urloff
    if (action) {
        key=keyon
        url=urlon
        func="Enable"
    } else {
        func="Disable"
    }
    viz.broadcast.witnessUpdate(wif,owner,url,key,function(err,result){
        if (err) {
            console.log(err)
            return
        }
        console.log(Date(), owner, func+" witness:", missed)
    });
  } catch (err) {
    console.log("SetKey >>>", e.name)
  }
}

/// Основной цикл
const startCheck = () => {

    timerCheckOff = setInterval(()=>{
        if (!disable) {
            checkMissed()
        }
    }, timeout) // 30 sec

    timerCheckOn = setInterval(()=>{
        if (disable) {
            checkMissed()
        }
    }, timewait) // 10 min

}

const startBot = () => {
    checkMissed()
    startCheck()
}

startBot() // запуск скрипта
