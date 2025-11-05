document.addEventListener('DOMContentLoaded', () => {

    // ----- 1. 스크롤 페이드인/아웃 (유지) -----
    const fadeInElements = document.querySelectorAll('.fade-in');
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('visible');
            } else {
                entry.target.classList.remove('visible');
            }
        });
    }, {
        threshold: 0.1
    });
    fadeInElements.forEach(el => observer.observe(el));

    // ----- 2. [삭제] 탭 콘텐츠 높이 보정 로직 (min-height) 삭제됨 -----

    // ----- 3. 3D 카드 로직 (유지) -----
    const cards = document.querySelectorAll('.card-container');
    cards.forEach(card => {
        const cardInner = card.querySelector('.card-inner');
        let isFlipped = false;
        // ... (기존 카드 이벤트 리스너들) ...
        card.addEventListener('mouseenter', () => {
            cardInner.style.transition = 'transform 0.1s ease-out';
        });
        card.addEventListener('mousemove', (e) => {
            if (isFlipped) return;
            const { width, height, left, top } = card.getBoundingClientRect();
            const x = e.clientX - left;
            const y = e.clientY - top;
            const centerX = width / 2;
            const centerY = height / 2;
            const rotateX = ((y - centerY) / centerY) * 15;
            const rotateY = ((x - centerX) / centerX) * -15;
            cardInner.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        });
        card.addEventListener('mouseleave', () => {
            cardInner.style.transition = 'transform 0.5s ease-in-out';
            if (!isFlipped) {
                cardInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
            }
        });
        card.addEventListener('click', () => {
            cardInner.style.transition = 'transform 0.5s ease-in-out';
            isFlipped = !isFlipped;
            if (isFlipped) {
                cardInner.style.transform = 'rotateY(180deg)';
            } else {
                cardInner.style.transform = 'rotateX(0deg) rotateY(0deg)';
            }
        });
    });


// ----- 3. 탭 내비게이션 및 높이 계산 (유지) -----
    const tabs = document.querySelectorAll("nav a");
    const sections = document.querySelectorAll(".tab-content > section");
    const tabContent = document.querySelector('.tab-content');
    const heightBuffer = 50;

    function updateTabContentHeight() {
        const activeSection = document.querySelector(".tab-content > section.active");
        if (activeSection) {
            tabContent.style.height = (activeSection.scrollHeight + heightBuffer) + "px";
        }
    }

    updateTabContentHeight(); // 초기 높이 설정

    tabs.forEach(tab => {
        tab.addEventListener("click", () => {
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            sections.forEach(sec => sec.classList.remove("active"));
            const target = document.getElementById(tab.dataset.target);

            if (target) {
                target.classList.add("active");

                // 2. 클릭 시 활성화된 섹션의 높이를 계산하여 .tab-content 높이 변경
                // [수정] scrollHeight에 buffer 더하기
                const newHeight = target.scrollHeight;
                tabContent.style.height = (newHeight + heightBuffer) + "px";
            }
        });
    });
// ----- 4. [수정] 채팅 기능 로직 (색상 적용 및 갱신) -----
    const chatForm = document.getElementById('chat-form');
    const chatInput = document.getElementById('chat-input');
    const chatWindow = document.querySelector('.chat-window');
    const API_URL = '/api/messages';
    /**
     * [수정] color 인자 추가
     * 화면에 말풍선을 추가하는 함수 (타입: 'sent' 또는 'received', color: HSL 문자열)
     */
    function displayMessage(messageText, type, color = null) {
        const bubble = document.createElement('div');
        bubble.classList.add('chat-message', type);

        const messageParagraph = document.createElement('p');
        messageParagraph.textContent = messageText;
        bubble.appendChild(messageParagraph);

        // [신규] 'sent' 타입이고 color가 있으면 스타일 적용
        if (type === 'sent' && color) {
            bubble.classList.add('custom-color');
            bubble.style.backgroundColor = color;
        }

        chatWindow.appendChild(bubble);
        chatWindow.scrollTop = chatWindow.scrollHeight;
    }

    /**
     * 서버에서 모든 메시지를 불러와 화면에 표시합니다.
     */
    /**
     * [수정] 서버에서 모든 메시지를 불러와 화면에 표시합니다.
     */
    async function loadMessages() {
        try {
            const response = await fetch(API_URL);
            const messages = await response.json();

            chatWindow.innerHTML = ''; // 1. 채팅창 비우기

            // 2. "안내 메시지"를 항상 먼저 표시
            displayMessage("응원 메시지를 남겨주세요!", 'received');

            // 3. 서버에서 받은 메시지들 표시
            messages.forEach(msg => {
                displayMessage(msg.text, 'sent', msg.color);
            });

            updateTabContentHeight();

        } catch (err) {
            console.error("메시지 로딩 실패:", err);
            chatWindow.innerHTML = ''; // 실패 시에도 비우기
            displayMessage("메시지를 불러오는 데 실패했습니다.", 'received');
        }
    }
// 폼 제출(메시지 전송) 이벤트
    if (chatForm) {
        chatForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const messageText = chatInput.value.trim();
            if (messageText === '') return;

            const newMessage = { text: messageText };

            try {
                // 1. 서버에 메시지 저장 (POST)
                const response = await fetch(API_URL, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(newMessage),
                });

                if (!response.ok) throw new Error('서버 응답 실패');

                // 2. 서버가 반환한 "최신 전체 목록"을 받음
                const updatedMessages = await response.json();

                // 3. [수정] 채팅창을 최신 목록으로 "전체 갱신"
                chatWindow.innerHTML = ''; // 3-1. 채팅창 비우기

                // 3-2. "안내 메시지"를 항상 먼저 표시
                displayMessage("응원 메시지를 남겨주세요!", 'received');

                // 3-3. 서버에서 받은 새 목록 표시
                updatedMessages.forEach(msg => {
                    displayMessage(msg.text, 'sent', msg.color);
                });

                // 4. 입력창 비우기 및 높이 재계산
                chatInput.value = '';
                chatWindow.scrollTop = chatWindow.scrollHeight;
                updateTabContentHeight();

            } catch (err) {
                console.error("메시지 전송 실패:", err);
                displayMessage("! 전송 실패. 다시 시도하세요.", 'received');
            }
        });
    }
    // 페이지 로드 시 메시지 불러오기
    loadMessages();

}); // DOMContentLoaded 끝