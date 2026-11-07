import React, { useState } from 'react';

export default function TestViewer({ questions, onFinish, studentInfo, sessionCode }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [fullImage, setFullImage] = useState(null);
  const [testResult, setTestResult] = useState(null);

  const currentQ = questions[currentIndex];

  if (!questions || questions.length === 0) {
    return (
      <div className="p-8 text-center text-gray-500">
        Немає збережених питань у тесті.
      </div>
    );
  }

  const handleAnswerChange = (questionId, value) => {
    const updated = { ...answers, [questionId]: value };
    setAnswers(updated);
    // Якщо є зовнішній обробник (наприклад, для передачі прогресу викладачу онлайн)
    if (onProgressUpdate) {
      onProgressUpdate(updated);
    }
  };

  const moveSequenceItem = (index, direction) => {
    const currentSeq = answers[currentQ.id] || [...currentQ.sequenceItems];
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentSeq.length) return;

    const temp = currentSeq[index];
    currentSeq[index] = currentSeq[newIndex];
    currentSeq[newIndex] = temp;

    handleAnswerChange(currentQ.id, [...currentSeq]);
  };

  // Підрахунок балів
  const handleFinishTest = () => {
    let totalScore = 0;
    let maxPossibleScore = 0;
    const detailedReport = [];

    questions.forEach((q) => {
      let qScore = 0;
      let qMax = 1;
      const userAns = answers[q.id];

      if (q.type === 'single_choice') {
        qMax = q.customPoints !== null ? q.customPoints : 1;
        if (userAns === q.singleCorrect) qScore = qMax;
      } else if (q.type === 'matching') {
        qMax = q.customPoints !== null ? q.customPoints : 4;
        if (Array.isArray(userAns)) {
          let correctPairs = 0;
          userAns.forEach((val, idx) => {
            if (val === q.matchingPairs[idx]) correctPairs++;
          });
          qScore = q.customPoints !== null ? (correctPairs === 4 ? qMax : 0) : correctPairs;
        }
      } else if (q.type === 'sequence') {
        qMax = q.customPoints !== null ? q.customPoints : 3;
        const studentSeq = userAns || q.sequenceItems;
        const correctSeq = q.sequenceItems;

        if (q.customPoints !== null) {
          const isFullCorrect = studentSeq.every((item, i) => item === correctSeq[i]);
          qScore = isFullCorrect ? qMax : 0;
        } else {
          let matches = 0;
          studentSeq.forEach((item, i) => {
            if (item === correctSeq[i]) matches++;
          });
          const isFirstCorrect = studentSeq[0] === correctSeq[0];
          const isLastCorrect = studentSeq[3] === correctSeq[3];

          if (matches === 4) qScore = 3;
          else if (isFirstCorrect && isLastCorrect) qScore = 2;
          else if (isFirstCorrect || isLastCorrect) qScore = 1;
          else qScore = 0;
        }
      } else if (q.type === 'multiple_3_7') {
        qMax = q.customPoints !== null ? q.customPoints : 3;
        if (Array.isArray(userAns)) {
          let correctChosen = 0;
          userAns.forEach((idx) => {
            if (q.multipleSevenCorrect.includes(idx)) correctChosen++;
          });
          qScore = q.customPoints !== null ? (correctChosen === 3 ? qMax : 0) : correctChosen;
        }
      } else if (q.type === 'short_answer') {
        qMax = q.customPoints !== null ? q.customPoints : 1;
        if (userAns && userAns.trim().toLowerCase() === q.shortAnswer.trim().toLowerCase()) {
          qScore = qMax;
        }
      }

      totalScore += qScore;
      maxPossibleScore += qMax;
      detailedReport.push({ title: q.title, score: qScore, max: qMax });
    });

    const resultData = { totalScore, maxPossibleScore, detailedReport, date: new Date().toLocaleDateString('uk-UA') };
    setTestResult(resultData);
    if (onFinish) onFinish({ answers, score: totalScore, maxScore: maxPossibleScore });
  };

  // Функція Друку сторінки результатів
  const handlePrint = () => {
    window.print();
  };

  // Екран результатів
  if (testResult) {
    return (
      <div className="max-w-3xl mx-auto my-6 p-8 bg-white rounded-2xl shadow-xl border text-center space-y-6 printable-area">
        <div className="flex justify-between items-center border-b pb-4">
          <div className="text-left">
            <h2 className="text-2xl font-bold text-gray-800">Результат тестування НМТ</h2>
            {studentInfo && (
              <p className="text-sm text-gray-600 mt-1">
                Учень: <b>{studentInfo.firstName} {studentInfo.lastName}</b> | Сесія: <b>{sessionCode || 'Демо'}</b>
              </p>
            )}
          </div>
          <span className="text-xs text-gray-400">{testResult.date}</span>
        </div>

        <div className="bg-blue-50 p-6 rounded-xl border border-blue-200 inline-block w-full">
          <p className="text-sm text-blue-600 font-semibold uppercase tracking-wider">Підсумковий балл:</p>
          <p className="text-5xl font-extrabold text-blue-900 mt-2">
            {testResult.totalScore} <span className="text-2xl text-blue-400">/ {testResult.maxPossibleScore} балів</span>
          </p>
        </div>

        <div className="text-left space-y-2 mt-4">
          <h3 className="font-bold text-gray-700 text-sm mb-2">Деталізація виконання завдань:</h3>
          {testResult.detailedReport.map((item, idx) => (
            <div key={idx} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg border text-sm">
              <span className="truncate max-w-md font-medium text-gray-800">{idx + 1}. {item.title}</span>
              <span className={`font-bold px-2 py-1 rounded text-xs ${item.score === item.max ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'}`}>
                {item.score} / {item.max} б.
              </span>
            </div>
          ))}
        </div>

        {/* Панель дій для результату (не відображається при друку) */}
        <div className="flex flex-wrap justify-center gap-3 pt-4 border-t no-print">
          <button
            onClick={handlePrint}
            className="px-5 py-2.5 bg-gray-800 hover:bg-gray-900 text-white font-semibold rounded-xl text-sm shadow flex items-center space-x-2 cursor-pointer"
          >
            <span>🖨️ Роздрукувати / Зберегти як PDF</span>
          </button>
          <button
            onClick={() => { setTestResult(null); setCurrentIndex(0); setAnswers({}); }}
            className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl text-sm shadow cursor-pointer"
          >
            Пройти тест знову 🔄
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto my-6 p-6 bg-white rounded-xl shadow-lg border border-gray-200">
      {/* Шапка тесту */}
      <div className="flex justify-between items-center pb-4 mb-6 border-b border-gray-200">
        <span className="text-sm font-semibold text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Питання {currentIndex + 1} з {questions.length}
        </span>
        <div className="space-x-2">
          {questions.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`w-8 h-8 rounded-full text-xs font-bold transition cursor-pointer ${
                currentIndex === idx
                  ? 'bg-blue-600 text-white shadow-md'
                  : answers[questions[idx].id] !== undefined
                  ? 'bg-green-100 text-green-700 border border-green-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {idx + 1}
            </button>
          ))}
        </div>
      </div>

      {/* Умова */}
      <div className="space-y-4 mb-6">
        <h3 className="text-lg font-bold text-gray-800 leading-relaxed">
          {currentQ.title}
        </h3>

        {currentQ.questionImage && (
          <div className="my-4 text-center">
            <img
              src={currentQ.questionImage}
              alt=""
              onClick={() => setFullImage(currentQ.questionImage)}
              className="max-h-[380px] max-w-full mx-auto object-contain rounded-lg border shadow-sm cursor-zoom-in"
            />
            <span className="text-xs text-gray-400 mt-1 block">🔍 Натисніть, щоб збільшити</span>
          </div>
        )}
      </div>

      {/* 1. Одинарний вибір */}
      {currentQ.type === 'single_choice' && (
        <div className="space-y-3">
          {currentQ.singleOptions.map((opt, idx) => (
            <label
              key={idx}
              className={`flex items-center p-3 rounded-xl border cursor-pointer transition ${
                answers[currentQ.id] === idx ? 'bg-blue-50 border-blue-500 ring-2 ring-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'
              }`}
            >
              <input
                type="radio"
                name={`q_${currentQ.id}`}
                checked={answers[currentQ.id] === idx}
                onChange={() => handleAnswerChange(currentQ.id, idx)}
                className="w-5 h-5 text-blue-600 cursor-pointer"
              />
              <span className="ml-3 text-sm font-medium text-gray-800 flex-1">{opt.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* 2. Відповідність */}
      {currentQ.type === 'matching' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Запитання (1-4)</h4>
              {currentQ.matchingLeft.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border">
                  <p className="text-sm font-semibold text-gray-800">{idx + 1}. {item.text}</p>
                </div>
              ))}
            </div>
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-500 uppercase">Варіанти (А-Д)</h4>
              {currentQ.matchingRight.map((item, idx) => (
                <div key={idx} className="p-3 bg-gray-50 rounded-xl border">
                  <p className="text-sm font-semibold text-gray-800">{String.fromCharCode(1040 + idx)}. {item.text}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
            <h4 className="text-xs font-bold text-purple-900 mb-3 text-center">Установіть відповідність:</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentQ.matchingLeft.map((_, lIdx) => (
                <div key={lIdx} className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                  <span className="text-xs font-bold text-gray-700 w-16">{lIdx + 1}-й елемент</span>
                  <span className="text-xs text-gray-400">➡️</span>
                  <select
                    value={answers[currentQ.id]?.[lIdx] ?? ''}
                    onChange={(e) => {
                      const currentPairs = answers[currentQ.id] || [0, 0, 0, 0];
                      const updated = [...currentPairs];
                      updated[lIdx] = Number(e.target.value);
                      handleAnswerChange(currentQ.id, updated);
                    }}
                    className="p-1.5 border border-gray-300 rounded text-xs bg-gray-50 flex-1 font-semibold cursor-pointer"
                  >
                    <option value="" disabled>Оберіть літеру...</option>
                    {currentQ.matchingRight.map((_, rIdx) => (
                      <option key={rIdx} value={rIdx}>
                        {String.fromCharCode(1040 + rIdx)}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 3. Послідовність */}
      {currentQ.type === 'sequence' && (
        <div className="bg-amber-50 p-4 rounded-xl border border-amber-200 space-y-3">
          <p className="text-xs font-bold text-amber-900 mb-2">Вибудуйте події у правильній послідовності (стрілочками):</p>
          {(answers[currentQ.id] || currentQ.sequenceItems).map((item, idx, arr) => (
            <div key={idx} className="flex items-center justify-between bg-white p-3 rounded-lg border border-amber-300 shadow-sm">
              <div className="flex items-center space-x-3">
                <span className="w-6 h-6 flex items-center justify-center bg-amber-200 text-amber-900 rounded-full font-bold text-xs">{idx + 1}</span>
                <span className="text-sm font-medium text-gray-800">{item}</span>
              </div>
              <div className="space-x-1">
                <button type="button" disabled={idx === 0} onClick={() => moveSequenceItem(idx, -1)} className="px-2 py-1 bg-gray-100 rounded text-xs font-bold cursor-pointer">⬆️</button>
                <button type="button" disabled={idx === arr.length - 1} onClick={() => moveSequenceItem(idx, 1)} className="px-2 py-1 bg-gray-100 rounded text-xs font-bold cursor-pointer">⬇️</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 4. Вибір 3 з 7 */}
      {currentQ.type === 'multiple_3_7' && (
        <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
          <p className="text-xs font-bold text-emerald-900 mb-2">Оберіть рівно 3 правильні варіанти:</p>
          {currentQ.multipleSevenItems.map((item, idx) => {
            const currentSelected = answers[currentQ.id] || [];
            const isChecked = currentSelected.includes(idx);
            return (
              <label key={idx} className="flex items-center space-x-3 bg-white p-2.5 rounded-lg border border-emerald-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {
                    let updated = [...currentSelected];
                    if (isChecked) {
                      updated = updated.filter((i) => i !== idx);
                    } else if (updated.length < 3) {
                      updated.push(idx);
                    }
                    handleAnswerChange(currentQ.id, updated);
                  }}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
                <span className="text-sm font-medium text-gray-800">{item.text}</span>
              </label>
            );
          })}
        </div>
      )}

      {/* 5. Коротка відповідь */}
      {currentQ.type === 'short_answer' && (
        <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
          <label className="block text-xs font-bold text-indigo-900">Введіть коротку відповідь:</label>
          <input
            type="text"
            value={answers[currentQ.id] || ''}
            onChange={(e) => handleAnswerChange(currentQ.id, e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white"
            placeholder="Ваша відповідь..."
          />
        </div>
      )}

      {/* Навігація */}
      <div className="flex justify-between items-center pt-6 mt-6 border-t border-gray-200">
        <button
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => prev - 1)}
          className="px-4 py-2 rounded-lg border border-gray-300 text-gray-600 disabled:opacity-40 text-sm font-medium cursor-pointer"
        >
          Назад
        </button>

        {currentIndex < questions.length - 1 ? (
          <button
            onClick={() => setCurrentIndex((prev) => prev + 1)}
            className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow cursor-pointer"
          >
            Наступне питання ➡️
          </button>
        ) : (
          <button
            onClick={handleFinishTest}
            className="px-6 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white font-medium text-sm shadow cursor-pointer"
          >
            Завершити тест ✅
          </button>
        )}
      </div>

      {fullImage && (
        <div onClick={() => setFullImage(null)} className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center p-4 z-50 cursor-zoom-out">
          <div className="relative max-w-5xl max-h-full">
            <img src={fullImage} alt="" className="max-h-[90vh] max-w-[90vw] object-contain rounded-lg shadow-2xl" />
            <button onClick={() => setFullImage(null)} className="absolute top-2 right-2 bg-white text-black font-bold px-3 py-1 rounded-full text-xs cursor-pointer">Закрити ✕</button>
          </div>
        </div>
      )}
    </div>
  );
}