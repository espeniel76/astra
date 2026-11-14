import { drawPerson } from './render/blob.js';
// 뼈대 확인용: Task 7에서 진짜 화면으로 바뀐다.
const cv = document.createElement('canvas');
cv.width = 120; cv.height = 140;
drawPerson(cv.getContext('2d'), 60, 128, 1.6, { shirt: '#2a2a30', pants: '#3a3f4a', skin: '#f2c79a', hair: '#4a3020', gun: 'axe', hero: 'executioner', outfit: true, aim: -0.25 });
document.getElementById('app').replaceChildren(cv);
