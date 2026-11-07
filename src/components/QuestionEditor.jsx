import React, { useState } from 'react';

export default function QuestionEditor({ initialQuestion, onSave, onCancel }) {
  const [type, setType] = useState(initialQuestion?.type || 'single_choice');
  const [title, setTitle] = useState(initialQuestion?.title || '');
  const [questionImage, setQuestionImage] = useState(initialQuestion?.questionImage || '');
  
  const [customPoints, setCustomPoints] = useState(initialQuestion?.customPoints || '');

  // 1. Одинарний вибір
  const [singleOptions, setSingleOptions] = useState(
    initialQuestion?.singleOptions || [
      { text: 'Варіант А', image: '' },
      { text: 'Варіант Б', image: '' },
      { text: 'Варіант В', image: '' },
      { text: 'Варіант Г', image: '' }
    ]
  );
  const [singleCorrect, setSingleCorrect] = useState(initialQuestion?.singleCorrect ?? 0);

  // 2. Логічні пари (4х5)
  const [matchingLeft, setMatchingLeft] = useState(
    initialQuestion?.matchingLeft || [
      { text: '1. Твердження 1', image: '' },
      { text: '2. Твердження 2', image: '' },
      { text: '3. Твердження 3', image: '' },
      { text: '4. Твердження 4', image: '' }
    ]
  );
  const [matchingRight, setMatchingRight] = useState(
    initialQuestion?.matchingRight || [
      { text: 'А. Відповідь А', image: '' },
      { text: 'Б. Відповідь Б', image: '' },
      { text: 'В. Відповідь В', image: '' },
      { text: 'Г. Відповідь Г', image: '' },
      { text: 'Д. Відповідь Д', image: '' }
    ]
  );
  const [matchingPairs, setMatchingPairs] = useState(initialQuestion?.matchingPairs || [0, 1, 2, 3]);

  // 3. Послідовність
  const [sequenceItems, setSequenceItems] = useState(
    initialQuestion?.sequenceItems || ['Подія 1', 'Подія 2', 'Подія 3', 'Подія 4']
  );

  // 4. Вибір 3 з 7
  const [multipleSevenItems, setMultipleSevenItems] = useState(
    initialQuestion?.multipleSevenItems || Array.from({ length: 7 }, (_, i) => ({ text: `Варіант ${i + 1}`, image: '' }))
  );
  const [multipleSevenCorrect, setMultipleSevenCorrect] = useState(initialQuestion?.multipleSevenCorrect || [0, 1, 2]);

  // 5. Коротка відповідь
  const [shortAnswer, setShortAnswer] = useState(initialQuestion?.shortAnswer || '');

  const handleImageUpload = (e, callback) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => callback(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const toggleSevenCorrect = (index) => {
    if (multipleSevenCorrect.includes(index)) {
      setMultipleSevenCorrect(multipleSevenCorrect.filter((i) => i !== index));
    } else {
      if (multipleSevenCorrect.length < 3) {
        setMultipleSevenCorrect([...multipleSevenCorrect, index]);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Введіть умову завдання.');
      return;
    }

    const questionData = {
      id: initialQuestion?.id || Date.now(),
      title,
      questionImage,
      type,
      customPoints: customPoints !== '' ? Number(customPoints) : null,
      ...(type === 'single_choice' && { singleOptions, singleCorrect }),
      ...(type === 'matching' && { matchingLeft, matchingRight, matchingPairs }),
      ...(type === 'sequence' && { sequenceItems }),
      ...(type === 'multiple_3_7' && { multipleSevenItems, multipleSevenCorrect }),
      ...(type === 'short_answer' && { shortAnswer }),
    };

    onSave(questionData);
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6 max-w-4xl mx-auto my-6">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        {initialQuestion ? '✏️ Редагування питання НМТ' : '➕ Створення нового питання НМТ'}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-sm font-semibold text-gray-700 mb-2">Тип завдання НМТ:</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-800 text-sm"
            >
              <option value="single_choice">1️⃣ 1 з 4-5 (Оцінка: 0 або 1 бал)</option>
              <option value="matching">🧩 Відповідність 4х5 (Оцінка: 0-4 бали)</option>
              <option value="sequence">🔢 Послідовність 4 події (Оцінка: 0-3 бали)</option>
              <option value="multiple_3_7">🎯 Вибір 3 з 7 (Оцінка: 0-3 бали)</option>
              <option value="short_answer">✍️ Коротка відповідь (Оцінка: 0 або 1 бал)</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Власний бал (опціонально):</label>
            <input
              type="number"
              min="1"
              max="50"
              value={customPoints}
              onChange={(e) => setCustomPoints(e.target.value)}
              placeholder="За правилами НМТ"
              className="w-full p-3 border border-gray-300 rounded-lg bg-gray-50 text-sm"
            />
          </div>
        </div>

        <div className="space-y-3 bg-gray-50 p-4 rounded-xl border border-gray-200">
          <label className="block text-sm font-semibold text-gray-700">Умова завдання:</label>
          <textarea
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            rows={3}
            className="w-full p-3 border border-gray-300 rounded-lg bg-white text-sm"
            placeholder="Введіть текст завдання..."
            required
          />

          <div className="flex items-center space-x-4 pt-2">
            <label className="cursor-pointer bg-blue-50 text-blue-700 px-3 py-1.5 rounded-lg border border-blue-200 text-xs font-semibold hover:bg-blue-100">
              📷 Додати зображення до питання
              <input type="file" accept="image/*" onChange={(e) => handleImageUpload(e, setQuestionImage)} className="hidden" />
            </label>
            {questionImage && (
              <div className="flex items-center space-x-2">
                <img src={questionImage} alt="" className="w-12 h-12 object-cover rounded border" />
                <button type="button" onClick={() => setQuestionImage('')} className="text-red-500 text-xs font-bold">Видалити</button>
              </div>
            )}
          </div>
        </div>

        {type === 'single_choice' && (
          <div className="space-y-3 bg-blue-50 p-4 rounded-xl border border-blue-100">
            <span className="text-sm font-bold text-blue-900 block mb-2">Варіанти (позначте правильну відповідь):</span>
            {singleOptions.map((opt, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-blue-200">
                <input
                  type="radio"
                  name="correct_single"
                  checked={singleCorrect === idx}
                  onChange={() => setSingleCorrect(idx)}
                  className="w-5 h-5 text-blue-600 cursor-pointer"
                />
                <input
                  type="text"
                  value={opt.text}
                  onChange={(e) => {
                    const newOpts = [...singleOptions];
                    newOpts[idx].text = e.target.value;
                    setSingleOptions(newOpts);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={`Варіант ${idx + 1}`}
                />
              </div>
            ))}
          </div>
        )}

        {type === 'matching' && (
          <div className="bg-purple-50 p-4 rounded-xl border border-purple-100 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-purple-900">Лівий стовпець (1-4):</h4>
                {matchingLeft.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">{idx + 1}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const updated = [...matchingLeft];
                        updated[idx].text = e.target.value;
                        setMatchingLeft(updated);
                      }}
                      className="w-full p-1.5 border border-gray-300 rounded text-sm"
                      placeholder="Текст"
                    />
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-bold text-purple-900">Правий стовпець (А-Д):</h4>
                {matchingRight.map((item, idx) => (
                  <div key={idx} className="bg-white p-2 rounded-lg border border-purple-200 flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-500">{String.fromCharCode(1040 + idx)}.</span>
                    <input
                      type="text"
                      value={item.text}
                      onChange={(e) => {
                        const updated = [...matchingRight];
                        updated[idx].text = e.target.value;
                        setMatchingRight(updated);
                      }}
                      className="w-full p-1.5 border border-gray-300 rounded text-sm"
                      placeholder="Текст"
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-purple-200">
              <h4 className="text-xs font-bold text-purple-900 mb-2">Еталонні відповідності:</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {matchingLeft.map((_, lIdx) => (
                  <div key={lIdx} className="flex items-center space-x-2 bg-white p-2 rounded-lg border">
                    <span className="text-xs font-semibold text-gray-700 w-20">{lIdx + 1}-й елемент</span>
                    <select
                      value={matchingPairs[lIdx]}
                      onChange={(e) => {
                        const updated = [...matchingPairs];
                        updated[lIdx] = Number(e.target.value);
                        setMatchingPairs(updated);
                      }}
                      className="p-1 border border-gray-300 rounded text-xs bg-gray-50 flex-1"
                    >
                      {matchingRight.map((rItem, rIdx) => (
                        <option key={rIdx} value={rIdx}>
                          {String.fromCharCode(1040 + rIdx)}. {rItem.text}
                        </option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {type === 'sequence' && (
          <div className="bg-amber-50 p-4 rounded-xl border border-amber-100 space-y-3">
            <p className="text-xs text-amber-900 font-bold">Введіть 4 події у правильному хронологічному порядку:</p>
            {sequenceItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3">
                <span className="w-7 h-7 flex items-center justify-center bg-amber-200 text-amber-900 rounded-full font-bold text-xs">{idx + 1}</span>
                <input
                  type="text"
                  value={item}
                  onChange={(e) => {
                    const updated = [...sequenceItems];
                    updated[idx] = e.target.value;
                    setSequenceItems(updated);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm bg-white"
                  placeholder={`Подія ${idx + 1}`}
                  required
                />
              </div>
            ))}
          </div>
        )}

        {type === 'multiple_3_7' && (
          <div className="bg-emerald-50 p-4 rounded-xl border border-emerald-100 space-y-3">
            <div className="flex justify-between items-center mb-1">
              <span className="text-xs font-bold text-emerald-900">Введіть 7 варіантів і відмітьте РІВНО 3 правильні:</span>
              <span className="text-xs text-emerald-700 font-semibold">Обрано: {multipleSevenCorrect.length} / 3</span>
            </div>
            {multipleSevenItems.map((item, idx) => (
              <div key={idx} className="flex items-center space-x-3 bg-white p-2 rounded-lg border border-emerald-200">
                <input
                  type="checkbox"
                  checked={multipleSevenCorrect.includes(idx)}
                  onChange={() => toggleSevenCorrect(idx)}
                  className="w-5 h-5 text-emerald-600 rounded cursor-pointer"
                />
                <input
                  type="text"
                  value={item.text}
                  onChange={(e) => {
                    const updated = [...multipleSevenItems];
                    updated[idx].text = e.target.value;
                    setMultipleSevenItems(updated);
                  }}
                  className="w-full p-2 border border-gray-300 rounded-lg text-sm"
                  placeholder={`Варіант ${idx + 1}`}
                />
              </div>
            ))}
          </div>
        )}

        {type === 'short_answer' && (
          <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100 space-y-3">
            <label className="block text-xs font-bold text-indigo-900">Правильна коротка відповідь:</label>
            <input
              type="text"
              value={shortAnswer}
              onChange={(e) => setShortAnswer(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg text-sm bg-white"
              placeholder="Наприклад: 1991"
              required
            />
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-200">
          {onCancel && (
            <button type="button" onClick={onCancel} className="px-5 py-2.5 rounded-lg border text-gray-700 text-sm">
              Скасувати
            </button>
          )}
          <button type="submit" className="px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium text-sm shadow-md">
            Зберегти завдання
          </button>
        </div>
      </form>
    </div>
  );
}