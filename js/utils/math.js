export const randInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

export const shuffleArray = (arr) => [...arr].sort(() => Math.random() - 0.5);

export const generateMathQuestion = (difficulty) => {
  let num1, num2, operator, answer, questionText;

  if (difficulty === 'age5') {
    // Age 5: Simple addition and subtraction up to 10
    operator = Math.random() > 0.5 ? '+' : '-';
    if (operator === '+') {
      num1 = randInt(1, 5);
      num2 = randInt(1, 5);
      answer = num1 + num2;
    } else {
      num1 = randInt(2, 10);
      num2 = randInt(1, num1 - 1); // Ensure positive result
      answer = num1 - num2;
    }
    questionText = `${num1} ${operator} ${num2} = ?`;
  } else {
    // 4th Grade: Multiplication, division, larger addition/subtraction
    const ops = ['+', '-', '*', '/'];
    operator = ops[randInt(0, 3)];
    
    switch (operator) {
      case '+':
        num1 = randInt(10, 99);
        num2 = randInt(10, 99);
        answer = num1 + num2;
        break;
      case '-':
        num1 = randInt(20, 99);
        num2 = randInt(10, num1 - 1);
        answer = num1 - num2;
        break;
      case '*':
        num1 = randInt(2, 12);
        num2 = randInt(2, 12);
        answer = num1 * num2;
        break;
      case '/':
        num2 = randInt(2, 12);
        answer = randInt(2, 12);
        num1 = num2 * answer; // Ensure clean division
        break;
    }
    questionText = `${num1} ${operator === '*' ? '×' : operator === '/' ? '÷' : operator} ${num2} = ?`;
  }

  // Generate 3 wrong answers
  const options = new Set([answer]);
  while (options.size < 4) {
    let wrong;
    if (difficulty === 'age5') {
      wrong = answer + randInt(-3, 3);
      if (wrong < 0) wrong = Math.abs(wrong) + 1;
    } else {
      const offset = randInt(-10, 10);
      wrong = answer + (offset === 0 ? 1 : offset);
    }
    if (wrong !== answer) options.add(wrong);
  }

  return {
    question: questionText,
    answer: answer,
    options: shuffleArray(Array.from(options))
  };
};
