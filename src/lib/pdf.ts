// src/lib/pdf.ts

export const printHtml = (html: string, title: string) => {
  const printWindow = window.open('', '_blank');
  if (!printWindow) {
    alert('Будь ласка, дозвольте спливаючі вікна (pop-ups) у вашому браузері, щоб згенерувати PDF.');
    return;
  }
  
  printWindow.document.write(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>${title}</title>
      <style>
        body { font-family: 'Segoe UI', Arial, sans-serif; padding: 40px; color: #333; line-height: 1.6; }
        h1 { color: #1a202c; text-align: center; margin-bottom: 30px; border-bottom: 2px solid #e2e8f0; padding-bottom: 10px; font-size: 24px; }
        .info { margin-bottom: 30px; font-size: 16px; background: #f7fafc; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; }
        .info p { margin: 5px 0; font-size: 15px; }
        .info span { font-weight: bold; color: #2d3748; }
        
        /* Стилі для блоку питання */
        .question-block { margin-bottom: 25px; padding: 20px; border: 1px solid #cbd5e0; border-radius: 10px; page-break-inside: avoid; background: #fff; }
        .question-title { font-weight: bold; font-size: 16px; color: #2d3748; margin-bottom: 5px; }
        .question-text { font-size: 15px; margin-bottom: 15px; color: #1a202c; }
        
        /* Стилі для зображень */
        .q-image { max-width: 100%; max-height: 250px; object-fit: contain; margin: 10px 0; border-radius: 8px; border: 1px solid #e2e8f0; display: block; }
        .opt-image { max-width: 80px; max-height: 80px; object-fit: contain; margin-left: 10px; vertical-align: middle; border-radius: 4px; border: 1px solid #e2e8f0; }
        
        /* Стилі для варіантів відповідей */
        .options-list { display: flex; flex-direction: column; gap: 8px; margin-bottom: 15px; }
        .opt-item { padding: 10px 15px; border-radius: 6px; border: 1px solid #e2e8f0; font-size: 14px; display: flex; align-items: center; flex-wrap: wrap; gap: 10px; }
        
        .opt-correct { background-color: #f0fff4; border-color: #c6f6d5; color: #22543d; }
        .opt-wrong { background-color: #fff5f5; border-color: #fed7d7; color: #742a2a; text-decoration: line-through; }
        .opt-neutral { background-color: #f7fafc; border-color: #edf2f7; color: #4a5568; }
        
        .badge { font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 12px; white-space: nowrap; }
        .badge-correct { background: #38a169; color: white; }
        .badge-wrong { background: #e53e3e; color: white; }
        .badge-picked { background: #3182ce; color: white; }

        /* Відповідність / Послідовність */
        .match-table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 14px; }
        .match-table td { border: 1px solid #cbd5e0; padding: 8px 12px; }
        .match-table td:first-child { font-weight: bold; width: 50%; }
        
        /* Коментар */
        .comment-box { margin-top: 15px; padding: 12px 15px; background-color: #fffbeb; border-left: 4px solid #f6ad55; border-radius: 4px; font-size: 13px; color: #744210; }
        
        .footer { margin-top: 50px; text-align: right; font-size: 14px; color: #718096; border-top: 1px solid #e2e8f0; padding-top: 20px; }
        
        /* Таблиці */
        table.data-table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 14px; }
        table.data-table th, table.data-table td { padding: 10px; border: 1px solid #cbd5e0; text-align: left; }
        table.data-table th { background: #edf2f7; font-weight: bold; }
      </style>
    </head>
    <body>
      ${html}
    </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// --- ДОПОМІЖНІ ФУНКЦІЇ ---

// Безпечне отримання тексту (підтримує і рядки, і об'єкти { text, image })
const getItemText = (item: any): string => {
  if (typeof item === 'string') return item;
  if (item && typeof item === 'object') return item.text || item.label || '';
  return '';
};

// Безпечне отримання картинки з об'єкта
const getItemImage = (item: any): string | null => {
  if (item && typeof item === 'object' && item.image) return item.image;
  return null;
};

// Рендер картинки
const renderImage = (src: string | null | undefined, className: string = 'q-image') => {
  if (!src) return '';
  return `<img src="${src}" class="${className}" />`;
};

// 1. ДРУК БЛАНКУ ТЕСТУ (бібліотека)
export const worksheetHtml = (data: { title: string; questions: any[]; withAnswers?: boolean; teacher?: string }) => {
  let rows = '';
  data.questions.forEach((q, i) => {
    let bodyHtml = '';
    
    // Текст питання
    const qText = q.text || q.prompt || q.title || '';
    const qImage = renderImage(q.image, 'q-image');

    // Рендер залежно від типу
    if (q.type === 'matching' || (q.leftColumn && q.rightColumn)) {
      bodyHtml = '<table class="match-table"><tbody>';
      const leftCol = q.leftColumn || q.leftItems || [];
      const rightCol = q.rightColumn || q.rightItems || [];
      
      leftCol.forEach((leftItem: any, idx: number) => {
        const leftText = getItemText(leftItem);
        const leftImg = renderImage(getItemImage(leftItem), 'opt-image');
        // Знаходимо правильну відповідь
        const correctMatchId = (q.correctMatches || q.correctPairs || {})[idx];
        let rightText = '';
        let rightImg = '';
        
        if (data.withAnswers && correctMatchId) {
          // Якщо правильна відповідь - це літера (A, B, C)
          const rightIdx = typeof correctMatchId === 'string' ? correctMatchId.charCodeAt(0) - 65 : parseInt(correctMatchId);
          if (rightCol[rightIdx]) {
            rightText = getItemText(rightCol[rightIdx]);
            rightImg = renderImage(getItemImage(rightCol[rightIdx]), 'opt-image');
          }
        }
        
        bodyHtml += `<tr>
          <td>${idx + 1}. ${leftText} ${leftImg}</td>
          <td>${data.withAnswers ? `➔ ${rightText} ${rightImg}` : '➔'}</td>
        </tr>`;
      });
      bodyHtml += '</tbody></table>';
    } 
    else if (q.type === 'sequence' || (q.sequenceItems && !q.options)) {
      bodyHtml = '<ol style="margin-left: 20px; font-size: 14px;">';
      const items = q.sequenceItems || q.items || [];
      items.forEach((item: any) => {
        const text = getItemText(item);
        const img = renderImage(getItemImage(item), 'opt-image');
        bodyHtml += `<li style="margin-bottom: 8px;">${text} ${img}</li>`;
      });
      bodyHtml += '</ol>';
    } 
    else if (q.options && Array.isArray(q.options)) {
      bodyHtml = '<div class="options-list">';
      q.options.forEach((opt: any, optIdx: number) => {
         const letter = String.fromCharCode(65 + optIdx);
         const text = getItemText(opt);
         const img = renderImage(getItemImage(opt), 'opt-image');
         const isCorrect = typeof opt === 'object' && opt.isCorrect;
         
         let optClass = 'opt-neutral';
         let badge = '';
         
         if (data.withAnswers && isCorrect) {
             optClass = 'opt-correct';
             badge = `<span class="badge badge-correct">Правильна</span>`;
         }
         
         bodyHtml += `<div class="opt-item ${optClass}"><b>${letter})</b> ${text} ${img} ${badge}</div>`;
      });
      bodyHtml += '</div>';
    }

    rows += `
      <div class="question-block">
        <div class="question-title">Питання ${i + 1}</div>
        <div class="question-text">${qText}</div>
        ${qImage}
        ${bodyHtml}
      </div>
    `;
  });

  return `
    <h1>${data.title}</h1>
    <div style="margin-top: 20px;">
      ${rows}
    </div>
    <div class="footer">
      <p>Вчитель: ${data.teacher || ''}</p>
    </div>
  `;
};

// 2. ЗВІТ УЧНЯ (моніторинг сесії)
export const sessionStudentHtml = (data: {
  studentName: string;
  sessionTitle: string;
  percent: number;
  answers: boolean[];
  questions: any[];
  teacher: string;
}) => {
  let blocks = '';
  
  data.questions.forEach((q, i) => {
    const isCorrect = data.answers ? data.answers[i] : false;
    let bodyHtml = '';

    const qText = q.text || q.prompt || q.title || 'Питання';
    const qImage = renderImage(q.image, 'q-image');

    if (q.type === 'matching' || (q.leftColumn && q.rightColumn)) {
      bodyHtml = `<div class="match-table" style="padding: 10px;">Завдання на встановлення відповідності (детальний звіт недоступний)</div>`;
    } else if (q.options && Array.isArray(q.options)) {
      bodyHtml = '<div class="options-list">';
      
      const correctIndex = q.options.findIndex((opt: any) => typeof opt === 'object' && opt.isCorrect);
      let studentPickedIndex = -1;
      
      // Спрощена логіка: якщо вірно - обрав правильний, якщо ні - перший неправильний
      if (isCorrect) {
        studentPickedIndex = correctIndex;
      } else {
        studentPickedIndex = q.options.findIndex((opt: any) => typeof opt !== 'object' || !opt.isCorrect);
      }

      q.options.forEach((opt: any, optIdx: number) => {
        const letter = String.fromCharCode(65 + optIdx);
        const text = getItemText(opt);
        const img = renderImage(getItemImage(opt), 'opt-image');
        const isOptCorrect = typeof opt === 'object' && opt.isCorrect;
        const isStudentPick = (optIdx === studentPickedIndex);

        let optClass = 'opt-neutral';
        let badge = '';

        if (isOptCorrect) {
          optClass = 'opt-correct';
          badge += `<span class="badge badge-correct">Правильна</span>`;
        } else if (isStudentPick) {
          optClass = 'opt-wrong';
          badge += `<span class="badge badge-wrong">Ваш вибір</span>`;
        }

        if (isStudentPick && isOptCorrect) {
          badge = `<span class="badge badge-correct">Правильна</span><span class="badge badge-picked">Ваш вибір</span>`;
        }

        bodyHtml += `<div class="opt-item ${optClass}"><b>${letter})</b> ${text} ${img} ${badge}</div>`;
      });
      bodyHtml += '</div>';
    }

    const commentHtml = q.comment || q.explanation 
      ? `<div class="comment-box">💡 <b>Коментар:</b> ${q.comment || q.explanation}</div>` 
      : '';

    blocks += `
      <div class="question-block">
        <div class="question-title">Питання ${i + 1} ${isCorrect ? '✅' : '❌'}</div>
        <div class="question-text">${qText}</div>
        ${qImage}
        ${bodyHtml}
        ${commentHtml}
      </div>
    `;
  });

  return `
    <h1>Звіт про результати тестування</h1>
    <div class="info">
      <p><span>Учень:</span> ${data.studentName}</p>
      <p><span>Тест:</span> ${data.sessionTitle}</p>
      <p><span>Результат:</span> <strong style="font-size: 18px; color: ${data.percent >= 50 ? '#38a169' : '#e53e3e'}">${data.percent}%</strong></p>
    </div>
    <div style="margin-top: 30px;">
      ${blocks}
    </div>
    <div class="footer">
      <p>Вчитель: ${data.teacher}</p>
      <p>Дата: ${new Date().toLocaleDateString('uk-UA')}</p>
    </div>
  `;
};

// 3. ЗВІТ КЛАСУ (AssignmentDetail)
export const classResultsHtml = (data: {
  title: string;
  className: string;
  teacher: string;
  questions: any[];
  rows: { name: string; sub?: any; guest?: boolean }[];
  detailed: boolean;
}) => {
  let tableRows = '';
  
  data.rows.forEach((r, i) => {
    const sub = r.sub;
    const percent = sub && sub.max ? Math.round((sub.score / sub.max) * 100) : 0;
    
    tableRows += `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td style="font-weight: bold;">${r.name} ${r.guest ? '<span style="font-size:10px;color:#d97706;">(гість)</span>' : ''}</td>
        <td style="text-align: center;">${sub ? `${sub.score} / ${sub.max}` : '—'}</td>
        <td style="color: ${percent >= 50 ? '#38a169' : '#e53e3e'}; font-weight: bold; text-align: center;">${sub ? `${percent}%` : '—'}</td>
      </tr>
    `;
  });

  let detailedHtml = '';
  if (data.detailed) {
    let qBlocks = '';
    data.questions.forEach((q, i) => {
      qBlocks += `
        <div class="question-block" style="margin-top: 15px;">
          <div class="question-title">Питання ${i + 1}</div>
          <div class="question-text">${q.text || q.prompt || q.title || ''}</div>
          ${renderImage(q.image, 'q-image')}
        </div>
      `;
    });
    detailedHtml = `
      <div style="page-break-before: always; margin-top: 40px;">
        <h2 style="text-align: center; color: #2d3748;">Питання тесту</h2>
        ${qBlocks}
      </div>
    `;
  }

  return `
    <h1>Звіт класу: ${data.className}</h1>
    <div class="info">
      <p><span>Завдання:</span> ${data.title}</p>
      <p><span>Кількість учнів:</span> ${data.rows.length}</p>
    </div>
    <table class="data-table">
      <thead>
        <tr>
          <th style="width: 50px; text-align: center;">№</th>
          <th>Учень</th>
          <th style="width: 100px; text-align: center;">Бали</th>
          <th style="width: 100px; text-align: center;">Відсоток</th>
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
    ${detailedHtml}
    <div class="footer">
      <p>Вчитель: ${data.teacher}</p>
      <p>Дата: ${new Date().toLocaleDateString('uk-UA')}</p>
    </div>
  `;
};

// 4. РЕЗУЛЬТАТ УЧНЯ (деталізований)
export const studentResultHtml = (data: {
  title: string;
  className: string;
  teacher: string;
  studentName: string;
  guest?: boolean;
  questions: any[];
  sub: any; // Submission
}) => {
  const sub = data.sub;
  const percent = sub && sub.max ? Math.round((sub.score / sub.max) * 100) : 0;
  
  let blocks = '';
  data.questions.forEach((q, i) => {
    const isCorrect = sub && sub.items ? sub.items[i] === 1 : false;
    let bodyHtml = '';

    const qText = q.text || q.prompt || q.title || 'Питання';
    const qImage = renderImage(q.image, 'q-image');

    // Спрощене відображення правильних відповідей
    if (q.type === 'matching' || (q.leftColumn && q.rightColumn)) {
       bodyHtml = `<div style="font-size: 13px; color: #4a5568;">Завдання на встановлення відповідності</div>`;
    } else if (q.options && Array.isArray(q.options)) {
      bodyHtml = '<div class="options-list">';
      q.options.forEach((opt: any, optIdx: number) => {
        const letter = String.fromCharCode(65 + optIdx);
        const text = getItemText(opt);
        const img = renderImage(getItemImage(opt), 'opt-image');
        const isOptCorrect = typeof opt === 'object' && opt.isCorrect;

        let optClass = 'opt-neutral';
        let badge = '';

        if (isOptCorrect) {
          optClass = 'opt-correct';
          badge = `<span class="badge badge-correct">Правильна</span>`;
        }

        bodyHtml += `<div class="opt-item ${optClass}"><b>${letter})</b> ${text} ${img} ${badge}</div>`;
      });
      bodyHtml += '</div>';
    }

    blocks += `
      <div class="question-block">
        <div class="question-title">Питання ${i + 1} ${isCorrect ? '✅' : '❌'}</div>
        <div class="question-text">${qText}</div>
        ${qImage}
        ${bodyHtml}
      </div>
    `;
  });

  return `
    <h1>Результат: ${data.title}</h1>
    <div class="info">
      <p><span>Учень:</span> ${data.studentName} ${data.guest ? '(гість)' : ''}</p>
      <p><span>Клас:</span> ${data.className}</p>
      <p><span>Бали:</span> ${sub ? `${sub.score} з ${sub.max}` : '—'}</p>
      <p><span>Відсоток:</span> <strong style="font-size: 18px; color: ${percent >= 50 ? '#38a169' : '#e53e3e'}">${percent}%</strong></p>
    </div>
    <div style="margin-top: 30px;">
      ${blocks}
    </div>
    <div class="footer">
      <p>Вчитель: ${data.teacher}</p>
      <p>Дата: ${new Date().toLocaleDateString('uk-UA')}</p>
    </div>
  `;
};