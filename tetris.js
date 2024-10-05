const canvas = document.getElementById('tetris');
const context = canvas.getContext('2d');
context.scale(20, 20); // 캔버스의 스케일을 조정하여 블록을 더 크게 보이도록 설정

// 아레나에서 꽉 찬 행을 제거하고 점수를 계산하는 함수
function arenaSweep() {
    let rowCount = 1;
    outer: for (let y = arena.length - 1; y > 0; --y) {
        for (let x = 0; x < arena[y].length; ++x) {
            if (arena[y][x] === 0) {
                continue outer; // 빈 공간이 있는 경우 해당 행은 지우지 않음
            }
        }

        const row = arena.splice(y, 1)[0].fill(0); // 꽉 찬 행을 제거하고 빈 행을 추가
        arena.unshift(row);
        ++y;

        player.score += rowCount * 10; // 점수를 행에 따라 증가
        rowCount *= 2;
    }
}

// 플레이어 블록이 아레나와 충돌하는지 확인하는 함수
function collide(arena, player) {
    const [m, o] = [player.matrix, player.pos];
    for (let y = 0; y < m.length; ++y) {
        for (let x = 0; x < m[y].length; ++x) {
            if (m[y][x] !== 0 &&
               (arena[y + o.y] &&
                arena[y + o.y][x + o.x]) !== 0) {
                return true; // 충돌이 발생하면 true 반환
            }
        }
    }
    return false; // 충돌이 없으면 false 반환
}

// 지정된 너비와 높이로 2차원 배열을 생성하는 함수
function createMatrix(w, h) {
    const matrix = [];
    while (h--) {
        matrix.push(new Array(w).fill(0)); // 배열을 0으로 채움
    }
    return matrix;
}

// 특정 유형의 테트리스 블록을 생성하는 함수
function createPiece(type) {
    switch (type) {
        case 'T':
            return [
                [0, 0, 0],
                [1, 1, 1],
                [0, 1, 0],
            ];
        case 'O':
            return [
                [2, 2],
                [2, 2],
            ];
        case 'L':
            return [
                [0, 0, 3],
                [3, 3, 3],
                [0, 0, 0],
            ];
        case 'J':
            return [
                [4, 0, 0],
                [4, 4, 4],
                [0, 0, 0],
            ];
        case 'I':
            return [
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
                [0, 5, 0, 0],
            ];
        case 'S':
            return [
                [0, 6, 6],
                [6, 6, 0],
                [0, 0, 0],
            ];
        case 'Z':
            return [
                [7, 7, 0],
                [0, 7, 7],
                [0, 0, 0],
            ];
    }
}

// 주어진 매트릭스를 캔버스에 그리는 함수
function drawMatrix(matrix, offset) {
    matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                const colors = ['#FF0D72', '#0DC2FF', '#0DFF72', '#F538FF', '#FF8E0D', '#FFE138', '#3877FF'];
                context.fillStyle = colors[value - 1]; // 블록의 색상을 설정
                context.fillRect(x + offset.x, y + offset.y, 1, 1); // 블록을 그리기
                context.strokeStyle = '#000';
                context.lineWidth = 0.05;
                context.strokeRect(x + offset.x, y + offset.y, 1, 1); // 블록의 테두리를 그리기
            }
        });
    });
}

// 전체 캔버스를 그리고 아레나와 플레이어 블록을 그리는 함수
function draw() {
    context.fillStyle = '#333'; // 배경색 설정
    context.fillRect(0, 0, canvas.width, canvas.height); // 배경 그리기

    drawMatrix(arena, {x: 0, y: 0}); // 아레나 그리기
    drawMatrix(player.matrix, player.pos); // 플레이어 블록 그리기
}

// 플레이어 블록을 아레나에 병합하는 함수
function merge(arena, player) {
    player.matrix.forEach((row, y) => {
        row.forEach((value, x) => {
            if (value !== 0) {
                arena[y + player.pos.y][x + player.pos.x] = value; // 아레나에 블록을 추가
            }
        });
    });
}

// 플레이어 블록을 아래로 한 칸 떨어뜨리는 함수
function playerDrop() {
    player.pos.y++;
    if (collide(arena, player)) {
        player.pos.y--; // 충돌 시 위치 복구
        merge(arena, player); // 블록을 아레나에 병합
        playerReset(); // 새로운 블록 생성
        arenaSweep(); // 아레나 정리
        updateScore(); // 점수 업데이트
    }
    dropCounter = 0;
}

// 플레이어 블록을 빠르게 떨어뜨리는 함수
function playerFastDrop() {
    while (!collide(arena, player)) {
        player.pos.y++; // 바닥까지 빠르게 내려가기
    }
    player.pos.y--;
    merge(arena, player);
    playerReset();
    arenaSweep();
    updateScore();
    dropCounter = 0;
}

// 플레이어 블록을 좌우로 이동하는 함수
function playerMove(dir) {
    player.pos.x += dir;
    if (collide(arena, player)) {
        player.pos.x -= dir; // 충돌 시 위치 복구
    }
}

// 새로운 블록을 생성하고 초기 위치를 설정하는 함수
function playerReset() {
    const pieces = 'TJLOSZI';
    player.matrix = createPiece(pieces[pieces.length * Math.random() | 0]); // 랜덤한 블록 생성
    player.pos.y = 0;
    player.pos.x = (arena[0].length / 2 | 0) - (player.matrix[0].length / 2 | 0); // 중앙에 위치하도록 설정
    if (collide(arena, player)) {
        arena.forEach(row => row.fill(0)); // 게임 오버 시 아레나 초기화
        alert('Game Over!'); // 게임 오버 메시지
        player.score = 0;
        updateScore();
    }
}

// 플레이어 블록을 회전하는 함수
function playerRotate(dir) {
    const pos = player.pos.x;
    let offset = 1;
    rotate(player.matrix, dir); // 블록 회전
    while (collide(arena, player)) {
        player.pos.x += offset; // 충돌을 피하기 위해 위치 조정
        offset = -(offset + (offset > 0 ? 1 : -1));
        if (offset > player.matrix[0].length) {
            rotate(player.matrix, -dir); // 원래 방향으로 되돌림
            player.pos.x = pos;
            return;
        }
    }
}

// 매트릭스를 회전시키는 함수
function rotate(matrix, dir) {
    for (let y = 0; y < matrix.length; ++y) {
        for (let x = 0; x < y; ++x) {
            [
                matrix[x][y],
                matrix[y][x],
            ] = [
                matrix[y][x],
                matrix[x][y],
            ]; // 대각선을 기준으로 값을 교환하여 회전
        }
    }

    if (dir > 0) {
        matrix.forEach(row => row.reverse()); // 시계 방향 회전
    } else {
        matrix.reverse(); // 반시계 방향 회전
    }
}

let dropCounter = 0;
let dropInterval = 1000; // 블록이 떨어지는 기본 시간 간격

let lastTime = 0;
function update(time = 0) {
    const deltaTime = time - lastTime;
    lastTime = time;

    dropCounter += deltaTime;
    if (dropCounter > dropInterval) {
        playerDrop(); // 일정 시간마다 블록을 떨어뜨림
    }

    draw(); // 캔버스 업데이트
    requestAnimationFrame(update); // 애니메이션 프레임 요청
}

// 점수를 업데이트하는 함수
function updateScore() {
    const scoreElement = document.getElementById('score');
    if (scoreElement) {
        scoreElement.innerText = player.score; // 화면에 점수 표시
    }
}

const arena = createMatrix(15, 30); // 아레나 생성 (너비 15, 높이 30)

const player = {
    pos: {x: 0, y: 0},
    matrix: null,
    score: 0,
};

// 키 입력 이벤트 처리
document.addEventListener('keydown', event => {
    if (event.keyCode === 37) {
        playerMove(-1); // 왼쪽 이동
    } else if (event.keyCode === 39) {
        playerMove(1); // 오른쪽 이동
    } else if (event.keyCode === 40) {
        dropInterval = 50; // 아래키로 가속
    } else if (event.keyCode === 38) {
        playerRotate(1); // 위쪽 화살표로 시계 방향 회전
    } else if (event.keyCode === 32) {
        playerFastDrop(); // 스페이스바로 빠르게 바닥까지 떨어뜨리기
    }
});

// 키가 올라올 때의 이벤트 처리
document.addEventListener('keyup', event => {
    if (event.keyCode === 40) {
        dropInterval = 1000; // 아래키를 떼면 속도를 원래대로 복구
    }
});

playerReset(); // 첫 번째 블록 설정
updateScore(); // 점수 초기화
update(); // 게임 루프 시작