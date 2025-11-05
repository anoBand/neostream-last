const express = require('express');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_FILE = './messages.json';

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '/')));

// --- [수정] 랜덤 HSL 색상 생성 함수 ---
/**
 * [수정] 흰색 텍스트와 어울리는 선명한(Vibrant) HSL 색상을 반환합니다.
 * (예: "hsl(200, 90%, 55%)")
 */
function generateVibrantColor() {
    const hue = Math.floor(Math.random() * 360); // 색상은 전체 범위
    const saturation = Math.floor(Math.random() * 15) + 70; // 70~85% → 선명하지만 과하지 않음
    const lightness = Math.floor(Math.random() * 10) + 45; // 45~55% → 적당히 밝고 흰 글자 잘 보임
    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

// 1. 메시지 조회 (GET /api/messages)
app.get('/api/messages', (req, res) => {
    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        if (err) {
            // 파일이 없거나 읽기 오류 시 빈 배열 반환
            if (err.code === 'ENOENT') {
                return res.json([]);
            }
            return res.status(500).send('서버 오류');
        }
        res.json(JSON.parse(data));
    });
});

// 2. 메시지 저장 (POST /api/messages)
app.post('/api/messages', (req, res) => {
    // [수정] text만 받지 않고, 전체 객체를 받음
    const newMessage = req.body; // { text: "새 메시지" }

    // [신규] 랜덤 색상 추가
    newMessage.color = generateVibrantColor();

    fs.readFile(DB_FILE, 'utf8', (err, data) => {
        let messages = [];
        if (!err && data) {
            messages = JSON.parse(data);
        }

        messages.push(newMessage);

        fs.writeFile(DB_FILE, JSON.stringify(messages, null, 2), (writeErr) => {
            if (writeErr) {
                return res.status(500).send('메시지 저장 실패');
            }
            // [수정] 업데이트된 전체 목록을 반환 (중요)
            res.status(201).json(messages);
        });
    });
});

app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});