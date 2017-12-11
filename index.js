'use strict';

const socket = new WebSocket("ws://switch.darkshark.pro");
const container = document.getElementById('messages');
let switches = [true, null, null, null];
let checkCount = 1;
let firstItemState = true;

const reverseBoolArray = (arr) => {
  return arr.map(item => !item);
}

socket.onopen = () => container.innerHTML += "<br>Соединение установлено.";

socket.onclose = (event) => {
  container.innerHTML += (event.wasClean) ? '<br>Соединение закрыто чисто' : '<br>Обрыв соединения';
  container.innerHTML += '<br>Код: ' + event.code + ' причина: ' + event.reason;
};

socket.onmessage = ({ data }) => {
  const json = JSON.parse(data);
  container.innerHTML += "<br>Получены данные " + data;

  if (json.stateId && ('pulled' in json) && (checkCount < 4)) {
    if (json.pulled < checkCount) {
      switches[json.pulled] = !switches[json.pulled];
    }
    socket.send(JSON.stringify({
      action: "check",
      "lever1": 0,
      "lever2": checkCount,
      stateId: json.stateId,
    }));
    checkCount++;
  }
  else if (json.action) {
      switches[json.lever2] = json.same ? switches[0] :!switches[0];
  }
  else if (json.pulled < checkCount) {
    switches[json.pulled] = !switches[json.pulled];
  }
  else if (json.newState === "poweredOff") {
    socket.close();
  } else if (json.newState === "poweredOn") {
    switches = reverseBoolArray(switches);
  }

  if (!json.newState){
    if (( ('stateId' in json) && switches.every(item => item === firstItemState))) {
      console.log(switches);
      socket.send(JSON.stringify({
        action: "powerOff", 
        stateId: json.stateId,
      }));
    }
  }
  
};

socket.onerror = (error) => container.innerHTML +="<br>Ошибка " + error.message;

