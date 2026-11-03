/* ---------------------------------------------------------
   1. 요소 선택  
   --------------------------------------------------------- */
const form = document.querySelector('.todo-form');
const input = document.querySelector('.todo-input');
const list = document.querySelector('.todo-list');
const emptyMsg = document.querySelector('.empty-msg');
const countText = document.querySelector('.todo-count');
const clearBtn = document.querySelector('.clear-btn');
const nowTime = document.querySelector('.now-time');
const dueInput = document.querySelector('.todo-due-input')


// 2. 상수 생성
const STORAGE_KEY = 'todo-list-v2';
const HOUR = 60 * 60 * 1000;
const SAFE_HOURS = 24;
const URGENT_HOUR = 5;


// 3. 저장하기 / 불러오기
function saveTodos() {
   localStorage.setItem(STORAGE_KEY, JSON.stringify(todos))
}

function loadTodos() {
   const saved = localStorage.getItem(STORAGE_KEY);
   if (saved === null) {
      return [];
   }

   try {
      const data = JSON.parse(saved);
      return Array.isArray(data) ? data : [];
   } catch (error) {
      return [];
   }
}

/* ---------------------------------------------------------
   4. 데이터: 할 일 목록을 '배열'에 저장한다.
      배열 안의 각 항목은 { text: 글자, done: 완료 여부 } 객체이다.
      핵심: 화면(HTML)이 아니라 이 배열이 '진짜 데이터'이다.
   --------------------------------------------------------- */
// let todos = [
//   { text: 'HTML 복습하기', done: true },
//   { text: '자바스크립트 배열 공부하기', done: false },
//   { text: 'To-do List 직접 만들어 보기', done: false }
// ];

let todos = loadTodos();

/* ---------------------------------------------------------
   3. 화면 그리기 함수 render()
      배열(todos)의 내용을 보고 목록 화면을 처음부터 다시 만든다.
      데이터가 바뀔 때마다 이 함수를 호출하면 화면이 항상 데이터와 같아진다.
   --------------------------------------------------------- */
function render() {
  // (1) 기존 목록을 모두 비운다. (비우지 않으면 항목이 중복해서 쌓인다.)
   list.innerHTML = "";
  
  // (2) 배열의 항목을 하나씩 꺼내 li 요소를 만든다.
  //     todo = 배열의 각 항목(객체), index = 그 항목의 순번(0, 1, 2 ...)
   todos.forEach((todo, index) => {
      const li = document.createElement('li');
      li.classList.add('todo-item')
      if (todo.done) {
         li.classList.add('done'); // 완료된 항목은 취소선 스타일 설정
      }

      // 남은 시간에 따라 li에 safe, urgent, orverdue
      const status = getStatus(todo);
      if (status !== 'none') {
         li.classList.add(status)
      }

      //체크박스 만들기
      const check = document.createElement('input');
      check.type = 'checkbox';
      check.checked = todo.done
      check.addEventListener('change', () => {
         todos[index].done = check.checked;
         saveTodos();
         render();
      })
     // 글자 만들기
      const span = document.createElement('span');
      span.classList.add('todo-text');
      span.textContent = todo.text;

      // 날짜 글자와 마감 정보를 세로로 묶을 상자
      const body = document.createElement('div');
      body.classList.add('todo-body')
      body.appendChild(span)

      // 완료 일시가 있는 항목에만 마감 안내 줄을 만든다
      if (todo.due) {
         const dueLine = document.createElement('span');
         dueLine.classList.add('todo-due');

         let info = formatDue(todo.due);

         if (!todo.done) {
            const remaining = getRemaining(todo);
            info += ' . ' + (remaining < 0 ? '기한이 지났습니다.' : formatremaing(remaining))
         }

         // 5시간 이내 일때만 깜빡이는 아이콘 추가
         if (status === 'urgent') {
            const icon = document.createElement('span')
            icon.classList.add('blink-icon');
            icon.textContent = '😐';
            dueLine.appendChild(icon); 
         }

         const infoText = document.createElement('span')
         infoText.textContent = info;
         dueLine.appendChild(infoText);

         body.appendChild(dueLine)
      }

      // 삭제 버튼 만들기
      const delBtn = document.createElement('button')
      delBtn.classList.add('del-btn')
      delBtn.type = 'button'; 
      delBtn.textContent = '삭제';
      delBtn.addEventListener('click', () => {
         todos.splice(index, 1) // 배열에서 index 위치부터 1개 삭제
         saveTodos();
         render();
      })
      // li 안에 자식 요소를 차례대로 넣고, 
      li.appendChild(check);
      li.appendChild(body);
      li.appendChild(delBtn);

      // 완성된 li를 ul에 붙인다.
      list.appendChild(li); 
  });


  // (3) 목록 아래의 '남은 할 일' 개수와 안내 문구를 갱신한다.
  const remaining = todos.filter((todo) => todo.done === false).length;
  countText.textContent = '남은 할 일' + remaining + '개'

  if (todos.length === 0 ) {
   emptyMsg.classList.add('show');
  } else {
   emptyMsg.classList.remove('show')
  }
}


/* ---------------------------------------------------------
   4. 할 일 추가 — form 의 submit 이벤트
      Enter 키를 누르거나 '추가' 버튼을 누르면 submit 이 발생한다.
      submit 의 기본 동작은 '페이지 새로고침'이므로
      preventDefault() 로 막아야 우리가 만든 코드가 실행된다.
   --------------------------------------------------------- */
form.addEventListener('submit', (event) => {
   event.preventDefault(); // 새로고침 막기

   //앞 뒤 공백 제거
   const text = input.value.trim();

   // 빈칸이면 추가하지 않고 입력창으로 돌아가기
   if (text === '') {
      input.focus();
      return;
   }
   // 배열 맨 뒤에 새 항목으로 추가하기
   todos.push({text : text, done : false, due : dueInput.value});

   dueInput.value = '';
   input.value = '';
   input.focus();
   saveTodos();
   render();
})

// 날짜 추가
function formatDue(due) {
   const d = new Date(due);
   const month = d.getMonth() + 1;
   const hours = String(d.getHours()).padStart(2, '0');
   const minute = String(d.getMinutes()).padStart(2, '0');
   return month + '/' + d.getDate() + " " + hours + ":" + minute;
}

// 현재 시간부터 완료 일시까지 남은 시간 계산(밀리초)
function getRemaining(todo) {
   return new Date(todo.due).getTime() - Date.now();
}

// 남은 밀리초 계산
function formatremaing(remaining) {
   const totalMinutes = Math.floor(remaining / 60000);
   const days = Math.floor(totalMinutes / (60 * 24));
   const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
   const minutes = totalMinutes % 60;
   
   if (days > 0) {
      return days + '일' + hours + '시간남음 ';
   }
   if (hours > 0) {
      return hours + '시간' + minutes + '분 남음';
   }
   return minutes + '분 남음';
}

// 할 일의 남은 시간에 따라 글자 색 지정
function getStatus(todo) {
   if (todo.done || !todo.due) {
      return 'none';
   }

   const remaining = getRemaining(todo);
   if (remaining < 0) {
      return 'overdue';
   }
   if (remaining <= URGENT_HOUR * HOUR) {
      return 'urgent';
   }
   if (remaining <= SAFE_HOURS * HOUR) {
      return 'safe';
   }
   return 'none';
}

/* ---------------------------------------------------------
   5. 완료 항목 삭제
      filter(): 조건을 만족하는 항목만 모아 '새 배열'을 만든다.
      done 이 false 인(= 아직 안 끝난) 항목만 남기면 완료 항목이 사라진다.
   --------------------------------------------------------- */
clearBtn.addEventListener('click', () => {
   todos = todos.filter((todo) => todo.done === false)
   saveTodos();
   render();
})

/* ---------------------------------------------------------
   7. 현재 시간 표시
   --------------------------------------------------------- */
const DAYS = ["일", "월", "화", "수", "목", "금", "토"]
function showNow(){
   const d = new Date();
   const hour = String(d.getHours()).padStart(2, "0");
   const min = String(d.getMinutes()).padStart(2, "0");
   const sec = String(d.getSeconds()).padStart(2, "0");

   nowTime.innerHTML = d.getFullYear() + "년 " + (d.getMonth()+1) + "월 " + d.getDate() + "일(" + DAYS[d.getDay()] + ") " +
                     '<span class="clock">' + hour + ":" + min + ":" + sec + '</span>';


   setInterval(showNow, 1000)
}

setInterval(render, 1000); 

/* ---------------------------------------------------------
   6. 페이지를 열자마자 처음 한 번 그린다.
   --------------------------------------------------------- */

showNow();
render();