import { curriculum } from './curriculum.js';
import { vocabulary } from './vocabulary.js';
import { lessons01To20 } from './lessons/01-20.js';
import { lessons21To40 } from './lessons/21-40.js';
import { lessons41To60 } from './lessons/41-60.js';
import { lessons61To80 } from './lessons/61-80.js';
import { lessons81To100 } from './lessons/81-100.js';

export const lessons = [...lessons01To20, ...lessons21To40, ...lessons41To60, ...lessons61To80, ...lessons81To100];
export { curriculum, vocabulary };